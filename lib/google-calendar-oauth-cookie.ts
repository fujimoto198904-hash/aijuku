const secureStateCookieName = '__Host-aijuku_google_calendar_state';
const secureVerifierCookieName = '__Host-aijuku_google_calendar_verifier';
const localStateCookieName = 'aijuku_google_calendar_state';
const localVerifierCookieName = 'aijuku_google_calendar_verifier';
const oauthCookieLifetimeSeconds = 10 * 60;

function parseCookieHeader(value: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!value) return cookies;

  for (const entry of value.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 1) continue;
    const name = entry.slice(0, separator).trim();
    const cookieValue = entry.slice(separator + 1).trim();
    if (name) cookies.set(name, cookieValue);
  }
  return cookies;
}

function cookieHeader(input: {
  name: string;
  value: string;
  secure: boolean;
  maxAge: number;
}): string {
  const expiresAt = new Date(Date.now() + input.maxAge * 1_000);
  return [
    `${input.name}=${input.value}`,
    'Path=/',
    `Max-Age=${input.maxAge}`,
    `Expires=${expiresAt.toUTCString()}`,
    'HttpOnly',
    'SameSite=Lax',
    input.secure ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

function clearCookieHeader(name: string, secure: boolean): string {
  return [
    `${name}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax',
    secure ? 'Secure' : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export function googleCalendarOauthCookieHeaders(input: {
  request: Request;
  state: string;
  codeVerifier: string;
}): string[] {
  const secure = new URL(input.request.url).protocol === 'https:';
  return [
    cookieHeader({
      name: secure ? secureStateCookieName : localStateCookieName,
      value: input.state,
      secure,
      maxAge: oauthCookieLifetimeSeconds,
    }),
    cookieHeader({
      name: secure ? secureVerifierCookieName : localVerifierCookieName,
      value: input.codeVerifier,
      secure,
      maxAge: oauthCookieLifetimeSeconds,
    }),
  ];
}

export function readGoogleCalendarOauthCookies(request: Request): {
  state: string | null;
  codeVerifier: string | null;
} {
  const cookies = parseCookieHeader(request.headers.get('cookie'));
  return {
    state:
      cookies.get(secureStateCookieName) ??
      cookies.get(localStateCookieName) ??
      null,
    codeVerifier:
      cookies.get(secureVerifierCookieName) ??
      cookies.get(localVerifierCookieName) ??
      null,
  };
}

export function clearedGoogleCalendarOauthCookieHeaders(): string[] {
  return [
    clearCookieHeader(secureStateCookieName, true),
    clearCookieHeader(secureVerifierCookieName, true),
    clearCookieHeader(localStateCookieName, false),
    clearCookieHeader(localVerifierCookieName, false),
  ];
}

export function appendSetCookieHeaders(
  responseHeaders: Headers,
  values: readonly string[],
): void {
  for (const value of values) responseHeaders.append('Set-Cookie', value);
}

export function constantTimeTextEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}
