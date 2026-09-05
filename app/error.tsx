'use client';
import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <section className="as-panel">
          <h1>読み込めませんでした。</h1>
          <p>
            少し待ってから、もう一度お試しください。入力した内容が保存されたかは、マイページで確認できます。
          </p>
          <div className="as-action-row">
            <Button onClick={reset}>もう一度読み込む</Button>
            <Link href="/textbook">教科書へ</Link>
            <Link href="/mypage">マイページへ</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
