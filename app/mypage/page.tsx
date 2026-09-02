import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  LogOut,
  Sparkles,
  UserRound,
} from "lucide-react";

import { chatGPTSignOutPath, requireChatGPTUser } from "@/app/chatgpt-auth";
import { BrandMark } from "@/components/brand-mark";
import { MemberApplicationActions } from "@/components/member-application-actions";
import { MemberProfileSettings } from "@/components/member-profile-settings";
import { MobileMemberNav } from "@/components/mobile-member-nav";
import Link from "@/components/site-link";
import {
  SkillPassport,
  type SkillTaskOption,
} from "@/components/skill-passport";
import {
  getMember,
  hasCurrentMembershipConsent,
  listMemberApplications,
  refreshMemberEmail,
} from "@/db/membership";
import {
  ensureSkillProfile,
  listMemberExternalReviews,
  listMemberExternalReviewRequests,
  listMemberSkillEvidence,
} from "@/db/skill-passport";
import {
  applicationStatusGuidance,
  applicationStatusLabels,
  findMemberServicePlan,
  memberServicePlans,
} from "@/lib/member-service-plans";
import { canonicalMemberUrl, isVercelRuntime } from "@/lib/site-runtime";
import { textbookCatalog } from "@/lib/textbook-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "マイページ｜藤本実学塾",
  description:
    "藤本実学塾の無料会員マイページです。受講申込、学習記録、講師確認、第三者評価、URL共有プロフィールを管理できます。",
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
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

export default async function MyPage() {
  if (isVercelRuntime()) redirect(canonicalMemberUrl("/mypage"));
  const user = await requireChatGPTUser("/mypage");
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    redirect("/mypage/onboarding");
  }

  await refreshMemberEmail(user);
  const [
    applications,
    skillProfile,
    skillEvidence,
    externalReviews,
    externalReviewRequests,
  ] = await Promise.all([
    listMemberApplications(user.userId),
    ensureSkillProfile(user.userId),
    listMemberSkillEvidence(user.userId),
    listMemberExternalReviews(user.userId),
    listMemberExternalReviewRequests(user.userId),
  ]);
  const activeApplications = applications.filter(
    (application) =>
      application.status === "received" || application.status === "reviewing",
  );
  const nextStep = activeApplications.length
    ? {
        title: "申込の確認を待ちながら、教科書を進める",
        body: "対応中の申込があります。運営の確認中もWeb教科書は無料で進められます。",
        href: "#applications",
        label: "申込状況を見る",
      }
    : skillEvidence.length === 0
      ? {
          title: "最初の課題を一つ選ぶ",
          body: "Web教科書から今の仕事や暮らしに近い課題を一つ選び、完成物を作ってみましょう。",
          href: "/textbook",
          label: "Web教科書から選ぶ",
        }
      : {
          title: "次の実践記録を積み重ねる",
          body: "できたことを証拠と一緒に残すほど、講師確認と第三者評価へつなげやすくなります。",
          href: "#skills",
          label: "AI実学パスポートへ",
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
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#apply"
            >
              受講を申し込む
            </a>
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#applications"
            >
              申込状況
            </a>
            <a
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="#skills"
            >
              AI実学パスポート
            </a>
            <Link
              className="border-b border-white/10 py-4 text-white/60 hover:text-white"
              href="/textbook"
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
              FREE MEMBER
            </p>
            <p className="mt-2 text-sm font-semibold">{member.displayName}</p>
            <p className="mt-1 break-all text-[10px] text-white/55">
              {user.email}
            </p>
            <Link
              className="mt-5 inline-flex items-center gap-2 text-xs text-white/55 hover:text-white"
              href={chatGPTSignOutPath("/")}
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
                  申込・学び・できることを、一つの場所に。
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  className="soft-control border border-rule px-3 py-2 text-xs font-semibold hover:border-sapphire hover:text-sapphire"
                  href="/textbook"
                >
                  Web教科書
                </Link>
                <MobileMemberNav signOutHref={chatGPTSignOutPath("/")} />
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1220px] px-5 py-10 sm:px-8 lg:px-10 lg:py-14">
            <section id="home" className="scroll-mt-24">
              <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
                    WELCOME
                  </p>
                  <h1 className="mt-4 font-mincho text-[clamp(2.5rem,5vw,4.9rem)] font-medium leading-[1.12] tracking-[-0.04em]">
                    {member.displayName}さん、
                    <br />
                    何から始めますか。
                  </h1>
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-quiet">
                    Web教科書はいつでも無料で読めます。作ったものは実践記録として残し、講師確認と第三者評価を加えて、応募先へ説明できる形へ育てられます。
                  </p>
                </div>
                <a
                  className="soft-button inline-flex min-h-13 items-center justify-between gap-8 bg-sapphire px-6 text-sm font-semibold text-white hover:bg-brand-dark"
                  href="#apply"
                >
                  受講方法を選ぶ
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>

              <div className="soft-work-surface soft-panel-clip mt-10 grid border border-rule bg-paper-white md:grid-cols-3">
                <div className="border-b border-rule p-6 md:border-b-0 md:border-r">
                  <UserRound
                    className="size-5 text-sapphire"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-[11px] text-quiet">会員種別</p>
                  <p className="mt-2 font-semibold">無料会員</p>
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
                    href="/textbook"
                  >
                    730課題から探す{" "}
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
                いずれも初回の有料受講時に入会金10,000円が必要です。税込区分、支払方法、変更・取消条件は、確定前に必ず提示します。
              </p>
            </section>

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
                    3つの学び方から選び、できるようになりたいことと希望時期を送ってください。
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
                            {application.status === "confirmed" &&
                            application.scheduledAt ? (
                              <p className="mt-3 font-semibold">
                                実施：{formatDate(application.scheduledAt)}
                                （日本時間）
                              </p>
                            ) : null}
                            {application.status === "confirmed" &&
                            application.assignedInstructor ? (
                              <p className="mt-1">
                                担当：{application.assignedInstructor}
                              </p>
                            ) : null}
                            {application.status === "confirmed" &&
                            application.deliveryDetails ? (
                              <p className="mt-3 whitespace-pre-wrap break-words border-t border-rule pt-3">
                                {application.deliveryDetails}
                              </p>
                            ) : null}
                            {application.status === "received" ||
                            application.status === "reviewing" ? (
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

            <SkillPassport
              evidence={skillEvidence}
              profile={skillProfile}
              reviewRequests={externalReviewRequests}
              reviews={externalReviews}
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
                  読了位置の自動保存は未実装です。完成した課題や既存の実務成果は、上のAI実学パスポートへ証拠付きで記録できます。
                </p>
              </div>
            </section>

            <MemberProfileSettings
              displayName={member.displayName}
              email={user.email}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
