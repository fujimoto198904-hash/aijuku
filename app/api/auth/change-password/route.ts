import {
  getAuthenticatedUser,
  safeRelativeReturnPath,
} from '@/app/chatgpt-auth';
import { changeMemberPassword } from '@/db/member-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { noStoreJson } from '@/lib/auth-request';
import { appendSessionCookie } from '@/lib/member-session-cookie';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return noStoreJson(
      { error: 'パスワード変更は正規会員サイトで行ってください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return noStoreJson(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  const user = await getAuthenticatedUser();
  if (!user) {
    return noStoreJson({ error: 'ログインが必要です。' }, { status: 401 });
  }
  if (user.isDemo) {
    return noStoreJson(
      { error: 'デモアカウントではパスワードを変更できません。' },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword =
      typeof body.newPassword === 'string' ? body.newPassword : '';
    const confirmPassword =
      typeof body.confirmPassword === 'string' ? body.confirmPassword : '';
    if (newPassword !== confirmPassword) {
      return noStoreJson(
        { error: '新しいパスワードの確認入力が一致しません。' },
        { status: 400 },
      );
    }
    const result = await changeMemberPassword({
      memberId: user.userId,
      currentPassword,
      newPassword,
    });
    if (!result.ok) {
      const headers = new Headers();
      if (result.retryAfterSeconds) {
        headers.set('Retry-After', String(result.retryAfterSeconds));
      }
      return noStoreJson(
        {
          error: result.error,
          retryAfterSeconds: result.retryAfterSeconds,
        },
        { status: result.retryAfterSeconds ? 429 : 400, headers },
      );
    }
    const member = await getMember(user.userId);
    const requestedReturnTo = safeRelativeReturnPath(
      cleanRequestText(body.returnTo, 1_000) || '/mypage',
    );
    const next =
      member?.status === 'active' && hasCurrentMembershipConsent(member)
        ? requestedReturnTo
        : `/mypage/onboarding?return_to=${encodeURIComponent(requestedReturnTo)}`;
    const headers = new Headers();
    appendSessionCookie(headers, {
      request,
      token: result.session.token,
      expiresAt: result.session.expiresAt,
    });
    return noStoreJson({ ok: true, next }, { headers });
  } catch (error) {
    console.error('password change failed', error);
    return noStoreJson(
      { error: 'パスワードを変更できませんでした。' },
      { status: 500 },
    );
  }
}
