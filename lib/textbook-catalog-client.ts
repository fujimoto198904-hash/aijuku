/**
 * クライアント(検索・一覧)用の軽量カタログ。
 *
 * フルカタログ(lib/textbook-catalog.generated.json)には管理用フィールド
 * (sourceFile、lessonDraftSourceFile、contentStatus等)が含まれるため、
 * クライアントへはこの型へ絞って渡す。変換はサーバーコンポーネントで行う。
 */

import type { TextbookTask, TextbookTrack } from '@/lib/textbook-catalog';

export type ClientTextbookTask = {
  id: string;
  track: TextbookTrack;
  trackLabel: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  action: string;
  outcome: string;
  tags: string[];
  hasLessonDraft: boolean;
};

export function toClientTask(task: TextbookTask): ClientTextbookTask {
  return {
    id: task.id,
    track: task.track,
    trackLabel: task.trackLabel,
    courseCode: task.courseCode,
    courseTitle: task.courseTitle,
    title: task.title,
    action: task.action,
    outcome: task.outcome,
    tags: task.tags,
    hasLessonDraft: task.hasLessonDraft,
  };
}
