import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { OfficialCard, MemberPostCard } from '@/components/community-feed';
import { officialPosts } from '@/lib/official-posts';
import { textbookCatalog } from '@/lib/textbook-catalog';
import { listCommunityPosts } from '@/db/community';
import { withSiteBasePath } from '@/lib/site-paths';
export const dynamic = 'force-dynamic';
export const metadata = { title: '見つける｜AIstock' };
export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number(params.page) || 1)),
  );
  const match = (text: string) =>
    text.toLocaleLowerCase().includes(q.toLocaleLowerCase());
  const posts = officialPosts.filter((p) => match(p.title + p.body + p.topic));
  const tasks = q
    ? textbookCatalog.tasks.filter((t) =>
        match(t.title + t.outcome + t.tags.join(' ')),
      )
    : [];
  const feed = await listCommunityPosts(undefined, page, undefined, q);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page">
        <header className="as-page-lead">
          <p className="as-eyebrow">見つける</p>
          <h1>それ、AIでできるかも。</h1>
          <p>メール、画像、調べもの。気になる言葉で探してみよう。</p>
        </header>
        <form action={withSiteBasePath('/discover')} className="as-search">
          <label className="sr-only" htmlFor="discover-query">
            投稿・教科書の検索
          </label>
          <input
            id="discover-query"
            name="q"
            defaultValue={q}
            placeholder="何をやってみたい？"
            maxLength={80}
          />
          <button type="submit">探す</button>
        </form>
        <nav className="as-action-row" aria-label="よく使うキーワード">
          {['メール', '画像', 'Excel', '暮らし'].map((k) => (
            <Link
              href={'/discover?q=' + encodeURIComponent(k)}
              key={k}
              className="as-chip"
            >
              {k}
            </Link>
          ))}
        </nav>
        {!!tasks.length && (
          <section className="as-section">
            <h2>教科書 · {tasks.length}件</h2>
            <div className="as-interest-grid">
              {tasks.slice(0, 12).map((t) => (
                <Link
                  href={'/textbook/lesson/' + encodeURIComponent(t.id)}
                  key={t.id}
                  className="as-panel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="as-eyebrow">{t.trackLabel}</span>
                  <h3>{t.title}</h3>
                  <span>教科書を開く ↗</span>
                </Link>
              ))}
            </div>
            {tasks.length > 12 && (
              <Link href="/textbook/explore">教科書の一覧でもっと探す →</Link>
            )}
          </section>
        )}
        <section className="as-section">
          <h2>{q ? '「' + q + '」の投稿' : 'こんな使い方から、どうぞ。'}</h2>
          <div className="as-discover-posts">
            {feed.posts.map((p) => (
              <MemberPostCard post={p} key={p.id} />
            ))}
            {page === 1 &&
              posts.map((p) => <OfficialCard post={p} key={p.id} />)}
          </div>
          {!feed.posts.length && !posts.length && (
            <p>まだ見つかりませんでした。別の言葉でも探してみてください。</p>
          )}
          <nav className="as-action-row" aria-label="検索結果のページ">
            {page > 1 && (
              <Link
                href={
                  '/discover?' +
                  new URLSearchParams({ q, page: String(page - 1) })
                }
              >
                ← 前へ
              </Link>
            )}
            {feed.hasMore && (
              <Link
                href={
                  '/discover?' +
                  new URLSearchParams({ q, page: String(page + 1) })
                }
              >
                次へ →
              </Link>
            )}
          </nav>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
