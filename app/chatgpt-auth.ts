import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import {
  getMemberAuthAccount,
  passwordAuthEmail,
  resolveBillingPasswordSession,
  resolvePasswordSession,
  type BillingMemberStatus,
} from '@/db/member-auth';
import { getMember } from '@/db/membership';
import { readMemberSessionToken } from '@/lib/member-session-cookie';
import { withSiteBasePath, withoutSiteBasePath } from '@/lib/site-paths';

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  loginId: string;
  fullName: string | null;
  authMethod: 'chatgpt' | 'password';
  mustChangePassword: boolean;
  isDemo: boolean;
};

export type BillingAuthenticatedUser = ChatGPTUser & {
  memberStatus: BillingMemberStatus;
};

export type ChatGPTHeaderIdentity = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

const USER_ID_HEADER = 'oai-authenticated-user-id';
const USER_EMAIL_HEADER = 'oai-authenticated-user-email';
const USER_FULL_NAME_HEADER = 'oai-authenticated-user-full-name';
const USER_FULL_NAME_ENCODING_HEADER =
  'oai-authenticated-user-full-name-encoding';
const PERCENT_ENCODED_UTF8 = 'percent-encoded-utf-8';
const SIGN_IN_PATH = '/signin-with-chatgpt';
const SIGN_OUT_PATH = '/signout-with-chatgpt';
const CALLBACK_PATH = '/callback';
const LOGIN_PATH = '/login';
const PASSWORD_CHANGE_PATH = '/account/password';

export async function getAuthenticatedUser(): Promise<ChatGPTUser | null> {
  const memberSessionToken = await readMemberSessionToken();
  if (memberSessionToken) {
    const sessionUser = await resolvePasswordSession(memberSessionToken);
    if (sessionUser) {
      return {
        userId: sessionUser.memberId,
        displayName: sessionUser.displayName,
        email: passwordAuthEmail(sessionUser),
        loginId: sessionUser.loginId,
        fullName: sessionUser.displayName,
        authMethod: 'password',
        mustChangePassword: sessionUser.sessionKind === 'password-change',
        isDemo: sessionUser.accountKind === 'demo',
      };
    }
  }

  const identity = readChatGPTIdentityHeaders(await headers());
  if (!identity) return null;
  const linkedAccount = await getMemberAuthAccount(identity.userId);
  if (linkedAccount?.status === 'disabled') return null;

  return {
    ...identity,
    loginId: linkedAccount?.loginId ?? identity.email,
    authMethod: 'chatgpt',
    mustChangePassword: linkedAccount?.passwordState === 'temporary',
    isDemo: linkedAccount?.accountKind === 'demo',
  };
}

export function readChatGPTIdentityHeaders(
  requestHeaders: Pick<Headers, 'get'>,
): ChatGPTHeaderIdentity | null {
  const userId = cleanIdentityHeader(requestHeaders.get(USER_ID_HEADER), 200);
  const email = cleanIdentityHeader(requestHeaders.get(USER_EMAIL_HEADER), 320);
  if (!userId || !email || !isPlausibleEmail(email)) return null;

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const decodedFullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;
  const fullName = cleanIdentityHeader(decodedFullName, 160);
  return {
    userId,
    displayName: fullName ?? email,
    email,
    fullName,
  };
}

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const user = await getAuthenticatedUser();
  if (!user || user.mustChangePassword) return null;
  if (
    user.authMethod === 'chatgpt' &&
    !(await getMemberAuthAccount(user.userId))
  )
    return null;
  return user;
}

export async function getBillingAuthenticatedUser(): Promise<BillingAuthenticatedUser | null> {
  const memberSessionToken = await readMemberSessionToken();
  if (memberSessionToken) {
    const sessionUser = await resolveBillingPasswordSession(memberSessionToken);
    if (sessionUser) {
      return {
        userId: sessionUser.memberId,
        displayName: sessionUser.displayName,
        email: passwordAuthEmail(sessionUser),
        loginId: sessionUser.loginId,
        fullName: sessionUser.displayName,
        authMethod: 'password',
        mustChangePassword: false,
        isDemo: false,
        memberStatus: sessionUser.memberStatus,
      };
    }
  }

  const identity = readChatGPTIdentityHeaders(await headers());
  if (!identity) return null;
  const [linkedAccount, member] = await Promise.all([
    getMemberAuthAccount(identity.userId),
    getMember(identity.userId),
  ]);
  if (
    !linkedAccount ||
    !member ||
    linkedAccount.status !== 'active' ||
    linkedAccount.accountKind !== 'member' ||
    linkedAccount.passwordState !== 'personal'
  ) {
    return null;
  }

  return {
    ...identity,
    loginId: linkedAccount.loginId,
    authMethod: 'chatgpt',
    mustChangePassword: false,
    isDemo: false,
    memberStatus: member.status,
  };
}

function cleanIdentityHeader(value: string | null, maxLength: number) {
  if (!value) return null;
  const normalized = value.trim();
  if (normalized.length < 1 || normalized.length > maxLength) {
    return null;
  }
  for (const character of normalized) {
    const codePoint = character.codePointAt(0) ?? 0;
    if (codePoint < 32 || codePoint === 127) return null;
  }
  return normalized;
}

function isPlausibleEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getAuthenticatedUser();
  if (user?.mustChangePassword) {
    redirect(passwordChangePath(returnTo));
  }
  if (
    user &&
    (user.authMethod === 'password' ||
      (await getMemberAuthAccount(user.userId)))
  )
    return user;

  redirect(memberLoginPath(returnTo));
}

export async function requireBillingAuthenticatedUser(
  returnTo = '/mypage/billing',
): Promise<BillingAuthenticatedUser> {
  const user = await getBillingAuthenticatedUser();
  if (user) return user;

  const regularUser = await getAuthenticatedUser();
  if (regularUser?.mustChangePassword) {
    redirect(passwordChangePath(returnTo));
  }
  if (regularUser) redirect(withSiteBasePath('/mypage'));
  redirect(memberLoginPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = withSiteBasePath(safeRelativeReturnPath(returnTo));
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = '/'): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `/api/auth/logout?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function legacyChatGPTSignOutPath(returnTo = '/'): string {
  const safeReturnTo = withSiteBasePath(safeRelativeReturnPath(returnTo));
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function memberLoginPath(returnTo = '/mypage'): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${withSiteBasePath(LOGIN_PATH)}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function passwordChangePath(returnTo = '/mypage'): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${withSiteBasePath(PASSWORD_CHANGE_PATH)}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith('/') || value.startsWith('//')) return '/';

  let url: URL;
  try {
    url = new URL(value, 'https://app.local');
  } catch {
    return '/';
  }
  if (url.origin !== 'https://app.local') return '/';
  if (isReservedAuthPath(withoutSiteBasePath(url.pathname))) return '/';

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH ||
    pathname === '/api/auth/logout'
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
