import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from '@/components/site-link';
import {
  MessageComposer,
  ProfileActions,
  ReportButton,
} from '@/components/social-actions';
import { memberThread, threadMessages, relationship } from '@/db/social';
import { requireSocialMember } from '@/lib/social-member';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '会話｜AIstock',
  robots: { index: false, follow: false },
};
export default async function Conversation({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ before?: string; beforeId?: string }>;
}) {
  const { id } = await params,
    query = await searchParams,
    user = await requireSocialMember('/messages/' + id);
  const context = await memberThread(user.userId, id);
  if (!context) notFound();
  const before = Number(query.before);
  const result = await threadMessages(
    user.userId,
    id,
    Number.isFinite(before) && before > 0 ? before : undefined,
    query.beforeId?.slice(0, 64),
  );
  if (!result) notFound();
  const { thread, me, other } = context,
    relation = await relationship(user.userId, other.handle);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/messages" className="as-back">
          ← メッセージ
        </Link>
        <header className="as-message-header">
          <h1>
            {other.isPublic ? (
              <Link href={'/u/' + other.handle}>{other.name}</Link>
            ) : (
              other.name
            )}
          </h1>
          <ProfileActions
            handle={other.handle}
            relation={relation}
            canInteract={!user.isDemo}
          />
        </header>
        {result.hasMore && (
          <Link
            href={
              '/messages/' +
              id +
              '?before=' +
              result.messages[0].createdAt +
              '&beforeId=' +
              encodeURIComponent(result.messages[0].id)
            }
          >
            ← 以前のメッセージ
          </Link>
        )}
        <ol className="as-message-list">
          {result.messages.map((m) => (
            <li key={m.id} className={m.sender === me.handle ? 'is-mine' : ''}>
              <span>{m.sender === me.handle ? 'あなた' : other.name}</span>
              <p>{m.body}</p>
              <time>
                {new Date(m.createdAt).toLocaleString('ja-JP', {
                  timeZone: 'Asia/Tokyo',
                })}
              </time>
              {m.sender !== me.handle && !user.isDemo && (
                <ReportButton targetType="message" target={m.id} />
              )}
            </li>
          ))}
        </ol>
        {relation.blocked || !other.isPublic || !me.isPublic ? (
          <p className="as-panel">
            新しいメッセージは送れません。過去の会話の確認と通報はできます。
          </p>
        ) : (
          <MessageComposer
            target={other.handle}
            thread={id}
            canAccept={!thread.acceptedAt && thread.initiator !== me.handle}
            waiting={!thread.acceptedAt && thread.initiator === me.handle}
            readOnly={!!user.isDemo}
          />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
