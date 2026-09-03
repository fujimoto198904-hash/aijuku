import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  CalendarCheck,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';

import { chatGPTSignInPath, getAuthenticatedUser } from '@/app/chatgpt-auth';
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
    '無料会員になると、課題の保存、学習記録、受講申込がマイページで使えます。',
};

const benefits = [
  {
    Icon: BookmarkCheck,
    title: '気になる課題を保存',
    body: 'あとでマイページから開けます。',
  },
  {
    Icon: CheckCircle2,
    title: 'できた課題がわかる',
    body: '終わった課題を一覧で見られます。',
  },
  {
    Icon: BadgeCheck,
    title: '作ったものを残せる',
    body: '作品や仕事の成果を記録できます。',
  },
  {
    Icon: CalendarCheck,
    title: '受講を申し込める',
    body: '困ったときだけ、合う方法を選べます。',
  },
] as const;

export default async function JoinPage() {
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/join'));
  const user = await getAuthenticatedUser();
  const destination = user
    ? user.mustChangePassword
      ? '/account/password?return_to=%2Fmypage%2Fonboarding'
      : '/mypage/onboarding'
    : chatGPTSignInPath('/mypage/onboarding');

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <section className="border-b border-rule bg-paper-white px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto grid w-full max-w-[1240px] gap-12 lg:grid-cols-[1fr_0.68fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                無料会員登録
              </p>
              <h1 className="text-soft-glow mt-6 max-w-4xl font-mincho text-[clamp(2.8rem,6vw,5.8rem)] font-medium leading-[1.13] tracking-[-0.045em]">
                教科書は無料。
                <br />
                記録を残すなら、
                <span className="text-highlight text-human-coral">
                  無料会員。
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-quiet">
                課題の保存、学習記録、受講申込がマイページで使えます。無料会員に料金はかかりません。
              </p>
              <div className="mt-8 grid gap-3 lg:hidden">
                <Link
                  className="button-glow flex min-h-14 items-center justify-between px-5 text-sm font-semibold text-white"
                  href={destination}
                  target={user ? undefined : '_top'}
                >
                  {user ? 'マイページへ進む' : 'ChatGPTで無料会員登録'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                {!user ? (
                  <Link
                    className="soft-outline-button flex min-h-12 items-center justify-between border border-rule bg-paper px-5 text-xs font-semibold text-sapphire"
                    href="/login"
                  >
                    登録済みの方はログイン
                    <KeyRound className="size-4" aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="space-y-5">
              <OnlinePriceSpotlight />
              <div className="soft-card border border-future-mint/45 bg-future-mint-soft/45 p-6 sm:p-8">
                <UserRoundCheck
                  className="size-6 text-sapphire"
                  aria-hidden="true"
                />
                <p className="mt-5 text-sm font-semibold">
                  ChatGPTでかんたん登録
                </p>
                <p className="mt-3 text-xs leading-6 text-quiet">
                  いつも使うChatGPTのメールアドレスで登録します。
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

            <div className="soft-panel mx-auto mt-12 max-w-3xl border border-rule bg-paper-white p-7 sm:p-10">
              <p className="text-center text-xs font-semibold tracking-[0.14em] text-sapphire">
                {user ? '登録を続ける' : '登録・ログイン'}
              </p>
              {user ? (
                <Link
                  className="button-glow group mt-6 flex min-h-16 items-center justify-between px-6 text-sm font-semibold text-white"
                  href={destination}
                >
                  マイページへ進む
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <Link
                    className="button-glow group flex min-h-36 flex-col items-start justify-between p-6 text-white"
                    href={destination}
                    target="_top"
                  >
                    <UserRoundCheck className="size-6" aria-hidden="true" />
                    <span className="mt-6 flex w-full items-end justify-between gap-3 text-left">
                      <span>
                        <span className="block text-[11px] font-semibold tracking-[0.12em] text-white/65">
                          初めての方
                        </span>
                        <span className="mt-1 block text-sm font-semibold">
                          ChatGPTで無料会員登録
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                  <Link
                    className="soft-card soft-interactive flex min-h-36 flex-col items-start justify-between border border-rule bg-paper p-6 text-ink"
                    href="/login"
                  >
                    <KeyRound
                      className="size-6 text-sapphire"
                      aria-hidden="true"
                    />
                    <span className="mt-6 flex w-full items-end justify-between gap-3 text-left">
                      <span>
                        <span className="block text-[11px] font-semibold tracking-[0.12em] text-quiet">
                          登録済みの方
                        </span>
                        <span className="mt-1 block text-sm font-semibold">
                          ID・パスワードでログイン
                        </span>
                      </span>
                      <ArrowRight
                        className="size-4 shrink-0 text-sapphire"
                        aria-hidden="true"
                      />
                    </span>
                  </Link>
                </div>
              )}
              <div className="soft-control mt-5 flex gap-3 bg-paper p-4 text-left">
                <ShieldCheck
                  className="mt-0.5 size-5 shrink-0 text-sapphire"
                  aria-hidden="true"
                />
                <p className="text-xs leading-6 text-quiet">
                  最初のパスワードは誕生日8桁です。誕生日そのものは保存せず、初回ログイン後に自分のパスワードへ変更します。
                </p>
              </div>
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
