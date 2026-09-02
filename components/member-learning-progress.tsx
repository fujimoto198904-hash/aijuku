'use client';

import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  Search,
  Undo2,
} from 'lucide-react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';

import Link from '@/components/site-link';
import { normalizeSearch } from '@/components/textbook/lesson-shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { MemberLessonProgress } from '@/db/lesson-progress';
import { withSiteBasePath } from '@/lib/site-paths';
import { textbookLessonPath } from '@/lib/textbook-routes';

export type MemberLearningTask = {
  id: string;
  title: string;
  outcome: string;
  courseTitle: string;
  trackLabel: string;
};

function formatDate(value: number | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}

export function MemberLearningProgress({
  tasks,
  initialProgress,
  initialTaskId,
  readOnly = false,
}: {
  tasks: MemberLearningTask[];
  initialProgress: MemberLessonProgress[];
  initialTaskId?: string;
  readOnly?: boolean;
}) {
  const initialTask = useMemo(
    () => tasks.find((task) => task.id === initialTaskId),
    [initialTaskId, tasks],
  );
  const [progress, setProgress] = useState(initialProgress);
  const [query, setQuery] = useState(initialTask?.id ?? '');
  const deferredQuery = useDeferredValue(query);
  const [selectedTaskId, setSelectedTaskId] = useState(initialTask?.id ?? '');
  const savingRef = useRef(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageKind, setMessageKind] = useState<'success' | 'error'>(
    'success',
  );

  const taskById = useMemo(
    () => new Map(tasks.map((task) => [task.id, task])),
    [tasks],
  );
  const progressByTaskId = useMemo(
    () => new Map(progress.map((item) => [item.taskId, item])),
    [progress],
  );
  const matchingTasks = useMemo(() => {
    const normalized = normalizeSearch(deferredQuery);
    if (!normalized) return tasks.slice(0, 6);
    return tasks
      .filter((task) =>
        normalizeSearch(
          [
            task.id,
            task.title,
            task.outcome,
            task.courseTitle,
            task.trackLabel,
          ].join(' '),
        ).includes(normalized),
      )
      .slice(0, 6);
  }, [deferredQuery, tasks]);
  const selectedTask = taskById.get(selectedTaskId) ?? null;
  const selectedProgress = selectedTask
    ? (progressByTaskId.get(selectedTask.id) ?? null)
    : null;
  const knownProgress = progress.filter((item) => taskById.has(item.taskId));
  const bookmarked = knownProgress.filter(
    (item) => item.bookmarked && !item.completed,
  );
  const completed = knownProgress.filter((item) => item.completed);

  useEffect(() => {
    if (!initialTask) return;
    window.requestAnimationFrame(() => {
      document.getElementById('learning')?.scrollIntoView({ block: 'start' });
    });
  }, [initialTask]);

  async function saveProgress(
    taskId: string,
    next: { bookmarked: boolean; completed: boolean },
    successMessage: string,
  ) {
    if (readOnly || savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setMessage('');
    try {
      const response = await fetch(withSiteBasePath('/api/lesson-progress'), {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ taskId, ...next }),
      });
      const body = (await response.json()) as {
        error?: string;
        progress?: MemberLessonProgress | null;
      };
      if (!response.ok) {
        throw new Error(body.error ?? '学習状況を保存できませんでした。');
      }
      setProgress((current) => {
        const withoutTask = current.filter((item) => item.taskId !== taskId);
        return body.progress ? [body.progress, ...withoutTask] : withoutTask;
      });
      setMessageKind('success');
      setMessage(successMessage);
    } catch (error) {
      setMessageKind('error');
      setMessage(
        error instanceof Error
          ? error.message
          : '学習状況を保存できませんでした。',
      );
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  function renderTaskCard(item: MemberLessonProgress, kind: 'later' | 'done') {
    const task = taskById.get(item.taskId);
    if (!task) return null;
    const pending = isSaving;
    return (
      <article
        className="soft-card border border-rule bg-paper-white p-5"
        key={`${kind}-${item.taskId}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="soft-badge bg-sapphire-soft px-3 py-1 text-xs font-semibold text-sapphire">
            {task.id}
          </span>
          <span className="text-xs text-quiet">{task.courseTitle}</span>
        </div>
        <h4 className="mt-4 font-mincho text-xl leading-8">{task.title}</h4>
        <p className="mt-2 text-xs leading-6 text-quiet">
          {kind === 'done'
            ? `${formatDate(item.completedAt)}に完了`
            : '次に取り組みたい課題'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2 border-t border-rule pt-4">
          <Link
            className="soft-control inline-flex min-h-11 items-center gap-2 border border-rule px-4 text-xs font-semibold text-sapphire"
            href={textbookLessonPath(task.id)}
            rel="noopener noreferrer"
            target="_blank"
          >
            教科書を開く
            <ExternalLink className="size-3.5" aria-hidden="true" />
          </Link>
          {!readOnly && kind === 'later' ? (
            <>
              <Button
                className="min-h-11 bg-deep-green px-4 text-xs text-white"
                disabled={pending}
                onClick={() =>
                  saveProgress(
                    task.id,
                    { bookmarked: false, completed: true },
                    `「${task.title}」を完了にしました。`,
                  )
                }
                type="button"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                完了にする
              </Button>
              <Button
                className="min-h-11 px-4 text-xs"
                disabled={pending}
                onClick={() =>
                  saveProgress(
                    task.id,
                    { bookmarked: false, completed: false },
                    `「${task.title}」をあとでやるから外しました。`,
                  )
                }
                type="button"
                variant="outline"
              >
                あとでやるから外す
              </Button>
            </>
          ) : !readOnly ? (
            <Button
              className="min-h-11 px-4 text-xs"
              disabled={pending}
              onClick={() =>
                saveProgress(
                  task.id,
                  { bookmarked: true, completed: false },
                  `「${task.title}」をあとでやるへ戻しました。`,
                )
              }
              type="button"
              variant="outline"
            >
              <Undo2 className="size-4" aria-hidden="true" />
              未完了へ戻す
            </Button>
          ) : null}
        </div>
      </article>
    );
  }

  return (
    <section
      id="learning"
      className="mt-16 scroll-mt-24 border-t-2 border-brand-dark pt-8"
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            MY LEARNING
          </p>
          <h2 className="mt-3 font-mincho text-4xl sm:text-5xl">
            次にやることも、できたことも。
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
            気になる課題は「あとでやる」へ。完成したら「完了」に移します。同じ会員アカウントで、学びの一覧をいつでも確認できます。
          </p>
          {readOnly ? (
            <p className="soft-control mt-4 inline-flex border border-sapphire/30 bg-sapphire-soft px-4 py-2 text-xs font-semibold text-sapphire">
              デモでは学習状況の変更は保存されません。
            </p>
          ) : null}
        </div>
        <div className="soft-control grid min-w-[260px] grid-cols-2 border border-rule bg-paper-white text-center">
          <div className="border-r border-rule p-4">
            <p className="text-[11px] text-quiet">あとでやる</p>
            <p className="numeric-text mt-1 text-2xl">{bookmarked.length}</p>
          </div>
          <div className="p-4">
            <p className="text-[11px] text-quiet">完了した課題</p>
            <p className="numeric-text mt-1 text-2xl">{completed.length}</p>
          </div>
        </div>
      </div>

      <div className="soft-panel mt-8 border border-sapphire/30 bg-sapphire-soft p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Search className="size-5 text-sapphire" aria-hidden="true" />
          <div>
            <p className="font-semibold">
              {readOnly ? '課題を探す' : '課題を探して保存'}
            </p>
            <p className="mt-1 text-xs leading-6 text-quiet">
              レベル番号、作りたいもの、仕事の悩みから検索できます。
            </p>
          </div>
        </div>
        <label className="mt-5 block" htmlFor="member-learning-search">
          <span className="sr-only">保存する教科書課題を検索</span>
          <Input
            className="min-h-12 bg-white px-4"
            id="member-learning-search"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedTaskId('');
            }}
            placeholder="例：メール、見積もり、Lv.05"
            type="search"
            value={query}
          />
        </label>

        <ul className="mt-3 grid gap-2" aria-label="課題の候補">
          {matchingTasks.map((task) => {
            const item = progressByTaskId.get(task.id);
            return (
              <li key={task.id}>
                <button
                  aria-pressed={selectedTaskId === task.id}
                  className={`soft-control flex min-h-12 w-full items-center justify-between gap-4 border px-4 py-3 text-left text-xs ${selectedTaskId === task.id ? 'border-sapphire bg-white text-sapphire' : 'border-rule bg-paper-white text-ink'}`}
                  onClick={() => setSelectedTaskId(task.id)}
                  type="button"
                >
                  <span>
                    <span className="font-semibold">{task.id}</span>　
                    {task.title}
                  </span>
                  {item?.completed ? (
                    <span className="soft-badge shrink-0 bg-future-mint-soft px-2 py-1 text-[10px] text-success">
                      完了
                    </span>
                  ) : item?.bookmarked ? (
                    <span className="soft-badge shrink-0 bg-sapphire-soft px-2 py-1 text-[10px] text-sapphire">
                      あとでやる
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
        {matchingTasks.length === 0 ? (
          <p className="soft-control mt-3 border border-rule bg-paper-white p-4 text-sm text-quiet">
            条件に合う課題がありません。別の言葉やレベル番号で検索してください。
          </p>
        ) : null}

        {selectedTask ? (
          <div className="soft-card mt-5 border border-sapphire bg-white p-5">
            <p className="text-xs font-semibold text-sapphire">
              {selectedTask.id} / {selectedTask.courseTitle}
            </p>
            <p className="mt-2 font-mincho text-xl">{selectedTask.title}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {readOnly ? (
                <Link
                  className="soft-control inline-flex min-h-11 items-center gap-2 border border-sapphire px-4 text-xs font-semibold text-sapphire"
                  href={textbookLessonPath(selectedTask.id)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  教科書を開く
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </Link>
              ) : selectedProgress?.completed ? (
                <Button
                  className="min-h-11 px-4 text-xs"
                  disabled={isSaving}
                  onClick={() =>
                    saveProgress(
                      selectedTask.id,
                      { bookmarked: true, completed: false },
                      `「${selectedTask.title}」を未完了へ戻しました。`,
                    )
                  }
                  type="button"
                  variant="outline"
                >
                  <Undo2 className="size-4" aria-hidden="true" />
                  未完了へ戻す
                </Button>
              ) : (
                <>
                  <Button
                    className={
                      selectedProgress?.bookmarked
                        ? 'min-h-11 px-4 text-xs'
                        : 'min-h-11 bg-sapphire px-4 text-xs text-white'
                    }
                    disabled={isSaving}
                    onClick={() =>
                      saveProgress(
                        selectedTask.id,
                        {
                          bookmarked: !selectedProgress?.bookmarked,
                          completed: false,
                        },
                        selectedProgress?.bookmarked
                          ? `「${selectedTask.title}」をあとでやるから外しました。`
                          : `「${selectedTask.title}」をあとでやるへ保存しました。`,
                      )
                    }
                    type="button"
                    variant={
                      selectedProgress?.bookmarked ? 'outline' : 'default'
                    }
                  >
                    {selectedProgress?.bookmarked ? (
                      <BookmarkCheck className="size-4" aria-hidden="true" />
                    ) : (
                      <Bookmark className="size-4" aria-hidden="true" />
                    )}
                    {selectedProgress?.bookmarked
                      ? 'あとでやるから外す'
                      : 'あとでやるに保存'}
                  </Button>
                  <Button
                    className="min-h-11 bg-deep-green px-4 text-xs text-white"
                    disabled={isSaving}
                    onClick={() =>
                      saveProgress(
                        selectedTask.id,
                        { bookmarked: false, completed: true },
                        `「${selectedTask.title}」を完了にしました。`,
                      )
                    }
                    type="button"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    完了にする
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {message ? (
          <p
            className={`soft-control mt-5 border-l-4 p-4 text-sm ${messageKind === 'success' ? 'border-future-mint bg-future-mint-soft' : 'border-human-coral bg-human-coral-soft'}`}
            role={messageKind === 'error' ? 'alert' : 'status'}
          >
            {message}
          </p>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section>
          <div className="flex items-center gap-3">
            <BookmarkCheck
              className="size-5 text-sapphire"
              aria-hidden="true"
            />
            <h3 className="font-mincho text-2xl">あとでやる</h3>
          </div>
          {bookmarked.length ? (
            <div className="mt-5 grid gap-4">
              {bookmarked.map((item) => renderTaskCard(item, 'later'))}
            </div>
          ) : (
            <p className="soft-panel mt-5 border border-rule bg-paper-white p-6 text-sm leading-7 text-quiet">
              気になる課題を見つけたら、上の検索から保存できます。
            </p>
          )}
        </section>

        <section>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            <h3 className="font-mincho text-2xl">できた課題</h3>
          </div>
          {completed.length ? (
            <div className="mt-5 grid gap-4">
              {completed.map((item) => renderTaskCard(item, 'done'))}
            </div>
          ) : (
            <p className="soft-panel mt-5 border border-rule bg-paper-white p-6 text-sm leading-7 text-quiet">
              完成した課題を「完了」にすると、ここへ積み上がります。
            </p>
          )}
        </section>
      </div>

      <div className="soft-panel mt-8 border border-future-mint/55 bg-future-mint-soft p-6 text-sm leading-7">
        <p className="font-semibold">「完了」は、自分の学習メモです。</p>
        <p className="mt-2 text-xs leading-6 text-quiet">
          修了資格や講師確認とは別です。作った成果物を証拠として残したい場合は、下のAI実学パスポートへ記録してください。
        </p>
        <a
          className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-sapphire"
          href="#skills"
        >
          AI実学パスポートへ進む
        </a>
      </div>
    </section>
  );
}
