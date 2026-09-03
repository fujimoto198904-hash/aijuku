import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  appendSetCookieHeaders,
  googleCalendarOauthCookieHeaders,
} from '@/lib/google-calendar-oauth-cookie';
import {
  buildGoogleCalendarOAuthRequest,
  getGoogleCalendarConfig,
  GoogleCalendarConfigurationError,
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
      { error: 'Googleカレンダーを接続できるのはオーナーだけです。' },
      { status: 403 },
    );
  }

  try {
    const config = getGoogleCalendarConfig();
    const redirectUri = new URL(
      '/api/admin/google-calendar/callback',
      request.url,
    ).toString();
    const oauth = await buildGoogleCalendarOAuthRequest({
      config,
      redirectUri,
    });
    const headers = new Headers({
      'Cache-Control': 'private, no-store',
      Location: oauth.authorizationUrl,
    });
    appendSetCookieHeaders(
      headers,
      googleCalendarOauthCookieHeaders({
        request,
        state: oauth.state,
        codeVerifier: oauth.codeVerifier,
      }),
    );
    return new Response(null, { status: 303, headers });
  } catch (error) {
    if (error instanceof GoogleCalendarConfigurationError) {
      return adminRedirect(request, 'configuration');
    }
    console.error('google calendar oauth start failed');
    return adminRedirect(request, 'failed');
  }
}
