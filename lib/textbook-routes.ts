/** Web教科書の画面構成を一か所で管理する。 */

export const textbookGuidePath = '/textbook';
export const textbookSetupPath = '/textbook/setup';
export const textbookPlanGuidePath = `${textbookSetupPath}#plan-guide`;
export const textbookExplorePath = '/textbook/explore';
export const textbookColumnsPath = '/textbook/columns';

export function textbookColumnPath(slug: string): string {
  return `${textbookColumnsPath}/${encodeURIComponent(slug)}`;
}

export function textbookLessonPath(taskId: string): string {
  return `/textbook/lesson/${encodeURIComponent(taskId)}`;
}

/** 課題を引き継いで、保存・完了・メモ・作品の入口を開く。まだ書き込みは行わない。 */
export function textbookRecordPath(taskId: string): string {
  return `/mypage?task=${encodeURIComponent(taskId)}#learning`;
}

export function textbookWorkRecordPath(taskId: string): string {
  return `/mypage?task=${encodeURIComponent(taskId)}#skill-record`;
}

export function textbookQuestionPath(taskId: string): string {
  return `/community/new?kind=question&task=${encodeURIComponent(taskId)}`;
}
