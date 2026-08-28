import type { Metadata } from 'next';
import { Info } from 'lucide-react';

import { LevelTest } from '@/components/level-test';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '4択レベルテスト体験｜豊田Ai塾',
  description: '豊田Ai塾独自基準のレベルテストを4問のデモで体験できます。',
};

export default function LevelTestPage() {
  return (
    <main className="min-h-screen bg-[#fbf8f1] text-ink">
      <SiteHeader />
      <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mx-auto mb-10 max-w-[850px]">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] font-bold tracking-[0.2em] text-coral"><span className="h-px w-7 bg-coral" aria-hidden="true" />LEVEL TEST / DEMO</div>
            <h1 className="text-[clamp(2.6rem,6vw,5rem)] font-black leading-[0.99] tracking-[-0.06em]">AIを使う力には、<br /><span className="text-coral">確かめる力</span>もある。</h1>
            <p className="mt-6 max-w-[680px] text-base leading-8 text-ink/58">4問のサンプルで、情報確認と安全性の判断を体験してください。正式版では段階ごとの4択テストと成果物レビューを組み合わせます。</p>
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-cyan/10 px-4 py-3 text-xs leading-6 text-[#176b77]"><Info className="mt-1 size-3.5 shrink-0" aria-hidden="true" />この結果はデモです。豊田Ai塾の正式な到達証・資格として保存または発行されません。</div>
          </div>
          <LevelTest />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
