'use client';

/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- 読み取り専用のpreをキーボードでスクロールできるようにする */

import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Compass,
  FileCheck2,
  Lightbulb,
  ListOrdered,
  MessageCircleQuestion,
  PenLine,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import Link from '@/components/site-link';
import { PromptExplanation } from '@/components/prompt-explanation';
import { TextbookAccessBadges } from '@/components/textbook/access-badges';
import type { ClientTextbookTask } from '@/lib/textbook-catalog-client';
import type { TextbookLesson } from '@/lib/textbook-lessons/types';
import { getTextbookAccessProfile } from '@/lib/textbook-access';
import type { TaskDemoDownloadPlan } from '@/lib/textbook-demo-industry';
import { getTextbookMaterialGuide } from '@/lib/textbook-material-guide';
import { getTextbookPromptExplanation } from '@/lib/textbook-prompt-explanation';
import {
  textbookExplorePath,
  textbookLessonPath,
  textbookPlanGuidePath,
  textbookSetupPath,
} from '@/lib/textbook-routes';
import { MaterialPreview } from '@/components/textbook/material-preview';
import {
  humanFileName,
  lessonSections,
  readStoredChecks,
  writeStoredChecks,
} from '@/components/textbook/lesson-shared';

const trackColors: Record<ClientTextbookTask['track'], string> = {
  common: 'border-sapphire bg-sapphire-soft text-sapphire',
  department: 'border-human-coral bg-human-coral-soft text-human-coral',
  industry: 'border-success bg-future-mint-soft text-success',
  generation: 'border-warning bg-sunrise-soft text-warning',
};

const stepUpActions = [
  '今使っているChatまたはWorkを、そのまま続ける',
  '下の追加プロンプトをコピーして送る',
  '出てきた物を見て、必要な所だけ一つ直す',
] as const;

type ChecksStorageStatus = 'checking' | 'saved' | 'not-saved' | 'unavailable';

type ChecksStorageState = {
  taskId: string;
  status: ChecksStorageStatus;
};

function preferredScrollBehavior(): ScrollBehavior {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth';
}

type LessonReaderProps = {
  task: ClientTextbookTask;
  lesson: TextbookLesson;
  stepUpTargetTask?: ClientTextbookTask;
  formalNextTask?: ClientTextbookTask;
  previousTask?: ClientTextbookTask;
  downloadPlan: TaskDemoDownloadPlan;
};

