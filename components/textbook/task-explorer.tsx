'use client';

import {
  BookOpenText,
  ChevronDown,
  ExternalLink,
  Filter,
  Search,
  Sparkles,
} from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import Link from '@/components/site-link';
import {
  TextbookAccessBadges,
  textbookAccessLabel,
} from '@/components/textbook/access-badges';
import { getTextbookAccessProfile } from '@/lib/textbook-access';
import type { TextbookPlanAccess } from '@/lib/textbook-access';
import type { ClientTextbookTask } from '@/lib/textbook-catalog-client';
import type {
  TextbookTrack,
  TextbookTrackSummary,
} from '@/lib/textbook-catalog';
import { trackDescriptions } from '@/lib/textbook-catalog';
import { chapterKeyForTaskId } from '@/lib/textbook-lessons/registry';
import lessonMetaJson from '@/lib/textbook-lesson-meta.generated.json';
import { normalizeSearch } from '@/components/textbook/lesson-shared';
import { textbookLessonPath } from '@/lib/textbook-routes';

type LessonMaterial = 'paste' | 'attach' | 'mixed' | 'none';
type LessonMode = 'chat' | 'work';
type LessonMeta = Record<string, [LessonMaterial, LessonMode, number | null]>;

const lessonMeta = lessonMetaJson as unknown as LessonMeta;

export type ChapterSummaryLite = {
  key: string;
  track: TextbookTrack;
  trackLabel: string;
  courseTitle: string;
  coursePromise: string;
  firstTaskId: string;
  flagshipTitle: string | null;
};

type PurposePreset = {
  id: string;
  label: string;
  hint: string;
  matches: (task: ClientTextbookTask, chapterKey: string | null) => boolean;
};

function chapterIn(chapterKey: string | null, keys: readonly string[]) {
  return chapterKey !== null && keys.includes(chapterKey);
}

function commonChapterBetween(
  chapterKey: string | null,
  from: number,
  to: number,
) {
  if (!chapterKey?.startsWith('common-')) return false;
  const number = Number(chapterKey.slice('common-'.length));
  return number >= from && number <= to;
}

const publishChapters = [
  'common-02',
  ...[
    'bok',
    'nov',
    'pct',
    'mng',
    'blg',
    'nws',
    'rpt',
    'igc',
    'sns',
    'ytb',
    'svd',
    'pod',
    'mus',
    'img',
    'cat',
    'brd',
  ].map((prefix) => `generation-${prefix}`),
];

export const purposePresets: readonly PurposePreset[] = [
  {
    id: 'three-min',
    label: 'まず3分で一個',
    hint: '10分以内に最初の完成品ができる課題',
    matches: (task) => {
      const minutes = lessonMeta[task.id]?.[2];
      return typeof minutes === 'number' && minutes <= 10;
    },
  },
  {
    id: 'work-ease',
    label: '仕事を楽にしたい',
    hint: 'メール、会議後の段取り、資料室、担当業務のAI化',
    matches: (task, chapterKey) =>
      task.track === 'department' || commonChapterBetween(chapterKey, 1, 6),
  },
  {
    id: 'publish',
    label: '発信・作品を作りたい',
    hint: '本、SNS、画像、動画、音声、ブランド',
    matches: (task, chapterKey) => chapterIn(chapterKey, publishChapters),
  },
  {
    id: 'numbers',
    label: '数字を整えたい',
    hint: '見積、請求、集計、ダッシュボード、Excel',
    matches: (task, chapterKey) =>
      chapterIn(chapterKey, [
        'generation-xls',
        'common-06',
        'common-10',
        'department-fin',
        'department-rev',
        'department-prc',
      ]),
  },
  {
    id: 'build',
    label: 'サイト・アプリを作りたい',
    hint: 'ホームページ、受付、ゲーム、スマホアプリ',
    matches: (task, chapterKey) =>
      commonChapterBetween(chapterKey, 7, 13) ||
      chapterIn(chapterKey, [
        'generation-web',
        'generation-app',
        'generation-gam',
      ]),
  },
  {
    id: 'ai-lead',
    label: 'AI推進を担いたい',
    hint: '承認、受付センター、安全運用、社内展開',
    matches: (task, chapterKey) =>
      commonChapterBetween(chapterKey, 14, 20) ||
      chapterIn(chapterKey, ['department-pmo', 'department-it']),
  },
];

