import { ArrowUpRight, CircleHelp } from 'lucide-react';

import Link from '@/components/site-link';
import { textbookColumnPath } from '@/lib/textbook-routes';

export type LessonColumnSummary = {
  slug: string;
  title: string;
  lead: string;
  categoryLabel: string;
};

type LessonColumnsProps = {
  columns: readonly LessonColumnSummary[];
};

export function LessonColumns({ columns }: LessonColumnsProps) {
  if (columns.length === 0) return null;

  return (
    <aside
      className="soft-panel mt-6 border border-sapphire/25 bg-sapphire-soft/45 p-5 sm:p-6"
      aria-labelledby="lesson-columns-title"
    >
      <div className="flex items-start gap-3">
        <span className="soft-badge grid size-10 shrink-0 place-items-center bg-paper-white text-sapphire shadow-[0_6px_18px_rgba(16,42,54,0.06)]">
          <CircleHelp className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p
            id="lesson-columns-title"
            className="font-mincho text-xl text-deep-green"
          >
            始める前に、2分だけ
          </p>
          <p className="mt-1 text-xs leading-6 text-quiet">
            知らない言葉があるときだけ。分かる方は、そのまま進めます。
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {columns.map((column) => (
          <Link
            key={column.slug}
            className="soft-control group flex min-h-[104px] items-start gap-3 border border-rule bg-paper-white p-4 transition-colors hover:border-sapphire"
            href={textbookColumnPath(column.slug)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${column.title}（新しいタブで開く）`}
          >
            <span className="min-w-0 flex-1">
              <span className="block text-[10px] font-semibold tracking-[0.08em] text-rust">
                {column.categoryLabel}
              </span>
              <span className="mt-1.5 block text-sm font-semibold leading-6 text-ink">
                {column.title}
              </span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-quiet">
                {column.lead}
              </span>
            </span>
            <ArrowUpRight
              className="mt-1 size-4 shrink-0 text-sapphire transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        ))}
      </div>
    </aside>
  );
}
