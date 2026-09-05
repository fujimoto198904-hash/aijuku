import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <section className="as-panel">
          <p className="as-eyebrow">404</p>
          <h1>このページは見つかりませんでした。</h1>
          <p>投稿が非公開になったか、URLが変わった可能性があります。</p>
          <div className="as-action-row">
            <Link href="/" className="as-primary">
              ホームへ
            </Link>
            <Link href="/discover">投稿や教科書を探す →</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
