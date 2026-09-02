/**
 * 章単位の遅延読み込み。クライアントは選択した課題の章チャンクだけを取得する。
 */

import type { TextbookChapter } from './types';
import { chapterKeyForTaskId } from './registry';

const chapterLoaders: Record<
  string,
  () => Promise<{ chapter: TextbookChapter }>
> = {
  'common-01': () => import('./common/chapter-01'),
  'common-02': () => import('./common/chapter-02'),
  'common-03': () => import('./common/chapter-03'),
  'common-04': () => import('./common/chapter-04'),
  'common-05': () => import('./common/chapter-05'),
  'common-06': () => import('./common/chapter-06'),
  'common-07': () => import('./common/chapter-07'),
  'common-08': () => import('./common/chapter-08'),
  'common-09': () => import('./common/chapter-09'),
  'common-10': () => import('./common/chapter-10'),
  'common-11': () => import('./common/chapter-11'),
  'common-12': () => import('./common/chapter-12'),
  'common-13': () => import('./common/chapter-13'),
  'common-14': () => import('./common/chapter-14'),
  'common-15': () => import('./common/chapter-15'),
  'common-16': () => import('./common/chapter-16'),
  'common-17': () => import('./common/chapter-17'),
  'common-18': () => import('./common/chapter-18'),
  'common-19': () => import('./common/chapter-19'),
  'common-20': () => import('./common/chapter-20'),
  'department-mgt': () => import('./department/mgt'),
  'department-biz': () => import('./department/biz'),
  'department-sls': () => import('./department/sls'),
  'department-rev': () => import('./department/rev'),
  'department-mkt': () => import('./department/mkt'),
  'department-com': () => import('./department/com'),
  'department-cs': () => import('./department/cs'),
  'department-fin': () => import('./department/fin'),
  'department-hr': () => import('./department/hr'),
  'department-lab': () => import('./department/lab'),
  'department-adm': () => import('./department/adm'),
  'department-leg': () => import('./department/leg'),
  'department-prc': () => import('./department/prc'),
  'department-pd': () => import('./department/pd'),
  'department-it': () => import('./department/it'),
  'department-mfg': () => import('./department/mfg'),
  'department-qa': () => import('./department/qa'),
  'department-scm': () => import('./department/scm'),
  'department-crt': () => import('./department/crt'),
  'department-pmo': () => import('./department/pmo'),
  'industry-rtl': () => import('./industry/rtl'),
  'industry-fnb': () => import('./industry/fnb'),
  'industry-sal': () => import('./industry/sal'),
  'industry-hsp': () => import('./industry/hsp'),
  'industry-trv': () => import('./industry/trv'),
  'industry-con': () => import('./industry/con'),
  'industry-rea': () => import('./industry/rea'),
  'industry-mfd': () => import('./industry/mfd'),
  'industry-prf': () => import('./industry/prf'),
  'industry-edu': () => import('./industry/edu'),
  'generation-bok': () => import('./generation/bok'),
  'generation-nov': () => import('./generation/nov'),
  'generation-pct': () => import('./generation/pct'),
  'generation-mng': () => import('./generation/mng'),
  'generation-blg': () => import('./generation/blg'),
  'generation-nws': () => import('./generation/nws'),
  'generation-rpt': () => import('./generation/rpt'),
  'generation-igc': () => import('./generation/igc'),
  'generation-sns': () => import('./generation/sns'),
  'generation-ytb': () => import('./generation/ytb'),
  'generation-svd': () => import('./generation/svd'),
  'generation-pod': () => import('./generation/pod'),
  'generation-mus': () => import('./generation/mus'),
  'generation-img': () => import('./generation/img'),
  'generation-cat': () => import('./generation/cat'),
  'generation-brd': () => import('./generation/brd'),
  'generation-web': () => import('./generation/web'),
  'generation-ads': () => import('./generation/ads'),
  'generation-sld': () => import('./generation/sld'),
  'generation-crs': () => import('./generation/crs'),
  'generation-gam': () => import('./generation/gam'),
  'generation-app': () => import('./generation/app'),
  'generation-xls': () => import('./generation/xls'),
};

/** 検査スクリプトがregistry/allとの登録ずれを検出するための軽量なキー一覧。 */
export const chapterLoaderKeys: readonly string[] = Object.keys(chapterLoaders);

const chapterCache = new Map<string, Promise<TextbookChapter>>();

export function loadChapter(chapterKey: string): Promise<TextbookChapter> {
  const cached = chapterCache.get(chapterKey);
  if (cached) return cached;
  const loader = chapterLoaders[chapterKey];
  if (!loader) {
    return Promise.reject(new Error(`Unknown chapter: ${chapterKey}`));
  }
  const loading = loader()
    .then((module) => module.chapter)
    .catch((error: unknown) => {
      // 失敗済みPromiseを残すと、以後の呼び出しが永続的に同じ失敗を返す。
      chapterCache.delete(chapterKey);
      throw error;
    });
  chapterCache.set(chapterKey, loading);
  return loading;
}

export async function loadLesson(taskId: string) {
  const chapterKey = chapterKeyForTaskId(taskId);
  if (!chapterKey) return null;
  const chapter = await loadChapter(chapterKey);
  return chapter.lessons[taskId] ?? null;
}
