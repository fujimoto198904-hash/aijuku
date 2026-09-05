import { redirect } from 'next/navigation';
import { requireChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MemberLearningProgress } from '@/components/member-learning-progress';
import { MemberProfileSettings } from '@/components/member-profile-settings';
import { SkillPassport } from '@/components/skill-passport';
import { listMemberLessonProgress } from '@/db/lesson-progress';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import {
  getMemberSkillProfile,
  ensureSkillProfile,
  listMemberSkillEvidence,
} from '@/db/skill-passport';
import { listCommunityPosts } from '@/db/community';
import { textbookCatalog, findTextbookTask } from '@/lib/textbook-catalog';
import { communityLabels } from '@/lib/community';
import { registrationAvailability } from '@/lib/registration-config';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { paidServicesEnabled } from '@/lib/site-features';
import PaidMemberPage from '@/features/paid-school/member-page';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import { withSiteBasePath } from '@/lib/site-paths';
import Link from '@/components/site-link';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'マイページ｜AIstock',
  robots: { index: false, follow: false },
};
export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<{ task?: string | string[] }>;
}) {
  if (paidServicesEnabled)
    return <PaidMemberPage searchParams={searchParams} />;
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/mypage'));
  return <MemberContent searchParams={searchParams} />;
}
async function MemberContent({
  searchParams,
}: {
  searchParams: Promise<{ task?: string | string[] }>;
}) {
  const user = await requireChatGPTUser('/mypage');
  const member = await getMember(user.userId);
  if (!member || member.status !== 'active')
    return (
      <>
        <SiteHeader />
        <main id="main-content" className="p-10">
          このアカウントでは利用できません。
          <Link href="/login">ログインへ</Link>
        </main>
      </>
    );
  if (!user.isDemo && !hasCurrentMembershipConsent(member))
    redirect(withSiteBasePath('/mypage/onboarding'));
  const params = await searchParams;
  const raw = Array.isArray(params.task) ? params.task[0] : params.task;
  const [progress, feed, profile, evidence] = await Promise.all([
    listMemberLessonProgress(user.userId),
    listCommunityPosts(undefined, 1, user.userId),
    user.isDemo
      ? getMemberSkillProfile(user.userId)
      : ensureSkillProfile(user.userId),
    listMemberSkillEvidence(user.userId),
  ]);
  const tasks = textbookCatalog.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    outcome: t.outcome,
    courseTitle: t.courseTitle,
    trackLabel: t.trackLabel,
  }));
  const isOwner = getAuthenticatedStaffPermissions(user).isOwner;
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-sapphire">マイページ</p>
            <h1 className="mt-3 text-3xl font-bold">
              今日も、自分のペースで。
            </h1>
          </div>
          <a
            href={withSiteBasePath(chatGPTSignOutPath('/'))}
            className="text-sm text-quiet"
          >
            ログアウト
          </a>
        </div>
        {user.isDemo && (
          <p className="mt-6 rounded-xl bg-sunrise-soft p-4">
            デモアカウントです。保存・投稿はできません。
          </p>
        )}
        <div className="my-8 flex flex-wrap gap-3">
          {[
            ['/mypage/saved', '保存した投稿'],
            ['/mypage/notebook', '自分用ノート'],
            ['/textbook/explore', '学ぶことを探す'],
            ['/community/new?kind=question', '質問する'],
            ['/community/new?kind=tip', '使い方を共有'],
            ['/community/new?kind=learning', 'みんなに共有する'],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className="soft-outline-button border border-rule bg-white px-5 py-3 font-semibold"
            >
              {label}
            </Link>
          ))}
          {isOwner && (
            <Link href="/aikanri" className="px-5 py-3 text-sapphire">
              運営管理
            </Link>
          )}
        </div>
        <MemberLearningProgress
          tasks={tasks}
          initialProgress={progress}
          initialTaskId={raw ? findTextbookTask(raw)?.id : undefined}
          readOnly={user.isDemo}
        />
        <section className="mt-12">
          <h2 className="text-2xl font-bold">自分の投稿</h2>
          <div className="mt-5 grid gap-3">
            {feed.posts.map((p) => (
              <Link
                href={'/community/' + p.id}
                key={p.id}
                className="soft-card border border-rule bg-white p-5"
              >
                <span className="mr-3 text-sm text-sapphire">
                  {communityLabels[p.kind]}
                </span>
                {p.title}
              </Link>
            ))}
            {!feed.posts.length && (
              <p className="leading-8 text-quiet">
                今日試したことを、ひとつ残してみませんか。
              </p>
            )}
          </div>
        </section>
        {profile && (
          <SkillPassport
            profile={profile}
            evidence={evidence}
            tasks={tasks}
            readOnly={user.isDemo}
          />
        )}
        <MemberProfileSettings
          displayName={member.displayName}
          email={member.email}
          readOnly={user.isDemo}
        />
        {registrationAvailability().google && !user.isDemo && (
          <a
            href={withSiteBasePath('/api/auth/google?mode=link')}
            target="_top"
            className="mt-6 inline-block font-semibold text-sapphire"
          >
            Googleログインを連携する
          </a>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
