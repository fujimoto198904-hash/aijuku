import downloadPlanJson from '@/lib/demo-task-download-plan.generated.json';
import type { DemoTaskDownloadPlan } from '@/lib/textbook-demo-industry';

export const demoTaskDownloadPlan = downloadPlanJson as DemoTaskDownloadPlan;

/** 生成済み計画から、表示中の1課題に必要な情報だけを取得する。 */
export function getTaskDemoDownloadPlan(taskId: string) {
  return demoTaskDownloadPlan.tasks[taskId] ?? null;
}