export function LessonReader({
  task,
  lesson,
  stepUpTargetTask,
  formalNextTask,
  previousTask,
  downloadPlan,
}: LessonReaderProps) {
  const taskMistakes = lesson.mistakes;
  const completionGroups = lesson.completionGroups ?? [
    { title: null, items: lesson.completion ?? [] },
  ];
  const [checks, setChecks] = useState<boolean[]>(() =>
    taskMistakes.map(() => false),
  );
  const [checksStorage, setChecksStorage] = useState<ChecksStorageState>({
    taskId: task.id,
    status: 'checking',
  });
  const [promptCopyStatus, setPromptCopyStatus] = useState('');
  const [nextPromptCopyStatus, setNextPromptCopyStatus] = useState('');
  const [saveCopyStatus, setSaveCopyStatus] = useState('');
  const [questionCopyStatus, setQuestionCopyStatus] = useState('');
  const [stepUpCopyStatus, setStepUpCopyStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const articleRef = useRef<HTMLElement>(null);

  // チェック状態はこの端末だけに保存する(保存できない環境では単に保存されない)。
  // SSRとの初期表示を一致させるため、マウント後にlocalStorageから読み戻す
  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (cancelled) return;
      const stored = readStoredChecks(task.id, taskMistakes.length);
      setChecks(stored.checks);
      setChecksStorage({ taskId: task.id, status: stored.status });
    });
    return () => {
      cancelled = true;
    };
  }, [task.id, taskMistakes.length]);

  function updateChecks(nextChecks: boolean[]) {
    setChecks(nextChecks);
    setChecksStorage({
      taskId: task.id,
      status: writeStoredChecks(task.id, nextChecks) ? 'saved' : 'unavailable',
    });
  }

  // 本文が画面から外れたら、スマホ用バーと開いた目次を閉じる。
  useEffect(() => {
    const lessonBody = articleRef.current?.querySelector('#lesson-body');
    if (!lessonBody) return;
    if (typeof IntersectionObserver === 'undefined') {
      void Promise.resolve().then(() => setMobileNavVisible(true));
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      const visible = entry?.isIntersecting ?? false;
      setMobileNavVisible(visible);
      if (!visible) setTocOpen(false);
    });
    observer.observe(lessonBody);
    return () => observer.disconnect();
  }, [task.id]);

  // 全体表示では、いま読んでいるステップを追跡して下部バーに出す
  useEffect(() => {
    if (focusIndex !== null) return;
    const article = articleRef.current;
    if (!article || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = lessonSections.findIndex(
            (section) => section.id === entry.target.id,
          );
          if (index >= 0) setCurrentSection(index);
        }
      },
      { rootMargin: '-35% 0px -55% 0px' },
    );
    for (const section of lessonSections) {
      const element = article.querySelector(`#${section.id}`);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [focusIndex, task.id]);

  async function copyText(
    value: string,
    label: string,
    setStatus: (status: string) => void,
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(`${label}をコピーしました`);
    } catch {
      setStatus('コピーできませんでした。文字を選択してコピーしてください。');
    }
  }

  function goToSection(index: number) {
    const bounded = Math.min(Math.max(index, 0), lessonSections.length - 1);
    setCurrentSection(bounded);
    if (focusIndex !== null) {
      setFocusIndex(bounded);
    }
    window.requestAnimationFrame(() => {
      const target = articleRef.current?.querySelector<HTMLElement>(
        `#${lessonSections[bounded].id}`,
      );
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({
        behavior: preferredScrollBehavior(),
        block: 'start',
      });
    });
  }

  function showStepUpRoutes() {
    const target =
      articleRef.current?.querySelector<HTMLElement>('#stepup-route');
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({
      behavior: preferredScrollBehavior(),
      block: 'center',
    });
  }

  const materialGuide = getTextbookMaterialGuide(lesson);
  const promptExplanation = getTextbookPromptExplanation(lesson);
  const accessProfile = getTextbookAccessProfile(task);
  const stepUpTargetMatchesFormal = stepUpTargetTask?.id === formalNextTask?.id;
  const stepUpHasTwoRoutes = Boolean(
    stepUpTargetTask && formalNextTask && !stepUpTargetMatchesFormal,
  );
  const modeLabel =
    lesson.recommendedMode === 'chat' ? '作業画面：Chat' : '作業画面：Work';
  const materialSummary =
    lesson.files.length > 0
      ? lesson.files.map(humanFileName).join('、')
      : (lesson.carryIn ?? '材料なし');
  const startBadge =
    lesson.files.length > 0
      ? '架空のデモファイルですぐ試せます'
      : lesson.carryIn
        ? '前の完成品を育てる課題です'
        : '材料なしですぐ始められます';
  const checksStorageStatus =
    checksStorage.taskId === task.id ? checksStorage.status : 'checking';
  const questionMemo = `${task.id}「${task.title}」で止まりました。\n使った材料：${materialSummary}\n材料の渡し方：中身を貼った・ファイルを添付した（当てはまるものを残す）\n作業画面：Chat・Work（使った方を残す）\nここで止まった：${question || 'まだうまく説明できない'}\n画面のスクショも一緒に送ります。`;

  const sectionVisible = useMemo(
    () =>
      lessonSections.map(
        (_, index) => focusIndex === null || focusIndex === index,
      ),
    [focusIndex],
  );

  const manualSaveCard = (
    <details
      className={`soft-control group border px-4 py-1.5 ${
        lesson.recommendedMode === 'chat'
          ? 'border-rust/55 bg-paper-white'
          : 'border-rule bg-paper'
      }`}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-xs [&::-webkit-details-marker]:hidden">
        <span className="soft-badge shrink-0 bg-white px-2 py-1 font-semibold text-rust">
          共通の保存メモ
        </span>
        <span className="font-semibold">Chatでできた物は、自分で保存</span>
        <ChevronDown
          className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-3 border-t border-rule pt-3 text-xs leading-6 text-quiet">
        Chatの返答欄にファイルができたらダウンロードして「完成」フォルダへ移します。文章だけなら、全文をコピーしてテキストやWordへ貼って保存します。保存した物をもう一度開けた時に「残せた」とします。
      </p>
    </details>
  );

  const workSaveCard = (
    <div
      className={`soft-card border-l-4 p-6 sm:p-7 ${
        lesson.recommendedMode === 'work'
          ? 'border-sapphire bg-sapphire-soft'
          : 'border-rule bg-paper'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-sapphire">
            Workで作った物を保存するプロンプト
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-7">
            {lesson.savePrompt}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            copyText(lesson.savePrompt, '保存用プロンプト', setSaveCopyStatus)
          }
          className="soft-control inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border border-sapphire px-4 text-xs font-semibold text-sapphire hover:bg-sapphire hover:text-white"
        >
          <Clipboard className="size-4" aria-hidden="true" />
          保存用プロンプトをコピー
        </button>
      </div>
      <p className="mt-3 min-h-5 text-xs text-sapphire" aria-live="polite">
        {saveCopyStatus}
      </p>
    </div>
  );

  return (
    <article
      className="min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0"
      ref={articleRef}
    >
      <header className="border-b border-rule bg-paper-white px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${trackColors[task.track]}`}
          >
            {task.trackLabel}
          </span>
          <span className="soft-badge numeric-text border border-rule px-3 py-1.5 text-xs text-quiet">
            {task.id}
          </span>
          <span className="text-xs text-quiet">{task.courseTitle}</span>
          <span className="soft-badge border border-sapphire/40 bg-sapphire-soft px-3 py-1.5 text-xs font-semibold text-sapphire">
            {startBadge}
          </span>
          <TextbookAccessBadges profile={accessProfile} />
        </div>
        <h1
          id="lesson-title"
          tabIndex={-1}
          className="text-soft-glow mt-6 max-w-4xl font-mincho text-[clamp(2rem,4.6vw,4.4rem)] font-medium leading-[1.18] tracking-[-0.04em] outline-none"
        >
          {task.title}
        </h1>

        <div className="soft-panel soft-panel-clip mt-8 grid border border-rule bg-paper-white px-6 sm:grid-cols-3">
          <div className="border-b border-rule py-5 sm:border-b-0 sm:border-r sm:pr-6">
            <p className="text-xs font-semibold text-rust">
              今日手元に残るもの
            </p>
            <p className="mt-2 text-sm leading-6">{lesson.deliverable}</p>
          </div>
          <div className="border-b border-rule py-5 sm:border-b-0 sm:border-r sm:px-6">
            <p className="text-xs font-semibold text-rust">時間の目安</p>
            <p className="mt-2 text-sm leading-6">{lesson.duration}</p>
          </div>
          <div className="py-5 sm:pl-6">
            <p className="text-xs font-semibold text-rust">終わりの合図</p>
            <p className="mt-2 text-sm leading-6">開けた・使えた・保存できた</p>
          </div>
        </div>

        <details className="soft-control mt-6 border border-rule bg-paper px-5 py-4 xl:hidden">
          <summary className="cursor-pointer text-xs font-semibold">
            この課題の10ステップを見る
          </summary>
          <nav
            className="mt-4 grid gap-2 border-t border-rule pt-4 sm:grid-cols-2"
            aria-label={`${task.id}の目次`}
          >
            {lessonSections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                aria-controls={section.id}
                className="flex min-h-9 items-center gap-3 text-left text-xs text-quiet hover:text-rust"
                onClick={() => goToSection(index)}
              >
                <span className="numeric-text text-xs text-quiet">
                  {section.number}
                </span>
                {section.label}
              </button>
            ))}
          </nav>
        </details>
      </header>

      <div
        id="lesson-body"
        className="grid scroll-mt-20 gap-12 px-5 py-10 sm:px-10 lg:px-14 xl:grid-cols-[minmax(0,1fr)_190px] xl:gap-16"
      >
        <div className="min-w-0">
          <div className="soft-control mb-8 border border-rule bg-paper-white px-5 py-4 text-xs leading-6 text-quiet shadow-[0_8px_24px_rgba(16,42,54,0.045)]">
            <span className="font-semibold text-rust">
              どの課題も、この順番でOK
            </span>
            <span className="mx-2 text-quiet">/</span>
            材料を入れる → プロンプトを送る → 試す → 直す → 保存する
          </div>

          {focusIndex !== null ? (
            <div
              className="soft-control mb-8 flex items-center justify-between gap-4 border border-sapphire bg-sapphire-soft px-5 py-3"
              aria-live="polite"
            >
              <p className="text-xs font-semibold text-sapphire">
                集中モード：ステップ {lessonSections[focusIndex].number}「
                {lessonSections[focusIndex].label}」だけを表示中
              </p>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-sapphire"
                onClick={() => setFocusIndex(null)}
              >
                <X className="size-3.5" aria-hidden="true" />
                全体を見る
              </button>
            </div>
          ) : null}

          <section
            id="goal"
            tabIndex={-1}
            hidden={!sectionVisible[0]}
            className="scroll-mt-24 border-t-2 border-deep-green pt-7"
          >
            <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
              <div>
                <p className="numeric-text text-xs text-rust">01</p>
                <h3 className="mt-3 font-mincho text-3xl">今日はこれを作る</h3>
                <p className="mt-4 text-sm leading-7 text-quiet">
                  最初に、今日手元に何が残れば終わりかだけ見ます。全部を覚える必要はありません。
                </p>
              </div>
              <div className="soft-card soft-panel-clip soft-dark-glow relative bg-deep-green p-7 text-white sm:p-9">
                <div
                  className="absolute right-0 top-0 size-28 border-b border-l border-white/15"
                  aria-hidden="true"
                />
                <p className="text-xs font-semibold tracking-[0.14em] text-white/55">
                  今日できあがるもの
                </p>
                <FileCheck2
                  className="mt-10 size-8 text-future-mint"
                  aria-hidden="true"
                />
                <p className="mt-5 font-mincho text-2xl leading-relaxed">
                  {lesson.deliverable}
                </p>
                <div className="mt-8 flex items-center gap-3 border-t border-white/15 pt-5 text-xs text-white/60">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {lesson.duration}
                  。説明や画像だけでなく、実物を開けたら次へ進みます
                </div>
              </div>
            </div>
          </section>

          <section
            id="start"
            tabIndex={-1}
            hidden={!sectionVisible[1]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <div className="grid gap-7 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <p className="numeric-text text-xs text-rust">02</p>
                <h3 className="mt-3 font-mincho text-3xl">材料をAIに渡す</h3>
                <p className="mt-4 text-sm leading-7 text-quiet">
                  下の材料を用意して、ChatGPTに入れます。
                </p>
              </div>
              <div>
                <div className="soft-card border-l-4 border-rust bg-paper-white p-6 sm:p-8">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="soft-badge border border-rust/35 bg-white px-3 py-1.5 text-xs font-semibold text-rust">
                      今回のおすすめ
                    </span>
                    <span className="soft-badge border border-sapphire/30 bg-sapphire-soft px-3 py-1.5 text-xs font-semibold text-sapphire">
                      {modeLabel}
                    </span>
                    <span className="soft-badge border border-success/30 bg-future-mint-soft px-3 py-1.5 text-xs font-semibold text-success">
                      {materialGuide.badge}
                    </span>
                  </div>
                  <h4 className="mt-6 font-mincho text-2xl">今回使う材料</h4>
                  <div className="mt-4 grid gap-3">
                    {lesson.carryIn ? (
                      <p className="break-words border-l-2 border-success/40 pl-3 text-sm font-semibold leading-7">
                        {lesson.carryIn}
                      </p>
                    ) : null}
                    {lesson.files.length === 0 && !lesson.carryIn ? (
                      <p className="text-sm leading-7 text-quiet">
                        この課題に材料はいりません。プロンプトだけで始められます。
                      </p>
                    ) : null}
                  </div>
                  {lesson.files.length > 0 ? (
                    <p className="mt-5 border-t border-rule pt-4 text-xs leading-6 text-quiet">
                      必要なファイルは、下からダウンロードできます。
                    </p>
                  ) : null}
                  <MaterialPreview key={task.id} downloadPlan={downloadPlan} />
                </div>
                <details className="soft-control group mt-4 border border-rule bg-paper-white px-4 py-1.5">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3 text-xs [&::-webkit-details-marker]:hidden">
                    <span className="soft-badge shrink-0 bg-paper px-2 py-1 font-semibold text-rust">
                      材料の入れ方
                    </span>
                    <span className="min-w-0 font-semibold">
                      {materialGuide.summary}
                    </span>
                    <span className="ml-auto hidden shrink-0 text-quiet sm:inline">
                      必要な時だけ開く
                    </span>
                    <ChevronDown
                      className="size-4 shrink-0 transition-transform group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="mt-3 border-t border-rule pt-3 text-xs leading-6 text-quiet">
                    <ol className="grid gap-2">
                      {materialGuide.steps.map((item, index) => (
                        <li className="flex gap-3" key={item}>
                          <span className="numeric-text shrink-0 text-rust">
                            {index + 1}
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-3 border-l-2 border-sapphire/30 pl-3">
                      {materialGuide.modeNote}
                    </p>
                    {materialGuide.alternative ? (
                      <p className="mt-2">{materialGuide.alternative}</p>
                    ) : null}
                    {materialGuide.failureNote ? (
                      <p className="mt-2">{materialGuide.failureNote}</p>
                    ) : null}
                    <Link
                      className="mt-3 inline-flex font-semibold text-sapphire underline decoration-sapphire/30 underline-offset-4"
                      href={textbookSetupPath}
                    >
                      ChatGPTの設定と詳しい使い方
                    </Link>
                  </div>
                </details>
                <div className="soft-control mt-3 border border-rule bg-paper px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <TextbookAccessBadges profile={accessProfile} compact />
                    <Link
                      className="text-xs font-semibold text-sapphire underline decoration-sapphire/30 underline-offset-4"
                      href={textbookPlanGuidePath}
                    >
                      無料・有料・Codexマークの見方
                    </Link>
                  </div>
                  <p className="mt-2 text-xs leading-6 text-quiet">
                    {accessProfile.planReason}
                  </p>
                  {accessProfile.codexReason ? (
                    <p className="mt-1 text-xs leading-6 text-quiet">
                      {accessProfile.codexReason}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section
            id="prompt"
            tabIndex={-1}
            hidden={!sectionVisible[2]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="numeric-text text-xs text-rust">03</p>
                <h3 className="mt-3 font-mincho text-3xl">
                  ChatGPTに送るプロンプト
                </h3>
                <p className="mt-3 text-sm leading-7 text-quiet">
                  プロンプトは、ChatGPTにそのまま貼る指示文です。
                  {materialGuide.promptLead}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  copyText(lesson.firstWord, 'プロンプト', setPromptCopyStatus)
                }
                className="soft-control inline-flex min-h-11 items-center justify-center gap-2 border border-deep-green px-4 text-xs font-semibold hover:bg-deep-green hover:text-white"
              >
                <Clipboard className="size-4" aria-hidden="true" />
                プロンプトをコピー
              </button>
            </div>
            <section aria-label="ChatGPTへ最初に送る文">
              <pre
                className="soft-card soft-dark-glow mt-7 overflow-x-auto border-l-4 border-future-mint bg-ink p-6 font-mono text-xs leading-7 whitespace-pre-wrap text-paper focus:outline-2 focus:outline-offset-2 focus:outline-future-mint sm:p-8"
                tabIndex={0}
              >
                {lesson.firstWord}
              </pre>
            </section>
            <p className="mt-3 min-h-6 text-xs text-rust" aria-live="polite">
              {promptCopyStatus}
            </p>
            <PromptExplanation
              reason={promptExplanation.reason}
              advice={promptExplanation.advice}
            />
          </section>

          <section
            id="compare"
            tabIndex={-1}
            hidden={!sectionVisible[3]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <p className="numeric-text text-xs text-rust">04</p>
            <h3 className="mt-3 font-mincho text-3xl">
              AIの答えを確認して試す
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              最初から完璧でなくて大丈夫。まず一度、自分で動かしてみます。
            </p>
            <div className="soft-panel soft-panel-clip mt-7 grid border border-rule md:grid-cols-2">
              <div className="border-b border-rule p-6 md:border-b-0 md:border-r sm:p-8">
                <p className="flex items-center gap-2 text-xs font-semibold text-quiet">
                  <span className="soft-control grid size-6 place-items-center border border-rule">
                    1
                  </span>
                  AIから出てくるもの
                </p>
                <p className="mt-6 text-base leading-8">{lesson.deliverable}</p>
              </div>
              <div className="bg-paper-white p-6 sm:p-8">
                <p className="flex items-center gap-2 text-xs font-semibold text-deep-green">
                  <Check className="size-4" aria-hidden="true" />
                  {lesson.nextPrompts?.length
                    ? 'まず自分で試す'
                    : '自分で試すのは、これだけ'}
                </p>
                <div className="mt-6 grid gap-3">
                  {lesson.tryActions.map((item) => (
                    <p
                      key={item}
                      className="flex items-start gap-3 text-sm leading-7"
                    >
                      <span
                        className="mt-2.5 size-1.5 shrink-0 bg-rust"
                        aria-hidden="true"
                      />
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            {lesson.nextPrompts?.length ? (
              <div className="soft-card mt-6 border-l-4 border-human-coral bg-human-coral-soft p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-[0.1em] text-human-coral">
                  追加のプロンプト
                </p>
                <p className="mt-3 text-sm leading-7 text-quiet">
                  当てはまるものだけ、上から順に送ります。
                </p>
                <div className="mt-6 grid gap-5">
                  {lesson.nextPrompts.map((item, index) => (
                    <div
                      key={`${item.when}-${index}`}
                      className="border-t border-human-coral/25 pt-5 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-human-coral">
                            {item.when}
                          </p>
                          <p className="mt-3 font-mono text-xs leading-7">
                            {item.say}
                          </p>
                          {item.afterActions?.length ? (
                            <div className="mt-4 border-l-2 border-human-coral/35 pl-4">
                              <p className="text-xs font-semibold text-human-coral">
                                送った後に試す
                              </p>
                              <div className="mt-2 grid gap-2">
                                {item.afterActions.map((action) => (
                                  <p
                                    key={action}
                                    className="flex gap-2 text-xs leading-6 text-quiet"
                                  >
                                    <span aria-hidden="true">・</span>
                                    {action}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              item.say,
                              '追加のプロンプト',
                              setNextPromptCopyStatus,
                            )
                          }
                          className="soft-control inline-flex min-h-10 shrink-0 items-center justify-center gap-2 border border-human-coral px-4 text-xs font-semibold text-human-coral hover:bg-human-coral hover:text-white"
                        >
                          <Clipboard className="size-4" aria-hidden="true" />
                          追加プロンプトをコピー
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  className="mt-4 min-h-5 text-xs text-human-coral"
                  aria-live="polite"
                >
                  {nextPromptCopyStatus}
                </p>
              </div>
            ) : null}
          </section>

          <section
            id="improve"
            tabIndex={-1}
            hidden={!sectionVisible[4]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <p className="numeric-text text-xs text-rust">05</p>
            <h3 className="mt-3 font-mincho text-3xl">
              仕上がりをよくするコツ
            </h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              気になるものを一つ選んで、ChatGPTに伝えます。
            </p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {lesson.improvementTips.map((item) => (
                <article
                  key={item.title}
                  className="soft-card soft-interactive border-t-2 border-rust bg-white p-5"
                >
                  <Lightbulb className="size-5 text-rust" aria-hidden="true" />
                  <h4 className="mt-4 text-sm font-semibold">{item.title}</h4>
                  <p className="mt-3 text-xs leading-6 text-quiet">
                    「{item.say}」
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="check"
            tabIndex={-1}
            hidden={!sectionVisible[5]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="numeric-text text-xs text-rust">06</p>
                <h3 className="mt-3 font-mincho text-3xl">やりがちなミス</h3>
              </div>
              <p className="text-xs text-quiet">
                見つけた数：{checks.filter(Boolean).length} /{' '}
                {taskMistakes.length}
              </p>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              当てはまる所を見つけたら、上のコツを使って直します。
            </p>
            <div className="soft-panel soft-panel-clip mt-7 border border-rule bg-paper-white">
              {taskMistakes.map((item, index) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-start gap-4 border-b border-rule px-5 py-5 last:border-b-0 hover:bg-white sm:px-6"
                >
                  <input
                    className="mt-1 size-4 accent-sapphire"
                    type="checkbox"
                    checked={checks[index] ?? false}
                    onChange={() =>
                      updateChecks(
                        checks.map((value, checkIndex) =>
                          checkIndex === index ? !value : value,
                        ),
                      )
                    }
                  />
                  <span className="text-sm leading-7">{item}</span>
                </label>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <p className="text-xs leading-6 text-quiet">
                これは合格・不合格を決めるものではありません。
                {checksStorageStatus === 'checking'
                  ? '保存状態を確認しています。'
                  : checksStorageStatus === 'saved'
                    ? 'チェックはこの端末のブラウザだけに保存されています。'
                    : checksStorageStatus === 'not-saved'
                      ? 'まだチェックは保存されていません。チェックするとこの端末のブラウザに保存します。'
                      : 'この環境では保存できないため、チェックはページを閉じると消えます。'}
              </p>
              <button
                type="button"
                onClick={() => updateChecks(taskMistakes.map(() => false))}
                className="inline-flex items-center gap-2 text-xs font-semibold text-rust"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                チェックを外す
              </button>
            </div>
          </section>

          <section
            id="complete"
            tabIndex={-1}
            hidden={!sectionVisible[6]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <p className="numeric-text text-xs text-rust">07</p>
            <h3 className="mt-3 font-mincho text-3xl">ここまでできたら完成</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              AIの「できました」で終わらせません。実物を開いて使い、この課題の完成条件を確かめます。
            </p>
            <div className="soft-panel soft-panel-clip mt-7 border border-rule bg-paper-white">
              {completionGroups.map((group, groupIndex) => (
                <div
                  key={group.title ?? 'completion'}
                  className={
                    groupIndex > 0 ? 'border-t-2 border-deep-green' : ''
                  }
                >
                  {group.title ? (
                    <h4 className="bg-paper px-5 py-4 text-sm font-semibold text-deep-green sm:px-6">
                      {group.title}
                    </h4>
                  ) : null}
                  {group.items.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-start gap-4 border-t border-rule px-5 py-5 first:border-t-0 sm:px-6"
                    >
                      <span className="soft-control numeric-text grid size-7 shrink-0 place-items-center border border-success bg-future-mint-soft text-xs font-semibold text-success">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="text-sm leading-7">{item}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-5">
              {lesson.recommendedMode === 'chat' ? (
                <>
                  {manualSaveCard}
                  {workSaveCard}
                </>
              ) : (
                <>
                  {workSaveCard}
                  {manualSaveCard}
                </>
              )}
            </div>
            <div className="soft-panel mt-5 flex flex-col gap-4 border border-sapphire/35 bg-sapphire-soft p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <BookmarkCheck
                  className="mt-0.5 size-5 shrink-0 text-sapphire"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-semibold">
                    この課題を、学びの一覧へ残す
                  </p>
                  <p className="mt-1 text-xs leading-6 text-quiet">
                    無料会員なら「あとでやる」と「完了」をマイページへ保存できます。
                  </p>
                </div>
              </div>
              <Link
                className="soft-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-sapphire px-5 text-xs font-semibold text-white"
                href={`/mypage?task=${encodeURIComponent(task.id)}`}
              >
                マイページで保存
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="soft-panel mt-5 flex flex-col gap-4 border border-future-mint bg-future-mint-soft p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  作ったものを学習記録に残す
                </p>
                <p className="mt-1 text-xs leading-6 text-quiet">
                  マイページに、作品や仕事の成果を残せます。
                </p>
              </div>
              <Link
                className="soft-button inline-flex min-h-11 shrink-0 items-center justify-center gap-2 bg-brand-dark px-5 text-xs font-semibold text-white"
                href="/mypage#skills"
              >
                <FileCheck2 className="size-4" aria-hidden="true" />
                学習記録へ残す
              </Link>
            </div>
          </section>

          <section
            id="application"
            tabIndex={-1}
            hidden={!sectionVisible[7]}
            className="mt-16 scroll-mt-24 border-t border-rule pt-7"
          >
            <p className="numeric-text text-xs text-rust">08</p>
            <h3 className="mt-3 font-mincho text-3xl">自分の仕事なら</h3>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              今作ったものを、明日の仕事で使える形に変えます。
            </p>
            <div className="soft-card soft-panel-clip mt-7 border border-rule bg-paper p-6 sm:p-8">
              <Sparkles className="size-6 text-rust" aria-hidden="true" />
              <p className="mt-5 font-mincho text-2xl leading-relaxed">
                {lesson.application}
              </p>
              <p className="mt-6 border-t border-rule pt-5 text-xs leading-6 text-quiet">
                本物の顧客名、個人情報、社外秘の資料へ置き換える前に、会社のルールと閲覧権限を確かめます。
              </p>
            </div>
          </section>

          <section
            id="ask"
            tabIndex={-1}
            hidden={!sectionVisible[8]}
            className="mt-16 scroll-mt-24 border-t-2 border-deep-green pt-7"
          >
            <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
              <div>
                <p className="numeric-text text-xs text-rust">09</p>
                <h3 className="mt-3 font-mincho text-3xl">
                  困ったら講師に聞く
                </h3>
                <p className="mt-4 text-sm leading-7 text-quiet">
                  止まった画面のスクショと、一言だけで大丈夫です。
                </p>
              </div>
              <div className="soft-card soft-dark-glow bg-deep-green p-6 text-white sm:p-8">
                <div className="flex items-center gap-3">
                  <MessageCircleQuestion
                    className="size-5 text-human-coral-bright"
                    aria-hidden="true"
                  />
                  <h4 className="font-mincho text-2xl">講師に見せる内容</h4>
                </div>
                <label className="mt-6 block">
                  <span className="text-xs text-white/65">
                    どこで止まった？
                  </span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-y border border-white/25 bg-white/5 p-4 text-sm leading-7 text-white outline-none placeholder:text-white/60 focus:border-human-coral-bright"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="例：元のメモにない日付が増えた"
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    copyText(questionMemo, '相談メモ', setQuestionCopyStatus)
                  }
                  className="soft-button mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-white px-5 text-xs font-semibold text-deep-green hover:bg-sapphire-soft"
                >
                  <PenLine className="size-4" aria-hidden="true" />
                  相談メモをコピー
                </button>
                <p className="mt-3 text-xs leading-5 text-white/55">
                  ここからは送信されません。コピーした文と画面のスクショを、相談する時に見せてください。
                </p>
                <p
                  className="mt-2 min-h-5 text-xs text-human-coral-bright"
                  aria-live="polite"
                >
                  {questionCopyStatus}
                </p>
              </div>
            </div>
          </section>

          <section
            id="stepup"
            tabIndex={-1}
            hidden={!sectionVisible[9]}
            className="mt-16 scroll-mt-24 border-t-2 border-sapphire pt-7"
          >
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="numeric-text text-xs text-sapphire">10 / 任意</p>
                <h3 className="mt-3 font-mincho text-3xl">次に進みたい方へ</h3>
              </div>
              <span className="soft-badge inline-flex border border-sapphire/35 bg-sapphire-soft px-3 py-1.5 text-xs font-semibold text-sapphire">
                やりたい人だけ
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
              {lesson.stepUp.kind === 'terminal'
                ? 'ここで完成です。もっと試したい方だけ、総仕上げへ進みます。'
                : stepUpHasTwoRoutes
                  ? 'ここで完成です。続ける方は、次の進み方を一つ選びます。'
                  : 'ここで完成です。続ける方だけ、下の文を送ります。'}
            </p>
            <div className="soft-card soft-panel-clip mt-7 overflow-hidden border border-sapphire bg-sapphire-soft">
              <div className="border-b border-sapphire/25 bg-paper-white/60 p-6 sm:p-8">
                <p className="text-xs font-semibold text-sapphire">
                  次にすること
                </p>
                <h4 className="mt-3 max-w-4xl font-mincho text-2xl leading-relaxed">
                  {lesson.stepUp.title}
                </h4>
              </div>
              <div
                className={`grid ${
                  stepUpHasTwoRoutes
                    ? 'lg:grid-cols-[0.86fr_1.14fr]'
                    : 'lg:grid-cols-[1.14fr_0.86fr]'
                }`}
              >
                {(() => {
                  const routePanel = (
                    <div
                      key="stepup-route-panel"
                      className={`p-6 sm:p-8 ${
                        stepUpHasTwoRoutes
                          ? 'lg:border-r'
                          : 'border-t border-sapphire/25 lg:border-t-0'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-semibold text-sapphire">
                          今作った物の、ここを使います
                        </p>
                        <p className="mt-2 text-sm leading-7 text-quiet">
                          {lesson.stepUp.carryOver}
                        </p>
                      </div>
                      <div className="mt-5 border-t border-sapphire/25 pt-5">
                        <p className="text-xs font-semibold text-sapphire">
                          できるようになること
                        </p>
                        <p className="mt-2 text-sm leading-7 text-quiet">
                          {lesson.stepUp.adds}
                        </p>
                      </div>
                      <div
                        id="stepup-route"
                        tabIndex={-1}
                        className="mt-5 scroll-mt-24 border-t border-sapphire/25 pt-5 outline-none focus-visible:ring-2 focus-visible:ring-sapphire/40"
                      >
                        {stepUpHasTwoRoutes ? (
                          <>
                            <p className="text-xs font-semibold text-sapphire">
                              進み方は、どちらか一つでOKです
                            </p>
                            <div className="mt-3 grid gap-3">
                              {stepUpTargetTask ? (
                                <Link
                                  href={textbookLessonPath(stepUpTargetTask.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="soft-control flex min-h-16 items-center justify-between gap-4 border border-sapphire bg-paper-white px-4 py-3 hover:bg-sapphire hover:text-white"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-[11px] font-semibold">
                                      おすすめ：今の作品を育てる
                                    </span>
                                    <span className="mt-1 block text-xs leading-5">
                                      {`${stepUpTargetTask.id}「${stepUpTargetTask.title}」`}
                                    </span>
                                  </span>
                                  <ArrowRight
                                    className="size-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                </Link>
                              ) : null}
                              {formalNextTask ? (
                                <Link
                                  href={textbookLessonPath(formalNextTask.id)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="soft-control flex min-h-16 items-center justify-between gap-4 border border-rule bg-paper-white px-4 py-3 hover:border-deep-green hover:bg-deep-green hover:text-white"
                                >
                                  <span className="min-w-0">
                                    <span className="block text-[11px] font-semibold">
                                      番号順に学ぶ
                                    </span>
                                    <span className="mt-1 block text-xs leading-5">
                                      {`${formalNextTask.id}「${formalNextTask.title}」`}
                                    </span>
                                  </span>
                                  <ArrowRight
                                    className="size-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                </Link>
                              ) : null}
                            </div>
                          </>
                        ) : stepUpTargetTask ? (
                          <>
                            <p className="text-xs font-semibold text-sapphire">
                              この内容を詳しく学ぶ教材
                            </p>
                            <Link
                              href={textbookLessonPath(stepUpTargetTask.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="soft-control mt-3 flex min-h-16 items-center justify-between gap-4 border border-sapphire bg-paper-white px-4 py-3 hover:bg-sapphire hover:text-white"
                            >
                              <span className="min-w-0 text-xs leading-5">
                                {`${stepUpTargetTask.id}「${stepUpTargetTask.title}」`}
                              </span>
                              <ArrowRight
                                className="size-4 shrink-0"
                                aria-hidden="true"
                              />
                            </Link>
                          </>
                        ) : (
                          <>
                            <p className="text-xs font-semibold text-sapphire">
                              このコースに、次の課題はありません
                            </p>
                            <p className="mt-2 text-xs leading-6 text-quiet">
                              下の文は、やりたい人だけが試す最後の仕上げです。
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                  const promptPanel = (
                    <div
                      key="stepup-prompt-panel"
                      className={`bg-paper-white p-6 sm:p-8 ${
                        stepUpHasTwoRoutes
                          ? 'border-t border-sapphire/25 lg:border-t-0'
                          : 'lg:border-r'
                      }`}
                    >
                      <div className="flex items-center gap-3 text-sapphire">
                        <Compass className="size-5" aria-hidden="true" />
                        <p className="text-xs font-semibold">
                          {stepUpHasTwoRoutes
                            ? '作品を育てる追加プロンプト'
                            : '続けるための追加プロンプト'}
                        </p>
                      </div>
                      {stepUpHasTwoRoutes ? (
                        <p className="mt-4 border-l-2 border-warning pl-4 text-xs leading-6 text-quiet">
                          「今の作品を育てる」を選ぶ方だけ、下の文を使います。
                        </p>
                      ) : null}
                      <div className="mt-5 border-t border-rule pt-5">
                        <p className="text-xs font-semibold text-sapphire">
                          追加のプロンプト
                        </p>
                        <pre
                          className="soft-control mt-3 overflow-x-auto border border-sapphire/20 bg-sapphire-soft/45 p-5 font-mono text-xs leading-7 whitespace-pre-wrap text-brand-dark"
                          tabIndex={0}
                        >
                          {lesson.stepUp.say}
                        </pre>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            lesson.stepUp.say,
                            '追加のプロンプト',
                            setStepUpCopyStatus,
                          )
                        }
                        className="soft-button mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 bg-sapphire px-5 text-xs font-semibold text-white sm:w-auto"
                      >
                        <Clipboard className="size-4" aria-hidden="true" />
                        追加プロンプトをコピー
                      </button>
                      <p
                        className="mt-3 min-h-5 text-xs text-sapphire"
                        aria-live="polite"
                      >
                        {stepUpCopyStatus}
                      </p>
                      <div className="mt-3 border-t border-rule pt-5">
                        <p className="text-xs font-semibold text-sapphire">
                          進め方は3つだけ
                        </p>
                        <ol className="mt-4 grid gap-3">
                          {stepUpActions.map((action, index) => (
                            <li
                              key={action}
                              className="flex items-start gap-3 text-xs leading-6 text-quiet"
                            >
                              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-sapphire text-[11px] font-bold leading-none text-white">
                                {index + 1}
                              </span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <a
                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-quiet hover:text-sapphire"
                        href="#ask"
                      >
                        止まったら、相談メモへ戻る
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  );

                  return stepUpHasTwoRoutes
                    ? [routePanel, promptPanel]
                    : [promptPanel, routePanel];
                })()}
              </div>
            </div>
          </section>

          <div className="mt-16 grid gap-3 border-t border-rule pt-7 sm:grid-cols-2">
            {previousTask ? (
              <Link
                href={textbookLessonPath(previousTask.id)}
                className="soft-control flex min-h-14 min-w-0 items-center justify-between gap-3 overflow-hidden border border-rule bg-paper-white px-5 py-3 text-left hover:border-sapphire"
              >
                <span className="flex shrink-0 items-center gap-2 text-xs text-quiet">
                  <ArrowLeft className="size-4 shrink-0" aria-hidden="true" />
                  前の課題
                </span>
                <span className="min-w-0 truncate text-xs font-semibold">
                  {previousTask.id} {previousTask.title}
                </span>
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
            <Link
              href={textbookExplorePath}
              className="soft-control flex min-h-14 min-w-0 items-center justify-between gap-3 overflow-hidden border border-deep-green bg-paper-white px-5 py-3 text-left hover:bg-deep-green hover:text-white"
            >
              <span className="min-w-0 truncate text-xs font-semibold">
                興味や目的から、別の課題を選び直す
              </span>
              <span className="flex shrink-0 items-center gap-2 text-xs">
                課題一覧
                <ListOrdered className="size-4 shrink-0" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-5 border-l border-rule pl-6">
            <p className="text-xs font-semibold tracking-[0.14em] text-rust">
              この課題の進め方
            </p>
            <nav className="mt-5 grid gap-1" aria-label={`${task.id}の目次`}>
              {lessonSections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  aria-controls={section.id}
                  className={`group flex min-h-9 items-center gap-3 text-left text-xs hover:text-rust ${
                    currentSection === index
                      ? 'font-semibold text-rust'
                      : 'text-quiet'
                  }`}
                  onClick={() => goToSection(index)}
                  aria-current={currentSection === index ? 'true' : undefined}
                >
                  <span className="numeric-text text-xs text-quiet group-hover:text-rust">
                    {section.number}
                  </span>
                  {section.label}
                </button>
              ))}
            </nav>
            <div className="mt-8 border-t border-rule pt-5">
              <p className="text-xs font-semibold">止まっても大丈夫</p>
              <p className="mt-2 text-xs leading-6 text-quiet">
                画面のスクショと、止まった所を講師に見せればOKです。
              </p>
              <a
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-rust"
                href="#ask"
              >
                相談メモを作る
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </aside>
      </div>

      {/* スマホ用: 本文を読んでいる間だけ、現在位置と次の一手を表示 */}
      {mobileNavVisible ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-paper-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
          {tocOpen ? (
            <nav
              className="max-h-[50vh] overflow-y-auto border-b border-rule"
              aria-label="課題内の移動"
            >
              {lessonSections.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  aria-controls={section.id}
                  className={`flex min-h-11 w-full items-center gap-3 border-b border-rule px-5 text-left text-xs last:border-b-0 ${
                    currentSection === index
                      ? 'bg-sapphire-soft font-semibold text-sapphire'
                      : ''
                  }`}
                  onClick={() => {
                    setTocOpen(false);
                    goToSection(index);
                  }}
                >
                  <span className="numeric-text text-xs text-quiet">
                    {section.number}
                  </span>
                  {section.label}
                </button>
              ))}
              <Link
                className="flex min-h-11 w-full items-center gap-3 px-5 text-xs font-semibold text-deep-green"
                href={textbookExplorePath}
                onClick={() => setTocOpen(false)}
              >
                <ListOrdered className="size-4" aria-hidden="true" />
                他の課題を選ぶ（課題一覧へ）
              </Link>
            </nav>
          ) : null}
          <div className="mx-auto flex min-h-14 w-full max-w-[720px] items-stretch justify-between px-1">
            <button
              type="button"
              className="inline-flex min-w-11 flex-col items-center justify-center gap-1 px-1.5 text-xs font-semibold text-quiet"
              aria-expanded={tocOpen}
              onClick={() => setTocOpen((open) => !open)}
            >
              <ListOrdered className="size-4" aria-hidden="true" />
              目次
            </button>
            <button
              type="button"
              className="inline-flex min-w-11 items-center justify-center px-1.5 text-xs font-semibold text-quiet disabled:opacity-35"
              disabled={currentSection === 0}
              onClick={() => goToSection(currentSection - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              前へ
            </button>
            <p
              className="flex min-w-0 flex-col items-center justify-center px-1 text-center"
              aria-live="polite"
            >
              <span className="numeric-text text-xs text-quiet">
                {currentSection + 1} / {lessonSections.length}
              </span>
              <span className="max-w-24 truncate text-xs font-semibold">
                {lessonSections[currentSection].label}
              </span>
            </p>
            {currentSection === lessonSections.length - 1 && formalNextTask ? (
              <button
                type="button"
                aria-controls="stepup-route"
                onClick={showStepUpRoutes}
                className="inline-flex min-w-11 items-center justify-center gap-1 px-1.5 text-xs font-semibold text-deep-green"
              >
                <Compass className="size-4" aria-hidden="true" />
                進み方
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex min-w-11 items-center justify-center px-1.5 text-xs font-semibold text-quiet disabled:opacity-35"
                disabled={currentSection === lessonSections.length - 1}
                onClick={() => goToSection(currentSection + 1)}
              >
                {currentSection === lessonSections.length - 1 ? (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    ここまで
                  </>
                ) : (
                  <>
                    次へ
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              className={`inline-flex min-w-11 flex-col items-center justify-center gap-1 px-1.5 text-xs font-semibold ${
                focusIndex !== null ? 'text-sapphire' : 'text-quiet'
              }`}
              aria-pressed={focusIndex !== null}
              onClick={() =>
                focusIndex !== null
                  ? setFocusIndex(null)
                  : setFocusIndex(currentSection)
              }
            >
              <Sparkles className="size-4" aria-hidden="true" />
              {focusIndex !== null ? '全体' : '集中'}
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
