import { BookOpenText, Check, ExternalLink, Map, Search } from 'lucide-react';

import Link from '@/components/site-link';
import {
  textbookExplorePath,
  textbookGuidePath,
  textbookLessonPath,
} from '@/lib/textbook-routes';

export type TextbookSubnavCurrent = 'guide' | 'explore' | 'lesson';

type TextbookSubnavProps = {
  current: TextbookSubnavCurrent;
};

const items = [
  {
    id: 'guide',
    number: '01',
    label: '使い方',
    hint: 'はじめにここ',
    href: textbookGuidePath,
    Icon: Map,
  },
  {
    id: 'explore',
    number: '02',
    label: '学ぶことを探す',
    hint: '目的から選ぶ',
    href: textbookExplorePath,
    Icon: Search,
  },
  {
    id: 'lesson',
    number: '03',
    label: '教科書を読む',
    hint: '1課題を別タブで',
    href: textbookLessonPath('Lv.01'),
    Icon: BookOpenText,
  },
] as const;

export function TextbookSubnav({ current }: TextbookSubnavProps) {
  return (
    <nav
      className="border-b border-rule bg-paper-white px-4 py-4 sm:px-8"
      aria-label="Web教科書の進み方"
    >
      <ol className="mx-auto grid w-full max-w-[1240px] gap-2 sm:grid-cols-3">
        {items.map(({ id, number, label, hint, href, Icon }) => {
          const isCurrent = current === id;
          const opensNewTab = id === 'lesson' && !isCurrent;
          const content = (
            <>
              <span
                className={`grid size-10 shrink-0 place-items-center border ${
                  isCurrent
                    ? 'border-white/15 bg-white/10 text-future-mint'
                    : 'border-rule bg-sapphire-soft text-sapphire'
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[10px] font-semibold tracking-[0.12em] ${
                    isCurrent ? 'text-future-mint' : 'text-quiet'
                  }`}
                >
                  STEP {number}
                </span>
                <span className="mt-1 block text-sm font-semibold">
                  {label}
                </span>
                <span
                  className={`mt-0.5 block text-[11px] ${
                    isCurrent ? 'text-white/60' : 'text-quiet'
                  }`}
                >
                  {isCurrent ? '現在地' : hint}
                </span>
              </span>
              {isCurrent ? (
                <Check
                  className="size-4 shrink-0 text-future-mint"
                  aria-hidden="true"
                />
              ) : opensNewTab ? (
                <ExternalLink
                  className="size-4 shrink-0 text-quiet"
                  aria-hidden="true"
                />
              ) : null}
            </>
          );

          return (
            <li key={id}>
              {isCurrent ? (
                <span
                  className="soft-control flex min-h-[76px] items-center gap-3 bg-brand-dark px-4 py-3 text-white"
                  aria-current="page"
                >
                  {content}
                </span>
              ) : (
                <Link
                  className="soft-control flex min-h-[76px] items-center gap-3 border border-rule bg-paper-white px-4 py-3 transition-colors hover:border-sapphire hover:bg-sapphire-soft/45"
                  href={href}
                  target={opensNewTab ? '_blank' : undefined}
                  rel={opensNewTab ? 'noopener noreferrer' : undefined}
                  aria-label={
                    opensNewTab ? `${label}（新しいタブで開く）` : undefined
                  }
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
