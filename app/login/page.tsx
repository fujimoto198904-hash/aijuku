import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  KeyRound,
  Sparkles,
} from 'lucide-react';

import {
  chatGPTSignInPath,
  getAuthenticatedUser,
  passwordChangePath,
} from '@/app/chatgpt-auth';
import { BrandMark } from '@/components/brand-mark';
import { MemberLoginForm } from '@/components/member-login-form';
import Link from '@/components/site-link';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { configuredOwnerLoginId } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ログイン｜藤本実学塾',
  description:
    '藤本実学塾の無料会員マイページへログイン。学習の続き、ブックマーク、受講申込をひとつにまとめます。',
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{
    initial?: string | string[];
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
  const loginQuery = new URLSearchParams();
  if (isInitialVerificationReturn) loginQuery.set('initial', '1');
  if (returnTo !== '/mypage') loginQuery.set('return_to', returnTo);
  const loginPath = `/login${loginQuery.size ? `?${loginQuery}` : ''}`;

  if (isVercelRuntime()) redirect(canonicalMemberUrl(loginPath));

  const user = await getAuthenticatedUser();
  const hasVerifiedInitialIdentity = Boolean(
    isInitialVerificationReturn && user?.authMethod === 'chatgpt',
  );
  if (user?.mustChangePassword && !hasVerifiedInitialIdentity) {
    redirect(passwordChangePath(returnTo));
  }
  if (user && !hasVerifiedInitialIdentity) redirect(returnTo);
  const verificationReturnPath = `/login?initial=1&return_to=${encodeURIComponent(
    returnTo,
  )}`;
  const verificationPath = chatGPTSignInPath(verificationReturnPath);
  const initialLoginId = hasVerifiedInitialIdentity
    ? (configuredOwnerLoginId(user?.email ?? '') ?? user?.email ?? '')
    : '';

  return (
    <main
      id="main-content"
      className="min-h-screen bg-paper px-4 py-4 text-ink sm:px-6 sm:py-6 lg:grid lg:place-items-center"
    >
      <div className="soft-panel soft-panel-clip mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1180px] border border-rule bg-paper-white sm:min-h-0 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex items-center p-6 sm:p-10 lg:p-14">
          <div className="mx-auto w-full max-w-[500px]">
            <Link
              className="mb-9 flex items-center gap-3 font-mincho text-xl lg:hidden"
              href="/"
            >
              <BrandMark framed />
              藤本実学塾
            </Link>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                  MEMBER LOGIN
                </p>
                <h1 className="mt-3 font-mincho text-3xl sm:text-4xl">
                  マイページへ
                </h1>
              </div>
              <span className="soft-icon grid size-12 shrink-0 place-items-center bg-sapphire-soft text-sapphire">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
            </div>

            <MemberLoginForm
              initialLoginId={initialLoginId}
              returnTo={returnTo}
              verificationPath={verificationPath}
              verifiedInitialIdentity={hasVerifiedInitialIdentity}
            />

            <Link
              className="group mt-6 flex min-h-12 items-center justify-between border-t border-rule pt-6 text-xs font-semibold text-sapphire"
              href="/textbook"
            >
              ログインせず、無料のWeb教科書を見る
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>

        <section className="aurora-shell relative isolate overflow-hidden p-7 text-white sm:p-10 lg:flex lg:min-h-[760px] lg:flex-col lg:justify-between lg:p-14">
          <div
            className="soft-grid pointer-events-none absolute inset-0 -z-10"
            aria-hidden="true"
          />
          <div
            className="ambient-orb absolute -right-24 -top-20 -z-10 size-72 rounded-full bg-future-mint/15 blur-3xl"
            aria-hidden="true"
          />

          <Link
            className="hidden w-fit items-center gap-3 font-mincho text-xl lg:flex"
            href="/"
          >
            <BrandMark framed />
            藤本実学塾
          </Link>

          <div className="mt-16 max-w-lg lg:my-auto">
            <p className="text-xs font-semibold tracking-[0.18em] text-future-mint">
              WELCOME BACK
            </p>
            <h2 className="text-soft-glow mt-5 font-mincho text-[clamp(2.7rem,5vw,4.9rem)] leading-[1.13] tracking-[-0.04em]">
              学びの続きから、
              <br />
              また始めよう。
            </h2>
            <p className="mt-6 text-sm leading-7 text-white/70 sm:text-base sm:leading-8">
              気になる課題も、できたことも、次に作りたいものも。あなたのマイページから、いつでも続きへ戻れます。
            </p>
          </div>

          <ul className="mt-12 grid gap-3 text-xs text-white/72 sm:grid-cols-3 lg:mt-0">
            {[
              [BookOpenCheck, '学習記録'],
              [CheckCircle2, '完了課題'],
              [Sparkles, '次のおすすめ'],
            ].map(([Icon, label]) => {
              const ItemIcon = Icon as typeof BookOpenCheck;
              return (
                <li
                  className="glass-pill flex items-center gap-2 px-4 py-3"
                  key={String(label)}
                >
                  <ItemIcon
                    className="size-4 text-future-mint"
                    aria-hidden="true"
                  />
                  {String(label)}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
