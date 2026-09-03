import {
  getChatgptColumn,
  getChatgptColumnCategory,
} from '@/lib/chatgpt-columns';
import type { TextbookTask } from '@/lib/textbook-catalog';
import type { TextbookLesson } from '@/lib/textbook-lessons/types';

export type ChatgptColumnRecommendation = {
  slug: string;
  title: string;
  lead: string;
  categoryLabel: string;
};

const CODE_START_TASK_IDS = new Set([
  'Lv.61',
  'Lv.76',
  'WEB-06',
  'GAM-03',
  'APP-03',
]);

const BROWSER_TASK_IDS = new Set([
  'Lv.61',
  'Lv.70',
  'Lv.76',
  'Lv.77',
  'Lv.79',
  'Lv.80',
  'WEB-06',
  'WEB-09',
  'WEB-10',
  'GAM-03',
  'GAM-06',
  'GAM-10',
]);

const WEB_RESEARCH_TASK_IDS = new Set([
  'Lv.22',
  'Lv.23',
  'Lv.24',
  'Lv.27',
  'Lv.28',
  'Lv.30',
  'BOK-04',
  'BLG-09',
  'RPT-02',
  'RPT-03',
  'RPT-04',
  'RPT-09',
]);

const FILE_PROMPT_TASK_IDS = new Set([
  'Lv.02',
  'Lv.03',
  'Lv.05',
  'Lv.31',
  'Lv.41',
  'Lv.51',
  'Lv.56',
  'Lv.137',
  'SLD-01',
  'SLD-03',
  'XLS-01',
  'XLS-03',
]);

const MODEL_CHOICE_TASK_IDS = new Set([
  'RPT-01',
  'IMG-01',
  'YTB-01',
  'SVD-01',
  'POD-01',
  'MUS-01',
  'WEB-01',
  'GAM-01',
  'APP-01',
  'XLS-01',
]);

const IMAGE_INPUT_TASK_IDS = new Set([
  'Lv.56',
  'IMG-01',
  'IMG-02',
  'IMG-03',
  'CAT-01',
  'CAT-02',
  'CAT-03',
  'BRD-03',
  'BRD-04',
]);

const REPOSITORY_TASK_IDS = new Set([
  ...CODE_START_TASK_IDS,
  'Lv.69',
  'Lv.79',
  'WEB-08',
  'WEB-09',
  'GAM-08',
  'GAM-09',
  'APP-09',
]);

const VERSION_TASK_IDS = new Set([
  'Lv.69',
  'Lv.79',
  'Lv.109',
  'Lv.138',
  'Lv.176',
  'Lv.179',
  'WEB-08',
  'WEB-09',
  'GAM-08',
  'GAM-09',
  'APP-09',
]);

const REVIEW_TASK_IDS = new Set([
  'Lv.79',
  'Lv.109',
  'Lv.139',
  'Lv.171',
  'Lv.173',
  'Lv.174',
  'Lv.179',
  'WEB-09',
  'GAM-09',
  'APP-09',
]);

const LOCAL_STATE_TASK_IDS = new Set([
  'Lv.181',
  'WEB-06',
  'WEB-10',
  'GAM-10',
  'APP-06',
]);

const LOCAL_CLOUD_TASK_IDS = new Set([
  'Lv.181',
  'Lv.191',
  'Lv.200',
  'WEB-10',
  'GAM-10',
  'APP-06',
  'APP-07',
]);

const APPROVAL_TASK_IDS = new Set([
  'Lv.174',
  'Lv.180',
  'Lv.181',
  'Lv.191',
  'APP-07',
]);

const FULL_ACCESS_RISK_TASK_IDS = new Set(['Lv.174', 'Lv.180', 'APP-07']);

const API_TASK_IDS = new Set([
  'Lv.147',
  'Lv.152',
  'Lv.164',
  'Lv.184',
  'Lv.195',
  'Lv.196',
  'Lv.200',
  'IT-07',
  'PMO-07',
]);

const SKILL_TASK_IDS = new Set([
  'Lv.10',
  'Lv.28',
  'Lv.30',
  'Lv.191',
  'Lv.200',
  'WEB-08',
  'CRS-08',
]);

const CREATE_SKILL_TASK_IDS = new Set(['Lv.10', 'Lv.30', 'WEB-08', 'CRS-08']);

const COMPUTER_USE_TASK_IDS = new Set([
  'Lv.56',
  'SLD-03',
  'XLS-01',
  'XLS-03',
  'WEB-06',
  'GAM-03',
  'APP-06',
]);

const CREATED_FILE_PREVIEW_TASK_IDS = new Set([
  'Lv.61',
  'Lv.76',
  'SLD-03',
  'XLS-01',
  'XLS-03',
  'WEB-06',
  'GAM-03',
  'APP-03',
]);

