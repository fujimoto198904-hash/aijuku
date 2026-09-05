import { requireChatGPTUser } from '@/app/chatgpt-auth';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { paidServicesEnabled } from '@/lib/site-features';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { listCommunityPosts } from '@/db/community';
import { registrationAvailability } from '@/lib/registration-config';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { redirect } from 'next/navigation';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import Link from '@/components/site-link';
import PaidAdminPage from '@/features/paid-school/admin-page';
import { withSiteBasePath } from '@/lib/site-paths';
import { AdminSkillReview } from '@/components/admin-skill-review';
import {
  listAdminSkillEvidence,
  countPendingAdminSkillEvidence,
} from '@/db/skill-passport';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: '運営管理｜AIstock',
  robots: { index: false, follow: false },
};
export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (paidServicesEnabled) return <PaidAdminPage searchParams={searchParams} />;
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/admin'));
  return <AdminContent />;
}
async function AdminContent() {
  const user = await requireChatGPTUser('/admin');
  if (!getAuthenticatedStaffPermissions(user).isOwner)
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="p-10">
          運営専用のページです。
        </main>
      </>
    );
  const member = await getMember(user.userId);
  if (!member || member.status !== 'active')
    return (
      <main id="main-content" className="p-10">
        このアカウントでは利用できません。
      </main>
    );
  if (!hasCurrentMembershipConsent(member))
    redirect(withSiteBasePath('/mypage/onboarding'));
  const [evidence, pendingEvidenceTotal] = await Promise.all([
    listAdminSkillEvidence({ includeMemberEmail: true, includeResolved: true }),
    countPendingAdminSkillEvidence(),
  ]);
  const { posts } = await listCommunityPosts();
  const availability = registrationAvailability();
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="text-3xl font-bold">MON-ai 運営管理</h1>
        <p className="mt-5 leading-8 text-quiet">
          投稿を開いて、回答や削除ができます。運営の回答には「MON-ai
          運営」と表示されます。
        </p>
        <div className="my-7 flex flex-wrap gap-3">
          <Link
            href="/admin/social"
            className="soft-outline-button border border-rule px-5 py-3"
          >
            公式アカウント・投稿予約・通報
          </Link>
          <Link
            href="/community/new"
            className="button-glow px-5 py-3 text-white"
          >
            運営として投稿
          </Link>
          <Link
            href="/mypage"
            className="soft-outline-button border border-rule px-5 py-3"
          >
            自分のマイページ
          </Link>
        </div>
        <section className="soft-panel border border-rule bg-white p-6">
          <h2 className="text-xl font-bold">会員登録の準備</h2>
          <p className="mt-4">
            ユーザー名・パスワード登録：
            {availability.username
              ? '設定あり（本番での通し確認が必要）'
              : '未設定'}
            。メール配信の設定は不要です。
          </p>
          <p className="mt-4">
            Googleログイン：
            {availability.google
              ? '設定あり（初回の通し確認が必要）'
              : '未設定'}
          </p>
          <p className="mt-3">
            確認メール：
            {availability.email
              ? '設定あり（初回の送受信確認が必要）'
              : '未設定'}
          </p>
        </section>
        <h2 className="mt-10 text-2xl font-bold">最近の投稿</h2>
        <div className="mt-5 grid gap-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={'/community/' + p.id}
              className="soft-card border border-rule bg-white p-5"
            >
              {p.title}
              <span className="ml-3 text-sm text-quiet">
                {p.replyCount}件の返信
              </span>
            </Link>
          ))}
          {!posts.length && (
            <p className="text-quiet">まだ投稿はありません。</p>
          )}
        </div>
        <Link href="/community" className="mt-6 block text-sapphire">
          すべての投稿を見る →
        </Link>
        <AdminSkillReview
          canReviewEvidence
          currentUserId={user.userId}
          evidence={evidence.map((item) => ({
            ...item,
            memberId: item.memberId === user.userId ? user.userId : '',
          }))}
          pendingEvidenceTotal={pendingEvidenceTotal}
        />
      </main>
      <SiteFooter />
    </>
  );
}
