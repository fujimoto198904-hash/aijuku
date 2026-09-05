import { PostStock } from '@/components/post-stock';
import { listPostStocks } from '@/db/learning-notes';
import Image from 'next/image';
import { withSiteBasePath } from '@/lib/site-paths';
import { CommunityAuthor } from '@/components/community-author';
import { notFound } from 'next/navigation';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  getCommunityPost,
  getCommunityReplies,
  communityOwnedIds,
} from '@/db/community';
import { communityLabels } from '@/lib/community';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { CommunityForm, CommunityDelete } from '@/components/community-form';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from '@/components/site-link';
import { textbookLessonPath } from '@/lib/textbook-routes';
export const dynamic = 'force-dynamic';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getCommunityPost(id);
  return {
    title: post ? post.title + '｜AIstock' : '投稿が見つかりません｜AIstock',
    description: post?.body.slice(0, 100),
    openGraph: { images: [] },
    twitter: { images: [] },
  };
}
export default async function CommunityDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const post = await getCommunityPost(id);
  if (!post) notFound();
  const query = await searchParams;
  const page = Math.max(
    1,
    Math.min(
      Math.max(1, Math.ceil(post.replyCount / 50)),
      Math.floor(Number(query.page) || 1),
    ),
  );
  const [replies, user] = await Promise.all([
    getCommunityReplies(id, page),
    getChatGPTUser(),
  ]);
  const stocks = user ? await listPostStocks(user.userId) : [];
  const staff = user ? getAuthenticatedStaffPermissions(user).isOwner : false;
  const owned =
    user && !user.isDemo
      ? await communityOwnedIds(id, user.userId)
      : { post: false, replies: [] };
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-12">
        <Link href="/community" className="text-sapphire">
          ← みんなの投稿
        </Link>
        <article className="soft-panel mt-6 border border-rule bg-white p-6 sm:p-9">
          <p className="text-sm font-semibold text-sapphire">
            {communityLabels[post.kind]}
          </p>
          <h1 className="mt-4 break-words text-3xl font-bold leading-relaxed">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-quiet">
            <CommunityAuthor role={post.authorRole} name={post.authorName} /> ·{' '}
            {new Date(post.createdAt).toLocaleDateString('ja-JP', {
              timeZone: 'Asia/Tokyo',
            })}
          </p>
          <div className="mt-5">
            <PostStock
              postRef={id}
              canSave={!!user && !user.isDemo}
              initialSaved={stocks.some((s) => s.postRef === id)}
            />
          </div>
          {post.mediaId && (
            <Image
              src={withSiteBasePath('/media/' + post.mediaId)}
              alt="投稿者が添付した画像"
              width={1200}
              height={1200}
              unoptimized
              sizes="(min-width: 740px) 700px, 100vw"
              className="mt-6 h-auto w-full rounded-xl"
            />
          )}
          <p className="mt-7 whitespace-pre-wrap break-words leading-8">
            {post.body}
          </p>
          {post.taskId && (
            <Link
              href={textbookLessonPath(post.taskId)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 block text-sapphire"
            >
              関連する教科書を開く：{post.taskId} ↗
            </Link>
          )}
          {(staff || owned.post) && <CommunityDelete id={id} target="post" />}
          <div className="as-action-row">
            <Link
              className="as-secondary"
              href={
                '/mypage/notebook?' +
                new URLSearchParams({
                  source: id,
                  ...(post.taskId ? { task: post.taskId } : {}),
                })
              }
            >
              自分でも試したことを記録する →
            </Link>
          </div>
        </article>
        <section id="replies" className="mt-10">
          <h2 className="text-2xl font-bold">返信 {post.replyCount}件</h2>
          <div className="my-6 grid gap-4">
            {replies.map((reply) => (
              <article
                key={reply.id}
                className="soft-card border border-rule bg-white p-6"
              >
                <p className="text-sm font-semibold text-sapphire">
                  <CommunityAuthor
                    role={reply.authorRole}
                    name={reply.authorName}
                  />
                </p>
                <p className="mt-4 whitespace-pre-wrap break-words leading-8">
                  {reply.body}
                </p>
                {(staff || owned.replies.includes(reply.id)) && (
                  <CommunityDelete id={reply.id} target="reply" postId={id} />
                )}
              </article>
            ))}
          </div>
          <nav aria-label="返信のページ" className="my-6 flex justify-between">
            {page > 1 ? (
              <Link href={'/community/' + id + '?page=' + (page - 1)}>
                ← 前の返信
              </Link>
            ) : (
              <span />
            )}
            {post.replyCount > page * 50 && (
              <Link href={'/community/' + id + '?page=' + (page + 1)}>
                次の返信 →
              </Link>
            )}
          </nav>
          {user && !user.isDemo ? (
            <CommunityForm postId={id} isStaff={staff} />
          ) : (
            <p className="soft-panel border border-rule bg-white p-6 leading-8">
              返信は無料会員になるとできます。
              <Link href="/join" className="ml-2 font-semibold text-sapphire">
                無料で参加する →
              </Link>
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
