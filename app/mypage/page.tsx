import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  LogOut,
  Sparkles,
  UserRound,
} from 'lucide-react';

import { chatGPTSignOutPath, requireChatGPTUser } from '@/app/chatgpt-auth';
import { BrandMark } from '@/components/brand-mark';
import { MemberApplicationActions } from '@/components/member-application-actions';
import { MemberLearningProgress } from '@/components/member-learning-progress';
import { MemberProfileSettings } from '@/components/member-profile-settings';
import { MobileMemberNav } from '@/components/mobile-member-nav';
import Link from '@/components/site-link';
import { getMemberAuthAccount } from '@/db/member-auth';
import {
  SkillPassport,
  type SkillTaskOption,
} from '@/components/skill-passport';
import { listMemberLessonProgress } from '@/db/lesson-progress';
import {
  getMember,
  hasCurrentMembershipConsent,
  listMemberApplications,
  refreshMemberEmail,
} from '@/db/membership';
import {
  ensureSkillProfile,
  getMemberSkillProfile,
  listMemberSkillEvidence,
} from '@/db/skill-passport';
import {
  applicationStatusGuidance,
  applicationStatusLabels,
  findMemberServicePlan,
  memberServicePlans,
  sharedFees,
} from '@/lib/member-service-plans';
import { canonicalMemberUrl, isVercelRuntime } from '@/lib/site-runtime';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { findTextbookTask, textbookCatalog } from '@/lib/textbook-catalog';
import { textbookExplorePath, textbookGuidePath } from '@/lib/textbook-routes';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'マイページ｜藤本実学塾',
  description:
    '課題の保存、学習記録、受講申込を確認できる無料会員マイページです。',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

const skillTaskOptions: SkillTaskOption[] = textbookCatalog.tasks.map(
  (task) => ({
    id: task.id,
    title: task.title,
    outcome: task.outcome,
    courseTitle: task.courseTitle,
    trackLabel: task.trackLabel,
  }),
);

function formatDate(value: number) {
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(value));
}

type MyPageProps = {
  searchParams: Promise<{ task?: string | string[] }>;
};

export default async function MyPage({ searchParams }: MyPageProps) {
  const params = await searchParams;
  const requestedTaskId = Array.isArray(params.task)
    ? params.task[0]
    : params.task;
  const initialTaskId = requestedTaskId
    ? findTextbookTask(requestedTaskId)?.id
    : undefined;
  const returnTo = initialTaskId
    ? `/mypage?task=${encodeURIComponent(initialTaskId)}`
    : '/mypage';
  if (isVercelRuntime()) redirect(canonicalMemberUrl(returnTo));
  return (
    <MemberPageContent initialTaskId={initialTaskId} returnTo={returnTo} />
  );
}

