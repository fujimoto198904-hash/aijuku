/** ChatGPTコラムが100本そろい、リンク切れのない正本になっていることを検査する。 */

import assert from 'node:assert/strict';

import {
  chatgptColumnCategories,
  chatgptColumns,
  chatgptColumnSources,
  getChatgptColumn,
  getRelatedChatgptColumns,
} from '../lib/chatgpt-columns';
import { getRecommendedChatgptColumns } from '../lib/chatgpt-column-recommendations';
import { textbookCatalog } from '../lib/textbook-catalog';
import { loadLesson } from '../lib/textbook-lessons/loader';

assert.equal(chatgptColumnCategories.length, 10, 'カテゴリは10個にします');
assert.equal(chatgptColumns.length, 100, 'コラムは100本必要です');

const categoryIds = new Set(chatgptColumnCategories.map((item) => item.id));
const sourceIds = new Set(chatgptColumnSources.map((item) => item.id));
const slugs = new Set<string>();
const counts = new Map<string, number>();

chatgptColumns.forEach((column, index) => {
  assert.equal(
    column.id,
    index + 1,
    `コラム番号が連番ではありません: ${column.slug}`,
  );
  assert.match(
    column.slug,
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    `slugが不正です: ${column.slug}`,
  );
  assert.equal(
    slugs.has(column.slug),
    false,
    `slugが重複しています: ${column.slug}`,
  );
  slugs.add(column.slug);
  assert.equal(
    categoryIds.has(column.category),
    true,
    `存在しないカテゴリです: ${column.slug}`,
  );
  counts.set(column.category, (counts.get(column.category) ?? 0) + 1);
  assert.equal(column.steps.length, 3, `手順は3つにします: ${column.slug}`);

  for (const [label, value] of [
    ['title', column.title],
    ['lead', column.lead],
    ['answer', column.answer],
    ['explanation', column.explanation],
    ['example', column.example],
    ['caution', column.caution],
  ] as const) {
    assert.ok(value.trim().length > 0, `${label}が空です: ${column.slug}`);
  }

  assert.ok(
    column.sourceIds.length > 0,
    `公式資料がありません: ${column.slug}`,
  );
  for (const sourceId of column.sourceIds) {
    assert.equal(
      sourceIds.has(sourceId),
      true,
      `存在しない公式資料です: ${column.slug}/${sourceId}`,
    );
  }
  assert.equal(
    getChatgptColumn(column.slug)?.id,
    column.id,
    `slug検索に失敗しました: ${column.slug}`,
  );

  const related = getRelatedChatgptColumns(column, 3);
  assert.ok(related.length > 0, `関連記事がありません: ${column.slug}`);
  assert.equal(
    related.some((item) => item.slug === column.slug),
    false,
    `関連記事に自分自身が含まれています: ${column.slug}`,
  );
});

for (const category of chatgptColumnCategories) {
  assert.equal(counts.get(category.id), 10, `${category.label}は10本必要です`);
}

const requiredTopics = [
  'アクセス権',
  'GitHub',
  'スキル',
  'モデル',
  'スケジュール',
  'ローカル',
  'リポジトリ',
];
for (const topic of requiredTopics) {
  assert.ok(
    chatgptColumns.some((column) =>
      `${column.title}${column.lead}`.includes(topic),
    ),
    `依頼されたテーマが見つかりません: ${topic}`,
  );
}

let lessonsWithColumns = 0;
let recommendationCount = 0;
const recommendedSlugs = new Set<string>();
const recommendationsByTask = new Map<string, readonly string[]>();
for (const task of textbookCatalog.tasks) {
  const lesson = await loadLesson(task.id);
  assert.ok(lesson, `本文がないためコラム推薦を検査できません: ${task.id}`);
  const recommendations = getRecommendedChatgptColumns(task, lesson);
  assert.ok(recommendations.length <= 2, `コラム推薦が多すぎます: ${task.id}`);
  assert.equal(
    new Set(recommendations.map((item) => item.slug)).size,
    recommendations.length,
    `同じコラムを重ねて表示しています: ${task.id}`,
  );
  if (recommendations.length > 0) lessonsWithColumns += 1;
  recommendationCount += recommendations.length;
  recommendationsByTask.set(
    task.id,
    recommendations.map((item) => item.slug),
  );
  for (const item of recommendations) {
    recommendedSlugs.add(item.slug);
    assert.ok(
      getChatgptColumn(item.slug),
      `推薦先がありません: ${task.id}/${item.slug}`,
    );
  }
}

assert.ok(
  lessonsWithColumns >= 50,
  `コラムの教材連携が少なすぎます: ${lessonsWithColumns}課題`,
);
assert.ok(
  recommendedSlugs.size >= 15,
  `推薦されるコラムの種類が少なすぎます: ${recommendedSlugs.size}本`,
);
assert.ok(
  recommendationsByTask.get('Lv.61')?.includes('permission-menu'),
  'Codex入門にアクセス権コラムがありません',
);
assert.ok(
  recommendationsByTask.get('Lv.28')?.includes('schedule-web'),
  '定期実行入門にスケジュールコラムがありません',
);

console.log(
  `ChatGPT columns: ${chatgptColumns.length} articles / ${chatgptColumnCategories.length} categories / ${chatgptColumnSources.length} official sources / ${recommendationCount} links on ${lessonsWithColumns} lessons`,
);
