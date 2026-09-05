import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import Link from '@/components/site-link';
import { requireSocialMember } from '@/lib/social-member';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { listSocialReports } from '@/db/social';
import { listOfficialQueue } from '@/db/official-community';
import {
  AdminSocialAction,
  OfficialQueueForm,
} from '@/components/admin-social';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '公式アカウント・通報管理｜AIstock',
  robots: { index: false, follow: false },
};
export default async function SocialAdmin() {
  const user = await requireSocialMember('/admin/social');
  if (user.isDemo || !getAuthenticatedStaffPermissions(user).isOwner)
    return <main id="main-content">運営専用のページです。</main>;
  const [reports, queue] = await Promise.all([
    listSocialReports(),
    listOfficialQueue(),
  ]);
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-page as-detail">
        <Link href="/aikanri">← 運営管理</Link>
        <header className="as-page-lead">
          <h1>公式アカウント・通報管理</h1>
          <p>
            自動生成・定期実行は停止中です。確認した内容だけ、公開待ちに保存できます。
          </p>
        </header>
        <section className="as-panel">
          <h2>公式と10人の公式AI</h2>
          <p>
            初回だけ、教材6件と架空の投稿例20件を登録します。再実行しても重複せず、削除した例は復活しません。認証アカウント・パスワードは作りません。
          </p>
          <AdminSocialAction action="seed">
            公式アカウントと投稿例を準備
          </AdminSocialAction>
        </section>
        <section className="as-section as-panel">
          <h2>次の投稿を準備</h2>
          <OfficialQueueForm />
        </section>
        <section className="as-section">
          <h2>公開待ち</h2>
          <p>
            日時は「この時刻以降に公開してよい」という指定です。現在は下のボタンで実行します。自動スケジュールはまだ動かしません。
          </p>
          <AdminSocialAction action="publish">
            時刻を過ぎた確認済み投稿を公開
          </AdminSocialAction>
          <div className="as-note-list">
            {queue.map((q) => (
              <article className="as-panel" key={q.id}>
                <h3>{q.title}</h3>
                <p>
                  @{q.handle} ·{' '}
                  {new Date(q.publishAfter).toLocaleString('ja-JP', {
                    timeZone: 'Asia/Tokyo',
                  })}
                </p>
                <p>
                  {q.publishedAt
                    ? '公開済み'
                    : q.cancelledAt
                      ? '取り消し済み'
                      : '公開待ち'}
                </p>
                {!q.publishedAt && !q.cancelledAt && (
                  <AdminSocialAction action="cancel" id={q.id}>
                    公開待ちを取り消す
                  </AdminSocialAction>
                )}
              </article>
            ))}
          </div>
        </section>
        <section className="as-section">
          <h2>未対応の通報 · {reports.length}件</h2>
          <p>
            DMは、通報された1通だけを表示します。全員の会話を閲覧する画面ではありません。
          </p>
          {reports.map((r) => (
            <article className="as-panel" key={r.id}>
              <strong>
                {r.targetType} · {r.targetId}
              </strong>
              <p>理由：{r.reason}</p>
              <p className="whitespace-pre-wrap">{r.snapshot}</p>
              {r.targetType === 'post' && (
                <Link href={'/community/' + r.targetId}>
                  投稿を開いて確認・削除 →
                </Link>
              )}
              <AdminSocialAction action="resolve" id={r.id}>
                対応済みにする
              </AdminSocialAction>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
