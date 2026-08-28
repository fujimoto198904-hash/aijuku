import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://toyota-ai-school.mondism.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '豊田Ai塾｜AIを、使えるから、つくれるへ。',
  description:
    '豊田市で学ぶ大人向けの対面AI塾。100の実践課題を自分のペースで進め、困った時はMONがサポート。平日18時〜21時、月額5,000円。',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: '豊田Ai塾｜AIを、使えるから、つくれるへ。',
    description:
      '100の実践課題を、自分のペースで。ひとりで進める。困った時は、隣にMONがいる。',
    type: 'website',
    locale: 'ja_JP',
    images: [
      {
        url: '/og.png',
        width: 1672,
        height: 941,
        alt: '豊田Ai塾 - AIを、使えるから、つくれるへ。',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '豊田Ai塾｜AIを、使えるから、つくれるへ。',
    description:
      '豊田の夜にひらく、大人のための対面AI工房。平日18時〜21時、月額5,000円。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
