import Link from '@/components/site-link';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SocialAvatar, AccountBadge } from '@/components/social-avatar';
import { MessageComposer } from '@/components/social-actions';
import {
  listThreads,
  publicSocialProfile,
  relationship,
  ownSocialProfile,
} from '@/db/social';
import { requireSocialMember } from '@/lib/social-member';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'メッセージ｜AIstock',
  robots: { index: false, follow: false },
};
export default async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ to?: string }>;
}) {
  const query = await searchParams;
  const returnTo =
    '/messages' + (query.to ? '?to=' + encodeURIComponent(query.to) : '');
  const user = await requireSocialMember(returnTo);
  const [threads, me, target] = await Promise.all([
    listThreads(user.userId),
    ownSocialProfile(user.userId),
    query.to ? publicSocialProfile(query.to) : null,
  ]);
  const relation = target
    ? await relationship(user.userId, target.handle)
    : null;
  return (
    <>
      <SiteHeader signedIn />
      <main id="main-content" className="as-page as-detail as-messages-page">
        <Link href="/mypage" className="as-back">
          ← マイページ
        </Link>
        <header className="as-page-lead">
          <h1>メッセージ</h1>
        </header>
        {!me?.isPublic && (
          <section className="as-message-start">
            <span className="as-step-label">はじめてのメッセージ</span>
            <h2>まずは、相手に見せるプロフィールを。</h2>
            <p>
              名前・写真・ユーザーIDを公開すると、メッセージを始められます。写真はあとからでもOK。
            </p>
            <Link
              className="as-primary"
              href={'/mypage/profile?return_to=' + encodeURIComponent(returnTo)}
            >
              プロフィールを設定する
            </Link>
            <Link className="as-text-button" href="/">
              今はフィードを見る
            </Link>
          </section>
        )}
        {target && !!me?.isPublic && (
          <section className="as-section">
            <h2>{target.name}へ</h2>
            {relation?.canMessage ? (
              <MessageComposer
                target={target.handle}
                readOnly={!!user.isDemo}
              />
            ) : (
              <p>この相手には現在メッセージを送れません。</p>
            )}
          </section>
        )}
        {query.to && !target && <p>相手のプロフィールが見つかりません。</p>}
        <div className="as-member-directory">
          {threads.map((t) => (
            <Link
              href={'/messages/' + t.id}
              key={t.id}
              className="as-directory-person"
            >
              <SocialAvatar name={t.other.name} avatar={t.other.avatar} />
              <div>
                <strong>{t.other.name}</strong>
                <AccountBadge kind={t.other.kind} />
                <p>
                  {!t.acceptedAt
                    ? t.initiator === me?.handle
                      ? '承認待ち'
                      : 'メッセージリクエスト'
                    : '会話を開く'}
                </p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
        {!!me?.isPublic && !threads.length && !target && (
          <div className="as-message-start">
            <h2>気になる人に、ひとことから。</h2>
            <p>プロフィールの「メッセージ」から話しかけてみましょう。</p>
            <Link href="/discover?view=people" className="as-secondary">
              メンバーを見つける
            </Link>
          </div>
        )}
        <p className="as-private-note">
          メッセージは当事者だけに表示。通報時は運営も確認します。
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
