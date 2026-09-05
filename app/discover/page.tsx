import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { OfficialCard, MemberPostCard } from '@/components/community-feed';
import { officialPosts } from '@/lib/official-posts';
import { textbookCatalog } from '@/lib/textbook-catalog';
import { listCommunityPosts } from '@/db/community';
import { withSiteBasePath } from '@/lib/site-paths';
import { getPostStockViewer } from '@/lib/post-stock-viewer';
import { postLikeStates, searchSocialProfiles } from '@/db/social';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { MemberDirectory } from '@/components/social-profile';
import { discoveryPage, discoveryPath } from '@/lib/discovery';

// 投稿タブだけが、保存状態・いいね・投稿一覧を必要とする。
async function loadPostResults(q: string, page: number) {
  const posts =
    page === 1
      ? officialPosts.filter((p) =>
          (p.title + p.body + p.topic)
            .toLocaleLowerCase()
            .includes(q.toLocaleLowerCase()),
        )
      : [];
  const [feed, viewer, user] = await Promise.all([
    listCommunityPosts(undefined, page, undefined, q),
    getPostStockViewer(),
    getChatGPTUser(),
  ]);
  const likes = await postLikeStates(
    [...feed.posts.map((p) => p.id), ...posts.map((p) => p.id)],
    user?.isDemo ? undefined : user?.userId,
  );
  return { feed, viewer, likes, posts };
}

