import type { Metadata } from 'next';
import { Info } from 'lucide-react';

import { FoundationCheck } from '@/components/level-test';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { canonicalPublicPath } from '@/lib/site-paths';

export const metadata: Metadata = {
  title: '基礎理解チェック｜藤本実学塾',
  description:
    'AIを安全に仕事で使うための、情報確認と判断の基礎理解チェックです。',
  alternates: { canonical: canonicalPublicPath('/level-test') },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function LevelTestPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="min-h-screen bg-paper text-ink">
        <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto w-full max-w-[1160px]">
            <div className="mx-auto mb-10 max-w-[850px]">
              <div className="mb-5 flex items-center gap-3 text-xs font-bold tracking-[0.08em] text-coral">
                <span className="h-px w-7 bg-coral" aria-hidden="true" />
                基礎理解チェック{' '}
                <span className="font-mono text-xs">CHECK</span>
              </div>
              <h1 className="display-heading text-[clamp(2.35rem,5vw,4.4rem)]">
                AIを仕事で使う前に、
                <br />
                <span className="display-emphasis text-coral">
                  基礎を確かめる。
                </span>
              </h1>
              <p className="mt-6 max-w-[680px] text-base leading-8 text-ink/68">
                4択10問で、AIを安全に使うための基礎を確認します。
              </p>
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-sapphire-soft px-4 py-3 text-xs leading-6 text-sapphire">
                <Info className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
                これは体験版です。結果は保存されず、正式な認定にはなりません。
              </div>
            </div>
            <FoundationCheck />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
