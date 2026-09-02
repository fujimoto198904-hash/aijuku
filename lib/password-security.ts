const encoder = new TextEncoder();

const passwordDigestVersion = 'pbkdf2-sha256-hmacpepper-v1';
// Sites Workers currently reject PBKDF2 iteration counts above 100,000.
// The digest also uses a deployment-only HMAC pepper; login throttling and the
// short-lived, verified-email flow protect the deliberately simple first key.
export const passwordIterations = 100_000;
export const minimumPersonalPasswordLength = 8;
export const maximumPasswordLength = 128;

export function isValidInitialPassword(input: {
  accountKind: 'member' | 'demo';
  password: string;
}): boolean {
  if (input.accountKind === 'member') return /^\d{8}$/.test(input.password);
  return (
    input.password.length >= 8 && input.password.length <= maximumPasswordLength
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

function secureRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

async function pepperPassword(
  password: string,
  pepper: string,
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', key, encoder.encode(password));
}

async function derivePasswordBits(input: {
  password: string;
  pepper: string;
  salt: Uint8Array;
  iterations: number;
}): Promise<Uint8Array> {
  const peppered = await pepperPassword(input.password, input.pepper);
  const key = await crypto.subtle.importKey('raw', peppered, 'PBKDF2', false, [
    'deriveBits',
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: Uint8Array.from(input.salt).buffer,
      iterations: input.iterations,
    },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export function requirePasswordPepper(value: string | undefined): string {
  const pepper = value?.trim() ?? '';
  if (pepper.length < 32) {
    throw new Error('Password authentication is not configured.');
  }
  return pepper;
}

export async function hashPassword(
  password: string,
  pepper: string,
): Promise<string> {
  if (password.length < 1 || password.length > maximumPasswordLength) {
    throw new Error('Password length is invalid.');
  }
  const salt = secureRandomBytes(16);
  const digest = await derivePasswordBits({
    password,
    pepper,
    salt,
    iterations: passwordIterations,
  });
  return [
    passwordDigestVersion,
    String(passwordIterations),
    bytesToBase64Url(salt),
    bytesToBase64Url(digest),
  ].join('$');
}

export async function verifyPassword(input: {
  password: string;
  pepper: string;
  storedDigest: string;
}): Promise<boolean> {
  if (
    input.password.length < 1 ||
    input.password.length > maximumPasswordLength
  ) {
    return false;
  }
  const [version, rawIterations, rawSalt, rawDigest, ...rest] =
    input.storedDigest.split('$');
  if (rest.length > 0 || version !== passwordDigestVersion) return false;
  const iterations = Number.parseInt(rawIterations ?? '', 10);
  const salt = rawSalt ? base64UrlToBytes(rawSalt) : null;
  const expected = rawDigest ? base64UrlToBytes(rawDigest) : null;
  if (
    iterations !== passwordIterations ||
    !salt ||
    salt.length !== 16 ||
    !expected ||
    expected.length !== 32
  ) {
    return false;
  }
  const actual = await derivePasswordBits({
    password: input.password,
    pepper: input.pepper,
    salt,
    iterations,
  });
  return constantTimeEqual(actual, expected);
}

export function validatePersonalPassword(input: {
  password: string;
  loginId: string;
}): string | null {
  const password = input.password;
  if (/^\d{8}$/.test(password)) {
    return '誕生日8桁ではなく、自分専用のパスワードを設定してください。';
  }
  if (password.length < minimumPersonalPasswordLength) {
    return `${minimumPersonalPasswordLength}文字以上で入力してください。`;
  }
  if (!password.trim()) {
    return '空白以外の文字を含むパスワードを設定してください。';
  }
  if (password.length > maximumPasswordLength) {
    return `${maximumPasswordLength}文字以内で入力してください。`;
  }
  if (password.toLowerCase() === input.loginId.toLowerCase()) {
    return 'メールアドレスやログインIDと異なるパスワードを設定してください。';
  }
  return null;
}

export function normalizeLoginId(value: unknown): string {
  if (typeof value !== 'string') return '';
  const normalized = value.trim().normalize('NFKC').toLowerCase();
  const hasInvalidCharacter = Array.from(normalized).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return /\s/u.test(character) || codePoint < 32 || codePoint === 127;
  });
  if (normalized.length < 3 || normalized.length > 320 || hasInvalidCharacter) {
    return '';
  }
  return normalized;
}

export function isPlausibleMemberEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

export function verifiedIdentityMatchesTemporaryAccount(input: {
  identity: { userId: string; email: string } | null;
  loginId: string;
  contactEmail: string | null;
}): boolean {
  if (!input.identity?.userId.trim()) return false;
  const verifiedEmail = normalizeLoginId(input.identity.email);
  const loginId = normalizeLoginId(input.loginId);
  const contactEmail = normalizeLoginId(input.contactEmail ?? input.loginId);
  return (
    isPlausibleMemberEmail(verifiedEmail) &&
    verifiedEmail === loginId &&
    verifiedEmail === contactEmail
  );
}

export function verifiedIdentityCanClaimTemporaryAccount(input: {
  identity: { userId: string; email: string } | null;
  loginId: string;
  contactEmail: string | null;
  configuredOwnerLoginId?: string;
  identityIsOwner?: boolean;
}): boolean {
  if (verifiedIdentityMatchesTemporaryAccount(input)) return true;
  if (!input.identity?.userId.trim() || !input.identityIsOwner) return false;

  const verifiedEmail = normalizeLoginId(input.identity.email);
  const loginId = normalizeLoginId(input.loginId);
  const ownerLoginId = normalizeLoginId(input.configuredOwnerLoginId ?? '');
  return (
    isPlausibleMemberEmail(verifiedEmail) &&
    Boolean(ownerLoginId) &&
    loginId === ownerLoginId
  );
}

export function initialPasswordFromBirthDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1900 ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  ) {
    return null;
  }
  return `${match[1]}${match[2]}${match[3]}`;
}

export function createSessionToken(): string {
  return bytesToBase64Url(secureRandomBytes(32));
}

export async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function protectedIdentifierHash(
  value: string,
  pepper: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export function timingSafeEqualText(left: string, right: string): boolean {
  return constantTimeEqual(encoder.encode(left), encoder.encode(right));
}
