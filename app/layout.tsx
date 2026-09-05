import type { Metadata } from 'next';

import { canonicalSiteUrl, withSiteBasePath } from '@/lib/site-paths';

import './globals.css';
import './aistock.css';

const siteUrl = canonicalSiteUrl;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'AIstock｜無料のAI勉強部屋',
  description:
    'Web教科書は無料。AIが初めてでも、作りたいものから始められます。',
  icons: {
    icon: withSiteBasePath('/brand/aistock-mark.svg'),
  },
  openGraph: {
    title: 'AIstock｜無料のAI勉強部屋',
    description:
      '教科書で学ぶ。質問する。気づきを持ち寄る。MON-aiの無料コミュニティ。',
    type: 'website',
    locale: 'ja_JP',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'AIstock｜無料のAI勉強部屋',
    description:
      '教科書で学ぶ。質問する。気づきを持ち寄る。MON-aiの無料コミュニティ。',
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
