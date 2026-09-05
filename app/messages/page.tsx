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
  const user = await requireSocialMember('/messages'),
    query = await searchParams;
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
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/mypage" className="as-back">
          ← マイページ
        </Link>
        <header className="as-page-lead">
          <h1>メッセージ</h1>
          <p>気になる人と、ひとことから。</p>
        </header>
        {!me?.isPublic && (
          <p className="as-panel">
            公開プロフィールを作ると利用できます。
            <Link href="/mypage#account">プロフィール設定へ →</Link>
          </p>
        )}
        {target && (
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
        {!threads.length && !target && (
          <div className="as-profile-empty">
            <h2>まだ会話はありません。</h2>
            <p>公開プロフィールで「メッセージ」が表示される人に送れます。</p>
            <Link href="/discover?view=people" className="as-secondary">
              メンバーを見つける
            </Link>
          </div>
        )}
        <p className="as-private-note">
          DMは当事者だけが閲覧できます。通報したメッセージは、運営が確認します。仕事の斡旋・契約・決済の仲介は行いません。
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
