import catalogJson from '@/lib/textbook-catalog.generated.json';

export type TextbookTrack = 'common' | 'department' | 'industry' | 'generation';

export type TextbookTask = {
  id: string;
  track: TextbookTrack;
  trackLabel: string;
  courseCode: string;
  courseTitle: string;
  coursePromise: string;
  title: string;
  action: string;
  outcome: string;
  tags: string[];
  sourceFile: string;
  /** lesson-ready-local: ローカル正本に詳細本文あり(公開状態は別管理) / outline-only: 設計のみ */
  contentStatus: 'lesson-ready-local' | 'outline-only';
  hasLessonDraft: boolean;
  lessonDraftSourceFile: string | null;
};

export type TextbookTrackSummary = {
  id: TextbookTrack;
  label: string;
  count: number;
};

export type TextbookCatalog = {
  total: number;
  stats: {
    total: number;
    lessonDrafts: number;
    outlines: number;
  };
  tracks: TextbookTrackSummary[];
  tasks: TextbookTask[];
};

export const textbookCatalog = catalogJson as TextbookCatalog;

export const trackDescriptions: Record<TextbookTrack, string> = {
  common: '会話・調査・データ・Web・安全運用を、作品の成長順に選びます。',
  department: '営業・経理・人事など、自分の担当業務から10課題を選びます。',
  industry: '小売・飲食・製造など、現場の一連の仕事を一つにつなぎます。',
  generation:
    '本・SNS・画像・動画・Web・Excelなど、一つの表現や仕事ファイルを磨きます。',
};

export function findTextbookTask(taskId: string) {
  return textbookCatalog.tasks.find((task) => task.id === taskId);
}
