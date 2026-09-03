import {
  ArrowRight,
  BookOpenCheck,
  BookOpenText,
  ExternalLink,
  MousePointerClick,
  Search,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { DemoDataLibrary } from '@/components/demo-data-library';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import { TextbookAccessLegend } from '@/components/textbook/access-badges';
import { TextbookSubnav } from '@/components/textbook/textbook-subnav';
import { MemberLearningPromo } from '@/components/textbook/member-learning-promo';
import { canonicalPublicPath } from '@/lib/site-paths';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { textbookExplorePath, textbookLessonPath } from '@/lib/textbook-routes';

type TextbookPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const guideSteps = [
  {
    number: '01',
    label: '使い方を知る',
    title: 'まず、使い方を見る。',
    body: '教科書の始め方を、ここで確認します。',
    note: '今ここ',
    Icon: BookOpenCheck,
  },
  {
    number: '02',
    label: '学ぶことを探す',
    title: '作りたいものから選ぶ。',
    body: '最初からでも、好きな課題からでも大丈夫です。',
    note: '探すページへ',
    Icon: Search,
  },
  {
    number: '03',
    label: '教科書を読む',
    title: '1課題だけ、新しいタブで開く。',
    body: '選んだ課題は別タブで開きます。',
    note: '別タブで開く',
    Icon: MousePointerClick,
  },
] as const;

function requestedTaskIdFrom(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const requestedTask = searchParams.task;
  return Array.isArray(requestedTask) ? requestedTask[0] : requestedTask;
}

export const metadata: Metadata = {
  title: 'Web教科書の使い方｜藤本実学塾',
  description:
    '登録なしで無料で学べるWeb教科書。好きな課題を一つずつ、別タブで開いて学べます。',
  alternates: { canonical: canonicalPublicPath('/textbook') },
};

export default async function TextbookPage({
  searchParams,
}: TextbookPageProps) {
  const requestedTaskId = requestedTaskIdFrom(await searchParams)?.trim();

  if (requestedTaskId) {
    const requestedTask = findTextbookTask(requestedTaskId);
    redirect(
      requestedTask
        ? textbookLessonPath(requestedTask.id)
        : textbookExplorePath,
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <TextbookSubnav current="guide" />

        <section className="section-aura border-b border-rule bg-paper-white px-5 py-14 sm:px-8 sm:py-20 lg:px-10 lg:py-24">
          <div className="mx-auto w-full max-w-[1000px]">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-rust">
                Web教科書の使い方
              </p>
              <h1 className="soft-section-heading mt-5 max-w-4xl font-mincho text-[clamp(2.8rem,6vw,5.8rem)] font-medium leading-[1.1] tracking-[-0.045em]">
                Web教科書を、
                <br />
                迷わず始める。
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-quiet sm:text-lg sm:leading-9">
                登録も購入もいりません。気になる課題を一つ選べば、すぐ始められます。
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="button-glow group inline-flex min-h-14 items-center justify-between gap-8 px-6 text-sm font-semibold text-white"
                  href={textbookExplorePath}
                >
                  学ぶことを探す
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <Link
                  className="soft-outline-button inline-flex min-h-14 items-center justify-center gap-3 border border-brand-dark px-6 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark hover:text-white"
                  href={textbookLessonPath('Lv.01')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lv.01を別タブで読む
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-rule bg-paper px-5 py-10 sm:px-8 sm:py-12 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <TextbookAccessLegend />
          </div>
        </section>

        <section
          className="border-b border-rule bg-paper px-5 py-16 sm:px-8 sm:py-24 lg:px-10"
          aria-labelledby="three-steps-heading"
        >
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                使い方
              </p>
              <h2
                id="three-steps-heading"
                className="soft-section-heading mt-5 font-mincho text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-[1.14] tracking-[-0.04em]"
              >
                使い方は、3つだけ。
              </h2>
            </div>

            <ol className="soft-panel soft-panel-clip mt-12 grid border border-rule bg-paper-white lg:grid-cols-3">
              {guideSteps.map(({ number, label, title, body, note, Icon }) => (
                <li
                  key={number}
                  className="group border-b border-rule p-7 last:border-b-0 sm:p-9 lg:border-b-0 lg:border-r lg:last:border-r-0"
                >
                  <div className="flex items-center justify-between gap-5">
                    <span className="soft-icon grid size-12 place-items-center bg-sapphire-soft text-sapphire">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="numeric-text text-sm text-quiet">
                      {number}
                    </span>
                  </div>
                  <p className="mt-7 text-xs font-semibold tracking-[0.12em] text-rust">
                    {label}
                  </p>
                  <h3 className="mt-3 font-mincho text-2xl leading-9">
                    {title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-quiet">{body}</p>
                  <p className="mt-6 border-t border-rule pt-4 text-xs font-semibold text-sapphire">
                    {note}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section
          className="border-b border-rule bg-paper-white px-5 py-16 sm:px-8 sm:py-24 lg:px-10"
          aria-labelledby="level-zero-heading"
        >
          <div className="soft-panel soft-panel-clip mx-auto grid w-full max-w-[1240px] overflow-hidden border border-rule bg-sapphire-soft/60 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="flex min-h-[280px] flex-col justify-between bg-deep-green p-7 text-white sm:p-10">
              <Sparkles
                className="size-8 text-future-mint"
                aria-hidden="true"
              />
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                  LEVEL 0
                </p>
                <p className="mt-4 font-mincho text-3xl leading-tight sm:text-4xl">
                  AI初体験の
                  <br />
                  入り口。
                </p>
              </div>
            </div>
            <div className="p-7 sm:p-10 lg:p-12">
              <h2
                id="level-zero-heading"
                className="font-mincho text-3xl leading-[1.4] sm:text-4xl"
              >
                Level 0は、難易度の順位ではありません。
              </h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-quiet">
                AIを使ったことがない方の入り口です。「何から始めればいいか分からない」ときに選んでください。
              </p>
              <Link
                className="button-glow group mt-8 inline-flex min-h-12 items-center gap-6 px-5 text-sm font-semibold text-white"
                href={`${textbookExplorePath}#level-zero`}
              >
                Level 0から探す
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </section>

        <DemoDataLibrary />

        <section className="border-t border-rule bg-paper px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <MemberLearningPromo />
          </div>
        </section>

        <section className="bg-brand-dark px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-10">
          <div className="soft-panel soft-dark-glow mx-auto flex w-full max-w-[1240px] flex-col gap-8 border border-white/15 bg-white/[0.035] p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-future-mint">
                <BookOpenText className="size-4" aria-hidden="true" />
                次は
              </p>
              <h2 className="mt-5 font-mincho text-3xl leading-tight sm:text-4xl">
                今つくりたいものから、
                <br />
                教科書を選ぶ。
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                順番にこだわらず、気になる課題から始めて大丈夫です。
              </p>
            </div>
            <Link
              className="soft-outline-button group inline-flex min-h-14 shrink-0 items-center justify-between gap-8 border border-white/40 px-6 text-sm font-semibold transition-colors hover:bg-white hover:text-brand-dark"
              href={textbookExplorePath}
            >
              学ぶことを探す
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
