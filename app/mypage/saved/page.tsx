import { redirect } from 'next/navigation';
import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { listPostStocks } from '@/db/learning-notes';
import { getCommunityPost } from '@/db/community';
import { findOfficialPost } from '@/lib/official-posts';
import { withSiteBasePath } from '@/lib/site-paths';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PostStock } from '@/components/post-stock';
import Link from '@/components/site-link';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '保存した投稿｜AIstock',
  robots: { index: false, follow: false },
};
export default async function SavedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireChatGPTUser('/mypage/saved');
  const member = await getMember(user.userId);
  if (!member || member.status !== 'active')
    redirect(withSiteBasePath('/login'));
  if (!user.isDemo && !hasCurrentMembershipConsent(member))
    redirect(withSiteBasePath('/mypage/onboarding'));
  const refs = await listPostStocks(user.userId);
  const params = await searchParams;
  const page = Math.max(
    1,
    Math.min(
      Math.max(1, Math.ceil(refs.length / 20)),
      Math.floor(Number(params.page) || 1),
    ),
  );
  const posts = await Promise.all(
    refs.slice((page - 1) * 20, page * 20).map(async ({ postRef }) => {
      const official = findOfficialPost(postRef);
      const post = official ?? (await getCommunityPost(postRef));
      return {
        ref: postRef,
        post,
        href: official ? '/posts/' + postRef : '/community/' + postRef,
      };
    }),
  );
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/mypage" className="as-back">
          ← マイページ
        </Link>
        <header className="as-page-lead">
          <p className="as-eyebrow">保存した投稿</p>
          <h1>「あとでやりたい」を、ここに。</h1>
          <p>教科書のブックマークは、マイページの学習一覧にあります。</p>
        </header>
        <div className="as-note-list">
          {posts.map(({ ref, post, href }) => (
            <article key={ref} className="as-panel">
              <PostStock postRef={ref} initialSaved canSave={!user.isDemo} />
              {post ? (
                <>
                  <h2>
                    <Link href={href}>{post.title}</Link>
                  </h2>
                  <p className="as-user-excerpt">{post.body}</p>
                  <Link href={href}>続きを見る →</Link>
                </>
              ) : (
                <p>この投稿は現在公開されていません。</p>
              )}
            </article>
          ))}
        </div>
        {!posts.length && (
          <div className="as-panel">
            <p>まだ保存した投稿はありません。</p>
            <Link href="/">気になる投稿を見つける →</Link>
          </div>
        )}
        <nav className="as-action-row" aria-label="保存した投稿のページ">
          {page > 1 && (
            <Link href={'/mypage/saved?page=' + (page - 1)}>← 前へ</Link>
          )}
          {refs.length > page * 20 && (
            <Link href={'/mypage/saved?page=' + (page + 1)}>次へ →</Link>
          )}
        </nav>
      </main>
      <SiteFooter />
    </>
  );
}