const PUBLIC_URL_TASK_IDS = new Set([
  'Lv.80',
  'Lv.181',
  'WEB-10',
  'GAM-10',
  'APP-08',
  'APP-10',
]);

const CONSEQUENTIAL_ACTION_TASK_IDS = new Set([
  'Lv.38',
  'Lv.78',
  'Lv.120',
  'Lv.140',
  'Lv.146',
  'Lv.150',
  'Lv.160',
  'Lv.170',
  'Lv.180',
  'Lv.190',
  'Lv.200',
  'NWS-10',
  'ADS-10',
  'WEB-10',
  'GAM-10',
  'APP-10',
]);

const CONNECTOR_TASK_IDS = new Set([
  'Lv.38',
  'Lv.147',
  'Lv.165',
  'Lv.195',
  'IT-07',
  'PMO-07',
]);

const SAFE_ATTACHMENT_TASK_IDS = new Set(['Lv.02', 'Lv.31', 'Lv.41', 'Lv.137']);

const IMAGE_INPUT_VS_GENERATION_TASK_IDS = new Set([
  'IMG-01',
  'IMG-02',
  'CAT-01',
  'BRD-03',
]);

const FACT_CHECK_TASK_IDS = new Set([
  'Lv.43',
  'Lv.44',
  'Lv.46',
  'Lv.49',
  'RPT-09',
  'BOK-09',
  'BLG-09',
]);

const BRANCH_TASK_IDS = new Set(['Lv.179', 'WEB-09', 'APP-09']);
const GITHUB_TASK_IDS = new Set(['WEB-10', 'GAM-10', 'APP-08']);
const APPROVAL_MODE_TASK_IDS = new Set(['Lv.180', 'Lv.181', 'APP-07']);
const REASONING_TASK_IDS = new Set(['RPT-02', 'RPT-04', 'SLD-01', 'XLS-01']);
const MEDIA_USAGE_TASK_IDS = new Set([
  'IMG-02',
  'YTB-02',
  'SVD-02',
  'POD-02',
  'MUS-02',
]);
const SKILL_PLUGIN_TASK_IDS = new Set(['Lv.147', 'Lv.195', 'IT-07']);
const API_BILLING_TASK_IDS = new Set(['Lv.152', 'Lv.184', 'Lv.196', 'Lv.200']);

function coursePosition(taskId: string): number | null {
  const common = /^Lv\.(\d{1,3})$/.exec(taskId);
  if (common) return ((Number(common[1]) - 1) % 10) + 1;

  const specialist = /^[A-Z]{2,5}-(\d{2})$/.exec(taskId);
  return specialist ? Number(specialist[1]) : null;
}

function lessonText(task: TextbookTask, lesson: TextbookLesson): string {
  return [
    task.title,
    task.action,
    task.outcome,
    ...task.tags,
    lesson.deliverable,
    lesson.carryIn ?? '',
    lesson.firstWord,
    ...lesson.tryActions,
    ...lesson.mistakes,
    lesson.application,
  ].join('\n');
}

/**
 * 課題を始める前に読む価値が高いコラムだけを返す。
 *
 * `recommendedMode=work` や `inputMethod=attach` は大半の課題に当てはまるため、
 * それだけを条件にしない。課題ID・章内の導入位置・明示的な機能語を優先し、
 * 同じ案内を730ページへばらまかない。
 */
