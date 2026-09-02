import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';

import { getAuthenticatedUser, memberLoginPath } from '@/app/chatgpt-auth';
import { BrandMark } from '@/components/brand-mark';
import { PasswordChangeForm } from '@/components/password-change-form';
import Link from '@/components/site-link';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'パスワード変更｜藤本実学塾',
  robots: { index: false, follow: false },
};

type PasswordPageProps = {
  searchParams: Promise<{
    return_to?: string | string[];
    mode?: string | string[];
  }>;
};

function safeReturnTo(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (!candidate || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return '/mypage';
  }
  try {
    const url = new URL(candidate, 'https://member.local');
    if (
      url.origin !== 'https://member.local' ||
      url.pathname === '/account/password' ||
      url.pathname.startsWith('/api/auth/')
    ) {
      return '/mypage';
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/mypage';
  }
}

export default async function PasswordPage({
  searchParams,
}: PasswordPageProps) {
  const params = await searchParams;
  const returnTo = safeReturnTo(params.return_to);
  const mode = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const requestedManagement = mode === 'manage';
  const requestedPagePath = `/account/password?return_to=${encodeURIComponent(returnTo)}${
    requestedManagement ? '&mode=manage' : ''
  }`;
  const loginPath = memberLoginPath(requestedPagePath);

  if (isVercelRuntime()) redirect(canonicalMemberUrl(requestedPagePath));

  const user = await getAuthenticatedUser();
  if (!user) redirect(loginPath);
  if (user.isDemo) redirect('/mypage');
  if (!user.mustChangePassword && !requestedManagement) redirect(returnTo);
  const isInitialChange = user.mustChangePassword;

  return (
    <main
      id="main-content"
      className="section-aura min-h-screen bg-paper px-4 py-6 text-ink sm:px-8 sm:py-12"
    >
      <div className="mx-auto w-full max-w-[760px]">
        <Link
          className="flex w-fit items-center gap-3 font-mincho text-xl"
          href="/"
        >
          <BrandMark framed />
          藤本実学塾
        </Link>

        <section className="soft-panel mt-8 border border-rule bg-paper-white p-6 sm:p-10 lg:p-12">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                {isInitialChange ? 'FIRST SECURITY STEP' : 'ACCOUNT SECURITY'}
              </p>
              <h1 className="mt-4 whitespace-pre-line font-mincho text-3xl leading-tight sm:text-4xl">
                {isInitialChange
                  ? '最初に、自分だけの\nパスワードへ。'
                  : 'パスワードを変更'}
              </h1>
            </div>
            <span className="soft-icon grid size-12 shrink-0 place-items-center bg-sapphire-soft text-sapphire sm:size-14">
              <KeyRound className="size-5 sm:size-6" aria-hidden="true" />
            </span>
          </div>

          <p className="mt-5 text-sm leading-7 text-quiet">
            {isInitialChange
              ? '初期パスワードは、登録した誕生日の8桁（YYYYMMDD）で、発行から72時間有効です。ここで自分だけが知っている鍵に変えると、学習を始められます。'
              : '現在のパスワードを確認し、新しいパスワードへ更新します。'}
          </p>

          {isInitialChange ? (
            <ol className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                [LockKeyhole, '01', '初期パスを入力'],
                [KeyRound, '02', '新しい鍵を作る'],
                [ShieldCheck, '03', '安全に学び始める'],
              ].map(([Icon, number, label]) => {
                const ItemIcon = Icon as typeof KeyRound;
                return (
                  <li
                    className="soft-control border border-rule bg-paper px-4 py-4"
                    key={String(number)}
                  >
                    <div className="flex items-center gap-2 text-sapphire">
                      <ItemIcon className="size-4" aria-hidden="true" />
                      <span className="numeric-text text-[11px] font-semibold">
                        {String(number)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold">
                      {String(label)}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : null}

          <PasswordChangeForm
            isInitialChange={isInitialChange}
            loginId={user.email}
            loginPath={loginPath}
            returnTo={returnTo}
          />
        </section>
      </div>
    </main>
  );
}
