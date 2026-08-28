import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';

import { ReservationForm } from '@/components/reservation-form';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: '無料体験を予約｜豊田Ai塾',
  description: '豊田Ai塾の初回無料体験を予約。平日18:00〜21:00、ブリッジスタッフサービスで開催します。',
};

export default function ReservePage() {
  return (
    <main className="min-h-screen bg-[#fbf8f1] text-ink">
      <SiteHeader />
      <section className="px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
        <div className="mx-auto w-full max-w-[1160px]">
          <div className="mb-10 max-w-[760px]">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] font-bold tracking-[0.2em] text-coral"><span className="h-px w-7 bg-coral" aria-hidden="true" />FREE TRIAL</div>
            <h1 className="text-[clamp(2.7rem,6vw,5.5rem)] font-black leading-[0.98] tracking-[-0.06em]">最初の1問を、<br /><span className="text-coral">無料で完成</span>させる。</h1>
            <p className="mt-6 max-w-[650px] text-base leading-8 text-ink/58">AIが初めてでも大丈夫です。現在地を確認し、あなたに合うミッションを一つ選んで、実際の成果物まで一緒に進めます。</p>
            <div className="mt-5 inline-flex items-start gap-2 rounded-xl bg-amber/18 px-4 py-3 text-xs leading-6 text-[#765017]"><ShieldCheck className="mt-1 size-3.5 shrink-0" aria-hidden="true" />先行公開中の予約体験デモです。本番の送信・決済は、運営情報と規約の確定後に有効化します。</div>
          </div>
          <ReservationForm />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
