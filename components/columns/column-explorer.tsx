'use client';

import { ArrowRight, BookOpenText, Search } from 'lucide-react';
import { useDeferredValue, useMemo, useState } from 'react';

import Link from '@/components/site-link';
import { textbookColumnPath } from '@/lib/textbook-routes';

export type ColumnCategoryOption = {
  id: string;
  label: string;
};

export type ColumnListItem = {
  id: string;
  slug: string;
  categoryId: string;
  categoryLabel: string;
  title: string;
  lead: string;
  readMinutes: number;
  keywords: readonly string[];
};

function normalizeSearch(value: string) {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .replace(/[　\s\p{P}\p{S}]+/gu, '');
}

const firstPageSize = 24;

export function ColumnExplorer({
  columns,
  categories,
}: {
  columns: readonly ColumnListItem[];
  categories: readonly ColumnCategoryOption[];
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(firstPageSize);
  const deferredQuery = useDeferredValue(query);

  const filteredColumns = useMemo(() => {
    const normalizedQuery = normalizeSearch(deferredQuery);

    return columns.filter((column) => {
      if (category !== 'all' && column.categoryId !== category) return false;
      if (!normalizedQuery) return true;

      return normalizeSearch(
        [
          column.id,
          column.title,
          column.lead,
          column.categoryLabel,
          ...column.keywords,
        ].join(' '),
      ).includes(normalizedQuery);
    });
  }, [category, columns, deferredQuery]);

  const visibleColumns = filteredColumns.slice(0, visibleCount);

  function selectCategory(nextCategory: string) {
    setCategory(nextCategory);
    setVisibleCount(firstPageSize);
  }

  return (
    <section aria-labelledby="column-search-heading">
      <div className="soft-panel border border-rule bg-paper-white p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.12em] text-sapphire">
              知りたい言葉から探す
            </p>
            <h2
              className="mt-3 font-mincho text-2xl leading-tight sm:text-3xl"
              id="column-search-heading"
            >
              「これ何？」をすぐ調べる
            </h2>
          </div>
          <p className="text-xs leading-6 text-quiet">
            全{columns.length}本・1本約2分
          </p>
        </div>

        <label className="mt-6 block">
          <span className="sr-only">ChatGPTコラムを検索</span>
          <span className="soft-control flex min-h-14 items-center gap-3 border border-interactive-border bg-white px-4 shadow-[0_8px_24px_rgba(16,42,54,0.055)] focus-within:border-sapphire">
            <Search
              className="size-5 shrink-0 text-sapphire"
              aria-hidden="true"
            />
            <input
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-quiet"
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(firstPageSize);
              }}
              placeholder="例：モデル、GitHub、アクセス権…"
              type="search"
              value={query}
            />
          </span>
        </label>

        <label className="mt-4 block sm:hidden">
          <span className="mb-2 block text-xs font-semibold text-quiet">
            分野で絞り込む
          </span>
          <select
            className="soft-control min-h-12 w-full border border-interactive-border bg-white px-4 text-sm"
            onChange={(event) => selectCategory(event.target.value)}
            value={category}
          >
            <option value="all">すべての分野</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="mt-5 hidden border-0 p-0 sm:block">
          <legend className="sr-only">分野で絞り込む</legend>
          <div className="flex flex-wrap gap-2">
            <button
              aria-pressed={category === 'all'}
              className={`soft-badge min-h-11 border px-4 text-xs font-semibold transition-colors ${
                category === 'all'
                  ? 'border-deep-green bg-deep-green text-white'
                  : 'border-rule bg-white text-quiet hover:border-sapphire hover:text-sapphire'
              }`}
              onClick={() => selectCategory('all')}
              type="button"
            >
              すべて
            </button>
            {categories.map((item) => (
              <button
                aria-pressed={category === item.id}
                className={`soft-badge min-h-11 border px-4 text-xs font-semibold transition-colors ${
                  category === item.id
                    ? 'border-sapphire bg-sapphire text-white'
                    : 'border-rule bg-white text-quiet hover:border-sapphire hover:text-sapphire'
                }`}
                key={item.id}
                onClick={() => selectCategory(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <output className="mt-5 block text-xs text-quiet" aria-live="polite">
          {filteredColumns.length}本見つかりました
        </output>
      </div>

      {visibleColumns.length > 0 ? (
        <ol className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleColumns.map((column) => (
            <li className="min-w-0" key={column.slug}>
              <Link
                className="soft-card soft-interactive group flex h-full min-h-64 flex-col border border-rule bg-paper-white p-6 transition-colors hover:border-sapphire sm:p-7"
                href={textbookColumnPath(column.slug)}
              >
                <span className="flex items-center justify-between gap-4">
                  <span className="soft-badge border border-sapphire/25 bg-sapphire-soft px-3 py-1 text-[11px] font-semibold text-sapphire">
                    {column.categoryLabel}
                  </span>
                  <span className="numeric-text text-xs text-quiet">
                    {column.id}
                  </span>
                </span>
                <span className="mt-6 block font-mincho text-2xl font-medium leading-9">
                  {column.title}
                </span>
                <span className="mt-4 line-clamp-3 block text-sm leading-7 text-quiet">
                  {column.lead}
                </span>
                <span className="mt-auto flex items-center justify-between gap-4 border-t border-rule pt-5 text-xs font-semibold text-sapphire">
                  <span className="inline-flex items-center gap-2">
                    <BookOpenText className="size-4" aria-hidden="true" />約
                    {column.readMinutes}分で読む
                  </span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="soft-panel mt-7 border border-rule bg-paper-white p-8 text-center sm:p-12">
          <Search className="mx-auto size-6 text-sapphire" aria-hidden="true" />
          <p className="mt-4 font-mincho text-2xl">まだ見つかりません。</p>
          <p className="mt-3 text-sm leading-7 text-quiet">
            「ファイル」「モデル」のように、短い言葉で探してみてください。
          </p>
        </div>
      )}

      {visibleCount < filteredColumns.length ? (
        <div className="mt-7 flex justify-center">
          <button
            className="soft-outline-button min-h-12 border border-deep-green px-6 text-sm font-semibold text-deep-green transition-colors hover:bg-deep-green hover:text-white"
            onClick={() => setVisibleCount((count) => count + firstPageSize)}
            type="button"
          >
            次の{Math.min(firstPageSize, filteredColumns.length - visibleCount)}
            本を表示
          </button>
        </div>
      ) : null}
    </section>
  );
}
