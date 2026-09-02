import type { DemoIndustry } from '@/lib/demo-data-catalog';
import type { TextbookTask, TextbookTrack } from '@/lib/textbook-catalog';

export type DemoIndustrySelectionKind =
  | 'exact'
  | 'proxy'
  | 'course-default'
  | 'keyword-override';

export type TaskDemoIndustrySelection = {
  industry: DemoIndustry;
  selectionKind: DemoIndustrySelectionKind;
  reason: string;
};

export type TaskDemoDownloadFile = {
  assetKey: string;
  originalPath: string;
  publicFile: string;
  publicUrl: string;
};

export type TaskDemoDownloadPlan = TaskDemoIndustrySelection & {
  files: readonly TaskDemoDownloadFile[];
};

export type DemoDownloadAsset = {
  key: string;
  industry: DemoIndustry;
  originalPath: string;
  publicFile: string;
  publicUrl: string;
  taskIds: readonly string[];
};

export type DemoTaskDownloadPlan = {
  version: number;
  note: string;
  stats: {
    tasks: number;
    taskFiles: number;
    uniqueAssets: number;
    industries: Record<DemoIndustry, number>;
    selectionKinds: Record<DemoIndustrySelectionKind, number>;
  };
  tasks: Readonly<Record<string, TaskDemoDownloadPlan>>;
  assets: readonly DemoDownloadAsset[];
};

type IndustrySelectionTask = Pick<
  TextbookTask,
  'id' | 'track' | 'courseTitle' | 'title' | 'action' | 'outcome'
>;

const INDUSTRY_LABELS: Record<DemoIndustry, string> = {
  salon: '美容室',
  construction: '建設業',
  realestate: '不動産会社',
};

const COMMON_CHAPTER_DEFAULTS: readonly DemoIndustry[] = [
  'salon',
  'salon',
  'construction',
  'realestate',
  'construction',
  'construction',
  'construction',
  'salon',
  'salon',
  'construction',
  'construction',
  'realestate',
  'salon',
  'construction',
  'salon',
  'realestate',
  'construction',
  'construction',
  'construction',
  'construction',
];

const DEPARTMENT_DEFAULTS: Readonly<Record<string, DemoIndustry>> = {
  MGT: 'construction',
  BIZ: 'construction',
  SLS: 'realestate',
  REV: 'realestate',
  MKT: 'salon',
  COM: 'salon',
  CS: 'salon',
  FIN: 'realestate',
  HR: 'construction',
  LAB: 'construction',
  ADM: 'construction',
  LEG: 'realestate',
  PRC: 'construction',
  PD: 'salon',
  IT: 'construction',
  MFG: 'construction',
  QA: 'construction',
  SCM: 'construction',
  CRT: 'salon',
  PMO: 'construction',
};

const INDUSTRY_DEFAULTS: Readonly<Record<string, DemoIndustry>> = {
  RTL: 'salon',
  FNB: 'salon',
  SAL: 'salon',
  HSP: 'realestate',
  TRV: 'realestate',
  CON: 'construction',
  REA: 'realestate',
  MFD: 'construction',
  PRF: 'realestate',
  EDU: 'salon',
};

const GENERATION_DEFAULTS: Readonly<Record<string, DemoIndustry>> = {
  BOK: 'realestate',
  NOV: 'realestate',
  PCT: 'salon',
  MNG: 'salon',
  BLG: 'salon',
  NWS: 'salon',
  RPT: 'construction',
  IGC: 'salon',
  SNS: 'salon',
  YTB: 'salon',
  SVD: 'salon',
  POD: 'salon',
  MUS: 'salon',
  IMG: 'salon',
  CAT: 'salon',
  BRD: 'salon',
  WEB: 'salon',
  ADS: 'salon',
  SLD: 'construction',
  CRS: 'salon',
  GAM: 'salon',
  APP: 'construction',
  XLS: 'construction',
};

const EXACT_INDUSTRY_CODES = new Set(['SAL', 'CON', 'REA']);

