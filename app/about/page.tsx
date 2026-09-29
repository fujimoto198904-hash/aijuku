import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from '@/components/site-link';
import { portfolioNotice } from '@/lib/site-features';

export const metadata = { title: 'この作品について｜AIstock' };

export default function About() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-portfolio-about">
        <p className="as-eyebrow">PORTFOLIO / MON-ai</p>
        <h1>
          AIを学ぶ場所を、
          <br />
          ひとつの作品に。
        </h1>
        <p>
          AIstockは、教科書と投稿フィードを組み合わせたAI学習コミュニティの制作実績です。
        </p>
        <p>{portfolioNotice}</p>
        <div className="as-action-row">
          <Link href="/" className="as-primary">
            作品を見る
          </Link>
          <Link href="/textbook/explore" className="as-secondary">
            教科書を見る
          </Link>
        </div>
        <small>
          掲載内容は公開当時のものです。AIサービスの仕様や料金などは、各提供元の最新情報をご確認ください。
        </small>
      </main>
      <SiteFooter />
    </>
  );
}
