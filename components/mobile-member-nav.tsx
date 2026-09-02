'use client';

import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Link from '@/components/site-link';

const memberNavItems = [
  { href: '#home', label: 'ホーム' },
  { href: '#apply', label: '受講を申し込む' },
  { href: '#applications', label: '申込状況' },
  { href: '#learning', label: '学習の続き' },
  { href: '#skills', label: 'AI実学パスポート' },
  { href: '#account', label: '会員情報' },
] as const;

export function MobileMemberNav({
  signOutHref,
  readOnly = false,
}: {
  signOutHref: string;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  function closeMenu() {
    setOpen(false);
  }

  return (
    <div className="relative lg:hidden" ref={containerRef}>
      <button
        aria-controls={open ? 'mobile-member-navigation' : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? '会員メニューを閉じる' : '会員メニューを開く'}
        className="soft-control flex cursor-pointer items-center gap-2 border border-rule px-3 py-2 text-xs font-semibold"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        {open ? (
          <X className="size-4" aria-hidden="true" />
        ) : (
          <Menu className="size-4" aria-hidden="true" />
        )}
        メニュー
      </button>
      {open ? (
        <nav
          aria-label="モバイル会員メニュー"
          className="soft-panel absolute right-0 top-12 z-30 grid max-h-[calc(100dvh-4rem)] w-56 overflow-y-auto border border-rule bg-paper-white p-2 text-sm"
          id="mobile-member-navigation"
        >
          {memberNavItems
            .filter((item) => !readOnly || item.href !== '#apply')
            .map((item) => (
              <a
                className="soft-control px-4 py-3"
                href={item.href}
                key={item.href}
                onClick={closeMenu}
              >
                {item.label}
              </a>
            ))}
          <Link
            className="soft-control flex items-center gap-2 px-4 py-3 text-human-coral"
            href={signOutHref}
            onClick={closeMenu}
            target="_top"
          >
            <LogOut className="size-4" aria-hidden="true" />
            ログアウト
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
