import {
  ArrowRight,
  BookOpenCheck,
  BookOpenText,
  Check,
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
import { DemoQuickPick } from '@/components/textbook/demo-quick-pick';
import { TextbookSubnav } from '@/components/textbook/textbook-subnav';
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
    title: 'まず、このページだけ読む。',
    body: '教科書の選び方と、読み始めるまでの流れを確認します。最初からすべてを理解する必要はありません。',
    note: '今ここ',
    Icon: BookOpenCheck,
  },
  {
    number: '02',
    label: '学ぶことを探す',
    title: '今つくりたいものから選ぶ。',
    body: '仕事、暮らし、つくりたい成果物など、自分に合う入り口から教材を探します。順番どおりに進む必要はありません。',
    note: '探すページへ',
    Icon: Search,
  },
  {
    number: '03',
    label: '教科書を読む',
    title: '1課題だけ、新しいタブで開く。',
    body: '探すページを残したまま、選んだ教科書を別タブで開きます。読み終えたら、元のタブへ戻って次を探せます。',
    note: '別タブで実践',
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
    '登録なしで無料で学べるWeb教科書の使い方。学びたいことを探し、1課題ずつ別タブで開いて実践できます。',
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
          <div className="mx-auto grid w-full max-w-[1240px] gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-rust">
                WEB TEXTBOOK GUIDE
              </p>
              <h1 className="soft-section-heading mt-5 max-w-4xl font-mincho text-[clamp(2.8rem,6vw,5.8rem)] font-medium leading-[1.1] tracking-[-0.045em]">
                Web教科書を、
                <br />
                迷わず始める。
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-quiet sm:text-lg sm:leading-9">
                登録も購入もいりません。使い方を確認し、今の自分に必要な教材を探し、1課題だけ新しいタブで開いて始めます。
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

            <aside className="soft-panel soft-panel-clip soft-dark-glow border border-white/15 bg-brand-dark p-7 text-white sm:p-9">
              <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                最初に覚えることは、1つだけ
              </p>
              <p className="mt-5 font-mincho text-3xl leading-[1.45] sm:text-4xl">
                「探す」と「読む」を
                <br />
                別のタブにする。
              </p>
              <ul className="mt-7 grid gap-4 border-t border-white/15 pt-6 text-sm leading-7 text-white/70">
                {[
                  '探すページは閉じずに残す',
                  '選んだ教科書は新しいタブで開く',
                  '終わったら元のタブへ戻る',
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <Check
                      className="mt-1 size-4 shrink-0 text-future-mint"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section
          className="border-b border-rule bg-paper px-5 py-16 sm:px-8 sm:py-24 lg:px-10"
          aria-labelledby="three-steps-heading"
        >
          <div className="mx-auto w-full max-w-[1240px]">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.16em] text-sapphire">
                THREE STEPS
              </p>
              <h2
                id="three-steps-heading"
                className="soft-section-heading mt-5 font-mincho text-[clamp(2.4rem,5vw,4.8rem)] font-medium leading-[1.14] tracking-[-0.04em]"
              >
                この3段階だけで、
                <br />
                学び始められます。
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
                AIを使ったことがない方が、初めての会話と小さな完成を体験するための入り口です。人の優劣や能力を判定する名前ではありません。「何から始めればいいか分からない」ときに選んでください。
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

        <DemoQuickPick />
        <DemoDataLibrary />

        <section className="bg-brand-dark px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-10">
          <div className="soft-panel soft-dark-glow mx-auto flex w-full max-w-[1240px] flex-col gap-8 border border-white/15 bg-white/[0.035] p-7 sm:p-10 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-future-mint">
                <BookOpenText className="size-4" aria-hidden="true" />
                READY TO LEARN
              </p>
              <h2 className="mt-5 font-mincho text-3xl leading-tight sm:text-4xl">
                今つくりたいものから、
                <br />
                教科書を選ぶ。
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                つくりたいものが決まっている方は、順番にこだわらず、その教材から始めて大丈夫です。
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
