import type { Metadata, Viewport } from 'next';

import { canonicalSiteUrl, withSiteBasePath } from '@/lib/site-paths';

import './globals.css';
import './composer.css';
import './aistock.css';
import './social.css';
import './portfolio.css';

const siteUrl = canonicalSiteUrl;
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'AIstock｜MON-ai 制作実績',
  description:
    'AI学習コミュニティの制作実績。教材と投稿フィードを閲覧できます。更新・お問い合わせの受付は終了しています。',
  icons: {
    icon: withSiteBasePath('/brand/aistock-mark.svg'),
  },
  openGraph: {
    title: 'AIstock｜MON-ai 制作実績',
    description:
      '教科書と投稿フィードを組み合わせた、AI学習コミュニティのポートフォリオ。',
    type: 'website',
    locale: 'ja_JP',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'AIstock｜MON-ai 制作実績',
    description:
      '教科書と投稿フィードを組み合わせた、AI学習コミュニティのポートフォリオ。',
    images: [],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="soft-ui aistock-app antialiased">
        <a
          className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-xl bg-brand-dark px-5 py-3 text-sm font-semibold text-white shadow-xl transition-transform focus:translate-y-0 focus:outline-none focus:ring-4 focus:ring-future-mint/70"
          href="#main-content"
        >
          本文へ進む
        </a>
        {children}
      </body>
    </html>
  );
}
