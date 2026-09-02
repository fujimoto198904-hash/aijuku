import type { Metadata } from "next";

import { canonicalSiteUrl, withSiteBasePath } from "@/lib/site-paths";
import { textbookCatalog } from "@/lib/textbook-catalog";

import "./globals.css";

const siteUrl = canonicalSiteUrl;
const socialImageUrl = `${canonicalSiteUrl}/brand/fujimoto-jitsugaku-og-1200x630.png`;
const allLessonDetailsPublished =
  textbookCatalog.stats.lessonDrafts === textbookCatalog.stats.total;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "藤本実学塾｜AIを、暮らしと仕事の力に",
  description: `AIが初めての方も、${allLessonDetailsPublished ? `詳しい手順つきの全${textbookCatalog.stats.total}課題` : `現在公開中の詳しい${textbookCatalog.stats.lessonDrafts}課題と、選べる全${textbookCatalog.stats.total}課題の骨格`}から、暮らしや仕事で使えるものを一つずつ形にするAI実学塾です。`,
  icons: {
    icon: withSiteBasePath("/brand/fujimoto-jitsugaku-mark.svg"),
  },
  openGraph: {
    title: "藤本実学塾｜AIを、暮らしと仕事の力に",
    description:
      "730を全部やるのではなく、今つくりたい一つから。東京23区内の対面と全国オンラインで学ぶAI実学塾です。",
    type: "website",
    locale: "ja_JP",
    images: [
      {
        url: socialImageUrl,
        width: 1200,
        height: 630,
        alt: "蝶のシンボルと『AIを、すべての人の実学へ。』のメッセージ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "藤本実学塾｜AIを、暮らしと仕事の力に",
    description:
      "730を全部やるのではなく、今つくりたい一つから。東京23区内の対面と全国オンラインで学ぶAI実学塾です。",
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
