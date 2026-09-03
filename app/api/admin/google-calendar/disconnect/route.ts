import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  disconnectGoogleCalendarConnection,
  getGoogleCalendarConnection,
} from '@/db/google-calendar';
import {
  decryptGoogleCalendarRefreshToken,
  getGoogleCalendarConfig,
  revokeGoogleCalendarGrant,
} from '@/lib/google-calendar';
import { isSameOriginRequest } from '@/lib/request-security';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

function adminRedirect(request: Request, result: string): Response {
  const url = new URL('/admin', request.url);
  url.searchParams.set('calendar', result);
  url.hash = 'google-calendar';
  return Response.redirect(url, 303);
}

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.redirect(
      `${canonicalMemberUrl('/admin')}#google-calendar`,
      303,
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
  if (user.isDemo || !getAuthenticatedStaffPermissions(user).isOwner) {
    return Response.json(
      { error: 'Googleカレンダーの連携解除はオーナーだけが行えます。' },
      { status: 403 },
    );
  }

  try {
    const connection = await getGoogleCalendarConnection(user.userId);
    if (!connection || connection.status === 'disconnected') {
      return adminRedirect(request, 'disconnected');
    }

    let providerRevocationUnverified = false;
    if (connection.refreshTokenCiphertext) {
      try {
        const config = getGoogleCalendarConfig();
        const refreshToken = await decryptGoogleCalendarRefreshToken({
          encryptedRefreshToken: connection.refreshTokenCiphertext,
          ownerMemberId: user.userId,
          encryptionKey: config.tokenEncryptionKey,
        });
        await revokeGoogleCalendarGrant({ refreshToken });
      } catch {
        // Google側の失敗でローカル解除を止めない。保存トークンを消せば、
        // 少なくとも本サイトから新しい予定を作ることはできなくなる。
        providerRevocationUnverified = true;
        console.error('google calendar provider revocation was not verified');
      }
    }
    const disconnected = await disconnectGoogleCalendarConnection({
      ownerMemberId: user.userId,
      expectedGoogleSubject: connection.googleSubject,
      expectedUpdatedAt: connection.updatedAt,
    });
    return adminRedirect(
      request,
      disconnected
        ? providerRevocationUnverified
          ? 'disconnected-local'
          : 'disconnected'
        : 'failed',
    );
  } catch {
    console.error('google calendar disconnect failed');
    return adminRedirect(request, 'failed');
  }
}
