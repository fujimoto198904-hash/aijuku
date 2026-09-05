import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { officialPosts } from '@/lib/official-posts';
export const metadata = {
  title: 'はじめてのAI・学ぶ｜AIstock',
  description:
    '開き方から、最初の「できた」まで。自分のペースで学べる無料のWeb教科書。',
};
export default function LearnPage() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page">
        <header className="as-page-lead">
          <p className="as-eyebrow">はじめてのAI</p>
          <h1>
            「難しそう」が、
            <br />
            「ちょっとできた」に。
          </h1>
          <p>
            パソコンに詳しくなくても大丈夫。
            <br />
            まずは、ひとつ試してみましょう。
          </p>
        </header>
        <div className="as-start-steps">
          {[
            [
              '1',
              'まずは開いてみよう',
              'スマホ・パソコンの準備と、ChatGPTの使い始め方。',
              '/textbook/setup',
              '準備のページへ',
            ],
            [
              '2',
              'AIに自分の好みを伝えよう',
              '質問に答えて、自分に合う使い方を用意する。目安は10〜15分。',
              '/textbook/lesson/Lv.01',
              '最初の教科書へ',
            ],
            [
              '3',
              '身近なことに使ってみよう',
              'メモからメールの下書きに。ひとつ作れると楽しくなる。',
              '/textbook/lesson/Lv.05',
              'メールを作ってみる',
            ],
          ].map(([n, title, body, href, label]) => (
            <section key={n} className="as-panel as-start-step">
              <span className="as-step-number">{n}</span>
              <h2>{title}</h2>
              <p>{body}</p>
              <Link
                className="as-secondary"
                href={href}
                target={n === '1' ? undefined : '_blank'}
                rel={n === '1' ? undefined : 'noopener noreferrer'}
              >
                {label} ↗
              </Link>
            </section>
          ))}
        </div>
        <section className="as-section">
          <h2>やりたいことから始めても、OK。</h2>
          <p>順番通りでなくても大丈夫。興味のあるものを選んでください。</p>
          <div className="as-interest-grid">
            {officialPosts.map((p) => (
              <Link key={p.id} href={'/posts/' + p.id} className="as-panel">
                <span className="as-eyebrow">{p.topic}</span>
                <h3>{p.title}</h3>
                <span>教材を見てみる →</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="as-next-card">
          <h2>わからない言葉が出てきたら。</h2>
          <p>
            いったん止まっても大丈夫。短い解説や、みんなへの質問が使えます。
          </p>
          <div className="as-action-row">
            <Link href="/textbook/columns">言葉・使い方を調べる →</Link>
            <Link href="/community?kind=question">みんなの質問を見る →</Link>
          </div>
        </section>
        <div className="as-action-row">
          <Link href="/textbook">教科書の使い方</Link>
          <Link href="/textbook/explore">すべての教科書を探す →</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
