import { notFound } from 'next/navigation';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { OfficialVisual } from '@/components/community-feed';
import { PostStock } from '@/components/post-stock';
import { findOfficialPost } from '@/lib/official-posts';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { listPostStocks } from '@/db/learning-notes';
import { postLikeStates, ownSocialProfile } from '@/db/social';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import {
  getCommunityPost,
  getCommunityReplies,
  communityOwnedIds,
} from '@/db/community';
import { PostReactions } from '@/components/social-actions';
import { CommunityForm, CommunityDelete } from '@/components/community-form';
import { SocialAvatar, AccountBadge } from '@/components/social-avatar';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const post = findOfficialPost((await params).id);
  return { title: post ? post.title + '｜AIstock' : '投稿が見つかりません' };
}
export default async function OfficialPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const post = findOfficialPost((await params).id);
  if (!post) notFound();
  const task = findTextbookTask(post.taskId);
  if (!task) notFound();
  const user = await getChatGPTUser();
  const saved = user ? await listPostStocks(user.userId) : [];
  const profile = user ? await ownSocialProfile(user.userId) : null;
  const isStaff = user ? getAuthenticatedStaffPermissions(user).isOwner : false;
  const record = await getCommunityPost(post.id),
    query = await searchParams,
    page = Math.max(1, Math.floor(Number(query.page) || 1));
  const [likes, replies, owned] = await Promise.all([
    postLikeStates([post.id], user?.isDemo ? undefined : user?.userId),
    record ? getCommunityReplies(post.id, page) : [],
    user && !user.isDemo
      ? communityOwnedIds(post.id, user.userId)
      : { post: false, replies: [] as string[] },
  ]);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/" className="as-back">
          ← フィードへ
        </Link>
        <article className="as-panel">
          <header className="as-detail-heading">
            <Link href="/u/aitock" className="as-detail-author">
              <SocialAvatar name="Aitock公式" kind="official" />
              Aitock <AccountBadge kind="official" />
            </Link>
            <h1>{post.title}</h1>
            <p>{post.body}</p>
          </header>
          <OfficialVisual post={post} />
          <div className="as-social-actions">
            <PostReactions
              postRef={post.id}
              path={'/posts/' + post.id}
              canInteract={!!user && !user.isDemo}
              {...likes[post.id]}
            />
          </div>
          <div className="as-detail-body">
            <section>
              <h2>やってみると、こんなものが作れます</h2>
              <p>{task.outcome}</p>
            </section>
            <section className="as-next-card">
              <h2>教科書を見ながら、試してみよう</h2>
              <p>{task.title}</p>
              {post.startTaskId !== post.taskId && (
                <p>
                  先に準備する教材があります。初めての方は「準備から始める」を選んでください。
                </p>
              )}
              <div className="as-action-row">
                {post.startTaskId !== post.taskId && (
                  <Link
                    className="as-primary"
                    href={
                      '/textbook/lesson/' + encodeURIComponent(post.startTaskId)
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    準備から始める ↗
                  </Link>
                )}
                <Link
                  className={
                    post.startTaskId === post.taskId
                      ? 'as-primary'
                      : 'as-secondary'
                  }
                  href={'/textbook/lesson/' + encodeURIComponent(post.taskId)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  この教科書を開く ↗
                </Link>
                <PostStock
                  postRef={post.id}
                  canSave={!!user && !user.isDemo}
                  initialSaved={saved.some((s) => s.postRef === post.id)}
                />
              </div>
              <small>
                教科書は無料です。AIサービスの必要なプランは、各課題のマークで確認できます。
              </small>
            </section>
            <section>
              <h2>ひとことヒント</h2>
              <p>{post.tip}</p>
            </section>
            <div className="as-action-row">
              <Link
                className="as-secondary"
                href={
                  '/mypage/notebook?source=' +
                  post.id +
                  '&task=' +
                  encodeURIComponent(post.taskId)
                }
              >
                試したことを自分用に記録
              </Link>
              <Link
                href={
                  '/community/new?kind=question&task=' +
                  encodeURIComponent(post.taskId)
                }
              >
                わからないところを質問
              </Link>
            </div>
          </div>
        </article>
        <section id="replies" className="as-section">
          <h2>コメント {record?.replyCount ?? 0}件</h2>
          {replies.map((r) => (
            <article className="as-panel" key={r.id}>
              <strong>{r.authorName}</strong>
              <p className="whitespace-pre-wrap">{r.body}</p>
              {(isStaff || owned.replies.includes(r.id)) && (
                <CommunityDelete id={r.id} target="reply" postId={post.id} />
              )}
            </article>
          ))}
          <nav className="as-action-row" aria-label="コメントのページ">
            {page > 1 && (
              <Link
                href={'/posts/' + post.id + '?page=' + (page - 1) + '#replies'}
              >
                ← 前へ
              </Link>
            )}
            {(record?.replyCount ?? 0) > page * 50 && (
              <Link
                href={'/posts/' + post.id + '?page=' + (page + 1) + '#replies'}
              >
                次へ →
              </Link>
            )}
          </nav>
          {record ? (
            user && !user.isDemo ? (
              <CommunityForm
                postId={post.id}
                isStaff={isStaff}
                publicProfile={
                  profile?.isPublic
                    ? { name: profile.name, handle: profile.handle }
                    : null
                }
              />
            ) : (
              <Link
                href={
                  '/login?return_to=' + encodeURIComponent('/posts/' + post.id)
                }
              >
                ログインしてコメントする →
              </Link>
            )
          ) : (
            <p>この教材への質問は「わからないところを質問」から送れます。</p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
