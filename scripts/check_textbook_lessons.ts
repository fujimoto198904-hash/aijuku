/**
 * 教科書本文(全730課題)の正本検査と、人間レビュー用サンプル10文書の生成。
 *
 * 使い方:
 *   npx tsx scripts/check_textbook_lessons.ts                 … 全体検査(730件そろうまでは不足も失敗として数える)
 *   npx tsx scripts/check_textbook_lessons.ts --chapter <key> … 1章だけ検査(執筆中の部分検査用)
 *   npx tsx scripts/check_textbook_lessons.ts --write         … 検査後、サンプル10のMarkdownを再生成
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { allChapters } from '../lib/textbook-lessons/all';
import { chapterLoaderKeys } from '../lib/textbook-lessons/loader';
import {
  REPRESENTATIVE_LESSON_IDS,
  chapterKeyForTaskId,
  chapterRefs,
  formalNextTaskIdFor,
  isCourseTerminalTaskId,
} from '../lib/textbook-lessons/registry';
import type {
  TextbookChapter,
  TextbookLesson,
} from '../lib/textbook-lessons/types';

type CatalogTask = {
  id: string;
  track: string;
  courseCode: string;
  title: string;
  hasLessonDraft: boolean;
};

type Catalog = {
  total: number;
  stats?: { lessonDrafts: number };
  tasks: CatalogTask[];
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDirectory, '..');
const samplePath = join(
  projectRoot,
  'docs',
  'TEXTBOOK_LESSON_CONTENT_SAMPLES_10_DRAFT.md',
);
const catalog = JSON.parse(
  readFileSync(
    join(projectRoot, 'lib', 'textbook-catalog.generated.json'),
    'utf8',
  ),
) as Catalog;
const demoFileIndex = JSON.parse(
  readFileSync(
    join(projectRoot, 'lib', 'demo-data-files.generated.json'),
    'utf8',
  ),
) as { files: string[] };

const catalogById = new Map(catalog.tasks.map((task) => [task.id, task]));
const demoFiles = new Set(demoFileIndex.files);
const chapterFilter = (() => {
  const index = process.argv.indexOf('--chapter');
  return index >= 0 ? process.argv[index + 1] : null;
})();

const failures: string[] = [];
// 網羅性(まだ書いていない章・課題)の失敗。全体検査では失敗扱いだが、
// --write(サンプル10の再生成)は品質失敗が無ければ実行できる。
const coverageFailures: string[] = [];

function fail(message: string) {
  failures.push(message);
}

function failCoverage(message: string) {
  coverageFailures.push(message);
}

function normalizeText(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[\p{P}\p{S}\s]+/gu, '');
}

function bigrams(value: string) {
  const normalized = normalizeText(value);
  const grams = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    grams.add(normalized.slice(index, index + 2));
  }
  return grams;
}

function jaccard(left: Set<string>, right: Set<string>) {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const gram of left) if (right.has(gram)) shared += 1;
  return shared / (left.size + right.size - shared);
}

// ---------------------------------------------------------------------------
// 章の選別
// ---------------------------------------------------------------------------

const chaptersByKey = new Map(
  allChapters.map((chapter) => [chapter.key, chapter]),
);

function checkDuplicateChapterKeys(label: string, keys: readonly string[]) {
  const seen = new Set<string>();
  for (const key of keys) {
    if (seen.has(key)) {
      fail(`章登録同期: ${label} に章キー ${key} が重複しています`);
    }
    seen.add(key);
  }
}

function checkChapterKeySet(
  leftLabel: string,
  leftKeys: readonly string[],
  rightLabel: string,
  rightKeys: readonly string[],
) {
  const left = new Set(leftKeys);
  const right = new Set(rightKeys);
  for (const key of left) {
    if (!right.has(key)) {
      fail(
        `章登録同期: ${key} は ${leftLabel} にありますが ${rightLabel} にありません`,
      );
    }
  }
  for (const key of right) {
    if (!left.has(key)) {
      fail(
        `章登録同期: ${key} は ${rightLabel} にありますが ${leftLabel} にありません`,
      );
    }
  }
}

const registryChapterKeys = chapterRefs.map((ref) => ref.key);
const allChapterKeys = allChapters.map((chapter) => chapter.key);

if (chapterLoaderKeys.length !== 73) {
  fail(
    `章登録同期: loader.ts の章数が73ではなく${chapterLoaderKeys.length}です`,
  );
}
checkDuplicateChapterKeys('loader.ts', chapterLoaderKeys);
checkDuplicateChapterKeys('registry.ts', registryChapterKeys);
checkDuplicateChapterKeys('all.ts', allChapterKeys);
checkChapterKeySet(
  'loader.ts',
  chapterLoaderKeys,
  'registry.ts',
  registryChapterKeys,
);
checkChapterKeySet('loader.ts', chapterLoaderKeys, 'all.ts', allChapterKeys);

if (chapterFilter && !chaptersByKey.has(chapterFilter)) {
  console.error(`不明な章キーです: ${chapterFilter}`);
  console.error(
    `使える章キー: ${chapterRefs.map((ref) => ref.key).join(', ')}`,
  );
  process.exit(1);
}

const targetChapters = chapterFilter
  ? [chaptersByKey.get(chapterFilter) as TextbookChapter]
  : allChapters;

// ---------------------------------------------------------------------------
// 章レベルの検査
// ---------------------------------------------------------------------------

for (const ref of chapterRefs) {
  if (!chaptersByKey.has(ref.key)) {
    fail(`章 ${ref.key}: all.ts に登録されていません(${ref.sourceFile})`);
  }
}

for (const chapter of targetChapters) {
  const ref = chapterRefs.find((candidate) => candidate.key === chapter.key);
  if (!ref) {
    fail(`章 ${chapter.key}: registry.ts にない章キーです`);
    continue;
  }
  if (chapter.track !== ref.track) {
    fail(`章 ${chapter.key}: trackが${ref.track}ではなく${chapter.track}です`);
  }
  const lessonIds = Object.keys(chapter.lessons);
  for (const lessonId of lessonIds) {
    if (chapterKeyForTaskId(lessonId) !== chapter.key) {
      fail(`章 ${chapter.key}: ${lessonId} はこの章の課題ではありません`);
    }
    if (!catalogById.has(lessonId)) {
      fail(`章 ${chapter.key}: ${lessonId} は730課題カタログにありません`);
    }
  }
  // 章としての完成(10件+旗艦作品)は、章単位検査では必須、全体では網羅性として扱う
  const failCompleteness = chapterFilter ? fail : failCoverage;
  const authored = lessonIds.length > 0;
  if (authored) {
    if (lessonIds.length !== 10) {
      failCompleteness(
        `章 ${chapter.key}: 課題が10件ではなく${lessonIds.length}件です`,
      );
    }
    const expectedIds = catalog.tasks
      .filter((task) => chapterKeyForTaskId(task.id) === chapter.key)
      .map((task) => task.id);
    for (const expectedId of expectedIds) {
      if (!chapter.lessons[expectedId]) {
        failCompleteness(`章 ${chapter.key}: ${expectedId} の本文がありません`);
      }
    }
    if (
      !chapter.flagship.title.trim() ||
      chapter.flagship.title === '(執筆中)'
    ) {
      failCompleteness(`章 ${chapter.key}: 旗艦作品のタイトルが未設定です`);
    }
    if (!chapter.flagship.summary.trim()) {
      failCompleteness(`章 ${chapter.key}: 旗艦作品のsummaryが空です`);
    }
    if (chapter.flagship.preview.lines.length < 3) {
      failCompleteness(`章 ${chapter.key}: 旗艦作品のプレビューが3行未満です`);
    }
  } else if (!chapterFilter) {
    failCoverage(`章 ${chapter.key}: 本文が未執筆です(0件)`);
  }
}

// ---------------------------------------------------------------------------
// 課題レベルの検査
// ---------------------------------------------------------------------------

const targetLessons: [string, TextbookLesson][] = targetChapters.flatMap(
  (chapter) => Object.entries(chapter.lessons),
);

const allLessonEntries: [string, TextbookLesson][] = allChapters.flatMap(
  (chapter) => Object.entries(chapter.lessons),
);
const allLessonIds = new Set(allLessonEntries.map(([lessonId]) => lessonId));

for (const [lessonId, lesson] of targetLessons) {
  const requiredTexts: [string, string][] = [
    ['最初の完成までの目安', lesson.duration],
    ['今回手元に残る物', lesson.deliverable],
    ['最初の一言', lesson.firstWord],
    ['保存の一言', lesson.savePrompt],
    ['自分の仕事なら', lesson.application],
  ];
  for (const [label, value] of requiredTexts) {
    if (!value || value.trim().length === 0) {
      fail(`${lessonId}: ${label}が空です`);
    }
  }
  if (lesson.tryActions.length === 0) {
    fail(`${lessonId}: 実際に触る操作がありません`);
  }
  if (lesson.mistakes.length < 3) {
    fail(`${lessonId}: やりがちなミスが3件未満です`);
  }
  if (
    lesson.improvementTips.length === 0 ||
    lesson.improvementTips.length > 3
  ) {
    fail(
      `${lessonId}: 出力を上げるコツは1〜3件にします(現在${lesson.improvementTips.length}件)`,
    );
  }
  for (const tip of lesson.improvementTips) {
    if (!tip.title.trim() || !tip.say.trim()) {
      fail(`${lessonId}: 出力を上げるコツに空欄があります`);
    }
  }

  // 材料
  for (const file of lesson.files) {
    if (!demoFiles.has(file)) {
      fail(`${lessonId}: 材料「${file}」が3業種デモZIPに存在しません`);
    }
    if (
      file.startsWith('完成/') ||
      file === 'SHA256SUMS.txt' ||
      file === 'manifest.csv'
    ) {
      fail(`${lessonId}: 「${file}」は課題の材料にできません`);
    }
  }
  if (lesson.inputMethod === 'none') {
    if (lesson.files.length > 0) {
      fail(`${lessonId}: 材料不要(none)なのにfilesが指定されています`);
    }
  } else if (lesson.files.length === 0 && !lesson.carryIn?.trim()) {
    fail(
      `${lessonId}: 材料が空です。デモ内ファイル、carryIn(前課題の完成品)、またはinputMethod'none'を指定します`,
    );
  }
  if (lesson.carryIn !== undefined && !lesson.carryIn.trim()) {
    fail(`${lessonId}: carryInが空文字です`);
  }

  // 完成条件
  if ('completion' in lesson && lesson.completion) {
    if (lesson.completion.length < 2) {
      fail(`${lessonId}: 完成条件が2件未満です`);
    }
  } else if (lesson.completionGroups) {
    if (
      !lesson.completionGroups.every(
        (group) => group.title.trim().length > 0 && group.items.length > 0,
      )
    ) {
      fail(`${lessonId}: グループ別完成条件に空欄があります`);
    }
  } else {
    fail(`${lessonId}: 完成条件がありません`);
  }

  // 次に送る一言
  for (const prompt of lesson.nextPrompts ?? []) {
    if (!prompt.when.trim() || !prompt.say.trim()) {
      fail(`${lessonId}: 次に送る一言に空欄があります`);
    }
  }

  // ステップアップと正式な次課題
  const stepUpValues = [
    lesson.stepUp.title,
    lesson.stepUp.carryOver,
    lesson.stepUp.adds,
    lesson.stepUp.say,
  ];
  if (stepUpValues.some((value) => value.trim().length === 0)) {
    fail(`${lessonId}: ステップアップの必須項目に空欄があります`);
  }
  const expectedFormalNext = formalNextTaskIdFor(lessonId);
  if (lesson.stepUp.kind === 'task') {
    if (isCourseTerminalTaskId(lessonId)) {
      fail(
        `${lessonId}: コース終端なので stepUp.kind は 'terminal'(総仕上げ)にします`,
      );
    }
    if (!catalogById.has(lesson.stepUp.targetTaskId)) {
      fail(
        `${lessonId}: ステップアップ先 ${lesson.stepUp.targetTaskId} がカタログにありません`,
      );
    }
    if (lesson.stepUp.targetTaskId === lessonId) {
      fail(`${lessonId}: ステップアップが自分自身を指しています`);
    }
    if (lesson.stepUp.formalNextTaskId !== expectedFormalNext) {
      fail(
        `${lessonId}: 正式な次課題は ${expectedFormalNext} ですが ${lesson.stepUp.formalNextTaskId} になっています`,
      );
    }
  } else {
    if (!isCourseTerminalTaskId(lessonId)) {
      fail(
        `${lessonId}: コース途中なので総仕上げ(terminal)にはできません(章末以外の行き止まり)`,
      );
    }
    if (
      lesson.stepUp.targetTaskId !== null ||
      lesson.stepUp.formalNextTaskId !== null
    ) {
      fail(`${lessonId}: 総仕上げには行き先IDを設定できません`);
    }
  }

  // 一言の中にMarkdownコード柵を入れない
  const rawValues = [
    lesson.firstWord,
    lesson.savePrompt,
    lesson.stepUp.say,
    ...lesson.improvementTips.map((tip) => tip.say),
    ...(lesson.nextPrompts?.map((prompt) => prompt.say) ?? []),
  ];
  if (rawValues.some((value) => value.includes('```'))) {
    fail(`${lessonId}: 一言の中にMarkdownコード柵が入っています`);
  }
}

// ---------------------------------------------------------------------------
// 重複検査(コピー本文の検出)
// ---------------------------------------------------------------------------

{
  // 完全一致(正規化後)の検出対象
  const uniqueFields: [string, (lesson: TextbookLesson) => string][] = [
    ['最初の一言', (lesson) => lesson.firstWord],
    ['保存の一言', (lesson) => lesson.savePrompt],
    ['自分の仕事なら', (lesson) => lesson.application],
    ['ステップアップの一言', (lesson) => lesson.stepUp.say],
  ];
  for (const [label, pick] of uniqueFields) {
    const seen = new Map<string, string>();
    for (const [lessonId, lesson] of allLessonEntries) {
      const key = normalizeText(pick(lesson));
      if (!key) continue;
      const first = seen.get(key);
      if (
        first &&
        (chapterFilter
          ? targetLessons.some(([id]) => id === lessonId || id === first)
          : true)
      ) {
        fail(`${lessonId}: ${label}が${first}と同一です`);
      } else if (!first) {
        seen.set(key, lessonId);
      }
    }
  }

  // 箇条書き項目の使い回し(3課題以上で同一)
  const itemFields: [string, (lesson: TextbookLesson) => readonly string[]][] =
    [
      ['やりがちなミス', (lesson) => lesson.mistakes],
      [
        '完成条件',
        (lesson) =>
          lesson.completionGroups
            ? lesson.completionGroups.flatMap((group) => group.items)
            : (lesson.completion ?? []),
      ],
    ];
  for (const [label, pick] of itemFields) {
    const usage = new Map<string, string[]>();
    for (const [lessonId, lesson] of allLessonEntries) {
      for (const item of pick(lesson)) {
        const key = normalizeText(item);
        if (!key) continue;
        const list = usage.get(key) ?? [];
        list.push(lessonId);
        usage.set(key, list);
      }
    }
    for (const [, lessonIds] of usage) {
      if (lessonIds.length >= 3) {
        const relevant = chapterFilter
          ? lessonIds.some((id) =>
              targetLessons.some(([targetId]) => targetId === id),
            )
          : true;
        if (relevant) {
          fail(
            `${label}「…」が${lessonIds.length}課題(${lessonIds.slice(0, 5).join(', ')}${lessonIds.length > 5 ? '…' : ''})で同一です`,
          );
        }
      }
    }
  }

  // 最初の一言の類似しすぎ(2-gram Jaccard)
  const grams = allLessonEntries.map(
    ([lessonId, lesson]) => [lessonId, bigrams(lesson.firstWord)] as const,
  );
  const targetIds = new Set(targetLessons.map(([lessonId]) => lessonId));
  for (let left = 0; left < grams.length; left += 1) {
    for (let right = left + 1; right < grams.length; right += 1) {
      if (
        chapterFilter &&
        !targetIds.has(grams[left][0]) &&
        !targetIds.has(grams[right][0])
      ) {
        continue;
      }
      const similarity = jaccard(grams[left][1], grams[right][1]);
      if (similarity >= 0.9) {
        fail(
          `${grams[left][0]}と${grams[right][0]}: 最初の一言が類似しすぎです(${Math.round(similarity * 100)}%)`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 全体カバレッジとカタログ同期(全体検査のみ)
// ---------------------------------------------------------------------------

if (!chapterFilter) {
  for (const task of catalog.tasks) {
    if (!allLessonIds.has(task.id)) {
      failCoverage(`カバレッジ: ${task.id}「${task.title}」の本文がありません`);
    }
  }
  for (const lessonId of allLessonIds) {
    if (!catalogById.has(lessonId)) {
      fail(`カバレッジ: 本文${lessonId}が730課題カタログにありません`);
    }
  }
  for (const task of catalog.tasks) {
    if (task.hasLessonDraft !== allLessonIds.has(task.id)) {
      failCoverage(
        `カタログ同期: ${task.id}のhasLessonDraftが実態と違います。npm run build:catalog を実行します`,
      );
    }
  }
  if (catalog.stats && catalog.stats.lessonDrafts !== allLessonIds.size) {
    failCoverage(
      `カタログ同期: 本文件数${catalog.stats.lessonDrafts}と正本${allLessonIds.size}件が違います`,
    );
  }
}

// ---------------------------------------------------------------------------
// サンプル10文書の生成・同期検査
// ---------------------------------------------------------------------------

const inputGuides: Record<TextbookLesson['inputMethod'], string> = {
  paste:
    '短いメモなので、ファイルを開いて中身を全部コピーし、入力欄へそのまま貼ります。きれいに書き直さなくて大丈夫です。ファイル自体を添付しても進められます。',
  attach:
    '見た目や表の形も使う資料です。必要なファイルだけを入力欄へ添付し、ファイル名が表示されたことを確かめます。文章部分だけを見てもらう場合は、その部分を貼っても構いません。',
  mixed:
    'TXTなどの短いメモは開いて中身を貼り、PDF・Word・Excelなど書式が大事な資料だけを添付します。全部をファイルで渡す必要はありません。',
  none: 'この課題は、デモフォルダの材料を渡さずに始められます。入力欄へ最初の一言だけ送ります。',
};

const modeGuides: Record<TextbookLesson['recommendedMode'], string> = {
  chat: '`Chat`の入力欄へ上の方法で材料を渡します。新しいチャットでも、続きのチャットでも構いません。',
  work: '`Work`が表示される場合は、先に展開したデモフォルダを開き、その入力欄へ上の方法で材料を渡します。`Work`がない場合は、`Chat`へ同じように貼る・添付する方法で進め、できたファイルを自分でダウンロードします。',
};

function codeBlock(value: string) {
  return `\`\`\`text\n${value}\n\`\`\``;
}

function bulletList(values: readonly string[]) {
  return values.map((value) => `- ${value}`).join('\n');
}

function renderCompletion(lesson: TextbookLesson) {
  if (lesson.completionGroups) {
    return lesson.completionGroups
      .map((group) => `**${group.title}**\n\n${bulletList(group.items)}`)
      .join('\n\n');
  }
  return bulletList(lesson.completion ?? []);
}

function renderNextPrompts(lesson: TextbookLesson) {
  if (!lesson.nextPrompts?.length) return '';
  return lesson.nextPrompts
    .map((prompt) => {
      const actions = prompt.afterActions?.length
        ? `\n\nそのあと、実際に次を確かめます。\n\n${bulletList(prompt.afterActions)}`
        : '';
      return `**${prompt.when}**\n\n${codeBlock(prompt.say)}${actions}`;
    })
    .join('\n\n');
}

function renderMaterials(lesson: TextbookLesson) {
  const parts: string[] = [];
  if (lesson.files.length > 0) {
    parts.push('展開したデモフォルダから、次の材料を使います。');
    parts.push(lesson.files.map((file) => `- \`${file}\``).join('\n'));
  }
  if (lesson.carryIn) {
    parts.push(`**前の課題から引き継ぐ物:** ${lesson.carryIn}`);
  }
  parts.push(inputGuides[lesson.inputMethod]);
  parts.push(modeGuides[lesson.recommendedMode]);
  return parts.join('\n\n');
}

function renderLesson(
  index: number,
  task: CatalogTask,
  lesson: TextbookLesson,
) {
  const tips = lesson.improvementTips
    .map((tip) => `**${tip.title}**\n\n${codeBlock(tip.say)}`)
    .join('\n\n');
  const nextPrompts = renderNextPrompts(lesson);
  const stepUpHeading =
    lesson.stepUp.kind === 'task'
      ? `${lesson.stepUp.targetTaskId} ${lesson.stepUp.title}`
      : `総仕上げ ${lesson.stepUp.title}`;
  const stepUpStatus =
    lesson.stepUp.kind === 'task'
      ? `これは今の完成品へ便利を一つ足す任意の発展です。${lesson.stepUp.targetTaskId}を正式に終えた扱いにはなりません。下の一言を今いるChatまたはWorkの続きで試すか、詳しい手順を開いて次の課題として進めます。`
      : 'これは今の完成品へ便利を一つ足す任意の総仕上げです。ここまでで終わっても大丈夫です。';
  const formalNext =
    lesson.stepUp.kind === 'task'
      ? `**次の正式課題:** ${lesson.stepUp.formalNextTaskId}`
      : '';

  return `## サンプル${index + 1}｜${task.id} ${task.title}

### 今日はこれを作る

**目安:** ${lesson.duration}

**今回手元に残る物:** ${lesson.deliverable}

### 使うもの

${renderMaterials(lesson)}

### まずこう言ってみる

材料を渡したすぐ下に、普段の言い方のまま送ります。

${codeBlock(lesson.firstWord)}

### 出てきた物を実際に触る

AIが「できました」と言っただけでは完成にしません。次を自分で一度触ります。

${bulletList(lesson.tryActions)}${nextPrompts ? `\n\n${nextPrompts}` : ''}

### 出力を上げるコツ

全部を言う必要はありません。気になるものを一つだけ選びます。

${tips}

### やりがちなミス

${bulletList(lesson.mistakes)}

### ここまでできたら完成

${renderCompletion(lesson)}

普通のChatで進めた場合は、文章をコピーするか、できたファイルをダウンロードして\`完成\`フォルダへ入れます。\`Work\`でデモフォルダを開いて進めた場合は、次の一言で保存を頼めます。

${codeBlock(lesson.savePrompt)}

保存した物をもう一度開けたら、今回の課題は完成です。

### 自分の仕事なら

${lesson.application}

### 困ったら藤本に聞く

止まった画面のスクショと、「${task.id}で、ここまでできた：＿＿。ここで止まった：＿＿」を藤本へ見せます。うまく説明できなくても大丈夫です。実在する個人情報や秘密は隠します。

### ステップアップ｜${stepUpHeading}

${stepUpStatus}

**今回できた物を、そのまま使う:** ${lesson.stepUp.carryOver}

**次に増えること:** ${lesson.stepUp.adds}

${formalNext}

${codeBlock(lesson.stepUp.say)}`;
}

const introduction = `# 藤本実学塾 ChatGPT実践教科書 本文サンプル10

> 状態: 品質見本 / Web表示と同じ正本から自動生成
> 更新日: 2026年9月2日
> 目的: 「これなら自分にもできそう」と思える本文になっているかを、10種類の完成品で確かめる

この10本は、全730課題の品質見本です。説明を覚える教科書ではありません。練習用の雑なメモや資料を、その仕事で一番楽な方法でChatGPTに渡し、まず何かを完成させます。

このファイルの課題本文は、\`lib/textbook-lessons/\`の章別正本から生成します。Webと原稿を別々に直して内容がずれないようにするため、本文を変える時は正本を直してから\`npm run build:lessons\`を実行します。

## いちばん最初に、これだけ準備します

### 1｜練習する会社を一つ選ぶ

サイトから、美容室、建設業、不動産会社のどれか一つのデモデータをダウンロードします。Windowsは右クリックして「すべて展開」、MacはZIPをダブルクリックします。中身はすべて架空で、実在する会社、人物、金額、契約ではありません。

### 2｜練習場所は一つ、会話は作る物ごとに分ける

展開したフォルダを一つの練習場所にします。ChatGPTのプロジェクトを使える場合も、練習用を一つ作れば十分です。ただし10課題を一つの長い会話へ詰め込まず、準備・試作、制作、確認・完成など、作る物や工程が変わる所で新しいChatを開きます。次のChatへは、完成品と短い引き継ぎメモだけを渡します。

### 3｜素材は、仕事に合う方法で渡す

- 短いメモは、開いて中身をコピーし、入力欄へ貼る
- PDF、Word、Excelは、見た目や表も必要な時だけ添付する
- 一回の文章づくりは\`Chat\`、実ファイルを作って何度も直す時は\`Work\`を使う
- \`Work\`が表示されない時は、\`Chat\`へ同じように貼る・添付し、できた物を自分で保存する

各課題の\`課題/01メール.txt\`のような表記は、素材を探すための場所案内です。ファイル名やパスをAIへ正確に言えるかは、課題の合否に関係ありません。

### 4｜できあがった物を「完成」へ残す

普通のChatやファイル添付で進めた場合は、できあがった文章をコピーするか、生成されたファイルをダウンロードし、デモデータの\`完成\`フォルダへ入れます。\`Work\`で進めた場合は、AIに保存を頼めます。

どの方法でも、**作る → 実際に触る → 気になる所を一つ直す → 保存した物を開く**の順で進めます。メール送信、予定登録、公開、支払い、契約は勝手に進めさせません。

最後のステップアップは任意です。今の完成品へ便利を一つ足す練習で、表示された別課題を正式に修了したことにはなりません。

---`;

const allLessonsById = new Map(allLessonEntries);
const representativeReady = REPRESENTATIVE_LESSON_IDS.every((lessonId) =>
  allLessonsById.has(lessonId),
);

if (!representativeReady) {
  fail('サンプル10: 代表課題の本文がそろっていません');
}

const writeMode = process.argv.includes('--write');
const blockingFailures = writeMode
  ? failures
  : [...failures, ...coverageFailures];

if (blockingFailures.length > 0) {
  console.error(
    chapterFilter
      ? `章 ${chapterFilter} の検査に失敗しました。`
      : '教科書本文の正本検査に失敗しました。',
  );
  for (const failure of blockingFailures) console.error(`- ${failure}`);
  console.error(`失敗: ${blockingFailures.length}件`);
  process.exit(1);
}

if (writeMode && coverageFailures.length > 0) {
  console.warn(
    `注意: 本文がまだ${coverageFailures.length}件そろっていません(品質検査は合格)。全体合格は全730件の完成後です。`,
  );
}

if (chapterFilter) {
  const chapter = chaptersByKey.get(chapterFilter) as TextbookChapter;
  console.log(
    `章 ${chapterFilter} は正本検査に合格しました(${Object.keys(chapter.lessons).length}課題)`,
  );
  process.exit(0);
}

const generated = `${introduction}\n\n${REPRESENTATIVE_LESSON_IDS.map(
  (lessonId, index) => {
    const task = catalogById.get(lessonId);
    const lesson = allLessonsById.get(lessonId);
    if (!task || !lesson) throw new Error(`${lessonId} is missing`);
    return renderLesson(index, task, lesson);
  },
).join('\n\n---\n\n')}\n`;

if (process.argv.includes('--write')) {
  writeFileSync(samplePath, generated);
  console.log(
    `全${allLessonIds.size}課題の検査に合格し、サンプル${REPRESENTATIVE_LESSON_IDS.length}件を${samplePath}へ生成しました`,
  );
} else {
  const current = readFileSync(samplePath, 'utf8');
  if (current !== generated) {
    console.error(
      '教科書本文Markdownが正本と違います。`npm run build:lessons`を実行してください。',
    );
    process.exit(1);
  }
  console.log(
    `Textbook lessons are current: ${allLessonIds.size} lessons, full-field sync`,
  );
}
