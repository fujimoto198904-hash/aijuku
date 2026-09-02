import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(scriptDirectory, '..');
const outputPath = join(projectRoot, 'lib', 'textbook-catalog.generated.json');
const lessonTrackDirectories = [
  'common',
  'department',
  'industry',
  'generation',
];

const sources = [
  {
    file: 'docs/TEXTBOOK_PROBLEM_BANK_200_DRAFT.md',
    track: 'common',
    trackLabel: '技術の幹',
    expected: 200,
    expectedCourses: 20,
  },
  {
    file: 'docs/TEXTBOOK_DEPARTMENT_TRACKS_200_DRAFT.md',
    track: 'department',
    trackLabel: '仕事の担当',
    expected: 200,
    expectedCourses: 20,
    expectedPrefixes: [
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
    ],
  },
  {
    file: 'docs/TEXTBOOK_INDUSTRY_TRACKS_100_DRAFT.md',
    track: 'industry',
    trackLabel: '現場の舞台',
    expected: 100,
    expectedCourses: 10,
    expectedPrefixes: [
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
    ],
  },
  {
    file: 'docs/TEXTBOOK_GENERATION_TRACKS_200_DRAFT.md',
    track: 'generation',
    trackLabel: '表現の工房',
    expected: 230,
    expectedCourses: 23,
    expectedPrefixes: [
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
    ],
  },
];

const taskPattern =
  /^- (Lv\.\d{2,3}|[A-Z]{2,5}-\d{2})｜(.+?) — やってみること:\s*(.+?)。できあがるもの:\s*(.+?)。〔(.+?)〕$/;

function splitCourseHeading(track, heading) {
  if (track === 'common') {
    const match = heading.match(/^(Lv\.\d{2,3}[–-]\d{2,3})｜(.+)$/);
    if (!match) return null;

    return {
      courseCode: match[1],
      courseTitle: match[2],
      coursePromise: match[2],
    };
  }

  const match = heading.match(/^(\d{2})｜(.+)$/);
  if (!match) return null;

  const courseCode = match[1];
  const courseHeading = match[2];
  const separator = track === 'industry' ? '：' : ' — ';
  const separatorIndex = courseHeading.indexOf(separator);

  if (separatorIndex === -1) {
    return {
      courseCode,
      courseTitle: courseHeading,
      coursePromise: courseHeading,
    };
  }

  return {
    courseCode,
    courseTitle: courseHeading.slice(0, separatorIndex).trim(),
    coursePromise: courseHeading
      .slice(separatorIndex + separator.length)
      .trim(),
  };
}

