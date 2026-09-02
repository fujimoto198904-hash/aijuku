import type { Metadata } from 'next';

import { DemoDataLibrary } from '@/components/demo-data-library';
import { DemoQuickPick } from '@/components/textbook/demo-quick-pick';
import { TextbookStudio, type ShowcaseItem } from '@/components/textbook/studio';
import type { ChapterSummaryLite } from '@/components/textbook/task-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { findTextbookTask, textbookCatalog } from '@/lib/textbook-catalog';
import { toClientTask } from '@/lib/textbook-catalog-client';
import { getChapterSummaries } from '@/lib/textbook-chapter-summaries';
import { loadLesson } from '@/lib/textbook-lessons/loader';
import { canonicalPublicPath } from '@/lib/site-paths';

type TextbookPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 完成物ショーケースに出す章(種類の違う作品を優先) */
const showcaseChapterKeys = [
  'common-03',
  'generation-xls',
  'generation-sld',
  'generation-web',
  'generation-app',
  'generation-gam',
  'generation-bok',
  'generation-igc',
];

function requestedTaskIdFrom(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const requestedTask = searchParams.task;
  return Array.isArray(requestedTask) ? requestedTask[0] : requestedTask;
}

export async function generateMetadata({
  searchParams,
}: TextbookPageProps): Promise<Metadata> {
  const requestedTaskId = requestedTaskIdFrom(await searchParams);
  const task = requestedTaskId ? findTextbookTask(requestedTaskId) : undefined;

  if (task) {
    return {
      title: `${task.id} ${task.title}｜Web教科書｜藤本実学塾`,
      description: `${task.action} できあがるもの: ${task.outcome}`,
      alternates: { canonical: canonicalPublicPath('/textbook') },
    };
  }

  return {
    title: 'ChatGPTでこんな物まで作れる｜実践教科書｜藤本実学塾',
    description: `登録も購入も不要。無料のChatGPT実践教科書で、メール、見積Excel、PowerPoint、ホームページ、ゲーム、スマホアプリまで、${textbookCatalog.stats.total}課題から作りたい物を選べます。`,
    alternates: { canonical: canonicalPublicPath('/textbook') },
  };
}

export default async function TextbookPage({
  searchParams,
}: TextbookPageProps) {
  const requestedTaskId = requestedTaskIdFrom(await searchParams);
  const requestedTask = requestedTaskId
    ? findTextbookTask(requestedTaskId)
    : undefined;
  const initialTaskId = requestedTask?.id ?? 'Lv.05';
  const initialLesson = await loadLesson(initialTaskId);

  const chapterSummaries = getChapterSummaries();
  const chapters: ChapterSummaryLite[] = chapterSummaries.map((chapter) => ({
    key: chapter.key,
    track: chapter.track,
    trackLabel: chapter.trackLabel,
    courseTitle: chapter.courseTitle,
    coursePromise: chapter.coursePromise,
    firstTaskId: chapter.firstTaskId,
    flagshipTitle: chapter.flagship?.title ?? null,
  }));
  const showcase: ShowcaseItem[] = showcaseChapterKeys
    .map((key) => chapterSummaries.find((chapter) => chapter.key === key))
    .filter(
      (chapter): chapter is NonNullable<typeof chapter> =>
        Boolean(chapter?.flagship),
    )
    .slice(0, 8)
    .map((chapter) => ({
      key: chapter.key,
      trackLabel: chapter.trackLabel,
      courseTitle: chapter.courseTitle,
      firstTaskId: chapter.firstTaskId,
      flagship: chapter.flagship!,
    }));

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
      <TextbookStudio
        tasks={textbookCatalog.tasks.map(toClientTask)}
        tracks={textbookCatalog.tracks}
        chapters={chapters}
        showcase={showcase}
        initialTaskId={initialTaskId}
        initialLesson={initialLesson}
        deepLink={Boolean(requestedTask)}
        readyLessonCount={textbookCatalog.stats.lessonDrafts}
        demoQuickPick={<DemoQuickPick />}
        demoDetail={<DemoDataLibrary />}
      />
      </main>
      <SiteFooter />
    </>
  );
}
