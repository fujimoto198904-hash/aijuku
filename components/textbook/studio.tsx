'use client';

import { ArrowDown, ArrowRight, Sparkles, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { BrandMark } from '@/components/brand-mark';
import type { ClientTextbookTask } from '@/lib/textbook-catalog-client';
import type { TextbookTrackSummary } from '@/lib/textbook-catalog';
import { formalNextTaskIdFor } from '@/lib/textbook-lessons/registry';
import { loadLesson } from '@/lib/textbook-lessons/loader';
import type {
  TextbookChapterFlagship,
  TextbookLesson,
} from '@/lib/textbook-lessons/types';
import { LessonReader } from '@/components/textbook/lesson-reader';
import {
  TaskExplorer,
  type ChapterSummaryLite,
} from '@/components/textbook/task-explorer';

export type ShowcaseItem = {
  key: string;
  trackLabel: string;
  courseTitle: string;
  firstTaskId: string;
  flagship: TextbookChapterFlagship;
};

type LessonLoadState =
  | { status: 'ready'; taskId: string; lesson: TextbookLesson | null }
  | { status: 'loading'; taskId: string }
  | { status: 'error'; taskId: string };

type TextbookStudioProps = {
  tasks: ClientTextbookTask[];
  tracks: TextbookTrackSummary[];
  chapters: ChapterSummaryLite[];
  showcase: ShowcaseItem[];
  initialTaskId: string;
  initialLesson: TextbookLesson | null;
  /** ?task=付きで開かれた時はtrue。本文を先頭近くへ出す */
  deepLink: boolean;
  readyLessonCount: number;
  /** デモデータの詳しい案内(サーバー側で描画) */
  demoDetail: React.ReactNode;
  /** 業種を選ぶ短い導線(サーバー側で描画) */
  demoQuickPick: React.ReactNode;
};

function previousTaskIdFor(taskId: string): string | null {
  const levelMatch = taskId.match(/^Lv\.(\d{2,3})$/);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level <= 1) return null;
    return `Lv.${String(level - 1).padStart(2, '0')}`;
  }
  const prefixMatch = taskId.match(/^([A-Z]{2,5})-(\d{2})$/);
  if (!prefixMatch) return null;
  const number = Number(prefixMatch[2]);
  if (number <= 1) return null;
  return `${prefixMatch[1]}-${String(number - 1).padStart(2, '0')}`;
}

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

