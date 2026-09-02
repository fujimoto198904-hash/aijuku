import type { Metadata } from 'next';
import { LockKeyhole } from 'lucide-react';

import { BrandMark } from '@/components/brand-mark';
import Link from '@/components/site-link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '評価機能について｜藤本実学塾',
  description: '第三者評価機能は提供していません。',
  robots: { index: false, follow: false },
};

export default function ReviewUnavailablePage() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center bg-paper px-5 text-ink"
    >
      <section className="soft-panel w-full max-w-xl border border-rule bg-paper-white p-8 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <BrandMark className="size-11" />
          <LockKeyhole aria-hidden="true" className="size-7 text-human-coral" />
        </div>
        <h1 className="mt-6 font-mincho text-3xl">
          第三者評価は提供していません
        </h1>
        <p className="mt-4 text-sm leading-7 text-quiet">
          藤本実学塾では、本人の実践記録と講師が確認した範囲を分けて残します。外部の方への評価依頼と評価の受付は行っていません。
        </p>
        <Link
          className="mt-7 inline-flex text-sm font-semibold text-sapphire"
          href="/"
        >
          藤本実学塾へ
        </Link>
      </section>
    </main>
  );
}
