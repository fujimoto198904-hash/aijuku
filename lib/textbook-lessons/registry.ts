/**
 * 章レジストリ。課題ID→章キー→正本ファイルの対応だけを持つ純メタデータ。
 * 本文データ本体は読み込まないため、クライアントの検索カタログから安全に参照できる。
 */

import type { TextbookTrackId } from './types';

export const DEPARTMENT_PREFIXES = [
  'MGT',
  'BIZ',
  'SLS',
  'REV',
  'MKT',
  'COM',
  'CS',
  'FIN',
  'HR',
  'LAB',
  'ADM',
  'LEG',
  'PRC',
  'PD',
  'IT',
  'MFG',
  'QA',
  'SCM',
  'CRT',
  'PMO',
] as const;

export const INDUSTRY_PREFIXES = [
  'RTL',
  'FNB',
  'SAL',
  'HSP',
  'TRV',
  'CON',
  'REA',
  'MFD',
  'PRF',
  'EDU',
] as const;

export const GENERATION_PREFIXES = [
  'BOK',
  'NOV',
  'PCT',
  'MNG',
  'BLG',
  'NWS',
  'RPT',
  'IGC',
  'SNS',
  'YTB',
  'SVD',
  'POD',
  'MUS',
  'IMG',
  'CAT',
  'BRD',
  'WEB',
  'ADS',
  'SLD',
  'CRS',
  'GAM',
  'APP',
  'XLS',
] as const;

const prefixTracks = new Map<string, TextbookTrackId>([
  ...DEPARTMENT_PREFIXES.map(
    (prefix) => [prefix, 'department'] as [string, TextbookTrackId],
  ),
  ...INDUSTRY_PREFIXES.map(
    (prefix) => [prefix, 'industry'] as [string, TextbookTrackId],
  ),
  ...GENERATION_PREFIXES.map(
    (prefix) => [prefix, 'generation'] as [string, TextbookTrackId],
  ),
]);

export type ChapterRef = {
  key: string;
  track: TextbookTrackId;
  /** 正本ファイル(リポジトリルートからの相対パス) */
  sourceFile: string;
};

/** 全73章。カタログのコース順(共通20→部署20→業種10→生成23)。 */
export const chapterRefs: readonly ChapterRef[] = [
  ...Array.from({ length: 20 }, (_, index): ChapterRef => {
    const chapter = String(index + 1).padStart(2, '0');
    return {
      key: `common-${chapter}`,
      track: 'common',
      sourceFile: `lib/textbook-lessons/common/chapter-${chapter}.ts`,
    };
  }),
  ...DEPARTMENT_PREFIXES.map(
    (prefix): ChapterRef => ({
      key: `department-${prefix.toLowerCase()}`,
      track: 'department',
      sourceFile: `lib/textbook-lessons/department/${prefix.toLowerCase()}.ts`,
    }),
  ),
  ...INDUSTRY_PREFIXES.map(
    (prefix): ChapterRef => ({
      key: `industry-${prefix.toLowerCase()}`,
      track: 'industry',
      sourceFile: `lib/textbook-lessons/industry/${prefix.toLowerCase()}.ts`,
    }),
  ),
  ...GENERATION_PREFIXES.map(
    (prefix): ChapterRef => ({
      key: `generation-${prefix.toLowerCase()}`,
      track: 'generation',
      sourceFile: `lib/textbook-lessons/generation/${prefix.toLowerCase()}.ts`,
    }),
  ),
];

const chapterRefByKey = new Map(chapterRefs.map((ref) => [ref.key, ref]));

export function findChapterRef(key: string) {
  return chapterRefByKey.get(key);
}

/** 課題IDから章キーを求める。不正なIDはnull。 */
export function chapterKeyForTaskId(taskId: string): string | null {
  const levelMatch = taskId.match(/^Lv\.(\d{2,3})$/);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level < 1 || level > 200) return null;
    const chapter = String(Math.ceil(level / 10)).padStart(2, '0');
    return `common-${chapter}`;
  }
  const prefixMatch = taskId.match(/^([A-Z]{2,5})-(\d{2})$/);
  if (!prefixMatch) return null;
  const [, prefix, numberText] = prefixMatch;
  const track = prefixTracks.get(prefix);
  const number = Number(numberText);
  if (!track || number < 1 || number > 10) return null;
  return `${track}-${prefix.toLowerCase()}`;
}

/** コース内の正式な次課題ID。コース終端(共通Lv.200・専門-10)はnull。 */
export function formalNextTaskIdFor(taskId: string): string | null {
  const levelMatch = taskId.match(/^Lv\.(\d{2,3})$/);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level >= 200) return null;
    return `Lv.${String(level + 1).padStart(2, '0')}`;
  }
  const prefixMatch = taskId.match(/^([A-Z]{2,5})-(\d{2})$/);
  if (!prefixMatch) return null;
  const [, prefix, numberText] = prefixMatch;
  const number = Number(numberText);
  if (number >= 10) return null;
  return `${prefix}-${String(number + 1).padStart(2, '0')}`;
}

/** コース内の直前課題ID。コース先頭ではnull。 */
export function previousTaskIdFor(taskId: string): string | null {
  const levelMatch = taskId.match(/^Lv\.(\d{2,3})$/);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level <= 1 || level > 200) return null;
    return `Lv.${String(level - 1).padStart(2, '0')}`;
  }
  const prefixMatch = taskId.match(/^([A-Z]{2,5})-(\d{2})$/);
  if (!prefixMatch) return null;
  const [, prefix, numberText] = prefixMatch;
  const number = Number(numberText);
  if (!prefixTracks.has(prefix) || number <= 1 || number > 10) return null;
  return `${prefix}-${String(number - 1).padStart(2, '0')}`;
}

/** コース終端(総仕上げ=terminal分岐)を置ける課題か。 */
export function isCourseTerminalTaskId(taskId: string): boolean {
  return formalNextTaskIdFor(taskId) === null;
}

/** 品質見本として人間レビュー文書(サンプル10)へ出力する課題ID。 */
export const REPRESENTATIVE_LESSON_IDS = [
  'Lv.05',
  'Lv.24',
  'IMG-03',
  'XLS-03',
  'SLD-03',
  'Lv.80',
  'SLS-05',
  'Lv.28',
  'APP-04',
  'Lv.180',
] as const;