type ModeFilter = 'all' | LessonMode;
type MaterialFilter = 'all' | LessonMaterial;
type MinutesFilter = 'all' | 'short' | 'medium' | 'long';
type PlanFilter = 'all' | TextbookPlanAccess;
type WorkModeFilter = ModeFilter | 'codex';

const materialFilterLabels: Record<Exclude<MaterialFilter, 'all'>, string> = {
  paste: '中身を貼る',
  attach: 'ファイルを添付',
  mixed: '貼る＋添付',
  none: '材料なし',
};

export function TaskExplorer({
  tasks,
  tracks,
  chapters,
  layout = 'sidebar',
  className = '',
}: {
  tasks: ClientTextbookTask[];
  tracks: TextbookTrackSummary[];
  chapters: ChapterSummaryLite[];
  layout?: 'sidebar' | 'page';
  className?: string;
}) {
  const [view, setView] = useState<'search' | 'courses'>('search');
  const [query, setQuery] = useState('');
  const [track, setTrack] = useState<TextbookTrack | 'all'>('all');
  const [purpose, setPurpose] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [modeFilter, setModeFilter] = useState<WorkModeFilter>('all');
  const [material, setMaterial] = useState<MaterialFilter>('all');
  const [minutes, setMinutes] = useState<MinutesFilter>('all');
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const deferredQuery = useDeferredValue(query);

  const chapterKeys = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const task of tasks) map.set(task.id, chapterKeyForTaskId(task.id));
    return map;
  }, [tasks]);

  const activePreset = purposePresets.find((preset) => preset.id === purpose);

  const filteredTasks = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredQuery);
    return tasks.filter((task) => {
      const chapterKey = chapterKeys.get(task.id) ?? null;
      if (courseFilter && chapterKey !== courseFilter) return false;
      if (track !== 'all' && task.track !== track) return false;
      if (activePreset && !activePreset.matches(task, chapterKey)) return false;
      const accessProfile = getTextbookAccessProfile(task);
      const meta = lessonMeta[task.id];
      if (planFilter !== 'all' && accessProfile.plan !== planFilter)
        return false;
      if (modeFilter === 'codex' && !accessProfile.codexRecommended)
        return false;
      if (
        (modeFilter === 'chat' || modeFilter === 'work') &&
        meta?.[1] !== modeFilter
      )
        return false;
      if (material !== 'all' && meta?.[0] !== material) return false;
      if (minutes !== 'all') {
        const upper = meta?.[2];
        if (typeof upper !== 'number') return false;
        if (minutes === 'short' && upper > 10) return false;
        if (minutes === 'medium' && (upper <= 10 || upper > 30)) return false;
        if (minutes === 'long' && upper <= 30) return false;
      }
      if (!normalizedQuery) return true;
      const haystack = normalizeSearch(
        [
          task.id,
          task.title,
          task.courseTitle,
          task.action,
          task.outcome,
          task.tags.join(' '),
        ].join(' '),
      );
      return haystack.includes(normalizedQuery);
    });
  }, [
    activePreset,
    chapterKeys,
    courseFilter,
    deferredQuery,
    material,
    minutes,
    modeFilter,
    planFilter,
    tasks,
    track,
  ]);

  const visibleTasks = useMemo(
    () => filteredTasks.slice(0, visibleCount),
    [filteredTasks, visibleCount],
  );
  const activeFilterCount =
    Number(planFilter !== 'all') +
    Number(modeFilter !== 'all') +
    Number(material !== 'all') +
    Number(minutes !== 'all');
  const hasActiveCriteria =
    deferredQuery.trim().length > 0 ||
    track !== 'all' ||
    purpose !== null ||
    planFilter !== 'all' ||
    modeFilter !== 'all' ||
    material !== 'all' ||
    minutes !== 'all' ||
    courseFilter !== null;

  function resetPaging() {
    setVisibleCount(30);
  }

  const courseFilterChapter = courseFilter
    ? chapters.find((chapter) => chapter.key === courseFilter)
    : null;
  const pageLayout = layout === 'page';

  return (
    <aside
      id="task-explorer"
      tabIndex={-1}
      className={`${pageLayout ? 'soft-card overflow-hidden border border-rule bg-paper-white' : 'border-r border-rule bg-paper-white lg:min-h-[calc(100vh-78px)]'} ${className}`}
      aria-labelledby="task-explorer-heading"
    >
      <div className="border-b border-rule p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="task-explorer-heading" className="font-mincho text-2xl">
            学びたいことを探す
          </h2>
          <span className="text-xs text-quiet">検索・絞り込み</span>
        </div>

        <fieldset className="mt-5 grid grid-cols-2 gap-2 border-0 p-0">
          <legend className="sr-only">探し方</legend>
          <button
            type="button"
            aria-pressed={view === 'search'}
            className={`soft-control min-h-11 border px-3 text-xs font-semibold ${view === 'search' ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-deep-green'}`}
            onClick={() => setView('search')}
          >
            <Search className="mr-2 inline size-3.5" aria-hidden="true" />
            さがす
          </button>
          <button
            type="button"
            aria-pressed={view === 'courses'}
            className={`soft-control min-h-11 border px-3 text-xs font-semibold ${view === 'courses' ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-deep-green'}`}
            onClick={() => setView('courses')}
          >
            <BookOpenText className="mr-2 inline size-3.5" aria-hidden="true" />
            コースから
          </button>
        </fieldset>

        {view === 'search' ? (
          <>
            <label className="mt-4 block">
              <span className="sr-only">作りたいものを検索</span>
              <span className="soft-control flex min-h-12 items-center gap-3 border border-rule bg-white px-4 shadow-[0_8px_24px_rgba(16,42,54,0.055)] focus-within:border-rust">
                <Search className="size-4 text-quiet" aria-hidden="true" />
                <input
                  id="task-search"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-quiet"
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    resetPaging();
                  }}
                  placeholder="メール、見積もり、PowerPoint、ゲーム…"
                />
              </span>
            </label>

            <div className="mt-4">
              <p className="text-xs font-semibold text-quiet">目的から選ぶ</p>
              <fieldset
                className="mt-2 flex flex-wrap gap-2 border-0 p-0"
                aria-label="目的の絞り込み"
              >
                {purposePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    aria-pressed={purpose === preset.id}
                    title={preset.hint}
                    className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${purpose === preset.id ? 'border-sapphire bg-sapphire text-white' : 'border-rule bg-white text-quiet hover:border-sapphire hover:text-sapphire'}`}
                    onClick={() => {
                      setPurpose((current) =>
                        current === preset.id ? null : preset.id,
                      );
                      setCourseFilter(null);
                      resetPaging();
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </fieldset>
              {activePreset ? (
                <p className="mt-2 text-xs leading-5 text-quiet">
                  {activePreset.hint}
                </p>
              ) : null}
            </div>

            <details className="soft-control mt-3 overflow-hidden border border-rule bg-paper">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-xs font-semibold [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <Filter className="size-3.5 text-rust" aria-hidden="true" />
                  プラン・作業環境・時間で絞る
                  {activeFilterCount > 0 || track !== 'all' ? (
                    <span className="soft-badge numeric-text border border-sapphire px-2 py-0.5 text-xs text-sapphire">
                      {activeFilterCount + Number(track !== 'all')}
                    </span>
                  ) : null}
                </span>
                <ChevronDown className="size-4 text-quiet" aria-hidden="true" />
              </summary>
              <div className="grid gap-4 border-t border-rule p-4">
                <div>
                  <p className="text-xs font-semibold text-quiet">料金プラン</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['all', 'すべて'],
                        ['free', '無料で始めやすい'],
                        ['paid-recommended', '有料版推奨'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={planFilter === value}
                        className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${planFilter === value ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-quiet'}`}
                        onClick={() => {
                          setPlanFilter(value);
                          resetPaging();
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-quiet">作業環境</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['all', 'すべて'],
                        ['chat', 'Chat'],
                        ['work', 'Work'],
                        ['codex', 'Codex向き'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={modeFilter === value}
                        className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${modeFilter === value ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-quiet'}`}
                        onClick={() => {
                          setModeFilter(value);
                          resetPaging();
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-quiet">系統</p>
                  <div className="mt-2 grid gap-1">
                    <button
                      type="button"
                      aria-pressed={track === 'all'}
                      className={`min-h-10 px-3 text-left text-xs ${track === 'all' ? 'bg-deep-green text-white' : 'hover:bg-white'}`}
                      onClick={() => {
                        setTrack('all');
                        resetPaging();
                      }}
                    >
                      すべて見る
                    </button>
                    {tracks.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={track === item.id}
                        className={`min-h-10 px-3 text-left text-xs ${track === item.id ? 'bg-deep-green text-white' : 'hover:bg-white'}`}
                        onClick={() => {
                          setTrack(item.id);
                          resetPaging();
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  {track !== 'all' ? (
                    <p className="mt-2 text-xs leading-5 text-quiet">
                      {trackDescriptions[track]}
                    </p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-semibold text-quiet">時間の目安</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(
                      [
                        ['all', 'すべて'],
                        ['short', '10分以内'],
                        ['medium', '11〜30分'],
                        ['long', '31分以上'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={minutes === value}
                        className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${minutes === value ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-quiet'}`}
                        onClick={() => {
                          setMinutes(value);
                          resetPaging();
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-quiet">
                    材料の渡し方
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      aria-pressed={material === 'all'}
                      className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${material === 'all' ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-quiet'}`}
                      onClick={() => {
                        setMaterial('all');
                        resetPaging();
                      }}
                    >
                      すべて
                    </button>
                    {(
                      Object.entries(materialFilterLabels) as [
                        Exclude<MaterialFilter, 'all'>,
                        string,
                      ][]
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={material === value}
                        className={`soft-badge border px-3 py-1.5 text-xs font-semibold ${material === value ? 'border-deep-green bg-deep-green text-white' : 'border-rule bg-white text-quiet'}`}
                        onClick={() => {
                          setMaterial(value);
                          resetPaging();
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </details>

            {courseFilterChapter ? (
              <p className="soft-control mt-3 flex items-center justify-between gap-3 border border-sapphire bg-sapphire-soft px-4 py-2 text-xs font-semibold text-sapphire">
                {courseFilterChapter.courseTitle}
                <button
                  type="button"
                  className="underline underline-offset-2"
                  onClick={() => {
                    setCourseFilter(null);
                    resetPaging();
                  }}
                >
                  解除
                </button>
              </p>
            ) : null}

            {hasActiveCriteria ? (
              <p className="mt-4 text-xs text-quiet" aria-live="polite">
                検索結果：{filteredTasks.length}件
              </p>
            ) : null}
          </>
        ) : (
          <p className="mt-4 text-xs leading-6 text-quiet">
            仕事や作りたい物に近いコースを選ぶと、その中の課題だけに絞って見られます。
          </p>
        )}
      </div>

      {view === 'search' ? (
        <>
          <div
            id="task-explorer-results"
            className={
              pageLayout
                ? ''
                : 'lg:max-h-[calc(100vh-430px)] lg:overflow-y-auto'
            }
          >
            {visibleTasks.length > 0 ? (
              <ol
                className={
                  pageLayout ? 'grid md:grid-cols-2 xl:grid-cols-3' : ''
                }
              >
                {visibleTasks.map((task) => {
                  const meta = lessonMeta[task.id];
                  const accessProfile = getTextbookAccessProfile(task);
                  return (
                    <li
                      key={task.id}
                      className={`border-b border-rule ${pageLayout ? 'md:border-r' : ''}`}
                    >
                      <Link
                        href={textbookLessonPath(task.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${task.id} ${task.title}、${textbookAccessLabel(accessProfile)}、新しいタブで開く`}
                        className="group block w-full px-5 py-4 text-left transition-colors hover:bg-paper"
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="numeric-text text-xs font-semibold text-rust">
                            {task.id}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-quiet">
                            新しいタブで読む
                            <ExternalLink
                              className="size-3"
                              aria-hidden="true"
                            />
                          </span>
                        </span>
                        <span className="mt-2 block text-sm font-semibold leading-6">
                          {task.title}
                        </span>
                        <span className="mt-2 block">
                          <TextbookAccessBadges
                            profile={accessProfile}
                            compact
                          />
                        </span>
                        <span className="mt-1.5 line-clamp-2 block text-xs leading-5 text-ink/80">
                          <span className="font-semibold">
                            できあがるもの：
                          </span>
                          {task.outcome}
                        </span>
                        <span className="mt-1.5 block text-xs leading-5 text-quiet">
                          {task.trackLabel} / {task.courseTitle}
                        </span>
                        <span className="mt-2 flex flex-wrap gap-1.5">
                          {typeof meta?.[2] === 'number' ? (
                            <span className="soft-badge border border-rule px-2 py-1 text-xs text-quiet">
                              時間：〜{meta[2]}分
                            </span>
                          ) : null}
                          {meta?.[0] ? (
                            <span className="soft-badge border border-rule px-2 py-1 text-xs text-quiet">
                              材料：{materialFilterLabels[meta[0]]}
                            </span>
                          ) : null}
                          <span className="soft-badge border border-sapphire/30 px-2 py-1 text-xs font-semibold text-sapphire">
                            {task.hasLessonDraft
                              ? '詳しい手順を読む'
                              : '概要を見る'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="p-7">
                <p className="font-mincho text-xl">まだ見つかりません。</p>
                <p className="mt-3 text-xs leading-6 text-quiet">
                  「メール」「画像」のように短くするか、絞り込みを解除してみてください。
                </p>
              </div>
            )}
          </div>

          {visibleCount < filteredTasks.length ? (
            <div className="border-t border-rule p-5">
              <button
                type="button"
                className="soft-control min-h-11 w-full border border-deep-green px-4 text-sm font-semibold text-deep-green hover:bg-deep-green hover:text-white"
                onClick={() => setVisibleCount((count) => count + 30)}
              >
                次の30件を表示
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div
          className={
            pageLayout ? '' : 'lg:max-h-[calc(100vh-330px)] lg:overflow-y-auto'
          }
        >
          {tracks.map((trackSummary) => (
            <section key={trackSummary.id} className="border-b border-rule">
              <h3 className="bg-paper px-5 py-3 text-xs font-semibold tracking-[0.1em] text-quiet">
                {trackSummary.label}
              </h3>
              <ol>
                {chapters
                  .filter((chapter) => chapter.track === trackSummary.id)
                  .map((chapter) => (
                    <li key={chapter.key} className="border-t border-rule">
                      <button
                        type="button"
                        aria-controls="task-explorer-results"
                        className="group w-full px-5 py-4 text-left hover:bg-paper"
                        onClick={() => {
                          setView('search');
                          setCourseFilter(chapter.key);
                          setPurpose(null);
                          setTrack('all');
                          resetPaging();
                          window.requestAnimationFrame(() => {
                            document.getElementById('task-search')?.focus();
                          });
                        }}
                      >
                        <span className="block text-sm font-semibold leading-6">
                          {chapter.courseTitle}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2 text-xs leading-5 text-quiet">
                          <Sparkles
                            className="size-3.5 shrink-0 text-sapphire"
                            aria-hidden="true"
                          />
                          {chapter.flagshipTitle ?? chapter.coursePromise}
                        </span>
                      </button>
                    </li>
                  ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </aside>
  );
}
