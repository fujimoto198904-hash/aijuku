import { getChatGPTUser } from '@/app/chatgpt-auth';
import { upsertGoogleCalendarConnection } from '@/db/google-calendar';
import {
  clearedGoogleCalendarOauthCookieHeaders,
  readGoogleCalendarOauthCookies,
} from '@/lib/google-calendar-oauth-cookie';
import {
  encryptGoogleCalendarRefreshToken,
  exchangeGoogleCalendarAuthorizationCode,
  getGoogleCalendarConfig,
  googleOAuthStateMatches,
  GoogleCalendarConfigurationError,
  GoogleCalendarError,
} from '@/lib/google-calendar';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

function redirectWithResult(request: Request, result: string): Response {
  const url = new URL('/admin', request.url);
  url.searchParams.set('calendar', result);
  url.hash = 'google-calendar';
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    Location: url.toString(),
    'Referrer-Policy': 'no-referrer',
  });
  for (const value of clearedGoogleCalendarOauthCookieHeaders()) {
    headers.append('Set-Cookie', value);
  }
  return new Response(null, { status: 303, headers });
}

function publicResultForError(error: unknown): string {
  if (error instanceof GoogleCalendarConfigurationError) {
    return 'configuration';
  }
  if (error instanceof GoogleCalendarError) {
    if (error.code === 'owner-email-mismatch') return 'wrong-account';
    if (error.code === 'invalid-state') return 'oauth-expired';
    if (error.code === 'oauth-exchange-failed') return 'missing-token';
  }
  return 'failed';
}

export async function GET(request: Request) {
  if (isVercelRuntime()) {
    return Response.redirect(
      `${canonicalMemberUrl('/admin')}#google-calendar`,
      303,
    );
  }
  const user = await getChatGPTUser();
  if (!user || user.isDemo || !getAuthenticatedStaffPermissions(user).isOwner) {
    return redirectWithResult(request, 'oauth-expired');
  }

  const url = new URL(request.url);
  const returnedState = url.searchParams.get('state') ?? '';
  const cookies = readGoogleCalendarOauthCookies(request);
  if (url.searchParams.has('error')) {
    return redirectWithResult(
      request,
      cookies.state && googleOAuthStateMatches(cookies.state, returnedState)
        ? 'oauth-denied'
        : 'oauth-expired',
    );
  }
  const code = url.searchParams.get('code') ?? '';
  if (!code || !returnedState || !cookies.state || !cookies.codeVerifier) {
    return redirectWithResult(request, 'oauth-expired');
  }

  try {
    const config = getGoogleCalendarConfig();
    const redirectUri = new URL(
      '/api/admin/google-calendar/callback',
      request.url,
    ).toString();
    const grant = await exchangeGoogleCalendarAuthorizationCode({
      config,
      code,
      codeVerifier: cookies.codeVerifier,
      redirectUri,
      expectedState: cookies.state,
      returnedState,
    });
    const refreshTokenCiphertext = await encryptGoogleCalendarRefreshToken({
      refreshToken: grant.refreshToken,
      ownerMemberId: user.userId,
      encryptionKey: config.tokenEncryptionKey,
    });
    const connection = await upsertGoogleCalendarConnection({
      ownerMemberId: user.userId,
      googleSubject: grant.ownerSubject,
      googleEmail: grant.ownerEmail,
      refreshTokenCiphertext,
      grantedScopes: grant.grantedScopes.join(' '),
    });
    if (!connection) return redirectWithResult(request, 'wrong-account');
    return redirectWithResult(request, 'connected');
  } catch (error) {
    const result = publicResultForError(error);
    console.error('google calendar oauth callback failed', { result });
    return redirectWithResult(request, result);
  }
}
