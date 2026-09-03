import { ArrowRight, Mail, MapPin } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import Link from '@/components/site-link';
import {
  textbookColumnsPath,
  textbookGuidePath,
  textbookSetupPath,
} from '@/lib/textbook-routes';

const footerLinks = [
  { href: '/#goals', label: '学んだ先' },
  { href: '/#curriculum', label: '始め方' },
  { href: textbookGuidePath, label: 'Web教科書' },
  { href: textbookSetupPath, label: 'ChatGPTの準備・プラン' },
  { href: textbookColumnsPath, label: 'ChatGPTコラム' },
  { href: '/#services', label: '受講方法' },
  { href: '/#faq', label: 'よくある質問' },
  { href: '/login', label: '会員ログイン' },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/15 bg-brand-dark px-5 py-14 text-paper sm:px-8 sm:py-18 lg:px-10">
      <div className="desktop-compact-footer mx-auto grid w-full max-w-[1240px] gap-12 border-b border-white/15 pb-12 md:grid-cols-[1.2fr_0.65fr_1fr] md:gap-10">
        <div>
          <Link
            className="flex items-center gap-3"
            href="/"
            aria-label="藤本実学塾 トップ"
          >
            <BrandMark className="size-11" framed />
            <span>
              <span className="block font-mincho text-xl font-semibold tracking-[0.05em]">
                藤本実学塾
              </span>
              <span className="block text-xs tracking-[0.06em] text-white/70">
                やりたいことが、できる毎日へ。
              </span>
            </span>
          </Link>
          <p className="mt-7 max-w-sm text-sm leading-7 text-white/65">
            Web教科書は無料。困ったときだけ、講師に聞けます。
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-white/65">
            サイト案内
          </p>
          <nav
            className="mt-5 grid gap-3 text-sm text-white/65"
            aria-label="フッターナビゲーション"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                className="hover:text-white"
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-white/65">
            運営本部・お問い合わせ
          </p>
          <div className="mt-5 grid gap-4 text-sm text-white/65">
            <p className="flex items-start gap-3">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-future-mint"
                aria-hidden="true"
              />
              愛知県豊田市東梅坪町10-4-9
            </p>
            <a
              className="flex items-center gap-3 hover:text-white"
              href="mailto:info@mon-ai.jp"
            >
              <Mail className="size-4 text-future-mint" aria-hidden="true" />
              info@mon-ai.jp
            </a>
          </div>
          <Link
            className="soft-outline-button group mt-7 inline-flex min-h-12 items-center gap-6 border border-white/35 px-5 text-sm font-semibold transition-colors hover:bg-white hover:text-brand-dark"
            href="/join"
          >
            無料会員登録
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <p className="mt-4 text-xs leading-6 text-white/65">
            教室会場は予約人数に合わせてご案内します。
          </p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-3 pt-6 text-xs leading-6 text-white/65 sm:flex-row sm:items-start sm:justify-between">
        <p>© 2026 藤本実学塾</p>
        <div className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
          <Link className="hover:text-white" href="/terms">
            無料会員利用規約
          </Link>
          <Link className="hover:text-white" href="/privacy">
            プライバシーポリシー
          </Link>
        </div>
      </div>
    </footer>
  );
}
