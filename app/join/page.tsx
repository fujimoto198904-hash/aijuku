import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  CalendarCheck,
  CheckCircle2,
  UserRoundCheck,
} from 'lucide-react';

import { chatGPTSignInPath, getChatGPTUser } from '@/app/chatgpt-auth';
import { OnlinePriceSpotlight } from '@/components/online-price-spotlight';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import { sharedFees } from '@/lib/member-service-plans';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '無料会員登録｜藤本実学塾',
  description:
    '藤本実学塾の無料会員登録ページです。課題のブックマーク、完了記録、実践記録、受講申込を一つのマイページで管理できます。',
};

const benefits = [
  {
    Icon: BookmarkCheck,
    title: '気になる課題を、あとで開ける',
    body: '今は時間がない課題も「あとでやる」へ保存。探し直さず、マイページから開けます。',
  },
  {
    Icon: CheckCircle2,
    title: 'やった課題が、ひと目でわかる',
    body: '完成したら自分で「完了」に。できた課題が一覧になり、積み重ねを確認できます。',
  },
  {
    Icon: BadgeCheck,
    title: 'できたことを、実践記録に残せる',
    body: '成果物名・説明・外部URLを記録し、講師が確認した範囲と分けてURL共有できます。',
  },
  {
    Icon: CalendarCheck,
    title: '必要なときだけ、受講を申し込める',
    body: '対面、Google Meet、対面・教科書自習式から、迷ったときに必要な方法を選べます。',
  },
] as const;

export default async function JoinPage() {
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/join'));
  const user = await getChatGPTUser();
  const destination = user
    ? '/mypage'
    : chatGPTSignInPath('/mypage/onboarding');

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <section className="border-b border-rule bg-paper-white px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 lg:grid-cols-[1fr_0.68fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                FREE MEMBERSHIP
              </p>
              <h1 className="text-soft-glow mt-6 max-w-4xl font-mincho text-[clamp(2.8rem,6vw,5.8rem)] font-medium leading-[1.13] tracking-[-0.045em]">
                学ぶだけなら、
                <br />
                登録不要。
                <br />
                <span className="text-highlight text-human-coral">
                  残して続ける
                </span>
                なら、無料会員。
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-quiet">
                公開中のWeb教科書は、登録も購入も不要で完全無料です。無料会員になると、気になる課題のブックマーク、自分で完了にした課題、成果物名や外部URLの実践記録をマイページへまとめられます。登録だけで料金は発生しません。
              </p>
            </div>

            <div className="space-y-5">
              <OnlinePriceSpotlight />
              <div className="soft-card border border-future-mint/45 bg-future-mint-soft/45 p-6 sm:p-8">
                <UserRoundCheck
                  className="size-6 text-sapphire"
                  aria-hidden="true"
                />
                <p className="mt-5 text-sm font-semibold">ChatGPTで本人確認</p>
                <p className="mt-3 text-xs leading-6 text-quiet">
                  新しいパスワードは作りません。これから学習に使うChatGPTアカウントで登録します。
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto w-full max-w-[1120px]">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map(({ Icon, title, body }) => (
                <article
                  className="soft-card soft-interactive border border-rule bg-paper-white p-7"
                  key={title}
                >
                  <span className="soft-icon grid size-11 place-items-center bg-sapphire-soft text-sapphire">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-mincho text-xl">{title}</h2>
                  <p className="mt-4 text-xs leading-6 text-quiet">{body}</p>
                </article>
              ))}
            </div>

            <div className="soft-panel mx-auto mt-12 max-w-2xl border border-rule bg-paper-white p-7 sm:p-10">
              <p className="text-center text-xs font-semibold tracking-[0.14em] text-sapphire">
                {user ? 'SIGNED IN' : 'START HERE'}
              </p>
              <Link
                className="button-glow group mt-6 flex min-h-16 items-center justify-between px-6 text-sm font-semibold text-white"
                href={destination}
                target={user ? undefined : '_top'}
              >
                {user
                  ? '登録状況を確認してマイページへ'
                  : 'ChatGPTで無料会員登録を始める'}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
              <p className="mt-5 text-center text-xs leading-6 text-quiet">
                登録は無料です。{sharedFees.entranceCampaign}は入会金
                {sharedFees.entrance}（{sharedFees.entranceRegular}）。
                受講料は申込前に確認します。
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
                <Link
                  className="text-sapphire underline underline-offset-4"
                  href="/terms"
                >
                  無料会員利用規約
                </Link>
                <Link
                  className="text-sapphire underline underline-offset-4"
                  href="/privacy"
                >
                  プライバシーポリシー
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
