import type { Metadata } from 'next';
import { ArrowRight, ExternalLink, Search, Sparkles } from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import { TextbookAccessLegend } from '@/components/textbook/access-badges';
import { TextbookSubnav } from '@/components/textbook/textbook-subnav';
import { MemberLearningPromo } from '@/components/textbook/member-learning-promo';
import {
  TaskExplorer,
  type ChapterSummaryLite,
} from '@/components/textbook/task-explorer';
import { findTextbookTask, textbookCatalog } from '@/lib/textbook-catalog';
import { toClientTask } from '@/lib/textbook-catalog-client';
import { getChapterSummaries } from '@/lib/textbook-chapter-summaries';
import { canonicalPublicPath } from '@/lib/site-paths';
import { textbookGuidePath, textbookLessonPath } from '@/lib/textbook-routes';

export const metadata: Metadata = {
  title: '学ぶことを探す｜Web教科書｜藤本実学塾',
  description:
    'AIが初めての方の入口、作りたい物、仕事の悩み、時間、使う材料から、自分に合うChatGPT実践課題を探せます。',
  alternates: { canonical: canonicalPublicPath('/textbook/explore') },
};

const showcaseChapterKeys = [
  'common-03',
  'generation-xls',
  'generation-sld',
  'generation-web',
  'generation-app',
  'generation-gam',
] as const;

