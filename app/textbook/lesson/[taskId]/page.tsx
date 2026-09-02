import type { Metadata } from 'next';
import { ArrowLeft, BookOpenText } from 'lucide-react';
import { notFound } from 'next/navigation';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import { LessonReader } from '@/components/textbook/lesson-reader';
import { TextbookSubnav } from '@/components/textbook/textbook-subnav';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { toClientTask } from '@/lib/textbook-catalog-client';
import { getTaskDemoDownloadPlan } from '@/lib/textbook-demo-download-plan';
import { loadLesson } from '@/lib/textbook-lessons/loader';
import {
  formalNextTaskIdFor,
  previousTaskIdFor,
} from '@/lib/textbook-lessons/registry';
import { canonicalPublicPath } from '@/lib/site-paths';
import { textbookExplorePath, textbookLessonPath } from '@/lib/textbook-routes';

type LessonPageProps = {
  params: Promise<{ taskId: string }>;
};

function decodedTaskId(rawTaskId: string): string | null {
  try {
    return decodeURIComponent(rawTaskId);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const taskId = decodedTaskId((await params).taskId);
  const task = taskId ? findTextbookTask(taskId) : undefined;

  if (!task) {
    return {
      title: '教科書が見つかりません｜藤本実学塾',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${task.id} ${task.title}｜Web教科書｜藤本実学塾`,
    description: `${task.action} できあがるもの: ${task.outcome}`,
    alternates: {
      canonical: canonicalPublicPath(textbookLessonPath(task.id)),
    },
  };
}

export default async function TextbookLessonPage({ params }: LessonPageProps) {
  const taskId = decodedTaskId((await params).taskId);
  const task = taskId ? findTextbookTask(taskId) : undefined;
  if (!task) notFound();

  const lesson = await loadLesson(task.id);
  if (!lesson) notFound();
  const downloadPlan = getTaskDemoDownloadPlan(task.id);
  if (!downloadPlan) notFound();

  const previousId = previousTaskIdFor(task.id);
  const formalNextId = formalNextTaskIdFor(task.id);
  const previousTask = previousId ? findTextbookTask(previousId) : undefined;
  const formalNextTask = formalNextId
    ? findTextbookTask(formalNextId)
    : undefined;
  const stepUpTargetTask =
    lesson.stepUp.kind === 'task'
      ? findTextbookTask(lesson.stepUp.targetTaskId)
      : undefined;

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <TextbookSubnav current="lesson" />

        <section className="border-b border-rule bg-paper-white px-5 py-5 sm:px-8">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="soft-badge inline-flex size-10 items-center justify-center border border-sapphire bg-sapphire-soft text-sapphire">
                <BookOpenText className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold text-ink">
                  1課題だけを、落ち着いて読むページ
                </p>
                <p className="mt-1 text-xs text-quiet">
                  探すページから開いた場合は、元のタブに一覧が残ります
                </p>
              </div>
            </div>
            <Link
              className="soft-control inline-flex min-h-11 items-center gap-2 border border-rule px-4 text-xs font-semibold text-deep-green hover:border-sapphire hover:text-sapphire"
              href={textbookExplorePath}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              学ぶことを探すページへ
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1180px] border-x border-rule bg-paper-white shadow-[0_24px_80px_rgba(16,42,54,0.06)]">
          <LessonReader
            task={toClientTask(task)}
            lesson={lesson}
            downloadPlan={downloadPlan}
            previousTask={previousTask ? toClientTask(previousTask) : undefined}
            formalNextTask={
              formalNextTask ? toClientTask(formalNextTask) : undefined
            }
            stepUpTargetTask={
              stepUpTargetTask ? toClientTask(stepUpTargetTask) : undefined
            }
          />
        </section>

        <section className="border-t border-rule bg-paper-white px-5 py-10 sm:px-8">
          <div className="mx-auto flex w-full max-w-[1180px] flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-mincho text-2xl">次に作りたい物を探す。</p>
              <p className="mt-2 text-xs leading-6 text-quiet">
                探すページから開いた場合は、元のタブへ戻って次の教科書を選べます。直接このページを開いた方は、右のボタンから探せます。
              </p>
            </div>
            <Link
              className="button-glow inline-flex min-h-12 items-center px-5 text-sm font-semibold text-white"
              href={textbookExplorePath}
            >
              教科書を探す
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
