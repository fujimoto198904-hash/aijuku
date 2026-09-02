/**
 * クライアントの絞り込み(作業画面・材料の渡し方・時間の目安)用に、
 * 章別正本から軽量メタJSONを生成する。
 *
 *   npx tsx scripts/build_lesson_meta.ts          … 生成
 *   npx tsx scripts/build_lesson_meta.ts --check  … 同期検査
 *
 * 出力: lib/textbook-lesson-meta.generated.json
 *   { "<課題ID>": [inputMethod, recommendedMode, 目安分(上限)] }
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { allChapters } from '../lib/textbook-lessons/all';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = join(
  scriptDirectory,
  '..',
  'lib',
  'textbook-lesson-meta.generated.json',
);

function upperMinutes(duration: string): number | null {
  const numbers = [...duration.matchAll(/(\d+)\s*分/g)].map((match) =>
    Number(match[1]),
  );
  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}

const meta: Record<string, [string, string, number | null]> = {};
for (const chapter of allChapters) {
  for (const [lessonId, lesson] of Object.entries(chapter.lessons)) {
    meta[lessonId] = [
      lesson.inputMethod,
      lesson.recommendedMode,
      upperMinutes(lesson.duration),
    ];
  }
}

const generated = `${JSON.stringify(meta, null, 1)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) {
    console.error(
      'レッスンメタが正本と違います。`npm run build:lessons`を実行してください。',
    );
    process.exit(1);
  }
  console.log(`Lesson meta is current: ${Object.keys(meta).length} lessons`);
} else {
  writeFileSync(outputPath, generated);
  console.log(
    `Generated lesson meta for ${Object.keys(meta).length} lessons at ${outputPath}`,
  );
}
