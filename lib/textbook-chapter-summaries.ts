/**
 * 章(コース)単位のショーケース情報。サーバーコンポーネント専用。
 *
 * lib/textbook-lessons/all.ts(全本文の静的集約)を読むため、
 * クライアントコンポーネントからはimportしない。クライアントへは
 * この関数の戻り値(軽量なサマリー)だけをpropsで渡す。
 */

import { allChapters } from '@/lib/textbook-lessons/all';
import type { TextbookChapterFlagship } from '@/lib/textbook-lessons/types';
import { textbookCatalog } from '@/lib/textbook-catalog';
import type { TextbookTrack } from '@/lib/textbook-catalog';

export type ChapterSummary = {
  key: string;
  track: TextbookTrack;
  trackLabel: string;
  courseCode: string;
  courseTitle: string;
  /** 課題定義文書の「10問後に手に入るもの」 */
  coursePromise: string;
  /** この章の最初の課題ID(コースの入口) */
  firstTaskId: string;
  /** 章の10課題ID(コース順) */
  taskIds: string[];
  /** 執筆済みの章だけ持つ旗艦作品プレビュー */
  flagship: TextbookChapterFlagship | null;
  lessonCount: number;
};

const chapterByKey = new Map(allChapters.map((chapter) => [chapter.key, chapter]));

function chapterKeyOf(taskId: string): string | null {
  const levelMatch = taskId.match(/^Lv\.(\d{2,3})$/);
  if (levelMatch) {
    return `common-${String(Math.ceil(Number(levelMatch[1]) / 10)).padStart(2, '0')}`;
  }
  const prefixMatch = taskId.match(/^([A-Z]{2,5})-\d{2}$/);
  if (!prefixMatch) return null;
  const chapter = allChapters.find((candidate) =>
    candidate.key.endsWith(`-${prefixMatch[1].toLowerCase()}`),
  );
  return chapter?.key ?? null;
}

export function getChapterSummaries(): ChapterSummary[] {
  const summaries = new Map<string, ChapterSummary>();
  for (const task of textbookCatalog.tasks) {
    const key = chapterKeyOf(task.id);
    if (!key) continue;
    let summary = summaries.get(key);
    if (!summary) {
      const chapter = chapterByKey.get(key);
      const hasLessons = chapter
        ? Object.keys(chapter.lessons).length > 0
        : false;
      summary = {
        key,
        track: task.track,
        trackLabel: task.trackLabel,
        courseCode: task.courseCode,
        courseTitle: task.courseTitle,
        coursePromise: task.coursePromise,
        firstTaskId: task.id,
        taskIds: [],
        flagship:
          chapter && hasLessons && chapter.flagship.title !== '(執筆中)'
            ? chapter.flagship
            : null,
        lessonCount: chapter ? Object.keys(chapter.lessons).length : 0,
      };
      summaries.set(key, summary);
    }
    summary.taskIds.push(task.id);
  }
  return [...summaries.values()];
}
