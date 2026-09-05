import { getChatGPTUser, safeRelativeReturnPath } from '@/app/chatgpt-auth';
import {
  createVerifiedMemberPasswordAccount,
  resolveVerifiedMemberAuthAccount,
} from '@/db/member-auth';
import { saveMemberOnboardingProfile } from '@/db/member-onboarding';
import {
  getMember,
  hasCurrentMembershipConsent,
  registerMember,
  updateMemberDisplayName,
} from '@/db/membership';
import { rejectDemoWrite } from '@/lib/demo-access';
import {
  parseInterestKeys,
  parseLearningGoal,
  parseStartMode,
} from '@/lib/member-onboarding';
import { initialPasswordFromBirthDate } from '@/lib/password-security';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: '会員登録はAIstockの正規会員サイトから行ってください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }

  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: 'ログインが必要です。' }, { status: 401 });
  }
  const demoResponse = rejectDemoWrite(user);
  if (demoResponse) return demoResponse;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const displayName = cleanRequestText(body.displayName, 80);
    if (displayName.length < 1 || displayName.length > 80) {
      return Response.json(
        { error: '表示名は1〜80文字で入力してください。' },
        { status: 400 },
      );
    }
    const learningGoal = parseLearningGoal(body.learningGoal);
    const startMode = parseStartMode(body.startMode);
    const interestKeys = parseInterestKeys(body.interestKeys);
    const firstOutcome = cleanRequestText(body.firstOutcome, 240) || null;
    if (!learningGoal || !startMode || !interestKeys) {
      return Response.json(
        { error: '学びたい目的と始め方を確認してください。' },
        { status: 400 },
      );
    }

    const returnTo = safeRelativeReturnPath(
      cleanRequestText(body.returnTo, 1_000) || '/mypage',
    );
    if (body.profileOnly === true) {
      const member = await getMember(user.userId);
      if (
        !member ||
        member.status !== 'active' ||
        !hasCurrentMembershipConsent(member)
      ) {
        return Response.json(
          {
            error: '学び方を変更する前に、現行規約への同意を完了してください。',
          },
          { status: 403 },
        );
      }
      const updated = await updateMemberDisplayName({
        memberId: user.userId,
        displayName,
      });
      if (!updated) {
        return Response.json(
          { error: '会員情報を更新できませんでした。' },
          { status: 409 },
        );
      }
      await saveMemberOnboardingProfile({
        memberId: user.userId,
        profile: { learningGoal, startMode, interestKeys, firstOutcome },
      });
      return Response.json({ ok: true, next: returnTo });
    }

    if (body.termsAccepted !== true || body.privacyAccepted !== true) {
      return Response.json(
        { error: '利用規約とプライバシーポリシーの確認が必要です。' },
        { status: 400 },
      );
    }

    const submittedInitialPassword = initialPasswordFromBirthDate(
      body.birthDate,
    );
    const accountResolution = await resolveVerifiedMemberAuthAccount({
      memberId: user.userId,
      email: user.email,
      initialPassword: submittedInitialPassword ?? '',
    });
    if (accountResolution.kind === 'conflict') {
      return Response.json(
        {
          code: 'existing-login',
          error:
            'このメールアドレスには既存のログイン情報があります。初期パスワードを確認し、「登録済みの方はログイン」から続けてください。',
        },
        { status: 409 },
      );
    }
    const existingAccount =
      accountResolution.kind === 'account' ? accountResolution.account : null;
    const initialPassword = existingAccount ? null : submittedInitialPassword;
    if (!existingAccount && !initialPassword) {
      return Response.json(
        { error: '初回ログインに使う誕生日を正しく入力してください。' },
        { status: 400 },
      );
    }

    await registerMember({ user, displayName });
    await saveMemberOnboardingProfile({
      memberId: user.userId,
      profile: { learningGoal, startMode, interestKeys, firstOutcome },
    });
    if (!existingAccount && initialPassword) {
      await createVerifiedMemberPasswordAccount({
        memberId: user.userId,
        email: user.email,
        initialPassword,
      });
    }
    const next =
      !existingAccount || existingAccount.passwordState === 'temporary'
        ? `/account/password?return_to=${encodeURIComponent(returnTo)}`
        : returnTo;
    return Response.json({ ok: true, next }, { status: 201 });
  } catch (error) {
    console.error('membership registration failed', error);
    if (
      error instanceof Error &&
      error.message === 'Suspended membership cannot be reactivated.'
    ) {
      return Response.json(
        { error: '停止中の会員登録は画面上で再開できません。' },
        { status: 403 },
      );
    }
    if (
      error instanceof Error &&
      error.message === 'Withdrawn membership requires explicit reactivation.'
    ) {
      return Response.json(
        {
          error:
            '退会済みの会員登録は自動で再開できません。登録メールから運営へ再登録を依頼してください。',
        },
        { status: 409 },
      );
    }
    return Response.json(
      { error: '登録を保存できませんでした。時間をおいて再度お試しください。' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: '会員情報はAIstockの正規会員サイトで変更してください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: 'ログインが必要です。' }, { status: 401 });
  }
  const demoResponse = rejectDemoWrite(user);
  if (demoResponse) return demoResponse;

  try {
    const member = await getMember(user.userId);
    if (
      !member ||
      member.status !== 'active' ||
      !hasCurrentMembershipConsent(member)
    ) {
      return Response.json(
        { error: '先に無料会員登録と現行規約への同意を完了してください。' },
        { status: 403 },
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const displayName = cleanRequestText(body.displayName, 80);
    if (displayName.length < 1) {
      return Response.json(
        { error: '表示名は1〜80文字で入力してください。' },
        { status: 400 },
      );
    }
    const updated = await updateMemberDisplayName({
      memberId: user.userId,
      displayName,
    });
    if (!updated) {
      return Response.json(
        { error: '会員情報を更新できませんでした。' },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('membership profile update failed', error);
    return Response.json(
      { error: '会員情報を保存できませんでした。' },
      { status: 500 },
    );
  }
}
