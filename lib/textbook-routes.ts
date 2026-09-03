/** Web教科書の画面構成を一か所で管理する。 */

export const textbookGuidePath = '/textbook';
export const textbookSetupPath = '/textbook/setup';
export const textbookPlanGuidePath = `${textbookSetupPath}#plan-guide`;
export const textbookExplorePath = '/textbook/explore';

export function textbookLessonPath(taskId: string): string {
  return `/textbook/lesson/${encodeURIComponent(taskId)}`;
}