export function getRecommendedChatgptColumns(
  task: TextbookTask,
  lesson: TextbookLesson,
): ChatgptColumnRecommendation[] {
  const candidates = new Map<string, number>();
  const position = coursePosition(task.id);
  const text = lessonText(task, lesson);
  const tags = new Set(task.tags);

  const add = (slug: string, score: number) => {
    candidates.set(slug, Math.max(candidates.get(slug) ?? 0, score));
  };

  // 最初の入口。専門コースから始める人にも一度だけ基本を見せる。
  if (task.id === 'Lv.01') {
    add('chat-work-codex', 120);
    add('prompt-basics', 115);
    add('free-plan-basics', 80);
  } else if (position === 1) {
    add(
      lesson.inputMethod === 'none' ? 'prompt-basics' : 'prompt-with-files',
      35,
    );
    if (lesson.recommendedMode === 'work') add('project-vs-chat', 30);
  }

  if (FILE_PROMPT_TASK_IDS.has(task.id)) add('prompt-with-files', 82);
  if (task.id === 'Lv.05') add('prompt-four-parts', 90);
  if (SAFE_ATTACHMENT_TASK_IDS.has(task.id)) {
    add('attach-files-safely', 84);
  }

  // 各10問コースの安全確認回。固有のコラムがある時はそちらを優先する。
  if (position === 9) add('verify-output', 42);
  if (FACT_CHECK_TASK_IDS.has(task.id)) {
    add('verify-output', 85);
  }

  if (WEB_RESEARCH_TASK_IDS.has(task.id)) {
    add('web-search-vs-browser', 88);
    add('web-search-basics', 72);
  }
  if (BROWSER_TASK_IDS.has(task.id)) add('browser-basics', 76);
  if (COMPUTER_USE_TASK_IDS.has(task.id)) add('computer-use-basics', 72);
  if (CREATED_FILE_PREVIEW_TASK_IDS.has(task.id)) {
    add('preview-created-files', 88);
  }

  // 「アクセス権」は業務アプリ内の権限と混同しないよう、Codexを開く課題だけ。
  if (CODE_START_TASK_IDS.has(task.id)) {
    add('permission-menu', 105);
    add('local-project', 95);
    add('repository-basics', 88);
  }
  if (REPOSITORY_TASK_IDS.has(task.id)) add('repository-basics', 70);
  if (VERSION_TASK_IDS.has(task.id)) add('commit-basics', 82);
  if (REVIEW_TASK_IDS.has(task.id)) add('codex-review', 86);
  if (BRANCH_TASK_IDS.has(task.id)) {
    add('branch-basics', 78);
    add('worktree-basics', 68);
  }
  if (GITHUB_TASK_IDS.has(task.id)) {
    add('github-basics', 72);
    add('github-connect', 55);
  }
  if (REVIEW_TASK_IDS.has(task.id)) add('ai-review-needs-tests', 88);

  if (LOCAL_STATE_TASK_IDS.has(task.id)) add('local-is-not-offline', 78);
  if (LOCAL_CLOUD_TASK_IDS.has(task.id)) add('local-worktree-cloud', 84);
  if (PUBLIC_URL_TASK_IDS.has(task.id)) add('localhost-vs-public-url', 90);
  if (APPROVAL_TASK_IDS.has(task.id)) add('sandbox-vs-approval', 92);
  if (APPROVAL_MODE_TASK_IDS.has(task.id)) {
    add('approval-mode', 86);
  }
  if (FULL_ACCESS_RISK_TASK_IDS.has(task.id)) add('full-access-risk', 98);

  if (MODEL_CHOICE_TASK_IDS.has(task.id)) add('model-vs-reasoning', 66);
  if (REASONING_TASK_IDS.has(task.id)) {
    add('choose-reasoning', 72);
  }
  if (IMAGE_INPUT_TASK_IDS.has(task.id)) add('image-input-tips', 80);
  if (IMAGE_INPUT_VS_GENERATION_TASK_IDS.has(task.id)) {
    add('image-input-vs-generation', 76);
  }
  if (MEDIA_USAGE_TASK_IDS.has(task.id)) {
    add('usage-dashboard', 62);
  }

  // 定期実行タグは34課題だけの明確な意味タグなので利用できる。
  if (tags.has('定期実行')) {
    add('schedule-basics', 102);
    add('test-before-schedule', 96);
    if (/ローカル|手元|フォルダ|同じWork/.test(text)) {
      add('schedule-local', 94);
    }
    if (/Web|ウェブ|ニュース|記事|URL|クラウド/i.test(text)) {
      add('schedule-web', 94);
    }
  }
  if (task.id === 'Lv.28') {
    add('schedule-web', 108);
    add('test-before-schedule', 106);
  }

  if (SKILL_TASK_IDS.has(task.id)) add('skill-basics', 74);
  if (CREATE_SKILL_TASK_IDS.has(task.id)) add('create-a-skill', 83);
  if (API_TASK_IDS.has(task.id)) {
    add('plugin-basics', 64);
    add('mcp-basics', 72);
    add('plugin-safety', 70);
  }
  if (CONNECTOR_TASK_IDS.has(task.id)) add('connector-basics', 82);
  if (SKILL_PLUGIN_TASK_IDS.has(task.id)) {
    add('skill-vs-plugin', 78);
  }
  if (API_BILLING_TASK_IDS.has(task.id)) {
    add('chatgpt-vs-api-billing', 88);
  }
  if (CONSEQUENTIAL_ACTION_TASK_IDS.has(task.id)) {
    add('confirm-consequential-actions', 84);
  }

  const recommendations: ChatgptColumnRecommendation[] = [];
  const selectedCategories = new Set<string>();
  const sortedCandidates = [...candidates.entries()].sort(
    ([slugA, scoreA], [slugB, scoreB]) => {
      if (scoreA !== scoreB) return scoreB - scoreA;
      return slugA.localeCompare(slugB);
    },
  );

  for (const [slug] of sortedCandidates) {
    const column = getChatgptColumn(slug);
    if (!column || selectedCategories.has(column.category)) continue;
    const category = getChatgptColumnCategory(column.category);
    recommendations.push({
      slug: column.slug,
      title: column.title,
      lead: column.lead,
      categoryLabel: category?.label ?? 'ChatGPT',
    });
    selectedCategories.add(column.category);
    if (recommendations.length === 2) break;
  }

  return recommendations;
}