const STRONG_INDUSTRY_WORDS: Readonly<Record<DemoIndustry, readonly string[]>> =
  {
    salon: [
      '美容',
      'サロン',
      '施術',
      'スタイリスト',
      'ヘア',
      'カット',
      'カラーリング',
      'ヘッドスパ',
    ],
    construction: [
      '建設',
      '工事',
      '施工',
      '図面',
      '資材',
      '工場',
      '製造',
      '生産設備',
      'BOM',
    ],
    realestate: [
      '不動産',
      '物件',
      '内見',
      '賃貸',
      '売買',
      '入居',
      '家賃',
      '敷金',
      '礼金',
      'オーナー',
      '不動産仲介',
    ],
  };

function taskCode(taskId: string) {
  return taskId.split('-')[0] ?? '';
}

function requiredDefault(
  defaults: Readonly<Record<string, DemoIndustry>>,
  code: string,
  track: TextbookTrack,
) {
  const industry = defaults[code];
  if (!industry) {
    throw new Error(`未登録の${track}コースです: ${code}`);
  }
  return industry;
}

function getCourseDefault(task: IndustrySelectionTask): DemoIndustry {
  if (task.track === 'common') {
    const level = Number(task.id.replace('Lv.', ''));
    const chapterIndex = Math.floor((level - 1) / 10);
    const industry = COMMON_CHAPTER_DEFAULTS[chapterIndex];
    if (!Number.isInteger(level) || !industry) {
      throw new Error(`未登録の共通編課題です: ${task.id}`);
    }
    return industry;
  }

  const code = taskCode(task.id);
  if (task.track === 'department') {
    return requiredDefault(DEPARTMENT_DEFAULTS, code, task.track);
  }
  if (task.track === 'generation') {
    return requiredDefault(GENERATION_DEFAULTS, code, task.track);
  }
  return requiredDefault(INDUSTRY_DEFAULTS, code, task.track);
}

function findStrongKeywordOverride(
  task: IndustrySelectionTask,
  fallback: DemoIndustry,
) {
  // コース名は既定値で反映済み。個別課題の本文だけを見る。
  const text = `${task.title} ${task.action} ${task.outcome}`;
  const matches = (
    Object.entries(STRONG_INDUSTRY_WORDS) as [DemoIndustry, readonly string[]][]
  )
    .map(([industry, words]) => ({
      industry,
      words: words.filter((word) => text.includes(word)),
    }))
    .filter((candidate) => candidate.words.length > 0)
    .sort((left, right) => right.words.length - left.words.length);

  const best = matches[0];
  if (!best || best.industry === fallback) return null;
  const runnerUp = matches[1];
  if (runnerUp && runnerUp.words.length === best.words.length) return null;
  return best;
}

/**
 * 課題ごとに一つの練習会社を決める純粋関数。
 * 業種別はコース単位で固定し、他トラックだけ強い業種固有語による上書きを許す。
 */
export function selectTaskDemoIndustry(
  task: IndustrySelectionTask,
): TaskDemoIndustrySelection {
  const fallback = getCourseDefault(task);
  const code = taskCode(task.id);

  if (task.track === 'industry') {
    const exact = EXACT_INDUSTRY_CODES.has(code);
    return {
      industry: fallback,
      selectionKind: exact ? 'exact' : 'proxy',
      reason: exact
        ? `「${task.courseTitle}」専用の${INDUSTRY_LABELS[fallback]}デモを使用`
        : `「${task.courseTitle}」専用データは未収録のため、仕事の流れが近い${INDUSTRY_LABELS[fallback]}デモを代替使用`,
    };
  }

  const override = findStrongKeywordOverride(task, fallback);
  if (override) {
    return {
      industry: override.industry,
      selectionKind: 'keyword-override',
      reason: `課題固有語「${override.words.join('・')}」を優先し、${INDUSTRY_LABELS[override.industry]}デモを使用`,
    };
  }

  return {
    industry: fallback,
    selectionKind: 'course-default',
    reason: `「${task.courseTitle}」の中心作業に合わせ、${INDUSTRY_LABELS[fallback]}デモを使用`,
  };
}

export function demoDownloadAssetKey(industry: DemoIndustry, file: string) {
  return `${industry}:${file}`;
}
