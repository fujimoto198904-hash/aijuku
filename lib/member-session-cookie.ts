import { cookies } from 'next/headers';

const secureCookieName = '__Host-fujimoto_jitsugaku_session';
const localCookieName = 'fujimoto_jitsugaku_session';

export async function readMemberSessionToken(): Promise<string | null> {
  const store = await cookies();
  return (
    store.get(secureCookieName)?.value ??
    store.get(localCookieName)?.value ??
    null
  );
}

export function sessionCookieHeader(input: {
  request: Request;
  token: string;
  expiresAt: number;
}): string {
  const secure = new URL(input.request.url).protocol === 'https:';
  const name = secure ? secureCookieName : localCookieName;
  const maxAge = Math.max(
    0,
    Math.floor((input.expiresAt - Date.now()) / 1_000),
  );
  return [
    `${name}=${input.token}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    `Expires=${new Date(input.expiresAt).toUTCString()}`,
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearedSessionCookieHeaders(): string[] {
  const expires = 'Thu, 01 Jan 1970 00:00:00 GMT';
  return [
    `${secureCookieName}=; Path=/; Max-Age=0; Expires=${expires}; HttpOnly; SameSite=Lax; Secure`,
    `${localCookieName}=; Path=/; Max-Age=0; Expires=${expires}; HttpOnly; SameSite=Lax`,
  ];
}

export function appendSessionCookie(
  responseHeaders: Headers,
  input: { request: Request; token: string; expiresAt: number },
): void {
  responseHeaders.append('Set-Cookie', sessionCookieHeader(input));
}

export function appendClearedSessionCookies(responseHeaders: Headers): void {
  for (const value of clearedSessionCookieHeaders()) {
    responseHeaders.append('Set-Cookie', value);
  }
}
