/** Web教科書の料金・Codexマークが全730課題をカバーすることを検査する。 */

import { textbookCatalog } from '../lib/textbook-catalog';
import lessonMetaJson from '../lib/textbook-lesson-meta.generated.json';
import {
  getTextbookAccessProfile,
  hasRecognizedTaskNumber,
} from '../lib/textbook-access';

const lessonMeta = lessonMetaJson as unknown as Record<
  string,
  readonly [string, 'chat' | 'work', number]
>;

const counts = {
  free: 0,
  paidRecommended: 0,
  codexRecommended: 0,
};

const unknownIds: string[] = [];
const freeCodexIds: string[] = [];
const codexOutsideWorkIds: string[] = [];
for (const task of textbookCatalog.tasks) {
  if (!hasRecognizedTaskNumber(task.id)) unknownIds.push(task.id);
  const profile = getTextbookAccessProfile(task);
  if (profile.plan === 'free') counts.free += 1;
  else counts.paidRecommended += 1;
  if (profile.codexRecommended) {
    counts.codexRecommended += 1;
    if (profile.plan === 'free') freeCodexIds.push(task.id);
    if (lessonMeta[task.id]?.[1] !== 'work') codexOutsideWorkIds.push(task.id);
  }
}

if (unknownIds.length > 0) {
  throw new Error(`判定できない課題ID: ${unknownIds.join(', ')}`);
}

const total = counts.free + counts.paidRecommended;
if (total !== textbookCatalog.tasks.length || total !== 730) {
  throw new Error(
    `アクセスマークの網羅数が不正です: ${total}/${textbookCatalog.tasks.length}`,
  );
}

if (freeCodexIds.length > 0) {
  throw new Error(
    `長いCodex向き課題が「無料で始めやすい」になっています: ${freeCodexIds.join(', ')}`,
  );
}

if (codexOutsideWorkIds.length > 0) {
  throw new Error(
    `Codex向き課題のWork代替経路がありません: ${codexOutsideWorkIds.join(', ')}`,
  );
}

const expectedCounts = {
  free: 400,
  paidRecommended: 330,
  codexRecommended: 157,
};

for (const key of Object.keys(expectedCounts) as (keyof typeof counts)[]) {
  if (counts[key] !== expectedCounts[key]) {
    throw new Error(
      `アクセス分類 ${key} の件数が変わりました: ${counts[key]}（期待値 ${expectedCounts[key]}）。分類ルールと案内文を一緒に見直してください。`,
    );
  }
}

console.log(
  `Textbook access marks: ${total} lessons (free-friendly ${counts.free}, paid-recommended ${counts.paidRecommended}, Codex-recommended ${counts.codexRecommended})`,
);
