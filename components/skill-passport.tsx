"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  BookOpenText,
  BriefcaseBusiness,
  Check,
  Clipboard,
  Eye,
  EyeOff,
  FileCheck2,
  Link2,
  MessageSquareText,
  Plus,
  Search,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { type SubmitEvent, useMemo, useState } from "react";

import Link from "@/components/site-link";
import { EvidenceRevisionForm } from "@/components/evidence-revision-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  ExternalReviewRecord,
  MemberExternalReviewRequest,
  SkillEvidenceRecord,
  SkillProfile,
} from "@/db/skill-passport";
import {
  evidenceSourceLabels,
  externalRatingLabels,
  externalRelationshipLabels,
  instructorStatusLabels,
  moderationStatusLabels,
  type EvidenceSourceType,
  type EvidenceVisibility,
} from "@/lib/skill-passport";
import { withSiteBasePath } from "@/lib/site-paths";
import {
  getSkillDefinition,
  skillDefinitions,
  type SkillKey,
} from "@/lib/skill-taxonomy";

export type SkillTaskOption = {
  id: string;
  title: string;
  outcome: string;
  courseTitle: string;
  trackLabel: string;
};

function formatDate(value: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function hostnameFromUrl(value: string) {
  try {
    return new URL(value).hostname;
  } catch {
    return "外部サイト";
  }
}

function safeVerifierName(value: string | null) {
  if (!value || value.includes("@")) return "藤本実学塾 講師・運営";
  return value;
}

function StatusMessage({
  kind,
  children,
}: {
  kind: "success" | "error";
  children: React.ReactNode;
}) {
  return (
    <p
      className={`soft-control border-l-4 p-4 text-sm leading-7 text-brand-dark ${kind === "success" ? "border-future-mint bg-future-mint-soft" : "border-human-coral bg-human-coral-soft"}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

export function SkillPassport({
  profile,
  evidence,
  reviews,
  reviewRequests,
  tasks,
}: {
  profile: SkillProfile;
  evidence: SkillEvidenceRecord[];
  reviews: ExternalReviewRecord[];
  reviewRequests: MemberExternalReviewRequest[];
  tasks: SkillTaskOption[];
}) {
  const [savedProfile, setSavedProfile] = useState(profile);
  const [profileDraft, setProfileDraft] = useState({
    headline: profile.headline,
    targetRole: profile.targetRole,
    bio: profile.bio,
    shareEnabled: profile.shareEnabled,
  });
  const [profileStatus, setProfileStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [profileMessage, setProfileMessage] = useState("");
  const [sourceType, setSourceType] =
    useState<EvidenceSourceType>("curriculum");
  const [taskQuery, setTaskQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [priorWorkSkillKeys, setPriorWorkSkillKeys] = useState<SkillKey[]>([]);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);
  const [evidenceStatus, setEvidenceStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [evidenceRequestId] = useState(() => crypto.randomUUID());
  const [evidenceMessage, setEvidenceMessage] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [actionMessageKind, setActionMessageKind] = useState<
    "success" | "error"
  >("success");
  const [invitationUrl, setInvitationUrl] = useState("");
  const [invitationRequestId, setInvitationRequestId] = useState("");
  const [revokedRequestIds, setRevokedRequestIds] = useState<string[]>([]);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId);
  const matchingTasks = useMemo(() => {
    const query = taskQuery.trim().toLowerCase();
    if (!query) return tasks.slice(0, 8);
    return tasks
      .filter((task) =>
        [task.id, task.title, task.outcome, task.courseTitle, task.trackLabel]
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [taskQuery, tasks]);

  const reviewCountByEvidence = useMemo(() => {
    const counts = new Map<string, number>();
    for (const review of reviews) {
      if (review.moderationStatus === "rejected") continue;
      counts.set(review.evidenceId, (counts.get(review.evidenceId) ?? 0) + 1);
    }
    return counts;
  }, [reviews]);

  const skillStats = useMemo(
    () =>
      skillDefinitions.map((skill) => {
        const related = evidence.filter((item) =>
          item.skillKeys.includes(skill.key),
        );
        return {
          ...skill,
          recorded: related.length,
          verified: related.filter(
            (item) => item.instructorStatus === "verified",
          ).length,
          externallyReviewed: related.filter(
            (item) => (reviewCountByEvidence.get(item.id) ?? 0) > 0,
          ).length,
        };
      }),
    [evidence, reviewCountByEvidence],
  );

  const verifiedCount = evidence.filter(
    (item) => item.instructorStatus === "verified",
  ).length;
  const approvedReviewCount = reviews.filter(
    (review) => review.moderationStatus === "approved" && review.consentPublic,
  ).length;

  async function saveProfile(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileStatus("sending");
    setProfileMessage("");
    try {
      const response = await fetch(withSiteBasePath("/api/skills/profile"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(profileDraft),
      });
      const body = (await response.json()) as {
        error?: string;
        profile?: SkillProfile;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "プロフィールを保存できませんでした。");
      }
      if (body.profile) setSavedProfile(body.profile);
      setProfileStatus("success");
      setProfileMessage(
        profileDraft.shareEnabled
          ? "プロフィールを保存しました。共有を再開した場合は、安全のため新しいURLを発行しています。"
          : "プロフィールと共有停止を保存しました。以前の共有URLからは閲覧できません。",
      );
    } catch (error) {
      setProfileStatus("error");
      setProfileMessage(
        error instanceof Error
          ? error.message
          : "プロフィールを保存できませんでした。",
      );
    }
  }

  async function saveEvidence(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setEvidenceStatus("sending");
    setEvidenceMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(withSiteBasePath("/api/skills/evidence"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientRequestId: evidenceRequestId,
          sourceType,
          taskId: sourceType === "curriculum" ? selectedTaskId : null,
          skillKeys: priorWorkSkillKeys,
          title: form.get("title"),
          summary: form.get("summary"),
          evidenceUrl: form.get("evidenceUrl"),
          rightsConfirmed,
          visibility: form.get("visibility"),
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "学習記録を保存できませんでした。");
      }
      setEvidenceStatus("success");
      setEvidenceMessage(
        "実践記録を保存し、講師確認待ちにしました。公開設定を選んでいても、講師確認までは共有ページへ出ません。",
      );
    } catch (error) {
      setEvidenceStatus("error");
      setEvidenceMessage(
        error instanceof Error
          ? error.message
          : "学習記録を保存できませんでした。",
      );
    }
  }

  async function changeVisibility(
    evidenceId: string,
    visibility: EvidenceVisibility,
  ) {
    if (
      visibility === "shared" &&
      !window.confirm(
        "この成果物の名前・説明・外部URLと講師確認範囲が、共有プロフィールのURLを知る人へ表示されます。内容を確認して共有しますか？",
      )
    ) {
      return;
    }
    setPendingActionId(evidenceId);
    setActionMessage("");
    try {
      const response = await fetch(withSiteBasePath("/api/skills/evidence"), {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evidenceId, visibility }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "公開範囲を変更できませんでした。");
      }
      window.location.reload();
    } catch (error) {
      setActionMessageKind("error");
      setActionMessage(
        error instanceof Error
          ? error.message
          : "公開範囲を変更できませんでした。",
      );
      setPendingActionId(null);
    }
  }

  async function createReviewLink(evidenceId: string) {
    if (
      !window.confirm(
        "評価リンクは、URLを受け取ったChatGPT利用者なら回答できます。意図した相手へ個別に送り、誤送信時はすぐ失効してください。作成しますか？",
      )
    ) {
      return;
    }
    setPendingActionId(evidenceId);
    setActionMessage("");
    setInvitationUrl("");
    setInvitationRequestId("");
    try {
      const response = await fetch(
        withSiteBasePath("/api/skills/review-requests"),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ evidenceId }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        invitation?: { id: string; token: string; expiresAt: number };
      };
      if (!response.ok || !body.invitation) {
        throw new Error(body.error ?? "評価リンクを作成できませんでした。");
      }
      const url = `${window.location.origin}${withSiteBasePath(`/review/${body.invitation.token}`)}`;
      setInvitationUrl(url);
      setInvitationRequestId(body.invitation.id);
      setActionMessageKind("success");
      setActionMessage(
        `14日間・1回だけ使える評価リンクを作成しました。この画面を離れると再表示できません。`,
      );
    } catch (error) {
      setActionMessageKind("error");
      setActionMessage(
        error instanceof Error
          ? error.message
          : "評価リンクを作成できませんでした。",
      );
    } finally {
      setPendingActionId(null);
    }
  }

  async function revokeReviewRequest(requestId: string) {
    setPendingActionId(requestId);
    setActionMessage("");
    try {
      const response = await fetch(
        withSiteBasePath("/api/skills/review-requests"),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ action: "revoke", requestId }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "評価依頼を失効できませんでした。");
      }
      setRevokedRequestIds((current) => [...current, requestId]);
      if (requestId === invitationRequestId) {
        setInvitationUrl("");
        setInvitationRequestId("");
      }
      setActionMessageKind("success");
      setActionMessage("評価依頼を失効しました。以前のリンクは使えません。");
    } catch (error) {
      setActionMessageKind("error");
      setActionMessage(
        error instanceof Error
          ? error.message
          : "評価依頼を失効できませんでした。",
      );
    } finally {
      setPendingActionId(null);
    }
  }

  async function copyText(value: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(value);
      setActionMessageKind("success");
      setActionMessage(successMessage);
    } catch {
      setActionMessageKind("error");
      setActionMessage(
        "コピーできませんでした。文字列を選択してコピーしてください。",
      );
    }
  }

  function togglePriorWorkSkill(key: SkillKey, checked: boolean) {
    setPriorWorkSkillKeys((current) => {
      if (!checked) return current.filter((item) => item !== key);
      if (current.includes(key) || current.length >= 3) return current;
      return [...current, key];
    });
  }

  return (
    <section
      id="skills"
      className="mt-16 scroll-mt-24 border-t-2 border-brand-dark pt-8"
    >
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            AI PRACTICE PASSPORT
          </p>
          <h2 className="mt-3 font-mincho text-4xl sm:text-5xl">
            できることを、証拠で残す。
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
            教科書で学んだことも、これまでの実務・自主制作も記録できます。本人の記録、講師確認、第三者評価を混ぜずに表示し、応募時に説明しやすい形へ整えます。
          </p>
        </div>
        {savedProfile.shareEnabled ? (
          <Link
            className="soft-button inline-flex min-h-12 items-center gap-3 border border-sapphire bg-white px-5 text-xs font-semibold text-sapphire"
            href={`/skills/${savedProfile.publicSlug}`}
            rel="noopener noreferrer"
            target="_blank"
          >
            共有ページを見る
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className="soft-work-surface soft-panel-clip mt-8 grid border border-rule bg-paper-white sm:grid-cols-3">
        <div className="border-b border-rule p-6 sm:border-b-0 sm:border-r">
          <FileCheck2 className="size-5 text-sapphire" aria-hidden="true" />
          <p className="mt-4 text-[11px] text-quiet">本人の実践記録</p>
          <p className="numeric-text mt-2 text-3xl">{evidence.length}件</p>
        </div>
        <div className="border-b border-rule p-6 sm:border-b-0 sm:border-r">
          <UserRoundCheck
            className="size-5 text-future-mint"
            aria-hidden="true"
          />
          <p className="mt-4 text-[11px] text-quiet">講師確認済み</p>
          <p className="numeric-text mt-2 text-3xl">{verifiedCount}件</p>
        </div>
        <div className="p-6">
          <MessageSquareText
            className="size-5 text-sunrise"
            aria-hidden="true"
          />
          <p className="mt-4 text-xs text-quiet">運営承認・公開同意あり</p>
          <p className="numeric-text mt-2 text-3xl">{approvedReviewCount}件</p>
          <p className="mt-2 text-xs leading-5 text-quiet">
            実際の共有には、現行規約への同意と成果物ごとの共有設定も必要です。
          </p>
        </div>
      </div>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sapphire">SKILL MAP</p>
            <h3 className="mt-2 font-mincho text-3xl">証拠の厚みを見る</h3>
          </div>
          <p className="hidden text-[11px] text-quiet sm:block">
            点数・人の順位ではありません
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {skillStats.map((skill) => (
            <article
              className={`soft-card border p-5 ${skill.recorded > 0 ? "border-sapphire/35 bg-paper-white" : "border-rule bg-paper-white/60"}`}
              key={skill.key}
            >
              <h4 className="font-semibold">{skill.shortLabel}</h4>
              <p className="mt-2 min-h-12 text-[11px] leading-5 text-quiet">
                {skill.description}
              </p>
              <div className="mt-4 grid gap-2 text-[10px]">
                <div className="flex items-center justify-between">
                  <span>実践記録</span>
                  <span className="numeric-text">{skill.recorded}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-rule">
                  <div
                    className="h-full rounded-full bg-sapphire transition-[width]"
                    style={{
                      width: `${Math.min(100, skill.recorded * 20)}%`,
                    }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-quiet">
                  <span>講師 {skill.verified}</span>
                  <span>第三者 {skill.externallyReviewed}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-10 grid gap-6 xl:grid-cols-2">
        <form
          className="soft-panel border border-rule bg-paper-white p-6 sm:p-8"
          onSubmit={saveProfile}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-sapphire">PROFILE</p>
              <h3 className="mt-2 font-mincho text-3xl">応募用の見せ方</h3>
            </div>
            <BriefcaseBusiness
              className="size-5 text-sapphire"
              aria-hidden="true"
            />
          </div>
          <div className="mt-6 grid gap-5">
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="skill-profile-headline"
            >
              一言で表すと
              <Input
                className="min-h-12 bg-white px-4 font-normal"
                id="skill-profile-headline"
                maxLength={120}
                minLength={profileDraft.shareEnabled ? 3 : undefined}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    headline: event.target.value,
                  }))
                }
                placeholder="例：現場の困りごとを、AIと小さな仕組みに変えます"
                value={profileDraft.headline}
              />
            </label>
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="skill-profile-target-role"
            >
              目指す仕事・役割（任意）
              <Input
                className="min-h-12 bg-white px-4 font-normal"
                id="skill-profile-target-role"
                maxLength={80}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    targetRole: event.target.value,
                  }))
                }
                placeholder="例：営業企画／社内AI推進"
                value={profileDraft.targetRole}
              />
            </label>
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="skill-profile-bio"
            >
              仕事でどう活かしたいか
              <Textarea
                className="min-h-32 bg-white p-4 font-normal leading-7"
                id="skill-profile-bio"
                maxLength={600}
                minLength={profileDraft.shareEnabled ? 20 : undefined}
                onChange={(event) =>
                  setProfileDraft((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                placeholder="学んだ背景、得意な仕事、これから挑戦したいことを書きます。"
                value={profileDraft.bio}
              />
            </label>
            <label
              className="soft-control flex cursor-pointer items-start gap-3 border border-sapphire/25 bg-sapphire-soft p-5 text-sm leading-7"
              htmlFor="skill-profile-share-enabled"
            >
              <Checkbox
                checked={profileDraft.shareEnabled}
                className="mt-1"
                id="skill-profile-share-enabled"
                onCheckedChange={(checked) =>
                  setProfileDraft((current) => ({
                    ...current,
                    shareEnabled: checked === true,
                  }))
                }
              />
              <span>
                URL共有ページを有効にする。検索エンジンには掲載しませんが、URLを知る人は閲覧できます。共有を選んだ講師確認済み成果物だけを表示します。
              </span>
            </label>
            {profileStatus === "success" || profileStatus === "error" ? (
              <StatusMessage kind={profileStatus}>
                {profileMessage}
              </StatusMessage>
            ) : null}
            <Button
              className="min-h-12 bg-brand-dark text-sm text-white"
              disabled={
                profileStatus === "sending" ||
                (profileDraft.shareEnabled &&
                  (profileDraft.headline.trim().length < 3 ||
                    profileDraft.bio.trim().length < 20))
              }
              type="submit"
            >
              {profileStatus === "sending"
                ? "保存しています…"
                : "プロフィールを保存"}
            </Button>
            {savedProfile.shareEnabled ? (
              <button
                className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-sapphire"
                onClick={() =>
                  copyText(
                    `${window.location.origin}${withSiteBasePath(`/skills/${savedProfile.publicSlug}`)}`,
                    "共有ページのURLをコピーしました。",
                  )
                }
                type="button"
              >
                <Clipboard className="size-4" aria-hidden="true" />
                URL共有ページをコピー
              </button>
            ) : null}
          </div>
        </form>

        <form
          className="soft-panel border border-rule bg-paper-white p-6 sm:p-8"
          onSubmit={saveEvidence}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-sapphire">
                ADD EVIDENCE
              </p>
              <h3 className="mt-2 font-mincho text-3xl">できたことを記録</h3>
            </div>
            <Plus className="size-5 text-sapphire" aria-hidden="true" />
          </div>

          <fieldset className="mt-6">
            <legend className="text-sm font-semibold">記録するもの</legend>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {(["curriculum", "prior-work"] as const).map((value) => (
                <label
                  className={`soft-control cursor-pointer border p-4 text-sm ${sourceType === value ? "border-sapphire bg-sapphire-soft font-semibold text-sapphire" : "border-rule bg-white"}`}
                  key={value}
                >
                  <input
                    checked={sourceType === value}
                    className="sr-only"
                    name="sourceType"
                    onChange={() => setSourceType(value)}
                    type="radio"
                  />
                  {evidenceSourceLabels[value]}
                </label>
              ))}
            </div>
          </fieldset>

          {sourceType === "curriculum" ? (
            <div className="mt-5">
              <label
                className="grid gap-2 text-sm font-semibold"
                htmlFor="skill-task-search"
              >
                730課題から探す
                <span className="relative">
                  <Search
                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-quiet"
                    aria-hidden="true"
                  />
                  <Input
                    className="min-h-12 bg-white pl-11 pr-4 font-normal"
                    id="skill-task-search"
                    onChange={(event) => {
                      setTaskQuery(event.target.value);
                      setSelectedTaskId("");
                    }}
                    placeholder="課題ID、メール、Excel、営業など"
                    value={taskQuery}
                  />
                </span>
              </label>
              <ul
                aria-label="課題の検索結果"
                className="mt-3 max-h-60 overflow-y-auto rounded-2xl border border-rule bg-white p-2"
              >
                {matchingTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      aria-current={
                        selectedTaskId === task.id ? "true" : undefined
                      }
                      className={`flex w-full items-start gap-3 rounded-xl p-3 text-left text-xs leading-6 ${selectedTaskId === task.id ? "bg-sapphire-soft text-brand-dark" : "hover:bg-paper"}`}
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setTaskQuery(`${task.id} ${task.title}`);
                      }}
                      type="button"
                    >
                      <span className="numeric-text mt-0.5 shrink-0 text-sapphire">
                        {task.id}
                      </span>
                      <span>{task.title}</span>
                    </button>
                  </li>
                ))}
                {matchingTasks.length === 0 ? (
                  <li className="p-4 text-xs text-quiet">
                    該当する課題がありません。
                  </li>
                ) : null}
              </ul>
              {selectedTask ? (
                <div
                  aria-live="polite"
                  className="soft-control mt-3 border border-future-mint bg-future-mint-soft p-4 text-xs leading-6"
                >
                  <p className="font-semibold">{selectedTask.title}</p>
                  <p className="mt-1 text-quiet">
                    完成物：{selectedTask.outcome}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <fieldset className="mt-5">
              <legend className="text-sm font-semibold">
                今できるスキルを1〜3個選ぶ
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {skillDefinitions.map((skill) => (
                  <label
                    className="soft-control flex cursor-pointer items-center gap-3 border border-rule bg-white p-3 text-xs"
                    htmlFor={`prior-work-skill-${skill.key}`}
                    key={skill.key}
                  >
                    <Checkbox
                      checked={priorWorkSkillKeys.includes(skill.key)}
                      disabled={
                        priorWorkSkillKeys.length >= 3 &&
                        !priorWorkSkillKeys.includes(skill.key)
                      }
                      id={`prior-work-skill-${skill.key}`}
                      onCheckedChange={(checked) =>
                        togglePriorWorkSkill(skill.key, checked === true)
                      }
                    />
                    <span>{skill.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-5 grid gap-5">
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="skill-evidence-title"
            >
              成果物名
              <Input
                className="min-h-12 bg-white px-4 font-normal"
                id="skill-evidence-title"
                maxLength={120}
                minLength={3}
                name="title"
                placeholder="例：商談後フォローを10分で終える営業セット"
                required
              />
            </label>
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="skill-evidence-summary"
            >
              できるようになったこと・確認したこと
              <Textarea
                className="min-h-36 bg-white p-4 font-normal leading-7"
                id="skill-evidence-summary"
                maxLength={1_200}
                minLength={20}
                name="summary"
                placeholder="何を作り、どんな操作をして、どこまで確認できたか。未確認の点も書きます。"
                required
              />
            </label>
            <label
              className="grid gap-2 text-sm font-semibold"
              htmlFor="skill-evidence-url"
            >
              成果物URL（任意・httpsのみ）
              <Input
                className="min-h-12 bg-white px-4 font-normal"
                id="skill-evidence-url"
                maxLength={2_000}
                name="evidenceUrl"
                placeholder="https://..."
                type="url"
              />
              <span className="text-[11px] font-normal leading-5 text-quiet">
                現在はファイル直接アップロード未対応です。顧客情報・社外秘・権利未確認素材は載せず、共有権限も確認してください。
              </span>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              講師確認後の公開範囲
              <select
                className="min-h-12 border border-input bg-white px-4 font-normal outline-none focus:border-sapphire focus:ring-3 focus:ring-sapphire/20"
                defaultValue="private"
                name="visibility"
              >
                <option value="private">自分と講師だけ</option>
                <option value="shared">URL共有プロフィールへ掲載</option>
              </select>
            </label>
            <label
              className="soft-control flex cursor-pointer items-start gap-3 border border-sunrise/40 bg-sunrise-soft p-5 text-sm leading-7"
              htmlFor="skill-evidence-rights-confirmed"
            >
              <Checkbox
                checked={rightsConfirmed}
                className="mt-1"
                id="skill-evidence-rights-confirmed"
                onCheckedChange={(checked) =>
                  setRightsConfirmed(checked === true)
                }
              />
              <span>
                この記録とリンクに、無断掲載の顧客情報・社外秘・第三者の個人情報・権利未確認素材がなく、必要な共有許可を確認しました。
              </span>
            </label>
            {evidenceStatus === "success" || evidenceStatus === "error" ? (
              <div className="grid gap-3">
                <StatusMessage kind={evidenceStatus}>
                  {evidenceMessage}
                </StatusMessage>
                {evidenceStatus === "success" ? (
                  <Button
                    onClick={() => window.location.reload()}
                    type="button"
                    variant="outline"
                  >
                    保存した記録を一覧へ反映
                  </Button>
                ) : null}
              </div>
            ) : null}
            <Button
              className="min-h-12 bg-sapphire text-sm text-white"
              disabled={
                evidenceStatus === "sending" ||
                evidenceStatus === "success" ||
                !rightsConfirmed ||
                (sourceType === "curriculum"
                  ? !selectedTaskId
                  : priorWorkSkillKeys.length < 1)
              }
              type="submit"
            >
              <Send className="size-4" aria-hidden="true" />
              {evidenceStatus === "sending"
                ? "保存しています…"
                : evidenceStatus === "success"
                  ? "保存済みです"
                  : "実践記録を保存して講師確認へ"}
            </Button>
          </div>
        </form>
      </div>

      <section className="mt-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-sapphire">MY EVIDENCE</p>
            <h3 className="mt-2 font-mincho text-3xl">成果物の確認状況</h3>
          </div>
          <BookOpenText className="size-5 text-sapphire" aria-hidden="true" />
        </div>

        {actionMessage ? (
          <div className="mt-5">
            <StatusMessage kind={actionMessageKind}>
              {actionMessage}
            </StatusMessage>
            {invitationUrl ? (
              <div className="soft-control mt-3 border border-sapphire bg-white p-4">
                <p className="text-xs leading-6 text-quiet">
                  このURLは評価者本人へ個別に送ってください。宛先とは技術的に結び付いていないため、転送された場合は別の人も回答できます。
                </p>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 overflow-x-auto text-xs text-sapphire">
                    {invitationUrl}
                  </code>
                  <Button
                    className="shrink-0"
                    onClick={() =>
                      copyText(
                        invitationUrl,
                        "第三者評価リンクをコピーしました。",
                      )
                    }
                    type="button"
                    variant="outline"
                  >
                    <Clipboard className="size-4" aria-hidden="true" />
                    コピー
                  </Button>
                  {invitationRequestId ? (
                    <Button
                      className="shrink-0"
                      disabled={pendingActionId === invitationRequestId}
                      onClick={() => revokeReviewRequest(invitationRequestId)}
                      type="button"
                      variant="outline"
                    >
                      <EyeOff className="size-4" aria-hidden="true" />
                      今すぐ失効
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {reviewRequests.length > 0 ? (
          <details className="soft-panel mt-5 border border-rule bg-paper-white p-5">
            <summary className="cursor-pointer text-sm font-semibold">
              第三者評価依頼を管理（最新{reviewRequests.length}件）
            </summary>
            <p className="mt-3 text-xs leading-6 text-quiet">
              評価URLは作成時だけ表示します。誤送信した場合や不要になった場合は、期限前でもここから失効できます。
            </p>
            <div className="mt-4 grid gap-3">
              {reviewRequests.map((request) => {
                const revoked = revokedRequestIds.includes(request.id);
                const statusLabel = revoked
                  ? "失効済み"
                  : request.status === "submitted"
                    ? "回答済み"
                    : request.status === "revoked"
                      ? "失効済み"
                      : "回答待ち（期限到来後は使用不可）";
                return (
                  <div
                    className="soft-control grid gap-3 border border-rule bg-paper p-4 text-xs sm:grid-cols-[1fr_auto] sm:items-center"
                    key={request.id}
                  >
                    <div className="min-w-0">
                      <p className="break-words font-semibold">
                        {request.evidenceTitle}
                      </p>
                      <p className="mt-1 text-quiet">
                        {statusLabel}／作成 {formatDate(request.createdAt)}
                        ／期限 {formatDate(request.expiresAt)}
                      </p>
                    </div>
                    {request.status === "open" && !revoked ? (
                      <Button
                        disabled={pendingActionId === request.id}
                        onClick={() => revokeReviewRequest(request.id)}
                        type="button"
                        variant="outline"
                      >
                        <EyeOff className="size-4" aria-hidden="true" />
                        この依頼を失効
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}

        {evidence.length === 0 ? (
          <div className="soft-panel mt-6 border border-rule bg-paper-white p-7 sm:p-9">
            <FileCheck2 className="size-5 text-sapphire" aria-hidden="true" />
            <p className="mt-4 font-mincho text-2xl">
              最初の成果物を残しましょう。
            </p>
            <p className="mt-3 text-sm leading-7 text-quiet">
              まず一つ、作ったものと確認できたことを記録すると、スキルマップが動き始めます。
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-5">
            {evidence.map((item) => {
              const itemReviews = reviews.filter(
                (review) => review.evidenceId === item.id,
              );
              return (
                <article
                  className="soft-panel border border-rule bg-paper-white p-6 sm:p-8"
                  key={item.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="soft-badge bg-sapphire-soft px-3 py-1 text-xs font-semibold text-sapphire">
                      {item.taskId ?? "実務・自主制作"}
                    </span>
                    <span
                      className={`soft-badge px-3 py-1 text-xs font-semibold ${item.instructorStatus === "verified" ? "bg-future-mint-soft text-brand-dark" : item.instructorStatus === "changes_requested" ? "bg-human-coral-soft text-human-coral" : "bg-sunrise-soft text-warning"}`}
                    >
                      {instructorStatusLabels[item.instructorStatus]}
                    </span>
                    <span className="ml-auto text-xs text-quiet">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h4 className="mt-5 font-mincho text-2xl">{item.title}</h4>
                  <p className="mt-2 text-xs leading-6 text-quiet">
                    {item.taskTitle}
                  </p>
                  <p className="mt-4 text-sm leading-7">{item.summary}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.skillKeys.map((key) => {
                      const skill = getSkillDefinition(key);
                      return skill ? (
                        <span
                          className="soft-badge border border-rule bg-paper px-3 py-1 text-xs"
                          key={key}
                        >
                          {skill.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {item.instructorNote ? (
                    <div className="soft-control mt-5 border border-future-mint bg-future-mint-soft p-4 text-xs leading-6">
                      <p className="font-semibold">講師・運営の記録</p>
                      <p className="mt-2 text-quiet">{item.instructorNote}</p>
                      {item.verifiedAt ? (
                        <p className="mt-2 text-xs text-quiet">
                          {safeVerifierName(item.verifiedByName)}／
                          {formatDate(item.verifiedAt)}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {item.instructorStatus === "changes_requested" ? (
                    <EvidenceRevisionForm evidence={item} />
                  ) : null}

                  <div className="mt-6 flex flex-wrap gap-3 border-t border-rule pt-5">
                    {item.evidenceUrl ? (
                      <a
                        className="soft-button inline-flex min-h-10 items-center gap-2 border border-rule px-4 text-xs font-semibold"
                        href={item.evidenceUrl}
                        referrerPolicy="no-referrer"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        <Link2 className="size-4" aria-hidden="true" />
                        外部成果物を開く（{hostnameFromUrl(item.evidenceUrl)}）
                      </a>
                    ) : null}
                    <Button
                      className="min-h-10"
                      disabled={pendingActionId === item.id}
                      onClick={() =>
                        changeVisibility(
                          item.id,
                          item.visibility === "shared" ? "private" : "shared",
                        )
                      }
                      type="button"
                      variant="outline"
                    >
                      {item.visibility === "shared" ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                      {item.visibility === "shared"
                        ? "共有から外す"
                        : "確認後に共有する"}
                    </Button>
                    {item.instructorStatus === "verified" ? (
                      <Button
                        className="min-h-10 bg-brand-dark text-white"
                        disabled={pendingActionId === item.id}
                        onClick={() => createReviewLink(item.id)}
                        type="button"
                      >
                        <UserRoundCheck className="size-4" aria-hidden="true" />
                        第三者へ評価を依頼
                      </Button>
                    ) : null}
                  </div>

                  {itemReviews.length > 0 ? (
                    <div className="mt-6 grid gap-3 border-t border-rule pt-5">
                      <p className="text-xs font-semibold text-sapphire">
                        第三者から届いた評価
                      </p>
                      {itemReviews.map((review) => (
                        <div
                          className="soft-control border border-rule bg-paper p-5"
                          key={review.id}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px]">
                            <p className="font-semibold">
                              {review.reviewerName}
                              {review.reviewerAffiliation
                                ? `／${review.reviewerAffiliation}`
                                : ""}
                            </p>
                            <span className="soft-badge bg-white px-3 py-1 text-quiet">
                              {moderationStatusLabels[review.moderationStatus]}
                            </span>
                          </div>
                          <p className="mt-2 text-[11px] text-quiet">
                            {externalRelationshipLabels[review.relationship]}／
                            {externalRatingLabels[review.rating]}
                          </p>
                          <p className="mt-3 text-sm leading-7">
                            {review.comment}
                          </p>
                          {review.moderationNote ? (
                            <p className="mt-3 border-t border-rule pt-3 text-[11px] leading-5 text-quiet">
                              運営の掲載判断：{review.moderationNote}
                            </p>
                          ) : null}
                          {!review.consentPublic ? (
                            <p className="mt-3 text-[10px] text-quiet">
                              評価者は公開掲載に同意していないため、マイページ内だけで表示します。
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="soft-panel mt-10 grid gap-5 border border-sapphire/25 bg-sapphire-soft p-6 text-xs leading-6 text-brand-dark md:grid-cols-3">
        <p className="flex items-start gap-3">
          <Check
            className="mt-0.5 size-4 shrink-0 text-sapphire"
            aria-hidden="true"
          />
          レベル番号は人の順位に使わず、作った成果物と確認範囲を表示します。
        </p>
        <p className="flex items-start gap-3">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-sapphire"
            aria-hidden="true"
          />
          URL共有ページには、本人が選んだ講師確認済み記録だけを載せます。URLを知る人は閲覧できます。
        </p>
        <p className="flex items-start gap-3">
          <BadgeCheck
            className="mt-0.5 size-4 shrink-0 text-sapphire"
            aria-hidden="true"
          />
          転職の採用を保証する資格ではなく、面接で具体的に説明するための証拠台帳です。
        </p>
      </div>
    </section>
  );
}
