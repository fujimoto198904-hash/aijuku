import { registrationAvailability } from '@/lib/registration-config';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { withSiteBasePath } from '@/lib/site-paths';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getMember } from '@/db/membership';

import {
  chatGPTSignInPath,
  getAuthenticatedUser,
  getChatGPTUser,
  passwordChangePath,
} from '@/app/chatgpt-auth';
import { MemberLoginForm } from '@/components/member-login-form';
import Link from '@/components/site-link';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import {
  configuredOwnerLoginId,
  getAuthenticatedStaffPermissions,
} from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ログイン｜AIstock',
  description:
    'AIstockの無料会員マイページへログイン。学習記録、ブックマーク、質問や使い方の共有をひとつに。',
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    initial?: string | string[];
    error?: string | string[];
    return_to?: string | string[];
  }>;
};

function safeReturnTo(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/mypage';
  }
  try {
    const url = new URL(candidate, 'https://member.local');
    if (url.origin !== 'https://member.local') return '/mypage';
    const isPasswordManagementReturn =
      url.pathname === '/account/password' &&
      url.searchParams.get('mode') === 'manage';
    if (
      url.pathname === '/login' ||
      url.pathname.startsWith('/api/auth/') ||
      (url.pathname === '/account/password' && !isPasswordManagementReturn)
    ) {
      return '/mypage';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/mypage';
  }
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.return_to);
  const initialValue = Array.isArray(params.initial)
    ? params.initial[0]
    : params.initial;
  const isInitialVerificationReturn = initialValue === '1';
  if (isVercelRuntime()) {
    const publicQuery = new URLSearchParams();
    if (isInitialVerificationReturn) publicQuery.set('initial', '1');
    if (returnTo !== '/mypage') publicQuery.set('return_to', returnTo);
    redirect(
      canonicalMemberUrl(`/login${publicQuery.size ? `?${publicQuery}` : ''}`),
    );
  }
  const user = await getAuthenticatedUser();
  const accountReturnTo =
    user && getAuthenticatedStaffPermissions(user).isOwner
      ? '/aikanri'
      : returnTo;

  const hasVerifiedInitialIdentity = Boolean(
    isInitialVerificationReturn && user?.authMethod === 'chatgpt',
  );
  if (user?.mustChangePassword && !hasVerifiedInitialIdentity) {
    redirect(passwordChangePath(accountReturnTo));
  }
  if (
    user &&
    !hasVerifiedInitialIdentity &&
    (await getMember(user.userId)) &&
    (await getChatGPTUser())
  )
    redirect(withSiteBasePath(accountReturnTo));
  const verificationReturnPath = `/login?initial=1&return_to=${encodeURIComponent(
    accountReturnTo,
  )}`;
  const verificationPath = chatGPTSignInPath(verificationReturnPath);
  const initialLoginId = hasVerifiedInitialIdentity
    ? (configuredOwnerLoginId(user?.email ?? '') ?? user?.email ?? '')
    : '';

  const available = registrationAvailability();
  const errorValue = Array.isArray(params.error)
    ? params.error[0]
    : params.error;
  const googleError =
    errorValue === 'google-link'
      ? 'このメールでは既存のアカウントがあります。パスワードでログインし、マイページからGoogleを連携してください。'
      : errorValue === 'google-unavailable'
        ? 'Googleログインは準備中です。'
        : errorValue === 'google-failed'
          ? 'Googleログインを完了できませんでした。もう一度お試しください。'
          : null;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-xl px-5 py-12">
        <div className="soft-panel border border-rule bg-white p-7 sm:p-9">
          <h1 className="text-3xl font-bold">おかえりなさい。</h1>
          <p className="mt-4 leading-7 text-quiet">
            学びの続きも、みんなとの会話も、ここから。
          </p>
          {googleError && (
            <p role="alert" className="mt-5 leading-7 text-red-700">
              {googleError}
            </p>
          )}
          {available.google && (
            <a
              href={withSiteBasePath('/api/auth/google')}
              target="_top"
              className="soft-outline-button mt-7 flex min-h-12 items-center justify-center border border-rule font-semibold"
            >
              Googleでログイン
            </a>
          )}
          <MemberLoginForm
            initialLoginId={initialLoginId}
            returnTo={accountReturnTo}
            verificationPath={verificationPath}
            verifiedInitialIdentity={hasVerifiedInitialIdentity}
          />
          <Link className="mt-6 block text-sm text-sapphire" href="/textbook">
            ログインせず、Web教科書を読む →
          </Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