async function MemberPageContent({
  initialTaskId,
  returnTo,
}: {
  initialTaskId?: string;
  returnTo: string;
}) {
  const user = await requireChatGPTUser(returnTo);
  if (getAuthenticatedStaffPermissions(user).isOwner) redirect('/aikanri');
  const isDemo = user.isDemo === true;
  const [member, authAccount] = await Promise.all([
    getMember(user.userId),
    getMemberAuthAccount(user.userId),
  ]);
  if (
    !member ||
    member.status !== 'active' ||
    !hasCurrentMembershipConsent(member) ||
    !authAccount
  ) {
    redirect(`/mypage/onboarding?return_to=${encodeURIComponent(returnTo)}`);
  }

  if (!isDemo) await refreshMemberEmail(user);
  const [applications, lessonProgress, skillProfileResult, skillEvidence] =
    await Promise.all([
      listMemberApplications(user.userId),
      listMemberLessonProgress(user.userId),
      isDemo
        ? getMemberSkillProfile(user.userId)
        : ensureSkillProfile(user.userId),
      listMemberSkillEvidence(user.userId),
    ]);
  if (!skillProfileResult) {
    throw new Error('Demo skill profile is unavailable.');
  }
  const skillProfile = skillProfileResult;
  const activeApplications = applications.filter(
    (application) =>
      application.status === 'received' || application.status === 'reviewing',
  );
  const nextStep = activeApplications.length
    ? {
        title: '申込の確認中も、教科書を進める',
        body: 'Web教科書はいつでも無料で使えます。',
        href: '#applications',
        label: '申込状況を見る',
      }
    : lessonProgress.some((item) => item.bookmarked && !item.completed)
      ? {
          title: '「あとでやる」から、一つ選ぶ',
          body: '保存した課題から、今日やるものを選びましょう。',
          href: '#learning',
          label: 'あとでやるを見る',
        }
      : lessonProgress.some((item) => item.completed) &&
          skillEvidence.length === 0
        ? {
            title: '作ったものを記録する',
            body: '完成したものと、できるようになったことを残しましょう。',
            href: '#skills',
            label: '作ったものを記録',
          }
        : skillEvidence.length === 0
          ? {
              title: '最初の課題を一つ選ぶ',
              body: '今の仕事や暮らしに近い課題から始めましょう。',
              href: textbookExplorePath,
              label: 'Web教科書から選ぶ',
            }
          : {
              title: '次に作ったものを記録する',
              body: '作ったものと、講師が確認した内容を分けて残せます。',
              href: '#skills',
              label: '作ったものを記録',
            };

  return (
    <main id="main-content" className="min-h-screen bg-paper text-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-white/10 bg-brand-dark p-7 text-white lg:flex lg:flex-col">
          <Link
            className="flex items-center gap-3"
            href="/"
            aria-label="藤本実学塾 トップ"
          >
            <BrandMark framed />
            <span>
              <span className="block font-mincho text-lg">藤本実学塾</span>
              <span className="block text-[10px] tracking-[0.12em] text-white/60">
                MEMBER PAGE
              </span>
            </span>
          </Link>

          <nav className="mt-12 grid text-sm" aria-label="会員メニュー">
            <a
              className="border-b border-white/10 py-4 text-white"
              href="#home"
            >
              ホーム
            </a>
            {!isDemo ? (
              <a
                className="border-b border-white/10 py-4 text-white/60 hover:text-white"
                href="#apply"
              >
                受講を申し込む
              </a>
            ) : null}
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#applications"
            >
              申込状況
            </a>
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#learning"
            >
              学習の続き
            </a>
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#skills"
            >
              AI実学パスポート
            </a>
            <Link
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href={textbookGuidePath}
            >
              Web教科書
            </Link>
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#account"
            >
              会員情報
            </a>
          </nav>

          <div className="mt-auto border-t border-white/15 pt-6">
            <p className="text-[10px] tracking-[0.12em] text-white/55">
              {isDemo ? 'DEMO / READ ONLY' : 'FREE MEMBER'}
            </p>
            <p className="mt-2 text-sm font-semibold">{member.displayName}</p>
            <p className="mt-1 break-all text-[10px] text-white/55">
              {user.email}
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-xs text-white/55 hover:text-white"
              href={chatGPTSignOutPath('/')}
              target="_top"
            >
              <LogOut className="size-3.5" aria-hidden="true" />
              ログアウト
            </Link>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-rule bg-paper-white px-5 py-5 sm:px-8 lg:px-10">
            <div className="mx-auto flex w-full max-w-[1220px] items-center justify-between gap-4">
              <Link
                className="flex items-center gap-2 font-mincho text-lg lg:hidden"
                href="/"
              >
                <BrandMark className="size-8" />
                藤本実学塾
              </Link>
              <div className="hidden lg:block">
                <p className="text-xs text-quiet">無料会員マイページ</p>
                <p className="mt-1 text-sm font-semibold">
                  申込も、学習の続きも、ここで確認できます。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  className="soft-control border border-rule px-3 py-2 text-xs font-semibold hover:border-sapphire hover:text-sapphire"
                  href={textbookGuidePath}
                >
                  Web教科書
                </Link>
                <MobileMemberNav
                  readOnly={isDemo}
                  signOutHref={chatGPTSignOutPath('/')}
                />
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1220px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
            {isDemo ? (
              <section
                aria-label="デモアカウントのご案内"
                className="soft-panel mb-10 flex flex-col gap-4 border border-sapphire/35 bg-sapphire-soft p-5 sm:flex-row sm:items-center sm:p-6"
              >
                <span className="soft-icon grid size-11 shrink-0 place-items-center bg-white text-sapphire">
                  <Eye className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold text-sapphire">
                    デモアカウントで閲覧中
                  </p>
                  <p className="mt-1 text-xs leading-6 text-quiet">
                    マイページの画面と学び方を試せます。申込、ブックマーク、学習記録、会員情報の編集はできません。
                  </p>
                </div>
              </section>
            ) : null}
            <section id="home" className="scroll-mt-24">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                    マイページ
                  </p>
                  <h1 className="mt-4 font-mincho text-[clamp(2.5rem,5vw,4.9rem)] font-medium leading-[1.12] tracking-[-0.04em]">
                    {member.displayName}さん、
                    <br />
                    何から始めますか。
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-quiet">
                    気になる課題や、終わった課題を残せます。作ったものも記録できます。
                  </p>
                </div>
                <Link
                  className="soft-button inline-flex min-h-13 items-center justify-between gap-8 bg-sapphire px-6 text-sm font-semibold text-white hover:bg-brand-dark"
                  href={isDemo ? textbookExplorePath : '#apply'}
                >
                  {isDemo ? 'Web教科書を見る' : '受講方法を選ぶ'}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="soft-work-surface soft-panel-clip mt-10 grid border border-rule bg-paper-white md:grid-cols-3">
                <div className="border-b border-rule p-6 md:border-b-0 md:border-r">
                  <UserRound
                    className="size-5 text-sapphire"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-[11px] text-quiet">会員種別</p>
                  <p className="mt-2 font-semibold">
                    {isDemo ? 'デモ（閲覧専用）' : '無料会員'}
                  </p>
                </div>
                <div className="border-b border-rule p-6 md:border-b-0 md:border-r">
                  <CalendarDays
                    className="size-5 text-sapphire"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-xs text-quiet">対応中の申込</p>
                  <p className="numeric-text mt-2 text-2xl">
                    {activeApplications.length}件
                  </p>
                </div>
                <div className="p-6">
                  <BookOpenText
                    className="size-5 text-sapphire"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-[11px] text-quiet">Web教科書</p>
                  <Link
                    className="mt-2 inline-flex items-center gap-2 font-semibold text-sapphire"
                    href={textbookExplorePath}
                  >
                    学びたいことから探す{' '}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <div className="soft-panel mt-6 grid gap-5 border border-future-mint/55 bg-future-mint-soft p-6 sm:p-8 md:grid-cols-[auto_1fr_auto] md:items-center">
                <span className="soft-icon grid size-11 place-items-center bg-white text-sapphire">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold text-sapphire">
                    今日の次の一歩
                  </p>
                  <p className="mt-2 break-words font-mincho text-xl">
                    {nextStep.title}
                  </p>
                  <p className="mt-2 text-xs leading-6 text-quiet">
                    {nextStep.body}
                  </p>
                </div>
                <Link
                  className="soft-button inline-flex min-h-11 items-center justify-between gap-4 border border-sapphire bg-white px-4 text-xs font-semibold text-sapphire"
                  href={nextStep.href}
                >
                  {nextStep.label}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </section>

            {!isDemo ? (
              <section
                id="apply"
                className="mt-16 scroll-mt-24 border-t-2 border-brand-dark pt-8"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                      APPLY
                    </p>
                    <h2 className="mt-3 font-mincho text-3xl sm:text-4xl">
                      受講を申し込む
                    </h2>
                  </div>
                  <p className="max-w-xl text-xs leading-6 text-quiet">
                    まず希望を受け付け、運営が日程と条件を確認します。送信だけで料金は発生しません。
                  </p>
                </div>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  {memberServicePlans.map((plan) => (
                    <article
                      className="soft-work-surface flex flex-col border border-rule bg-paper-white p-6"
                      key={plan.id}
                    >
                      <div className="flex items-center justify-between">
                        <span className="numeric-text text-xs text-sapphire">
                          {plan.number}
                        </span>
                        <span className="text-[10px] text-quiet">
                          {plan.area}
                        </span>
                      </div>
                      <h3 className="mt-6 font-mincho text-2xl">{plan.name}</h3>
                      <p className="numeric-text mt-4 text-xl">{plan.price}</p>
                      <p className="mt-4 text-xs leading-6 text-quiet">
                        {plan.summary}
                      </p>
                      <Link
                        className="soft-control mt-7 inline-flex min-h-11 items-center justify-between border border-sapphire px-4 text-xs font-semibold text-sapphire hover:bg-sapphire hover:text-white"
                        href={`/reserve?service=${plan.id}`}
                      >
                        この方法で申し込む
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </article>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-6 text-quiet">
                  {sharedFees.entranceCampaign}は入会金
                  {sharedFees.entrance}（{sharedFees.entranceRegular}）です。
                  {sharedFees.entranceCondition}
                  税込区分、支払方法、変更・取消条件は、確定前に必ず提示します。
                </p>
              </section>
            ) : null}

            <section
              id="applications"
              className="mt-16 scroll-mt-24 border-t-2 border-brand-dark pt-8"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                    APPLICATIONS
                  </p>
                  <h2 className="mt-3 font-mincho text-3xl">申込状況</h2>
                </div>
                <CheckCircle2
                  className="size-6 text-future-mint"
                  aria-hidden="true"
                />
              </div>

              {applications.length === 0 ? (
                <div className="soft-work-surface mt-7 border border-rule bg-paper-white p-7 sm:p-9">
                  <p className="font-mincho text-2xl">まだ申込はありません。</p>
                  <p className="mt-4 text-sm leading-7 text-quiet">
                    {isDemo
                      ? '本登録後は、ここで受講申込と対応状況を確認できます。'
                      : '3つの学び方から選び、できるようになりたいことと希望時期を送ってください。'}
                  </p>
                </div>
              ) : (
                <div className="mt-7 grid gap-4">
                  {applications.map((application) => {
                    const plan = findMemberServicePlan(application.serviceType);
                    return (
                      <article
                        className="soft-work-surface border border-rule bg-paper-white p-6"
                        key={application.id}
                      >
                        <div className="grid gap-6 md:grid-cols-[1fr_0.7fr]">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="soft-badge border border-sapphire bg-sapphire-soft px-3 py-1 text-xs font-semibold text-sapphire">
                                {applicationStatusLabels[application.status]}
                              </span>
                              <span className="text-xs text-quiet">
                                受付 {formatDate(application.createdAt)}
                              </span>
                            </div>
                            <h3 className="mt-4 break-words font-mincho text-2xl">
                              {plan?.name ?? application.serviceType}
                            </h3>
                            <p className="mt-2 text-sm font-semibold">
                              {application.offerSnapshot?.price ?? plan?.price}
                            </p>
                            <p className="mt-4 break-words text-sm leading-7">
                              {application.goal}
                            </p>
                            <p className="mt-2 flex items-center gap-2 text-xs text-quiet">
                              <Clock3
                                className="size-3.5 text-sapphire"
                                aria-hidden="true"
                              />
                              希望：{application.preferredSchedule}／
                              {application.participants}名
                            </p>
                          </div>
                          <div className="soft-control border border-rule bg-paper p-5 text-xs leading-6">
                            <p className="font-semibold text-sapphire">
                              現在の案内
                            </p>
                            <p className="mt-2 text-quiet">
                              {application.memberMessage ??
                                applicationStatusGuidance[application.status]}
                            </p>
                            {application.status === 'confirmed' &&
                            application.scheduledAt ? (
                              <p className="mt-3 font-semibold">
                                実施：{formatDate(application.scheduledAt)}
                                （日本時間）
                              </p>
                            ) : null}
                            {application.status === 'confirmed' &&
                            application.assignedInstructor ? (
                              <p className="mt-1">
                                担当：{application.assignedInstructor}
                              </p>
                            ) : null}
                            {application.status === 'confirmed' &&
                            application.deliveryDetails ? (
                              <p className="mt-3 whitespace-pre-wrap break-words border-t border-rule pt-3">
                                {application.deliveryDetails}
                              </p>
                            ) : null}
                            {!isDemo &&
                            (application.status === 'received' ||
                              application.status === 'reviewing') ? (
                              <MemberApplicationActions
                                applicationId={application.id}
                                updatedAt={application.updatedAt}
                              />
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <MemberLearningProgress
              initialProgress={lessonProgress}
              initialTaskId={initialTaskId}
              readOnly={isDemo}
              tasks={skillTaskOptions}
            />

            <SkillPassport
              evidence={skillEvidence}
              profile={skillProfile}
              readOnly={isDemo}
              tasks={skillTaskOptions}
            />

            <section className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="soft-work-surface border border-rule bg-paper-white p-6">
                <CircleDollarSign
                  className="size-5 text-sapphire"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-mincho text-2xl">支払い</h2>
                <p className="mt-3 text-xs leading-6 text-quiet">
                  決済はまだ接続していません。料金と取引条件を確認できる状態にしてから、マイページ内に追加します。
                </p>
              </div>
              <div className="soft-work-surface border border-rule bg-paper-white p-6">
                <BookOpenText
                  className="size-5 text-sapphire"
                  aria-hidden="true"
                />
                <h2 className="mt-4 font-mincho text-2xl">学習の続き</h2>
                <p className="mt-3 text-xs leading-6 text-quiet">
                  「あとでやる」と「完了」は、自分用のメモです。読んだ位置や修了は自動では記録されません。作ったものは下の欄へ別に記録できます。
                </p>
              </div>
            </section>

            <MemberProfileSettings
              displayName={member.displayName}
              email={user.email}
              readOnly={isDemo}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