export const dynamic = 'force-dynamic';
export const metadata = { title: '見つける｜AIstock' };
export default async function Discover({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; view?: string }>;
}) {
  const params = await searchParams;
  const view =
    params.view === 'people' || params.view === 'textbook'
      ? params.view
      : 'posts';
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 80) : '';
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number(params.page) || 1)),
  );
  const match = (text: string) =>
    text.toLocaleLowerCase().includes(q.toLocaleLowerCase());
  const tasks =
    view === 'textbook' && q
      ? textbookCatalog.tasks.filter((t) =>
          match(t.title + t.outcome + t.tags.join(' ')),
        )
      : [];
  const taskPage = discoveryPage(tasks, page);
  const postResults = view === 'posts' ? await loadPostResults(q, page) : null;
  const people = view === 'people' ? await searchSocialProfiles(q, page) : null;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-discover-page">
        <div className="as-discover-controls">
          <header className="as-page-lead">
            <p className="as-eyebrow">見つける</p>
            <h1>それ、AIでできるかも。</h1>
            <p>メール、画像、調べもの。気になる言葉で探してみよう。</p>
          </header>
          <form action={withSiteBasePath('/discover')} className="as-search">
            <input type="hidden" name="view" value={view} />
            <label className="sr-only" htmlFor="discover-query">
              投稿・教科書・メンバーを検索
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
          <nav className="as-discover-keywords" aria-label="よく使うキーワード">
            {[
              '仕事',
              'メール',
              '資料',
              '会議',
              'Excel',
              '画像',
              '動画',
              '音楽',
              'デザイン',
              'Web',
              'プログラミング',
              '調べ',
              '英語',
              '暮らし',
              '旅行',
              '料理',
              'お店',
              'SNS',
            ].map((k) => (
              <Link
                href={discoveryPath(view, k)}
                key={k}
                className="as-chip"
                aria-current={q === k ? 'page' : undefined}
              >
                {k}
              </Link>
            ))}
          </nav>
          <nav className="as-feed-tabs as-feed-subtabs" aria-label="検索対象">
            {(
              [
                ['posts', '投稿'],
                ['textbook', '教科書'],
                ['people', 'メンバー'],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                aria-current={view === key ? 'page' : undefined}
                href={discoveryPath(key, q)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        {view === 'people' && (
          <section className="as-section">
            <h2>学ぶ仲間を見つける</h2>
            <MemberDirectory profiles={people?.profiles ?? []} />
            {!people?.profiles.length && <p>まだ見つかりませんでした。</p>}
            <nav className="as-action-row" aria-label="メンバー検索のページ">
              {page > 1 && (
                <Link href={discoveryPath('people', q, page - 1)}>← 前へ</Link>
              )}
              {people?.hasMore && (
                <Link href={discoveryPath('people', q, page + 1)}>
                  もっと見る →
                </Link>
              )}
            </nav>
          </section>
        )}
        {view === 'textbook' && (
          <p className="as-private-note">
            {q
              ? '気になる課題から、始められます。'
              : 'キーワードを選ぶか、教科書の一覧から探せます。'}{' '}
            <Link href="/textbook/explore">教科書の一覧 →</Link>
          </p>
        )}
        {view === 'textbook' && q && (
          <section className="as-section">
            <div className="as-result-heading">
              <h2>「{q}」の教科書</h2>
              <span>
                {taskPage.total
                  ? `${taskPage.total}件中 ${taskPage.from}–${taskPage.to}件`
                  : '0件'}
              </span>
            </div>
            {!taskPage.total && (
              <div className="as-panel as-search-empty">
                <h3>その言葉では、まだ見つかりませんでした。</h3>
                <p>「画像」「メール」など、短い言葉で探してみてください。</p>
                <Link href={discoveryPath('posts', q)}>
                  同じ言葉で投稿を探す →
                </Link>
              </div>
            )}
            <div className="as-interest-grid">
              {taskPage.items.map((t) => (
                <Link
                  href={'/textbook/lesson/' + encodeURIComponent(t.id)}
                  key={t.id}
                  className="as-panel"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="as-eyebrow">{t.trackLabel}</span>
                  <h3>{t.title}</h3>
                  <span>
                    教科書を開く ↗
                    <span className="sr-only">（新しいタブ）</span>
                  </span>
                </Link>
              ))}
            </div>
            {taskPage.pages > 1 && (
              <nav
                className="as-action-row as-search-pagination"
                aria-label="教科書検索のページ"
              >
                {taskPage.page > 1 && (
                  <Link href={discoveryPath('textbook', q, taskPage.page - 1)}>
                    ← 前へ
                  </Link>
                )}
                <span>
                  {taskPage.page} / {taskPage.pages} ページ
                </span>
                {taskPage.page < taskPage.pages && (
                  <Link href={discoveryPath('textbook', q, taskPage.page + 1)}>
                    次へ →
                  </Link>
                )}
              </nav>
            )}
          </section>
        )}
        {view === 'posts' && postResults && (
          <section className="as-section">
            <h2>{q ? '「' + q + '」の投稿' : 'こんな使い方から、どうぞ。'}</h2>
            <div className="as-discover-posts">
              {postResults.feed.posts.map((p) => (
                <MemberPostCard
                  post={p}
                  key={p.id}
                  canSave={postResults.viewer.canSave}
                  initialSaved={postResults.viewer.savedRefs.has(p.id)}
                  likeState={postResults.likes[p.id]}
                />
              ))}
              {page === 1 &&
                postResults.posts.map((p) => (
                  <OfficialCard
                    post={p}
                    key={p.id}
                    canSave={postResults.viewer.canSave}
                    initialSaved={postResults.viewer.savedRefs.has(p.id)}
                    likeState={postResults.likes[p.id]}
                  />
                ))}
            </div>
            {!postResults.feed.posts.length && !postResults.posts.length && (
              <div className="as-panel as-search-empty">
                <h3>
                  {page > 1
                    ? 'このページに投稿はありません。'
                    : 'その言葉では、まだ見つかりませんでした。'}
                </h3>
                <p>別の言葉や、教科書のタブでも探せます。</p>
                <Link href={discoveryPath('textbook', q)}>教科書を探す →</Link>
              </div>
            )}
            <nav className="as-action-row" aria-label="検索結果のページ">
              {page > 1 && (
                <Link href={discoveryPath('posts', q, page - 1)}>← 前へ</Link>
              )}
              {postResults.feed.hasMore && (
                <Link href={discoveryPath('posts', q, page + 1)}>次へ →</Link>
              )}
            </nav>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
