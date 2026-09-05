import { env } from 'cloudflare:workers';
import {
  createSessionToken,
  requirePasswordPepper,
  sha256Base64Url,
} from '@/lib/password-security';
import { canonicalPublicPath } from '@/lib/site-paths';
const encoder = new TextEncoder();
const b64 = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const bytes = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) =>
    c.charCodeAt(0),
  );
async function signingKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(requirePasswordPepper(env.AUTH_PASSWORD_PEPPER)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}
export type GoogleFlow = {
  state: string;
  verifier: string;
  nonce: string;
  expiresAt: number;
  memberId: string | null;
};
export const googleFlowCookie = 'aistock_google_flow';
export function googleCallbackUrl() {
  return canonicalPublicPath('/api/auth/google/callback');
}
export function googleConfig() {
  if (!env.AUTH_GOOGLE_CLIENT_ID || !env.AUTH_GOOGLE_CLIENT_SECRET)
    throw new Error('Googleログインは準備中です。');
  return {
    clientId: env.AUTH_GOOGLE_CLIENT_ID,
    secret: env.AUTH_GOOGLE_CLIENT_SECRET,
  };
}
export async function beginGoogleFlow(memberId: string | null) {
  const config = googleConfig();
  const flow: GoogleFlow = {
    state: createSessionToken(),
    verifier: createSessionToken(),
    nonce: createSessionToken(),
    expiresAt: Date.now() + 600000,
    memberId,
  };
  const encoded = b64(encoder.encode(JSON.stringify(flow)));
  const signature = b64(
    new Uint8Array(
      await crypto.subtle.sign(
        'HMAC',
        await signingKey(),
        encoder.encode(encoded),
      ),
    ),
  );
  const query = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: googleCallbackUrl(),
    response_type: 'code',
    scope: 'openid email profile',
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: await sha256Base64Url(flow.verifier),
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return {
    cookie: encoded + '.' + signature,
    url: 'https://accounts.google.com/o/oauth2/v2/auth?' + query,
  };
}
export async function readGoogleFlow(
  cookie: string,
): Promise<GoogleFlow | null> {
  try {
    const [value, signature, ...extra] = cookie.split('.');
    if (
      extra.length ||
      !value ||
      !signature ||
      !(await crypto.subtle.verify(
        'HMAC',
        await signingKey(),
        bytes(signature),
        encoder.encode(value),
      ))
    )
      return null;
    const flow = JSON.parse(
      new TextDecoder().decode(bytes(value)),
    ) as GoogleFlow;
    return flow.expiresAt > Date.now() ? flow : null;
  } catch {
    return null;
  }
}
export function googleCookieHeader(
  value: string,
  secure: boolean,
  maxAge = 600,
) {
  return (
    googleFlowCookie +
    '=' +
    value +
    '; Path=/; HttpOnly; SameSite=Lax; Max-Age=' +
    maxAge +
    (secure ? '; Secure' : '')
  );
}
export async function verifyGoogleCode(code: string, flow: GoogleFlow) {
  const config = googleConfig();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    signal: AbortSignal.timeout(10000),
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: config.clientId,
      client_secret: config.secret,
      redirect_uri: googleCallbackUrl(),
      code,
      code_verifier: flow.verifier,
    }),
  });
  if (!response.ok) throw new Error('Google認証を完了できませんでした。');
  const data = (await response.json()) as { id_token?: string };
  const [h, p, s, ...rest] = (data.id_token ?? '').split('.');
  if (!h || !p || !s || rest.length)
    throw new Error('Google認証を確認できません。');
  const header = JSON.parse(new TextDecoder().decode(bytes(h)));
  const claim = JSON.parse(new TextDecoder().decode(bytes(p)));
  if (header.alg !== 'RS256') throw new Error('Google署名が正しくありません。');
  const certs = await fetch('https://www.googleapis.com/oauth2/v3/certs', {
    signal: AbortSignal.timeout(10000),
  });
  if (!certs.ok) throw new Error('Google署名を確認できません。');
  const { keys } = (await certs.json()) as {
    keys: (JsonWebKey & { kid: string })[];
  };
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Google署名を確認できません。');
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  if (
    !(await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      bytes(s),
      encoder.encode(h + '.' + p),
    )) ||
    !['https://accounts.google.com', 'accounts.google.com'].includes(
      claim.iss,
    ) ||
    claim.aud !== config.clientId ||
    (claim.azp && claim.azp !== config.clientId) ||
    !Number.isFinite(claim.exp) ||
    claim.exp * 1000 <= Date.now() ||
    !Number.isFinite(claim.iat) ||
    claim.iat * 1000 > Date.now() + 60000 ||
    claim.nonce !== flow.nonce ||
    claim.email_verified !== true ||
    typeof claim.email !== 'string' ||
    typeof claim.sub !== 'string' ||
    !claim.sub
  )
    throw new Error('Google認証情報が正しくありません。');
  return {
    email: claim.email.toLowerCase(),
    subject: claim.sub as string,
    authoritative:
      claim.email.toLowerCase().endsWith('@gmail.com') ||
      (typeof claim.hd === 'string' && claim.hd.length > 0),
  };
}
