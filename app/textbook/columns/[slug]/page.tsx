import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  ExternalLink,
  Lightbulb,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import {
  chatgptColumns,
  chatgptColumnSources,
  getChatgptColumn,
  getChatgptColumnCategory,
  getRelatedChatgptColumns,
} from '@/lib/chatgpt-columns';
import { canonicalPublicPath } from '@/lib/site-paths';
import {
  textbookColumnPath,
  textbookColumnsPath,
  textbookExplorePath,
} from '@/lib/textbook-routes';

type ChatgptColumnPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return chatgptColumns.map((column) => ({ slug: column.slug }));
}

function decodeSlug(rawSlug: string): string | null {
  try {
    return decodeURIComponent(rawSlug);
  } catch {
    return null;
  }
}

function columnNumber(id: number) {
  return `COLUMN ${String(id).padStart(3, '0')}`;
}

export async function generateMetadata({
  params,
}: ChatgptColumnPageProps): Promise<Metadata> {
  const slug = decodeSlug((await params).slug);
  const column = slug ? getChatgptColumn(slug) : undefined;

  if (!column) {
    return {
      title: 'コラムが見つかりません｜藤本実学塾',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `${column.title}｜ChatGPTコラム｜藤本実学塾`,
    description: column.lead,
    alternates: {
      canonical: canonicalPublicPath(textbookColumnPath(column.slug)),
    },
  };
}

export default async function ChatgptColumnPage({
  params,
}: ChatgptColumnPageProps) {
  const slug = decodeSlug((await params).slug);
  const column = slug ? getChatgptColumn(slug) : undefined;
  if (!column) notFound();

  const category = getChatgptColumnCategory(column.category);
  const sources = column.sourceIds
    .map((sourceId) =>
      chatgptColumnSources.find((source) => source.id === sourceId),
    )
    .filter((source): source is (typeof chatgptColumnSources)[number] =>
      Boolean(source),
    );
  const relatedColumns = getRelatedChatgptColumns(column, 3);

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <div className="border-b border-rule bg-paper-white px-5 py-4 sm:px-8">
          <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4">
            <Link
              className="inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-deep-green hover:text-sapphire"
              href={textbookColumnsPath}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              コラム一覧へ
            </Link>
            <span className="numeric-text text-xs text-quiet">
              {columnNumber(column.id)}
            </span>
          </div>
        </div>

        <article>
          <header className="section-aura border-b border-rule bg-deep-green px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-10">
            <div className="mx-auto w-full max-w-[920px]">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="soft-badge border border-future-mint/35 bg-white/10 px-3 py-1.5 font-semibold text-future-mint">
                  {category?.label ?? column.category}
                </span>
                <span className="text-white/60">約2分で読めます</span>
              </div>
              <h1 className="text-soft-glow mt-7 font-mincho text-[clamp(2.25rem,5.5vw,4.8rem)] font-medium leading-[1.16] tracking-[-0.04em]">
                {column.title}
              </h1>
              <p className="mt-7 max-w-3xl text-base leading-9 text-white/75 sm:text-lg">
                {column.lead}
              </p>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[920px] px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
            <section
              className="soft-panel soft-dark-glow relative overflow-hidden bg-brand-dark p-7 text-white sm:p-10"
              aria-labelledby="short-answer-heading"
            >
              <div
                className="absolute -right-14 -top-14 size-52 rounded-full bg-sapphire/20 blur-3xl"
                aria-hidden="true"
              />
              <Lightbulb
                className="relative size-7 text-future-mint"
                aria-hidden="true"
              />
              <h2
                className="relative mt-5 text-xs font-semibold tracking-[0.14em] text-future-mint"
                id="short-answer-heading"
              >
                ひとことでいうと
              </h2>
              <p className="relative mt-4 font-mincho text-2xl leading-relaxed sm:text-3xl">
                {column.answer}
              </p>
            </section>

            <section
              className="mt-12 border-t-2 border-deep-green pt-7 sm:mt-16"
              aria-labelledby="explanation-heading"
            >
              <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                まず知っておくこと
              </p>
              <h2
                className="mt-3 font-mincho text-3xl leading-tight sm:text-4xl"
                id="explanation-heading"
              >
                もう少し詳しく
              </h2>
              <p className="mt-6 whitespace-pre-line text-base leading-9 text-ink/85">
                {column.explanation}
              </p>
            </section>

            <section
              className="mt-12 border-t border-rule pt-7 sm:mt-16"
              aria-labelledby="steps-heading"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="size-5 text-sapphire" aria-hidden="true" />
                <h2 className="font-mincho text-3xl" id="steps-heading">
                  やってみる
                </h2>
              </div>
              <ol className="soft-panel soft-panel-clip mt-7 border border-rule bg-paper-white">
                {column.steps.map((step, index) => (
                  <li
                    className="flex items-start gap-4 border-b border-rule p-5 last:border-b-0 sm:p-6"
                    key={step}
                  >
                    <span className="soft-control numeric-text grid size-8 shrink-0 place-items-center border border-sapphire/30 bg-sapphire-soft text-xs font-semibold text-sapphire">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 text-sm leading-7 sm:text-base sm:leading-8">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className="soft-card mt-8 border-l-4 border-sapphire bg-paper-white p-6 sm:p-8"
              aria-labelledby="example-heading"
            >
              <h2
                className="text-xs font-semibold tracking-[0.12em] text-sapphire"
                id="example-heading"
              >
                たとえると
              </h2>
              <p className="mt-4 whitespace-pre-line font-mincho text-xl leading-9 sm:text-2xl">
                {column.example}
              </p>
            </section>

            <aside className="soft-control mt-6 border border-warning/30 bg-sunrise-soft p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert
                  className="mt-0.5 size-5 shrink-0 text-warning"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="text-sm font-semibold text-warning">
                    ここだけ注意
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-ink/80">
                    {column.caution}
                  </p>
                </div>
              </div>
            </aside>

            {sources.length > 0 ? (
              <section
                className="mt-12 border-t border-rule pt-7 sm:mt-16"
                aria-labelledby="sources-heading"
              >
                <h2 className="font-mincho text-3xl" id="sources-heading">
                  公式資料で確かめる
                </h2>
                <p className="mt-3 text-sm leading-7 text-quiet">
                  画面の名前や使える機能は変わることがあります。今の表示と公式資料を優先してください。
                  公式資料には英語のページも含まれます。
                </p>
                <ul className="soft-card mt-6 divide-y divide-rule overflow-hidden border border-rule bg-paper-white">
                  {sources.map((source) => (
                    <li key={source.id}>
                      <a
                        aria-label={`${source.label}（新しいタブで開く）`}
                        className="group flex min-h-16 items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-deep-green hover:bg-sapphire-soft"
                        href={source.url}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {source.label}
                        <ExternalLink
                          className="size-4 shrink-0 text-sapphire transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </article>

        {relatedColumns.length > 0 ? (
          <section className="border-y border-rule bg-paper-white px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
            <div className="mx-auto w-full max-w-[1120px]">
              <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                次に読むなら
              </p>
              <h2 className="mt-3 font-mincho text-3xl sm:text-4xl">
                あわせて読みたいコラム
              </h2>
              <ol className="mt-8 grid gap-4 md:grid-cols-3">
                {relatedColumns.map((related) => (
                  <li key={related.slug}>
                    <Link
                      className="soft-card soft-interactive group flex h-full min-h-44 flex-col border border-rule bg-paper p-6 hover:border-sapphire"
                      href={textbookColumnPath(related.slug)}
                    >
                      <span className="text-xs font-semibold text-sapphire">
                        {getChatgptColumnCategory(related.category)?.label ??
                          related.category}
                      </span>
                      <span className="mt-4 block font-mincho text-xl leading-8">
                        {related.title}
                      </span>
                      <span className="mt-auto flex items-center justify-end pt-5 text-sapphire">
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}

        <section className="bg-paper px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
          <div className="soft-panel mx-auto flex w-full max-w-[1120px] flex-col gap-6 border border-sapphire/30 bg-sapphire-soft p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="flex items-start gap-4">
              <BookOpenText
                className="mt-1 size-6 shrink-0 text-sapphire"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-mincho text-2xl">今度は、教科書で試す。</h2>
                <p className="mt-2 text-sm leading-7 text-quiet">
                  作りたいものから1課題を選べます。
                </p>
              </div>
            </div>
            <Link
              className="button-glow inline-flex min-h-12 shrink-0 items-center justify-center gap-5 px-6 text-sm font-semibold text-white"
              href={textbookExplorePath}
            >
              学ぶことを探す
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
