'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import Link from '@/components/site-link';

export function MobileSiteNav({
  items,
}: {
  items: readonly { href: string; label: string }[];
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
    <div className="relative xl:hidden" ref={containerRef}>
      <button
        aria-controls={open ? 'mobile-site-navigation' : undefined}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? 'メニューを閉じる' : 'メニューを開く'}
        className="soft-control grid size-11 cursor-pointer place-items-center border border-interactive-border bg-paper-white shadow-[0_8px_24px_rgba(16,42,54,0.07)] transition-colors hover:border-sapphire hover:text-sapphire"
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        type="button"
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </button>
      {open ? (
        <nav
          aria-label="モバイルナビゲーション"
          className="soft-popover absolute right-0 top-13 z-50 grid max-h-[calc(100dvh-5rem)] w-64 overflow-y-auto border border-rule bg-paper p-2 text-sm"
          id="mobile-site-navigation"
        >
          {items.map((item) => (
            <Link
              className="border-b border-rule px-4 py-3 last:border-b-0 hover:bg-paper-white hover:text-sapphire"
              href={item.href}
              key={item.href}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
          <Link
            className="soft-control mt-2 border border-sapphire px-4 py-3 text-center font-semibold text-sapphire"
            href="/login"
            onClick={closeMenu}
          >
            ログイン
          </Link>
          <Link
            className="button-glow mt-2 px-4 py-3 text-center font-semibold text-white"
            href="/join"
            onClick={closeMenu}
          >
            無料会員登録
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
