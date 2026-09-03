import { ArrowRight, BookOpenText, Lightbulb } from 'lucide-react';
import type { Metadata } from 'next';

import { BrandMark } from '@/components/brand-mark';
import {
  ColumnExplorer,
  type ColumnListItem,
} from '@/components/columns/column-explorer';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import Link from '@/components/site-link';
import { TextbookSubnav } from '@/components/textbook/textbook-subnav';
import {
  type ChatgptColumnCategoryId,
  chatgptColumnCategories,
  chatgptColumns,
  getChatgptColumnCategory,
} from '@/lib/chatgpt-columns';
import { canonicalPublicPath } from '@/lib/site-paths';
import {
  textbookColumnPath,
  textbookColumnsPath,
  textbookExplorePath,
} from '@/lib/textbook-routes';

export const metadata: Metadata = {
  title: 'ChatGPTコラム｜Web教科書｜藤本実学塾',
  description:
    'ChatGPTの画面、設定、モデル、Codex、GitHubなど、教科書で出てくる言葉を約2分で確認できます。',
  alternates: { canonical: canonicalPublicPath(textbookColumnsPath) },
};

function columnNumber(id: number) {
  return `COLUMN ${String(id).padStart(3, '0')}`;
}

function categoryLabel(categoryId: ChatgptColumnCategoryId) {
  return getChatgptColumnCategory(categoryId)?.label ?? categoryId;
}

const columnListItems: readonly ColumnListItem[] = chatgptColumns.map(
  (column) => ({
    id: columnNumber(column.id),
    slug: column.slug,
    categoryId: column.category,
    categoryLabel: categoryLabel(column.category),
    title: column.title,
    lead: column.lead,
    readMinutes: 2,
    keywords: column.keywords,
  }),
);

const featuredColumns = chatgptColumns
  .filter((column) => column.starter)
  .slice(0, 6);

export default function ChatgptColumnsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <TextbookSubnav current="columns" />

        <section className="section-aura border-b border-rule bg-deep-green px-5 py-14 text-white sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto grid w-full max-w-[1240px] gap-9 lg:grid-cols-[1.08fr_0.72fr] lg:items-end">
            <div>
              <div className="flex items-center gap-4">
                <BrandMark className="size-10" framed />
                <p className="text-xs font-semibold tracking-[0.14em] text-future-mint">
                  ChatGPTコラム
                </p>
              </div>
              <h1 className="text-soft-glow mt-7 max-w-4xl font-mincho text-[clamp(2.6rem,5.8vw,5.4rem)] font-medium leading-[1.1] tracking-[-0.045em]">
                「これ何？」が、
                <br />
                すぐ分かる。
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-8 text-white/75 sm:text-lg sm:leading-9">
                教科書で出てくる言葉と仕組みを、100本の短いコラムにしました。分からない所だけ読めば大丈夫です。
              </p>
            </div>

            <aside className="soft-card border border-white/20 bg-white/10 p-7 backdrop-blur-sm sm:p-8">
              <Lightbulb
                className="size-6 text-future-mint"
                aria-hidden="true"
              />
              <p className="mt-5 font-mincho text-2xl leading-9">
                教科書からも、必要なコラムが開きます。
              </p>
              <p className="mt-4 text-sm leading-7 text-white/65">
                課題を始める前に知っておくと楽な内容だけ、その教科書に表示します。
              </p>
            </aside>
          </div>
        </section>

        {featuredColumns.length > 0 ? (
          <section className="border-b border-rule bg-paper-white px-5 py-12 sm:px-8 sm:py-16 lg:px-10">
            <div className="mx-auto w-full max-w-[1240px]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                    初めての方へ
                  </p>
                  <h2 className="mt-3 font-mincho text-3xl leading-tight sm:text-4xl">
                    まずは、このコラムから。
                  </h2>
                </div>
                <p className="max-w-md text-xs leading-6 text-quiet">
                  すべて読む必要はありません。気になるものを1本選びます。
                </p>
              </div>
              <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredColumns.map((column) => (
                  <li key={column.slug}>
                    <Link
                      className="soft-card soft-interactive group flex h-full min-h-44 flex-col border border-sapphire/25 bg-sapphire-soft p-6 transition-colors hover:border-sapphire sm:p-7"
                      href={textbookColumnPath(column.slug)}
                    >
                      <span className="flex items-center justify-between gap-3 text-xs">
                        <span className="font-semibold text-sapphire">
                          {categoryLabel(column.category)}
                        </span>
                        <span className="numeric-text text-quiet">
                          {columnNumber(column.id)}
                        </span>
                      </span>
                      <span className="mt-5 block font-mincho text-xl leading-8">
                        {column.title}
                      </span>
                      <span className="mt-auto flex items-center justify-between gap-4 pt-5 text-xs font-semibold text-sapphire">
                        約2分で読む
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

        <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto w-full max-w-[1240px]">
            <ColumnExplorer
              categories={chatgptColumnCategories.map((category) => ({
                id: category.id,
                label: category.label,
              }))}
              columns={columnListItems}
            />
          </div>
        </section>

        <section className="border-t border-rule bg-paper-white px-5 py-12 sm:px-8 lg:px-10">
          <div className="soft-panel mx-auto flex w-full max-w-[1240px] flex-col gap-6 border border-sapphire/30 bg-sapphire-soft p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div className="flex items-start gap-4">
              <BookOpenText
                className="mt-1 size-6 shrink-0 text-sapphire"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-mincho text-2xl">
                  言葉が分かったら、作ってみる。
                </h2>
                <p className="mt-2 text-sm leading-7 text-quiet">
                  Web教科書は、登録なしで無料で始められます。
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