function parseSource(source) {
  const markdown = readFileSync(join(projectRoot, source.file), 'utf8');
  const tasks = [];
  let course = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    if (rawLine.startsWith('## ')) {
      const nextCourse = splitCourseHeading(
        source.track,
        rawLine.slice(3).trim(),
      );
      if (nextCourse) course = nextCourse;
      continue;
    }

    const normalizedLine = rawLine.replaceAll('**', '');
    const match = normalizedLine.match(taskPattern);
    if (!match) continue;
    if (!course) {
      throw new Error(`${source.file}: ${match[1]} has no course heading`);
    }

    const [, id, title, action, outcome, rawTags] = match;
    tasks.push({
      id,
      track: source.track,
      trackLabel: source.trackLabel,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      coursePromise: course.coursePromise,
      title,
      action,
      outcome,
      tags: rawTags.split('・').map((tag) => tag.trim()),
      sourceFile: source.file,
    });
  }

  if (tasks.length !== source.expected) {
    throw new Error(
      `${source.file}: expected ${source.expected} tasks, found ${tasks.length}`,
    );
  }

  const expectedIds = source.expectedPrefixes
    ? source.expectedPrefixes.flatMap((prefix) =>
        Array.from(
          { length: 10 },
          (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`,
        ),
      )
    : Array.from(
        { length: source.expected },
        (_, index) => `Lv.${String(index + 1).padStart(2, '0')}`,
      );
  const actualIds = tasks.map((task) => task.id);

  if (actualIds.join('\n') !== expectedIds.join('\n')) {
    throw new Error(
      `${source.file}: task ids or order do not match the curriculum`,
    );
  }

  const courseCount = new Set(
    tasks.map((task) => `${task.courseCode}|${task.courseTitle}`),
  ).size;
  if (courseCount !== source.expectedCourses) {
    throw new Error(
      `${source.file}: expected ${source.expectedCourses} courses, found ${courseCount}`,
    );
  }

  return tasks;
}

const parsedTasks = sources.flatMap(parseSource);

// 章別正本(lib/textbook-lessons/<track>/*.ts)から、詳細本文があるIDと正本ファイルを収集する
const lessonSourceById = new Map();
for (const trackDirectory of lessonTrackDirectories) {
  const directory = join(
    projectRoot,
    'lib',
    'textbook-lessons',
    trackDirectory,
  );
  for (const fileName of readdirSync(directory)) {
    if (!fileName.endsWith('.ts')) continue;
    const sourcePath = `lib/textbook-lessons/${trackDirectory}/${fileName}`;
    const sourceText = readFileSync(join(projectRoot, sourcePath), 'utf8');
    // 初期の章は生のオブジェクト、量産章は共通の lesson({...}) ヘルパーを使う。
    // どちらも正本なので、課題IDを同じ規則で収集する。
    for (const match of sourceText.matchAll(
      /^\s*'(Lv\.\d{2,3}|[A-Z]{2,5}-\d{2})': (?:lesson\()?\{$/gm,
    )) {
      const lessonId = match[1];
      if (lessonSourceById.has(lessonId)) {
        throw new Error(
          `${sourcePath}: ${lessonId} は ${lessonSourceById.get(lessonId)} と重複しています`,
        );
      }
      lessonSourceById.set(lessonId, sourcePath);
    }
  }
}

const unknownLessonDraftIds = [...lessonSourceById.keys()].filter(
  (id) => !parsedTasks.some((task) => task.id === id),
);

if (unknownLessonDraftIds.length > 0) {
  throw new Error(
    `Lesson draft ids missing from catalog: ${unknownLessonDraftIds.join(', ')}`,
  );
}

const tasks = parsedTasks.map((task) => {
  const hasLessonDraft = lessonSourceById.has(task.id);
  return {
    ...task,
    // ここでの「ready-local」は、ローカル正本に詳細本文があるという意味であり、
    // 本番公開済みという意味ではない(公開状態はホスティング側で別管理)。
    contentStatus: hasLessonDraft ? 'lesson-ready-local' : 'outline-only',
    hasLessonDraft,
    lessonDraftSourceFile: hasLessonDraft
      ? lessonSourceById.get(task.id)
      : null,
  };
});
const duplicateIds = tasks
  .map((task) => task.id)
  .filter((id, index, ids) => ids.indexOf(id) !== index);
const duplicateTitles = tasks
  .map((task) => task.title)
  .filter((title, index, titles) => titles.indexOf(title) !== index);
const normalizedTitleGroups = new Map();

for (const task of tasks) {
  const normalizedTitle = task.title
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[\p{P}\p{S}\s]+/gu, '');
  const group = normalizedTitleGroups.get(normalizedTitle) ?? [];
  group.push(task);
  normalizedTitleGroups.set(normalizedTitle, group);
}

const duplicateNormalizedTitles = [...normalizedTitleGroups.values()].filter(
  (group) => group.length > 1,
);

if (tasks.length !== 730) {
  throw new Error(`Expected 730 tasks, found ${tasks.length}`);
}

if (duplicateIds.length > 0) {
  throw new Error(
    `Duplicate task ids: ${[...new Set(duplicateIds)].join(', ')}`,
  );
}

if (duplicateTitles.length > 0) {
  throw new Error(
    `Duplicate task titles: ${[...new Set(duplicateTitles)].join(', ')}`,
  );
}

if (duplicateNormalizedTitles.length > 0) {
  throw new Error(
    `Duplicate normalized task titles: ${duplicateNormalizedTitles
      .map((group) => group.map((task) => task.id).join(' / '))
      .join(', ')}`,
  );
}

const tasksWithEmptyTags = tasks.filter(
  (task) => task.tags.length === 0 || task.tags.some((tag) => tag.length === 0),
);
if (tasksWithEmptyTags.length > 0) {
  throw new Error(
    `Tasks with empty tags: ${tasksWithEmptyTags.map((task) => task.id).join(', ')}`,
  );
}

const catalog = {
  total: tasks.length,
  stats: {
    total: tasks.length,
    lessonDrafts: tasks.filter((task) => task.hasLessonDraft).length,
    outlines: tasks.filter((task) => !task.hasLessonDraft).length,
  },
  tracks: sources.map((source) => ({
    id: source.track,
    label: source.trackLabel,
    count: source.expected,
  })),
  tasks,
};

const generated = `${JSON.stringify(catalog, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) {
    throw new Error(
      'Textbook catalog is out of date. Run `npm run build:catalog`.',
    );
  }
  console.log(`Textbook catalog is current: ${tasks.length} tasks`);
} else {
  writeFileSync(outputPath, generated);
  console.log(`Generated ${tasks.length} tasks at ${outputPath}`);
}