export function TextbookStudio({
  tasks,
  tracks,
  chapters,
  showcase,
  initialTaskId,
  initialLesson,
  deepLink,
  readyLessonCount,
  demoDetail,
  demoQuickPick,
}: TextbookStudioProps) {
  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const initialTask = taskById.get(initialTaskId) ?? tasks[0];
  const [selectedTask, setSelectedTask] = useState(initialTask);
  const [lessonState, setLessonState] = useState<LessonLoadState>({
    status: 'ready',
    taskId: initialTask.id,
    lesson: initialLesson,
  });
  const firstSelection = useRef(true);

  // 読み込みは「loading状態」に反応して行い、状態遷移の起点は
  // イベントハンドラ側(selectTask / popstate / retry)に置く
  useEffect(() => {
    if (
      lessonState.status !== 'loading' ||
      lessonState.taskId !== selectedTask.id
    ) {
      return;
    }
    let cancelled = false;
    loadLesson(selectedTask.id)
      .then((lesson) => {
        if (cancelled) return;
        setLessonState({ status: 'ready', taskId: selectedTask.id, lesson });
      })
      .catch(() => {
        if (cancelled) return;
        setLessonState({ status: 'error', taskId: selectedTask.id });
      });
    return () => {
      cancelled = true;
    };
  }, [lessonState, selectedTask.id]);

  function beginTaskTransition(task: ClientTextbookTask) {
    setSelectedTask(task);
    setLessonState(
      task.hasLessonDraft
        ? { status: 'loading', taskId: task.id }
        : { status: 'ready', taskId: task.id, lesson: null },
    );
  }

  // URLの?task=とブラウザの戻る・進むに追随する
  useEffect(() => {
    const syncFromUrl = () => {
      const url = new URL(window.location.href);
      const requestedTaskId = url.searchParams.get('task');
      const requestedTask = requestedTaskId
        ? taskById.get(requestedTaskId)
        : undefined;
      const nextTask = requestedTask ?? initialTask;
      setSelectedTask(nextTask);
      setLessonState((previous) =>
        previous.taskId === nextTask.id
          ? previous
          : nextTask.hasLessonDraft
            ? { status: 'loading', taskId: nextTask.id }
            : { status: 'ready', taskId: nextTask.id, lesson: null },
      );
      if (requestedTaskId && !requestedTask) {
        url.searchParams.set('task', nextTask.id);
        window.history.replaceState(null, '', url);
      }
    };
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, [initialTask, taskById]);

  // 存在しない課題IDのURLは、安全な入口(初期課題)のURLへ置き換える
  useEffect(() => {
    const url = new URL(window.location.href);
    const requestedTaskId = url.searchParams.get('task');
    if (requestedTaskId && !taskById.has(requestedTaskId)) {
      url.searchParams.set('task', initialTask.id);
      window.history.replaceState(null, '', url);
    }
  }, [initialTask.id, taskById]);

  // 深いURLで開いた時は、選んだ課題が見えている状態から始める(初回マウント時だけ)
  const deepLinkScrolled = useRef(false);
  useEffect(() => {
    if (!deepLink || deepLinkScrolled.current) return;
    deepLinkScrolled.current = true;
    window.requestAnimationFrame(() => {
      document
        .getElementById('lesson-title')
        ?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  }, [deepLink]);

  useEffect(() => {
    if (firstSelection.current) {
      firstSelection.current = false;
      return;
    }
    if (lessonState.status === 'loading') return;
    window.requestAnimationFrame(() => {
      const title = document.getElementById('lesson-title');
      title?.focus({ preventScroll: true });
      title?.scrollIntoView({
        behavior: preferredScrollBehavior(),
        block: 'start',
      });
    });
  }, [lessonState.status, selectedTask.id]);

  function selectTask(taskId: string) {
    const task = taskById.get(taskId);
    if (!task) return;
    beginTaskTransition(task);
    const url = new URL(window.location.href);
    url.searchParams.set('task', task.id);
    url.hash = '';
    window.history.pushState(null, '', url);
  }

  const formalNextId = formalNextTaskIdFor(selectedTask.id);
  const previousId = previousTaskIdFor(selectedTask.id);
  const lesson =
    lessonState.status === 'ready' && lessonState.taskId === selectedTask.id
      ? lessonState.lesson
      : null;

  const heroSection = (
    <section className="section-aura border-b border-rule bg-deep-green px-5 py-12 text-white sm:px-8 sm:py-16">
      <div className="mx-auto grid w-full max-w-[1440px] gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
        <div>
          <div className="flex items-center gap-4">
            <BrandMark className="size-10" framed />
            <p className="text-xs font-semibold tracking-[0.16em] text-future-mint">
              ChatGPT実践教科書｜{tasks.length}の「作ってみよう」
            </p>
          </div>
          <h1 className="text-soft-glow mt-5 max-w-4xl font-mincho text-[clamp(2.4rem,5.4vw,4.8rem)] font-medium leading-[1.12] tracking-[-0.045em]">
            ChatGPTで「できた」を、
            <br />
            今日ひとつ。
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-8 text-white/75 sm:text-base">
            メール、画像、見積Excel、PowerPoint、ホームページ、ゲーム、スマホアプリまで。全
            {readyLessonCount}
            課題に、材料と最初の一言、完成までの詳しい手順があります。登録も購入も不要です。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <a
            className="button-glow group inline-flex min-h-14 items-center justify-between gap-4 px-6 text-sm font-semibold text-white"
            href="#textbook-index"
            onClick={(event) => {
              event.preventDefault();
              selectTask('Lv.05');
            }}
          >
            <span className="flex items-center gap-3">
              <Timer className="size-4" aria-hidden="true" />
              3分で最初のメール案を見る
            </span>
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>
          <a
            className="soft-outline-button inline-flex min-h-14 items-center justify-between gap-4 border border-white/40 px-6 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-brand-dark"
            href="#flagship-showcase"
          >
            作りたい完成物から選ぶ
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );

  const showcaseSection =
    showcase.length > 0 ? (
      <section
        id="flagship-showcase"
        className="scroll-mt-20 border-b border-rule bg-paper px-5 py-14 sm:px-8 sm:py-20"
        aria-labelledby="showcase-heading"
      >
        <div className="mx-auto w-full max-w-[1440px]">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-rust">
                10課題で、ここまで育つ
              </p>
              <h2
                id="showcase-heading"
                className="soft-section-heading mt-4 font-mincho text-[clamp(2rem,4vw,3.4rem)] font-medium leading-[1.2]"
              >
                完成物から、コースを選ぶ。
              </h2>
            </div>
            <p className="max-w-md text-xs leading-6 text-quiet">
              どのコースも1章10課題。前の課題の完成品を育てながら、最後に旗艦作品が手元に残ります。
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {showcase.map((item) => (
              <article
                key={item.key}
                className="soft-card soft-interactive flex min-h-full flex-col border border-rule bg-paper-white"
              >
                <div className="border-b border-rule p-5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-quiet">
                    {item.trackLabel}
                  </p>
                  <h3 className="mt-2 font-mincho text-xl leading-8">
                    {item.flagship.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-quiet">
                    {item.flagship.summary}
                  </p>
                </div>
                <div className="flex-1 bg-ink p-5 text-paper">
                  <p className="text-xs font-semibold tracking-[0.12em] text-future-mint">
                    {item.flagship.preview.kind === 'files'
                      ? '完成フォルダの中身'
                      : item.flagship.preview.kind === 'screen'
                        ? '画面の見どころ'
                        : item.flagship.preview.kind === 'excerpt'
                          ? '成果物の抜粋'
                          : '仕事の流れ'}
                  </p>
                  <ul className="mt-3 grid gap-1.5">
                    {item.flagship.preview.lines.slice(0, 5).map((line) => (
                      <li
                        key={line}
                        className="line-clamp-2 font-mono text-xs leading-5 text-paper/85"
                        title={line}
                      >
                        {line}
                      </li>
                    ))}
                    {item.flagship.preview.lines.length > 5 ? (
                      <li className="font-mono text-xs text-paper/60">
                        …ほか{item.flagship.preview.lines.length - 5}件
                      </li>
                    ) : null}
                  </ul>
                </div>
                <button
                  type="button"
                  className="group flex min-h-12 items-center justify-between px-5 text-xs font-semibold text-sapphire transition-colors hover:bg-sapphire-soft"
                  onClick={() => selectTask(item.firstTaskId)}
                >
                  {item.courseTitle}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    ) : null;

  const readerSection = (
    <section
      id="textbook-index"
      aria-label="課題をさがして読む"
      className="mx-auto grid w-full max-w-[1440px] scroll-mt-20 border-x border-rule bg-paper-white lg:grid-cols-[360px_minmax(0,1fr)]"
    >
      <TaskExplorer
        tasks={tasks}
        tracks={tracks}
        chapters={chapters}
        selectedTask={selectedTask}
        onSelect={selectTask}
        className={deepLink ? 'order-2 lg:order-1' : ''}
      />
      <div
        id="lesson-reader"
        className={`min-w-0 ${deepLink ? 'order-1 lg:order-2' : ''}`}
      >
        {lessonState.status === 'loading' ? (
          <article
            className="min-w-0 px-5 py-12 sm:px-10 lg:px-14"
            aria-busy="true"
          >
            <p className="text-xs font-semibold tracking-[0.14em] text-rust">
              {selectedTask.id} を読み込んでいます…
            </p>
            <h2
              id="lesson-title"
              tabIndex={-1}
              className="mt-6 max-w-4xl font-mincho text-4xl leading-tight outline-none"
            >
              {selectedTask.title}
            </h2>
            <div className="mt-10 grid max-w-4xl gap-4" aria-hidden="true">
              <div className="h-24 animate-pulse bg-paper" />
              <div className="h-40 animate-pulse bg-paper" />
              <div className="h-24 animate-pulse bg-paper" />
            </div>
          </article>
        ) : lessonState.status === 'error' ? (
          <article className="min-w-0 px-5 py-12 sm:px-10 lg:px-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-rust">
              読み込みに失敗しました
            </p>
            <h2
              id="lesson-title"
              tabIndex={-1}
              className="mt-6 max-w-4xl font-mincho text-3xl leading-tight outline-none"
            >
              {selectedTask.id}「{selectedTask.title}」を取得できませんでした
            </h2>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-quiet">
              オフラインなどで読み込めなかった可能性があります。通信を確かめて、この課題をもう一度開いてください。
            </p>
            <button
              type="button"
              className="soft-control mt-7 inline-flex min-h-11 items-center gap-2 border border-deep-green px-5 text-sm font-semibold text-deep-green hover:bg-deep-green hover:text-white"
              onClick={() => window.location.reload()}
            >
              この課題をもう一度開く
            </button>
          </article>
        ) : lesson ? (
          <LessonReader
            key={selectedTask.id}
            task={selectedTask}
            lesson={lesson}
            previousTask={previousId ? taskById.get(previousId) : undefined}
            formalNextTask={
              formalNextId ? taskById.get(formalNextId) : undefined
            }
            stepUpTargetTask={
              lesson.stepUp.kind === 'task'
                ? taskById.get(lesson.stepUp.targetTaskId)
                : undefined
            }
            onSelectTask={selectTask}
          />
        ) : (
          <article className="min-w-0 px-5 py-12 sm:px-10 lg:px-14">
            <p className="text-xs font-semibold tracking-[0.14em] text-rust">
              この課題は準備中です
            </p>
            <h2
              id="lesson-title"
              tabIndex={-1}
              className="mt-6 max-w-4xl font-mincho text-4xl leading-tight outline-none"
            >
              {selectedTask.title}
            </h2>
            <div className="soft-card mt-8 max-w-3xl border border-rule bg-paper p-6">
              <p className="font-mincho text-xl leading-8">
                {selectedTask.outcome}
              </p>
              <p className="mt-4 text-sm leading-7 text-quiet">
                {selectedTask.action}
              </p>
              <p className="mt-5 border-t border-rule pt-4 text-xs leading-6 text-quiet">
                詳しい本文は準備中です。未完成の手順で進めず、今は気になる課題として覚えておけます。
              </p>
            </div>
          </article>
        )}
      </div>
    </section>
  );

  const startHint = (
    <section className="border-b border-rule bg-paper-white px-5 py-8 sm:px-8">
      <div className="mx-auto grid w-full max-w-[1440px] gap-4 sm:grid-cols-3">
        {[
          {
            title: 'どこからでもOK',
            body: '最初から一段ずつでも、作りたいもの・学びたい領域からでも大丈夫です。',
          },
          {
            title: '雑な一言でOK',
            body: 'うまく説明しようとしなくても始められます。',
          },
          {
            title: '困ったら藤本へ',
            body: '止まった画面を見せれば、続きから一緒に進めます。',
          },
        ].map((item) => (
          <div key={item.title} className="flex items-start gap-3">
            <Sparkles
              className="mt-1 size-4 shrink-0 text-rust"
              aria-hidden="true"
            />
            <p className="text-xs leading-6 text-quiet">
              <span className="font-semibold text-ink">{item.title}</span>
              <span className="mx-1.5">—</span>
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {lessonState.status === 'loading'
          ? `${selectedTask.id}「${selectedTask.title}」を読み込んでいます`
          : lessonState.status === 'error'
            ? `${selectedTask.id}「${selectedTask.title}」の読み込みに失敗しました`
            : `${selectedTask.id}「${selectedTask.title}」を表示しました`}
      </p>
      {deepLink ? (
        <>
          {readerSection}
          {heroSection}
          {showcaseSection}
          {demoQuickPick}
          {demoDetail}
        </>
      ) : (
        <>
          {heroSection}
          {startHint}
          {showcaseSection}
          {demoQuickPick}
          {readerSection}
          {demoDetail}
        </>
      )}
    </>
  );
}
