import { redirect } from 'next/navigation';
import { requireChatGPTUser, chatGPTSignOutPath } from '@/app/chatgpt-auth';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { MemberLearningProgress } from '@/components/member-learning-progress';
import { MemberProfileSettings } from '@/components/member-profile-settings';
import { SkillPassport } from '@/components/skill-passport';
import { MypageTabs } from '@/components/mypage-tabs';
import { ProfileIdentity, ProfilePostGrid } from '@/components/social-profile';
import { SocialProfileSettings } from '@/components/social-actions';
import { PostStock } from '@/components/post-stock';
import { listMemberLessonProgress } from '@/db/lesson-progress';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import {
  getMemberSkillProfile,
  ensureSkillProfile,
  listMemberSkillEvidence,
} from '@/db/skill-passport';
import { listCommunityPosts, getCommunityPost } from '@/db/community';
import { ownSocialProfile, socialCounts, ownPostCount } from '@/db/social';
import { listPostStocks } from '@/db/learning-notes';
import { findOfficialPost } from '@/lib/official-posts';
import { textbookCatalog, findTextbookTask } from '@/lib/textbook-catalog';
import { registrationAvailability } from '@/lib/registration-config';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { paidServicesEnabled } from '@/lib/site-features';
import PaidMemberPage from '@/features/paid-school/member-page';
import { isVercelRuntime, canonicalMemberUrl } from '@/lib/site-runtime';
import { withSiteBasePath } from '@/lib/site-paths';
import { hasUsernameRecovery } from '@/db/username-registration';
import Link from '@/components/site-link';
export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'マイページ｜AIstock',
  robots: { index: false, follow: false },
};
type Query = { task?: string | string[]; page?: string; savedPage?: string };
export default async function MyPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  if (paidServicesEnabled)
    return <PaidMemberPage searchParams={searchParams} />;
  if (isVercelRuntime()) redirect(canonicalMemberUrl('/mypage'));
  return <MemberContent searchParams={searchParams} />;
}
async function MemberContent({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  const params = await searchParams,
    raw = Array.isArray(params.task) ? params.task[0] : params.task;
  const returnQuery = new URLSearchParams({
    ...(raw ? { task: raw } : {}),
    ...(params.page ? { page: params.page } : {}),
  });
  const user = await requireChatGPTUser(
    '/mypage' + (returnQuery.size ? '?' + returnQuery : ''),
  );
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
  const page = Math.max(
    1,
    Math.min(1000, Math.floor(Number(params.page) || 1)),
  );
  const [progress, feed, profile, evidence, social, stocks, postCount] =
    await Promise.all([
      listMemberLessonProgress(user.userId),
      listCommunityPosts(undefined, page, user.userId),
      user.isDemo
        ? getMemberSkillProfile(user.userId)
        : ensureSkillProfile(user.userId),
      listMemberSkillEvidence(user.userId),
      ownSocialProfile(user.userId),
      listPostStocks(user.userId),
      ownPostCount(user.userId),
    ]);
  const counts = social
    ? await socialCounts(social.handle)
    : { posts: 0, followers: 0, following: 0 };
  const savedPage = Math.max(
    1,
    Math.min(
      Math.max(1, Math.ceil(stocks.length / 20)),
      Math.floor(Number(params.savedPage) || 1),
    ),
  );
  const saved = await Promise.all(
    stocks.slice((savedPage - 1) * 20, savedPage * 20).map(async (s) => ({
      ref: s.postRef,
      post: findOfficialPost(s.postRef) || (await getCommunityPost(s.postRef)),
    })),
  );
  const tasks = textbookCatalog.tasks.map((t) => ({
    id: t.id,
    title: t.title,
    outcome: t.outcome,
    courseTitle: t.courseTitle,
    trackLabel: t.trackLabel,
  }));
  const isOwner = getAuthenticatedStaffPermissions(user).isOwner;
  const hasRecovery = !user.isDemo && (await hasUsernameRecovery(user.userId));
  const settings = (
    <>
      <div id="account" className="as-tab-section">
        <SocialProfileSettings profile={social} readOnly={!!user.isDemo} />
      </div>
      <MemberProfileSettings
        displayName={member.displayName}
        email={member.email}
        loginId={user.loginId}
        hasRecovery={hasRecovery}
        readOnly={user.isDemo}
      />
      {registrationAvailability().google && !user.isDemo && !!member.email && (
        <a
          href={withSiteBasePath('/api/auth/google?mode=link')}
          target="_top"
          className="as-secondary"
        >
          Googleログインを連携する
        </a>
      )}
      <a
        href={withSiteBasePath(chatGPTSignOutPath('/'))}
        className="as-text-button"
      >
        ログアウト
      </a>
    </>
  );
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="as-profile-page">
        <p className="as-private-note">
          マイページ · 保存・学習記録・自分用ノートは、あなた専用です。
        </p>
        <ProfileIdentity
          profile={
            social ?? {
              handle: 'your-profile',
              name: member.displayName,
              bio: '小さな発見が、自分の力になっていく。',
              kind: 'member',
              avatar: null,
              isPublic: 0,
              dmEnabled: 0,
            }
          }
          counts={{ ...counts, posts: postCount }}
        >
          <div className="as-action-row">
            <Link className="as-secondary" href="/mypage#account">
              プロフィールを編集
            </Link>
            {social?.isPublic ? (
              <Link className="as-secondary" href={'/u/' + social.handle}>
                公開ページを見る ↗
              </Link>
            ) : (
              <span className="as-profile-status">
                公開プロフィールは未公開
              </span>
            )}
            <Link className="as-secondary" href="/messages">
              メッセージ
            </Link>
          </div>
        </ProfileIdentity>
        {user.isDemo && (
          <p className="as-ai-disclosure">
            デモアカウントです。保存・投稿・DM送信はできません。
          </p>
        )}
        <div className="as-profile-shortcuts">
          <Link href="/community/new?kind=learning">
            <span>＋</span>
            <strong>投稿する</strong>
            <small>今日の発見</small>
          </Link>
          <Link href="/mypage/notebook">
            <span>↗</span>
            <strong>自分用ノート</strong>
            <small>非公開</small>
          </Link>
          <Link href="/mypage#learning">
            <span>{progress.filter((p) => p.completed).length}</span>
            <strong>完了した教材</strong>
            <small>自分の学習記録</small>
          </Link>
          <Link href="/textbook/explore">
            <span>⌕</span>
            <strong>教科書を探す</strong>
            <small>次にやりたいこと</small>
          </Link>
          {isOwner && (
            <Link href="/admin/social">
              <span>⚙</span>
              <strong>公式・通報管理</strong>
              <small>運営専用</small>
            </Link>
          )}
        </div>
        {isOwner && (
          <Link className="as-text-button" href="/aikanri">
            運営管理の全機能 →
          </Link>
        )}
        <MypageTabs
          initial={raw ? 'learning' : params.savedPage ? 'saved' : 'posts'}
          panels={{
            posts: (
              <>
                <div className="as-tab-section">
                  <h2>自分の投稿</h2>
                  <p>
                    公開ページには、プロフィール作成後に紐付けた投稿だけが並びます。
                  </p>
                </div>
                <ProfilePostGrid posts={feed.posts} />
                <nav className="as-action-row" aria-label="自分の投稿のページ">
                  {page > 1 && (
                    <Link href={'/mypage?page=' + (page - 1) + '#posts'}>
                      ← 前へ
                    </Link>
                  )}
                  {feed.hasMore && (
                    <Link href={'/mypage?page=' + (page + 1) + '#posts'}>
                      もっと見る →
                    </Link>
                  )}
                </nav>
              </>
            ),
            saved: (
              <>
                <div className="as-tab-section">
                  <h2>保存した投稿 · {stocks.length}件</h2>
                  <p>
                    この一覧は、あなただけに見えます。教材の「あとでやる」は学習タブへ。
                  </p>
                </div>
                <div className="as-saved-grid">
                  {saved.map((s) => (
                    <article className="as-panel" key={s.ref}>
                      <PostStock
                        postRef={s.ref}
                        canSave={!user.isDemo}
                        initialSaved
                      />
                      {s.post ? (
                        <>
                          <h3>
                            <Link
                              href={
                                (findOfficialPost(s.ref)
                                  ? '/posts/'
                                  : '/community/') + s.ref
                              }
                            >
                              {s.post.title}
                            </Link>
                          </h3>
                          <p>{s.post.body.slice(0, 100)}</p>
                        </>
                      ) : (
                        <p>
                          この投稿は公開されていません。保存は解除できます。
                        </p>
                      )}
                    </article>
                  ))}
                </div>
                {!saved.length && (
                  <div className="as-profile-empty">
                    <h2>気になった投稿を、ここへ。</h2>
                    <p>投稿のしおりマークを押すと保存できます。</p>
                    <Link href="/discover" className="as-secondary">
                      投稿を見つける
                    </Link>
                  </div>
                )}
                <nav
                  className="as-action-row"
                  aria-label="保存した投稿のページ"
                >
                  {savedPage > 1 && (
                    <Link
                      href={'/mypage?savedPage=' + (savedPage - 1) + '#saved'}
                    >
                      ← 前へ
                    </Link>
                  )}
                  {stocks.length > savedPage * 20 && (
                    <Link
                      href={'/mypage?savedPage=' + (savedPage + 1) + '#saved'}
                    >
                      もっと見る →
                    </Link>
                  )}
                </nav>
              </>
            ),
            learning: (
              <MemberLearningProgress
                tasks={tasks}
                initialProgress={progress}
                initialTaskId={raw ? findTextbookTask(raw)?.id : undefined}
                readOnly={user.isDemo}
              />
            ),
            skills: profile ? (
              <SkillPassport
                profile={profile}
                evidence={evidence}
                tasks={tasks}
                readOnly={user.isDemo}
              />
            ) : (
              <p>まだ作ったものはありません。</p>
            ),
            account: settings,
          }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
