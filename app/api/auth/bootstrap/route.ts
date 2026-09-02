import { env } from 'cloudflare:workers';

import {
  bootstrapPasswordAccount,
  consumeBootstrapRateLimit,
} from '@/db/member-auth';
import { saveMemberOnboardingProfile } from '@/db/member-onboarding';
import { getMember, registerMember } from '@/db/membership';
import { ensureSkillProfile } from '@/db/skill-passport';
import { noStoreJson, requestClientAddress } from '@/lib/auth-request';
import {
  isPlausibleMemberEmail,
  isValidInitialPassword,
  timingSafeEqualText,
} from '@/lib/password-security';
import { cleanRequestText } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

type BootstrapAccountInput = {
  loginId?: unknown;
  contactEmail?: unknown;
  initialPassword?: unknown;
  accountKind?: unknown;
  displayName?: unknown;
};

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return noStoreJson({ error: 'Not found.' }, { status: 404 });
  }
  const configuredToken = env.AUTH_BOOTSTRAP_TOKEN?.trim() ?? '';
  if (configuredToken.length < 32) {
    return noStoreJson({ error: 'Not found.' }, { status: 404 });
  }
  const rateLimit = await consumeBootstrapRateLimit(
    requestClientAddress(request),
  );
  if (!rateLimit.allowed) {
    return noStoreJson(
      { error: 'Too many requests.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      },
    );
  }
  const providedToken =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!timingSafeEqualText(configuredToken, providedToken)) {
    return noStoreJson({ error: 'Not found.' }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      accounts?: BootstrapAccountInput[];
    };
    if (
      !Array.isArray(body.accounts) ||
      body.accounts.length < 1 ||
      body.accounts.length > 2
    ) {
      return noStoreJson(
        { error: 'Invalid bootstrap payload.' },
        { status: 400 },
      );
    }
    const results: Array<{ accountKind: 'member' | 'demo'; created: boolean }> =
      [];
    for (const candidate of body.accounts) {
      const loginId = cleanRequestText(candidate.loginId, 320).toLowerCase();
      const accountKind = candidate.accountKind === 'demo' ? 'demo' : 'member';
      const contactEmail =
        cleanRequestText(candidate.contactEmail, 320) || null;
      const initialPassword =
        typeof candidate.initialPassword === 'string'
          ? candidate.initialPassword
          : '';
      const displayName =
        cleanRequestText(candidate.displayName, 80) ||
        (accountKind === 'demo' ? 'デモ会員' : '藤本 亮志');
      if (
        !loginId ||
        !isValidInitialPassword({ accountKind, password: initialPassword }) ||
        (accountKind === 'member' && !isPlausibleMemberEmail(loginId)) ||
        (accountKind === 'member' &&
          contactEmail !== null &&
          contactEmail.toLowerCase() !== loginId) ||
        (contactEmail && !isPlausibleMemberEmail(contactEmail))
      ) {
        return noStoreJson(
          { error: 'Invalid account input.' },
          { status: 400 },
        );
      }

      const result = await bootstrapPasswordAccount({
        loginId,
        contactEmail,
        initialPassword,
        accountKind,
      });
      if (accountKind === 'demo') {
        const existingMember = await getMember(result.account.memberId);
        if (!existingMember) {
          await registerMember({
            user: {
              userId: result.account.memberId,
              displayName,
              email: loginId,
              fullName: displayName,
              authMethod: 'password',
              mustChangePassword: false,
              isDemo: true,
            },
            displayName,
          });
        }
        await saveMemberOnboardingProfile({
          memberId: result.account.memberId,
          profile: {
            learningGoal: 'explore',
            startMode: 'recommend',
            interestKeys: ['writing', 'images', 'web'],
            firstOutcome: '無料教材とマイページの使い方を体験する',
          },
        });
        await ensureSkillProfile(result.account.memberId);
      }
      results.push({ accountKind, created: result.created });
    }
    return noStoreJson({ ok: true, accounts: results }, { status: 201 });
  } catch (error) {
    console.error('account bootstrap failed', error);
    return noStoreJson({ error: 'Bootstrap failed.' }, { status: 500 });
  }
}
