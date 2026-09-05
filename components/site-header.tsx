'use client';
import { usePathname } from 'next/navigation';
import {
  House,
  Search,
  SquarePlus,
  BookOpen,
  UserRound,
  ArrowUpRight,
  MessageCircle,
} from 'lucide-react';
import Link from '@/components/site-link';
import { withoutSiteBasePath } from '@/lib/site-paths';
import { isAistockNavActive } from '@/lib/aistock-navigation';
const items = [
  { href: '/', label: 'ホーム', Icon: House },
  { href: '/discover', label: '見つける', Icon: Search },
  { href: '/community/new', label: '投稿する', Icon: SquarePlus },
  { href: '/learn', label: '学ぶ', Icon: BookOpen },
  { href: '/mypage', label: 'マイページ', Icon: UserRound },
];
export function AistockLogo() {
  return (
    <span className="aistock-logo">
      <span className="aistock-logo-wordmark">
        AIstock
        <span className="aistock-logo-symbol" aria-hidden="true">
          ✦
        </span>
      </span>
      <span className="aistock-logo-reading">アイトック</span>
    </span>
  );
}
export function SiteHeader() {
  const pathname = withoutSiteBasePath(usePathname() || '/');
  return (
    <>
      <header className="as-header">
        <Link href="/" aria-label="AIstock（アイトック）ホーム">
          <AistockLogo />
        </Link>
        <Link href="/discover" className="as-header-search">
          <Search size={18} aria-hidden="true" />
          <span>やってみたいことを探す</span>
        </Link>
        <Link
          href="/messages"
          className="as-header-messages as-icon-button"
          aria-label="メッセージ"
        >
          <MessageCircle size={23} />
        </Link>
        <Link href="/join" className="as-join">
          無料で参加 <ArrowUpRight size={16} />
        </Link>
      </header>
      <nav className="as-navigation" aria-label="メインナビゲーション">
        <Link
          href="/"
          className="as-desktop-logo"
          aria-label="AIstock（アイトック）ホーム"
        >
          <AistockLogo />
        </Link>
        <div className="as-nav-items">
          {items.map(({ href, label, Icon }) => {
            const selected = isAistockNavActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={selected ? 'page' : undefined}
                className={selected ? 'as-nav-item is-active' : 'as-nav-item'}
              >
                <span className="as-nav-icon" aria-hidden="true">
                  <Icon size={23} strokeWidth={selected ? 2.2 : 1.7} />
                </span>
                <span className="as-nav-label">{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="as-nav-bottom">
          <p>
            小さな発見を、
            <br />
            自分の力に。
          </p>
          <Link href="/join" className="as-primary">
            無料会員登録
          </Link>
          <Link href="/login" className="as-login">
            ログイン
          </Link>
          <small>運営：MON-ai</small>
        </div>
      </nav>
    </>
  );
}
