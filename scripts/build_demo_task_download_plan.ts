/**
 * 730課題ごとに、一つの練習会社と必要ファイルを固定する。
 *
 *   npx tsx scripts/build_demo_task_download_plan.ts
 *   npx tsx scripts/build_demo_task_download_plan.ts --check
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import demoFilesJson from '../lib/demo-data-files.generated.json';
import { textbookCatalog } from '../lib/textbook-catalog';
import {
  demoDownloadAssetKey,
  selectTaskDemoIndustry,
  type DemoDownloadAsset,
  type DemoIndustrySelectionKind,
  type TaskDemoDownloadFile,
  type TaskDemoDownloadPlan,
} from '../lib/textbook-demo-industry';
import { allLessons } from '../lib/textbook-lessons/all';

import type { DemoIndustry } from '../lib/demo-data-catalog';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = join(
  scriptDirectory,
  '..',
  'lib',
  'demo-task-download-plan.generated.json',
);

const knownFiles = new Set(demoFilesJson.files);
const tasks: Record<string, TaskDemoDownloadPlan> = {};
const assetTaskIds = new Map<
  string,
  Omit<DemoDownloadAsset, 'key'> & { taskIds: string[] }
>();
const publicUrlOwners = new Map<string, string>();

const industries: Record<DemoIndustry, number> = {
  salon: 0,
  construction: 0,
  realestate: 0,
};
const selectionKinds: Record<DemoIndustrySelectionKind, number> = {
  exact: 0,
  proxy: 0,
  'course-default': 0,
  'keyword-override': 0,
};

let taskFiles = 0;

function buildDownloadFile(
  industry: DemoIndustry,
  originalPath: string,
): TaskDemoDownloadFile {
  const assetKey = demoDownloadAssetKey(industry, originalPath);
  const extension = extname(originalPath).toLowerCase();
  if (!/^\.[a-z0-9]+$/.test(extension)) {
    throw new Error(`ASCIIの拡張子として扱えないファイルです: ${originalPath}`);
  }
  const publicFile = `${createHash('sha256')
    .update(`${industry}\0${originalPath}`)
    .digest('hex')
    .slice(0, 16)}${extension}`;
  const publicUrl = `/downloads/demo-data/files/${industry}/${publicFile}`;
  const owner = publicUrlOwners.get(publicUrl);
  if (owner && owner !== assetKey) {
    throw new Error(`公開ファイル名が衝突しました: ${owner} / ${assetKey}`);
  }
  publicUrlOwners.set(publicUrl, assetKey);
  return { assetKey, originalPath, publicFile, publicUrl };
}

for (const task of textbookCatalog.tasks) {
  const lesson = allLessons[task.id];
  if (!lesson) throw new Error(`課題本文がありません: ${task.id}`);
  if (tasks[task.id]) throw new Error(`課題IDが重複しています: ${task.id}`);

  const originalPaths = [...new Set(lesson.files)];
  for (const file of originalPaths) {
    if (!knownFiles.has(file)) {
      throw new Error(
        `デモデータに無い参照ファイルです: ${task.id} -> ${file}`,
      );
    }
  }

  const selection = selectTaskDemoIndustry(task);
  const files = originalPaths.map((file) =>
    buildDownloadFile(selection.industry, file),
  );
  tasks[task.id] = { ...selection, files };
  industries[selection.industry] += 1;
  selectionKinds[selection.selectionKind] += 1;
  taskFiles += files.length;

  for (const file of files) {
    const key = file.assetKey;
    const current = assetTaskIds.get(key);
    if (current) {
      current.taskIds.push(task.id);
    } else {
      assetTaskIds.set(key, {
        industry: selection.industry,
        originalPath: file.originalPath,
        publicFile: file.publicFile,
        publicUrl: file.publicUrl,
        taskIds: [task.id],
      });
    }
  }
}

if (Object.keys(tasks).length !== textbookCatalog.total) {
  throw new Error(
    `課題数が合いません: ${Object.keys(tasks).length}/${textbookCatalog.total}`,
  );
}
for (const lessonId of Object.keys(allLessons)) {
  if (!tasks[lessonId])
    throw new Error(`カタログに無い課題本文です: ${lessonId}`);
}

const assets: DemoDownloadAsset[] = [...assetTaskIds.entries()]
  .sort(([left], [right]) => left.localeCompare(right, 'ja'))
  .map(([key, asset]) => ({ key, ...asset }));

const plan = {
  version: 1,
  note: '課題ごとに一つの架空会社と必要ファイルだけを割り当てた直接ダウンロード計画。proxyは同業種ではなく、仕事の流れが近い代替データを表す。',
  stats: {
    tasks: Object.keys(tasks).length,
    taskFiles,
    uniqueAssets: assets.length,
    industries,
    selectionKinds,
  },
  tasks,
  assets,
};

const generated = `${JSON.stringify(plan, null, 1)}\n`;
if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) {
    console.error(
      '課題別ダウンロード計画が正本と違います。`npx tsx scripts/build_demo_task_download_plan.ts`を実行してください。',
    );
    process.exit(1);
  }
  console.log(
    `Demo task download plan is current: ${plan.stats.tasks} tasks / ${plan.stats.uniqueAssets} assets`,
  );
} else {
  writeFileSync(outputPath, generated);
  console.log(
    `Generated demo task download plan: ${plan.stats.tasks} tasks / ${plan.stats.uniqueAssets} assets`,
  );
  console.log(JSON.stringify(plan.stats, null, 2));
}
