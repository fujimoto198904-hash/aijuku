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
}: {
  params: Promise<{ id: string }>;
}) {
  const post = findOfficialPost((await params).id);
  if (!post) notFound();
  const task = findTextbookTask(post.taskId);
  if (!task) notFound();
  const user = await getChatGPTUser();
  const saved = user ? await listPostStocks(user.userId) : [];
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/" className="as-back">
          ← フィードへ
        </Link>
        <article className="as-panel">
          <header className="as-detail-heading">
            <p className="as-eyebrow">MON-ai 公式教材紹介 · {post.topic}</p>
            <h1>{post.title}</h1>
            <p>{post.body}</p>
          </header>
          <OfficialVisual post={post} />
          <div className="as-detail-body">
            <PostStock
              postRef={post.id}
              canSave={!!user && !user.isDemo}
              initialSaved={saved.some((s) => s.postRef === post.id)}
            />
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
      </main>
      <SiteFooter />
    </>
  );
}
