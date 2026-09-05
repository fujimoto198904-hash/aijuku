import { authenticatePassword, passwordAuthEmail } from '@/db/member-auth';
import { getMember } from '@/db/membership';
import { requestClientAddress, noStoreJson } from '@/lib/auth-request';
import { appendSessionCookie } from '@/lib/member-session-cookie';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { readBoundedJson } from '@/lib/limited-json';
import {
  readChatGPTIdentityHeaders,
  safeRelativeReturnPath,
} from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return noStoreJson(
      { error: 'ログインはAIstockの正規会員サイトで行ってください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return noStoreJson(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await readBoundedJson(request, 5000);
  } catch {
    return noStoreJson(
      { error: '入力内容を確認してください。' },
      { status: 400 },
    );
  }
  try {
    const result = await authenticatePassword({
      loginId: cleanRequestText(body.loginId, 320),
      password: typeof body.password === 'string' ? body.password : '',
      clientAddress: requestClientAddress(request),
      verifiedIdentity: readChatGPTIdentityHeaders(request.headers),
    });
    if (!result.ok) {
      const headers = new Headers();
      if (result.retryAfterSeconds > 0) {
        headers.set('Retry-After', String(result.retryAfterSeconds));
      }
      return noStoreJson(
        {
          error:
            result.reason === 'rate-limited'
              ? '試行回数が多いため、一時的にログインを停止しました。時間をおいてお試しください。'
              : result.reason === 'verification-required'
                ? '初回ログインには、同じメールアドレスでChatGPTの本人確認を完了してください。'
                : 'ログインIDまたはパスワードを確認してください。',
          retryAfterSeconds: result.retryAfterSeconds || undefined,
          code:
            result.reason === 'verification-required'
              ? 'verification-required'
              : undefined,
          verificationRequired:
            result.reason === 'verification-required' || undefined,
        },
        {
          status:
            result.reason === 'rate-limited'
              ? 429
              : result.reason === 'verification-required'
                ? 403
                : 401,
          headers,
        },
      );
    }

    const staffPermissions = getAuthenticatedStaffPermissions({
      userId: result.session.user.memberId,
      authMethod: 'password',
      email: passwordAuthEmail(result.session.user),
      loginId: result.session.user.loginId,
      isDemo: result.session.user.accountKind === 'demo',
    });
    const member =
      result.session.user.accountKind === 'member'
        ? await getMember(result.session.user.memberId)
        : null;
    const inactiveMember = Boolean(member && member.status !== 'active');
    const requestedReturnTo = safeRelativeReturnPath(
      cleanRequestText(body.returnTo, 1_000) || '/mypage',
    );
    const accountHome = inactiveMember
      ? '/mypage/billing'
      : staffPermissions.isOwner
        ? '/aikanri'
        : requestedReturnTo;
    const next =
      result.session.user.sessionKind === 'password-change'
        ? `/account/password?return_to=${encodeURIComponent(accountHome)}`
        : accountHome;
    const headers = new Headers();
    appendSessionCookie(headers, {
      request,
      token: result.session.token,
      expiresAt: result.session.expiresAt,
    });
    return noStoreJson({ ok: true, next }, { headers });
  } catch (error) {
    console.error('password login failed', error);
    return noStoreJson(
      { error: 'ログイン機能を利用できません。時間をおいてお試しください。' },
      { status: 503 },
    );
  }
}
