import type { Metadata } from 'next';

import { canonicalSiteUrl, withSiteBasePath } from '@/lib/site-paths';

import './globals.css';

const siteUrl = canonicalSiteUrl;
const socialImageUrl = `${canonicalSiteUrl}/brand/fujimoto-jitsugaku-og-1200x630.png`;
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '藤本実学塾｜やりたいことが、できる毎日へ。',
  description:
    'Web教科書は無料。AIが初めてでも、作りたいものから始められます。',
  icons: {
    icon: withSiteBasePath('/brand/fujimoto-jitsugaku-mark.svg'),
  },
  openGraph: {
    title: '藤本実学塾｜やりたいことが、できる毎日へ。',
    description: 'Web教科書は無料。困ったときだけ、講師に聞けるAI塾です。',
    type: 'website',
    locale: 'ja_JP',
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: '蝶のシンボルと『AIを、すべての人の実学へ。』のメッセージ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '藤本実学塾｜やりたいことが、できる毎日へ。',
    description: 'Web教科書は無料。困ったときだけ、講師に聞けるAI塾です。',
    images: [socialImageUrl],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="soft-ui antialiased">
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
