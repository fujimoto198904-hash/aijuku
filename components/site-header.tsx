import { BrandMark } from '@/components/brand-mark';
import { MobileSiteNav } from '@/components/mobile-site-nav';
import Link from '@/components/site-link';
import { textbookColumnsPath, textbookGuidePath } from '@/lib/textbook-routes';

const navItems = [
  { href: '/#goals', label: '学んだ先' },
  { href: '/#curriculum', label: '始め方' },
  { href: textbookGuidePath, label: 'Web教科書' },
  { href: textbookColumnsPath, label: 'ChatGPTコラム' },
  { href: '/#learning', label: '学び方' },
  { href: '/#services', label: '受講方法' },
  { href: '/#faq', label: 'よくある質問' },
] as const;

export function SiteHeader() {
  return (
    <header className="relative z-40 border-b border-rule bg-paper/95 text-ink backdrop-blur-xl">
      <div className="mx-auto flex min-h-[78px] w-full max-w-[1440px] items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
        <Link
          className="flex min-w-0 items-center gap-3"
          href="/"
          aria-label="藤本実学塾 トップ"
        >
          <BrandMark />
          <span className="min-w-0">
            <span className="block truncate font-mincho text-lg font-semibold tracking-[0.04em]">
              藤本実学塾
            </span>
            <span className="desktop-compact-tagline hidden text-xs tracking-[0.06em] text-quiet sm:block">
              AIが初めてでも、作りたいものから。
            </span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 text-xs font-semibold xl:flex xl:gap-8"
          aria-label="メインナビゲーション"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              className="border-b border-transparent py-2 transition-colors hover:border-sapphire hover:text-sapphire"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <nav
          className="desktop-compact-nav items-center gap-4 text-xs font-semibold"
          aria-label="メインナビゲーション（コンパクト）"
        >
          <Link
            className="border-b border-transparent py-2 transition-colors hover:border-sapphire hover:text-sapphire"
            href={textbookGuidePath}
          >
            Web教科書
          </Link>
          <Link
            className="border-b border-transparent py-2 transition-colors hover:border-sapphire hover:text-sapphire"
            href={textbookColumnsPath}
          >
            コラム
          </Link>
          <Link
            className="border-b border-transparent py-2 transition-colors hover:border-sapphire hover:text-sapphire"
            href="/#services"
          >
            受講方法
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            className="desktop-compact-login hidden min-h-11 items-center justify-center px-3 text-xs font-semibold text-quiet transition-colors hover:text-sapphire md:inline-flex"
            href="/login"
          >
            ログイン
          </Link>
          <Link
            className="button-glow hidden min-h-11 items-center justify-center px-5 text-xs font-semibold text-white min-[430px]:inline-flex"
            href="/join"
          >
            無料会員登録
          </Link>

          <MobileSiteNav items={navItems} />
        </div>
      </div>
    </header>
  );
}