export default function TextbookExplorePage() {
  const chapterSummaries = getChapterSummaries();
  const chapters: ChapterSummaryLite[] = chapterSummaries.map((chapter) => ({
    key: chapter.key,
    track: chapter.track,
    trackLabel: chapter.trackLabel,
    courseTitle: chapter.courseTitle,
    coursePromise: chapter.coursePromise,
    firstTaskId: chapter.firstTaskId,
    flagshipTitle: chapter.flagship?.title ?? null,
  }));
  const levelZeroTask = findTextbookTask('Lv.01') ?? textbookCatalog.tasks[0];
  const quickTask = findTextbookTask('Lv.05') ?? levelZeroTask;
  const showcase = showcaseChapterKeys
    .map((key) => chapterSummaries.find((chapter) => chapter.key === key))
    .filter((chapter): chapter is NonNullable<typeof chapter> =>
      Boolean(chapter?.flagship),
    );

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <TextbookSubnav current="explore" />

        <section className="section-aura border-b border-rule bg-deep-green px-5 py-12 text-white sm:px-8 sm:py-16">
          <div className="mx-auto grid w-full max-w-[1280px] gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <BrandMark className="size-10" framed />
                <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
                  WEB教科書 / FIND YOUR NEXT STEP
                </p>
              </div>
              <h1 className="text-soft-glow mt-6 max-w-4xl font-mincho text-[clamp(2.5rem,5.5vw,4.9rem)] font-medium leading-[1.12] tracking-[-0.045em]">
                今日できるようになりたいことを、
                <br />
                ここから見つける。
              </h1>
              <p className="mt-6 max-w-2xl text-sm leading-8 text-white/75 sm:text-base">
                最初から順番に進んでも、作りたい物から始めても大丈夫です。課題を選ぶと、教科書本文だけが新しいタブで開きます。
              </p>
            </div>
            <div className="soft-card border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
              <Search className="size-5 text-future-mint" aria-hidden="true" />
              <p className="mt-4 font-mincho text-xl">
                探すページは、そのまま残ります。
              </p>
              <p className="mt-3 text-xs leading-6 text-white/65">
                教科書を読んでからここへ戻り、次の課題を比べられます。新しいタブが増えすぎないよう、本文内の前後移動は同じタブで進みます。
              </p>
            </div>
          </div>
        </section>

        <section
          id="level-zero"
          className="scroll-mt-24 border-b border-rule bg-paper-white px-5 py-12 sm:px-8 sm:py-16"
          aria-labelledby="level-zero-title"
        >
          <div className="mx-auto grid w-full max-w-[1280px] gap-5 lg:grid-cols-[1.12fr_0.88fr]">
            <article className="soft-card soft-panel-clip relative overflow-hidden border border-sapphire bg-sapphire-soft p-7 sm:p-10">
              <div
                className="absolute -right-16 -top-16 size-56 rounded-full bg-future-mint/30 blur-3xl"
                aria-hidden="true"
              />
              <p className="relative text-xs font-semibold tracking-[0.14em] text-sapphire">
                LEVEL 0 / AIが初めての方へ
              </p>
              <h2
                id="level-zero-title"
                className="relative mt-4 max-w-2xl font-mincho text-[clamp(2rem,4vw,3.4rem)] leading-[1.25]"
              >
                まだ分からない、から始めて大丈夫。
              </h2>
              <p className="relative mt-5 max-w-2xl text-sm leading-8 text-quiet">
                Level
                0は、人の能力を測る順位ではありません。AIをまだ使ったことがない方のための入口です。最初の実課題では、自分の仕事を話すところから始めます。
              </p>
              <Link
                className="button-glow group relative mt-7 inline-flex min-h-14 items-center gap-4 px-6 text-sm font-semibold text-white"
                href={textbookLessonPath(levelZeroTask.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>最初の一歩：{levelZeroTask.id}から始める</span>
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
              <p className="relative mt-3 text-xs text-quiet">
                「{levelZeroTask.title}」を新しいタブで開きます
              </p>
            </article>

            <article className="soft-card border border-rule bg-paper p-7 sm:p-10">
              <p className="text-xs font-semibold tracking-[0.14em] text-rust">
                先に一個、試してみたい方へ
              </p>
              <h2 className="mt-4 font-mincho text-3xl leading-[1.3]">
                走り書きのメモを、送れるメールへ。
              </h2>
              <p className="mt-5 text-sm leading-8 text-quiet">
                難しい説明を読む前に、短い課題で「AIと一緒に作れた」を体験します。保存して開き直すところまで、教科書が順番に案内します。
              </p>
              <Link
                className="soft-outline-button group mt-7 inline-flex min-h-14 items-center gap-4 border border-deep-green px-6 text-sm font-semibold text-deep-green hover:bg-deep-green hover:text-white"
                href={textbookLessonPath(quickTask.id)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {quickTask.id}を新しいタブで読む
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </article>
          </div>
        </section>

        {showcase.length > 0 ? (
          <section className="border-b border-rule px-5 py-14 sm:px-8 sm:py-20">
            <div className="mx-auto w-full max-w-[1280px]">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold tracking-[0.16em] text-rust">
                    作りたい物から選ぶ
                  </p>
                  <h2 className="soft-section-heading mt-4 font-mincho text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.2]">
                    学んだ先に、手元へ残るもの。
                  </h2>
                </div>
                <p className="max-w-md text-xs leading-6 text-quiet">
                  気になる完成物を選ぶと、そのコースの最初の教科書を新しいタブで開きます。
                </p>
              </div>
              <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {showcase.map((chapter) => (
                  <article
                    key={chapter.key}
                    className="soft-card soft-interactive flex min-h-full flex-col overflow-hidden border border-rule bg-paper-white"
                  >
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2 text-sapphire">
                        <Sparkles className="size-4" aria-hidden="true" />
                        <p className="text-xs font-semibold tracking-[0.12em]">
                          {chapter.trackLabel}
                        </p>
                      </div>
                      <h3 className="mt-4 font-mincho text-2xl leading-9">
                        {chapter.flagship!.title}
                      </h3>
                      <p className="mt-3 text-xs leading-6 text-quiet">
                        {chapter.flagship!.summary}
                      </p>
                    </div>
                    <Link
                      className="group flex min-h-14 items-center justify-between gap-4 border-t border-rule px-6 text-xs font-semibold text-sapphire hover:bg-sapphire-soft"
                      href={textbookLessonPath(chapter.firstTaskId)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {chapter.courseTitle}から始める
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section
          className="px-5 py-14 sm:px-8 sm:py-20"
          aria-labelledby="all-lessons-title"
        >
          <div className="mx-auto w-full max-w-[1280px]">
            <MemberLearningPromo className="mb-12" />
            <p className="text-xs font-semibold tracking-[0.16em] text-rust">
              SEARCH THE TEXTBOOK
            </p>
            <h2
              id="all-lessons-title"
              className="soft-section-heading mt-4 font-mincho text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.2]"
            >
              言葉・目的・時間から探す。
            </h2>
            <p className="mt-5 max-w-3xl text-sm leading-8 text-quiet">
              「メール」「見積もり」「画像」のように入力するか、仕事の悩みやコースで絞ってください。どの課題から始めても、教科書の順番に沿って授業を受けられます。
            </p>
            <TextbookAccessLegend className="mt-9" />
            <TaskExplorer
              tasks={textbookCatalog.tasks.map(toClientTask)}
              tracks={textbookCatalog.tracks}
              chapters={chapters}
              layout="page"
              className="mt-5"
            />
          </div>
        </section>

        <section className="border-t border-rule bg-paper-white px-5 py-10 sm:px-8">
          <div className="mx-auto flex w-full max-w-[1280px] flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-mincho text-2xl">
                迷ったら、使い方へ戻れます。
              </p>
              <p className="mt-2 text-xs leading-6 text-quiet">
                練習データの選び方や、教科書と授業の使い分けを確認できます。
              </p>
            </div>
            <Link
              className="soft-outline-button group inline-flex min-h-12 items-center gap-4 border border-deep-green px-5 text-sm font-semibold text-deep-green hover:bg-deep-green hover:text-white"
              href={textbookGuidePath}
            >
              Web教科書の使い方を見る
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
