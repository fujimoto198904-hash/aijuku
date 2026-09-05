import type { Metadata } from 'next';
import { withSiteBasePath } from '@/lib/site-paths';
import { paidServicesEnabled } from '@/lib/site-features';
import { redirect } from 'next/navigation';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { BrandMark } from '@/components/brand-mark';
import { MemberApplicationForm } from '@/components/member-application-form';
import Link from '@/components/site-link';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '受講を申し込む｜AIstock',
  description:
    '無料会員マイページから、対面・オンライン・教科書自習式の受講希望を送れます。',
  robots: { index: false, follow: false },
};

export default async function ReservePage({
  searchParams,
}: {
  searchParams?: Promise<{ service?: string }>;
}) {
  if (!paidServicesEnabled) redirect(withSiteBasePath('/community'));
  if (isVercelRuntime()) {
    const params = (await searchParams) ?? {};
    const service = params.service
      ? `?service=${encodeURIComponent(params.service)}`
      : '';
    redirect(canonicalMemberUrl(`/reserve${service}`));
  }
  const user = await requireChatGPTUser('/reserve');
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== 'active' ||
    !hasCurrentMembershipConsent(member)
  ) {
    redirect('/mypage/onboarding');
  }
  const params = (await searchParams) ?? {};

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <header className="border-b border-white/15 bg-brand-dark px-5 py-5 text-white sm:px-8">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4">
          <Link className="flex items-center gap-3" href="/mypage">
            <BrandMark framed />
            <span>
              <span className="block font-mincho text-lg">AIstock</span>
              <span className="block text-[10px] tracking-[0.12em] text-white/55">
                MEMBER APPLICATION
              </span>
            </span>
          </Link>
          <Link
            className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white"
            href={chatGPTSignOutPath('/')}
            target="_top"
          >
            <LogOut className="size-4" aria-hidden="true" />
            ログアウト
          </Link>
        </div>
      </header>
      <section className="border-b border-rule bg-paper-white px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto w-full max-w-[1120px]">
          <Link
            className="inline-flex items-center gap-2 text-xs font-semibold text-sapphire"
            href="/mypage"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            マイページへ戻る
          </Link>
          <p className="mt-10 text-xs font-semibold tracking-[0.16em] text-sapphire">
            MEMBER APPLICATION
          </p>
          <h1 className="text-soft-glow mt-5 font-mincho text-[clamp(2.6rem,5vw,4.8rem)] leading-[1.12] tracking-[-0.04em]">
            受講の希望を、
            <br />
            マイページから送る。
          </h1>
          <div className="mt-7 flex max-w-3xl items-start gap-3 text-sm leading-7 text-quiet">
            <ShieldCheck
              className="mt-1 size-4 shrink-0 text-sapphire"
              aria-hidden="true"
            />
            <p>
              登録中の連絡先は {user.email}{' '}
              です。電話番号やカード情報は、この画面では入力しません。
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="soft-panel mx-auto w-full max-w-[1120px] border border-rule bg-paper-white p-6 sm:p-9 lg:p-11">
          <MemberApplicationForm initialService={params.service} />
        </div>
      </section>
    </main>
  );
}
