"use client";

import {
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Save,
  UsersRound,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";

import Link from "@/components/site-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminApplication, ApplicationStatus } from "@/db/membership";
import {
  applicationStatusLabels,
  findMemberServicePlan,
} from "@/lib/member-service-plans";
import { withSiteBasePath } from "@/lib/site-paths";

type ApplicationDraft = {
  status: ApplicationStatus;
  persistedStatus: ApplicationStatus;
  memberMessage: string;
  assignedInstructor: string;
  scheduledAt: string;
  deliveryDetails: string;
  internalNote: string;
  expectedUpdatedAt: number;
};

const statusFilters: ApplicationStatus[] = [
  "received",
  "reviewing",
  "confirmed",
  "cancelled",
];

const statusOptions: Record<ApplicationStatus, ApplicationStatus[]> = {
  received: ["received", "reviewing", "cancelled"],
  reviewing: ["reviewing", "confirmed", "cancelled"],
  confirmed: ["confirmed"],
  cancelled: ["cancelled"],
};

function formatDate(value: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function toDateTimeLocal(value: number | null): string {
  if (!value) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Tokyo",
  })
    .format(new Date(value))
    .replace(" ", "T");
}

function fromTokyoDateTimeLocal(value: string): number | null {
  if (!value) return null;
  const timestamp = Date.parse(`${value}:00+09:00`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function createDraft(application: AdminApplication): ApplicationDraft {
  return {
    status: application.status,
    persistedStatus: application.status,
    memberMessage: application.memberMessage ?? "",
    assignedInstructor: application.assignedInstructor ?? "",
    scheduledAt: toDateTimeLocal(application.scheduledAt),
    deliveryDetails: application.deliveryDetails ?? "",
    internalNote: application.internalNote ?? "",
    expectedUpdatedAt: application.updatedAt,
  };
}

function filterHref(status?: ApplicationStatus) {
  return status ? `/admin?status=${status}` : "/admin";
}

export function AdminApplicationQueue({
  applications,
  totalCount,
  page,
  pageCount,
  statusFilter,
}: {
  applications: AdminApplication[];
  totalCount: number;
  page: number;
  pageCount: number;
  statusFilter?: ApplicationStatus;
}) {
  const [drafts, setDrafts] = useState<Record<string, ApplicationDraft>>(() =>
    Object.fromEntries(
      applications.map((application) => [
        application.id,
        createDraft(application),
      ]),
    ),
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [messages, setMessages] = useState<
    Record<string, { kind: "success" | "error"; text: string }>
  >({});

  function updateDraft<K extends keyof ApplicationDraft>(
    applicationId: string,
    field: K,
    value: ApplicationDraft[K],
  ) {
    setDrafts((current) => ({
      ...current,
      [applicationId]: { ...current[applicationId], [field]: value },
    }));
  }

  async function saveApplication(
    event: SubmitEvent<HTMLFormElement>,
    applicationId: string,
  ) {
    event.preventDefault();
    const draft = drafts[applicationId];
    if (!draft) return;
    setPendingId(applicationId);
    setMessages((current) => {
      const next = { ...current };
      delete next[applicationId];
      return next;
    });

    try {
      const response = await fetch(
        withSiteBasePath("/api/admin/applications"),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            applicationId,
            expectedUpdatedAt: draft.expectedUpdatedAt,
            status: draft.status,
            memberMessage: draft.memberMessage,
            assignedInstructor: draft.assignedInstructor,
            scheduledAt: fromTokyoDateTimeLocal(draft.scheduledAt),
            deliveryDetails: draft.deliveryDetails,
            internalNote: draft.internalNote,
          }),
        },
      );
      const body = (await response.json()) as {
        error?: string;
        updatedAt?: number;
      };
      if (!response.ok || !body.updatedAt) {
        throw new Error(body.error ?? "申込管理を保存できませんでした。");
      }
      setDrafts((current) => ({
        ...current,
        [applicationId]: {
          ...current[applicationId]!,
          expectedUpdatedAt: body.updatedAt!,
          persistedStatus: draft.status,
        },
      }));
      setMessages((current) => ({
        ...current,
        [applicationId]: {
          kind: "success",
          text: "保存しました。会員のマイページへ最新状態が表示されます。",
        },
      }));
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [applicationId]: {
          kind: "error",
          text:
            error instanceof Error
              ? error.message
              : "申込管理を保存できませんでした。",
        },
      }));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section id="applications" className="scroll-mt-24">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-sapphire">
            APPLICATION OPERATIONS
          </p>
          <h1 className="mt-4 font-mincho text-4xl">受講申込を処理する</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-quiet">
            受付から内容確認、担当・日時・実施方法の確定までを管理します。会員向け案内と運営内部メモは分けて保存されます。
          </p>
        </div>
        <div className="soft-work-surface border border-rule bg-paper-white px-5 py-4">
          <p className="text-[11px] text-quiet">
            {statusFilter
              ? `${applicationStatusLabels[statusFilter]}の件数`
              : "全申込件数"}
          </p>
          <p className="numeric-text mt-1 text-2xl">{totalCount}件</p>
        </div>
      </div>

      <nav
        aria-label="申込状態で絞り込む"
        className="mt-7 flex flex-wrap gap-2"
      >
        <Link
          className={`soft-control border px-4 py-2 text-xs font-semibold ${!statusFilter ? "border-sapphire bg-sapphire text-white" : "border-rule bg-white text-quiet"}`}
          href={filterHref()}
        >
          すべて
        </Link>
        {statusFilters.map((status) => (
          <Link
            className={`soft-control border px-4 py-2 text-xs font-semibold ${statusFilter === status ? "border-sapphire bg-sapphire text-white" : "border-rule bg-white text-quiet"}`}
            href={filterHref(status)}
            key={status}
          >
            {applicationStatusLabels[status]}
          </Link>
        ))}
      </nav>

      {applications.length === 0 ? (
        <div className="soft-work-surface mt-7 border border-rule bg-paper-white p-8 sm:p-10">
          <CheckCircle2
            className="size-6 text-future-mint"
            aria-hidden="true"
          />
          <p className="mt-5 font-mincho text-2xl">
            この条件の申込はありません。
          </p>
        </div>
      ) : (
        <div className="mt-7 grid gap-5">
          {applications.map((application) => {
            const draft = drafts[application.id];
            const plan = findMemberServicePlan(application.serviceType);
            const message = messages[application.id];
            if (!draft) return null;
            return (
              <form
                className="soft-panel border border-rule bg-paper-white p-6 sm:p-8"
                key={application.id}
                onSubmit={(event) => saveApplication(event, application.id)}
              >
                <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="soft-badge bg-sapphire-soft px-3 py-1 text-xs font-semibold text-sapphire">
                        {applicationStatusLabels[draft.status]}
                      </span>
                      <span className="text-xs text-quiet">
                        受付 {formatDate(application.createdAt)}
                      </span>
                    </div>
                    <h2 className="mt-5 break-words font-mincho text-2xl">
                      {plan?.name ?? application.serviceType}
                    </h2>
                    <p className="mt-2 text-sm font-semibold">
                      {application.offerSnapshot?.price ?? plan?.price}
                    </p>
                    <div className="mt-5 grid gap-2 text-sm">
                      <p className="break-words font-semibold">
                        {application.memberDisplayName}
                      </p>
                      <a
                        className="inline-flex min-w-0 items-center gap-2 break-all text-sapphire underline underline-offset-4"
                        href={`mailto:${application.memberEmail}`}
                      >
                        <Mail className="size-4 shrink-0" aria-hidden="true" />
                        {application.memberEmail}
                      </a>
                      <p className="mt-2 flex items-center gap-2 text-xs text-quiet">
                        <UsersRound className="size-4" aria-hidden="true" />
                        {application.participants}名／希望：
                        {application.preferredSchedule}
                      </p>
                    </div>
                    <div className="mt-5 border-t border-rule pt-5 text-sm leading-7">
                      <p className="font-semibold">できるようになりたいこと</p>
                      <p className="mt-2 break-words">{application.goal}</p>
                      {application.notes ? (
                        <p className="mt-3 break-words text-quiet">
                          補足：{application.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="soft-control grid gap-5 border border-rule bg-paper p-5 sm:grid-cols-2">
                    <label
                      className="grid gap-2 text-xs font-semibold"
                      htmlFor={`application-status-${application.id}`}
                    >
                      対応状態
                      <select
                        className="min-h-11 border border-input bg-white px-3 font-normal"
                        id={`application-status-${application.id}`}
                        onChange={(event) =>
                          updateDraft(
                            application.id,
                            "status",
                            event.target.value as ApplicationStatus,
                          )
                        }
                        value={draft.status}
                      >
                        {statusOptions[draft.persistedStatus].map((status) => (
                          <option key={status} value={status}>
                            {applicationStatusLabels[status]}
                          </option>
                        ))}
                      </select>
                      {draft.persistedStatus === "confirmed" ||
                      draft.persistedStatus === "cancelled" ? (
                        <span className="font-normal leading-5 text-quiet">
                          この状態は確定済みです。再開する場合は新しい申込として受け付けます。
                        </span>
                      ) : null}
                    </label>
                    <label
                      className="grid gap-2 text-xs font-semibold"
                      htmlFor={`application-instructor-${application.id}`}
                    >
                      担当講師
                      <Input
                        className="min-h-11 bg-white px-3 font-normal"
                        id={`application-instructor-${application.id}`}
                        maxLength={120}
                        onChange={(event) =>
                          updateDraft(
                            application.id,
                            "assignedInstructor",
                            event.target.value,
                          )
                        }
                        placeholder="例：藤本"
                        value={draft.assignedInstructor}
                      />
                    </label>
                    <label
                      className="grid gap-2 text-xs font-semibold"
                      htmlFor={`application-scheduled-${application.id}`}
                    >
                      実施日時（日本時間）
                      <span className="relative">
                        <CalendarClock
                          className="pointer-events-none absolute left-3 top-3 size-4 text-quiet"
                          aria-hidden="true"
                        />
                        <Input
                          className="min-h-11 bg-white pl-10 font-normal"
                          id={`application-scheduled-${application.id}`}
                          onInput={(event) =>
                            updateDraft(
                              application.id,
                              "scheduledAt",
                              event.currentTarget.value,
                            )
                          }
                          type="datetime-local"
                          value={draft.scheduledAt}
                        />
                      </span>
                    </label>
                    <label
                      className="grid gap-2 text-xs font-semibold"
                      htmlFor={`application-member-message-${application.id}`}
                    >
                      会員への案内
                      <Textarea
                        className="min-h-24 bg-white p-3 font-normal leading-6"
                        id={`application-member-message-${application.id}`}
                        maxLength={600}
                        onChange={(event) =>
                          updateDraft(
                            application.id,
                            "memberMessage",
                            event.target.value,
                          )
                        }
                        placeholder="マイページへ表示する次の手順や取消理由"
                        value={draft.memberMessage}
                      />
                    </label>
                    <label
                      className="grid gap-2 text-xs font-semibold sm:col-span-2"
                      htmlFor={`application-delivery-${application.id}`}
                    >
                      会場・Google Meet・当日の案内
                      <Textarea
                        className="min-h-24 bg-white p-3 font-normal leading-6"
                        id={`application-delivery-${application.id}`}
                        maxLength={600}
                        onChange={(event) =>
                          updateDraft(
                            application.id,
                            "deliveryDetails",
                            event.target.value,
                          )
                        }
                        placeholder="確定後に会員へ表示する会場名、集合方法、Google Meet URLなど"
                        value={draft.deliveryDetails}
                      />
                    </label>
                    <label
                      className="grid gap-2 text-xs font-semibold sm:col-span-2"
                      htmlFor={`application-internal-note-${application.id}`}
                    >
                      運営内部メモ（会員には非表示）
                      <Textarea
                        className="min-h-24 bg-white p-3 font-normal leading-6"
                        id={`application-internal-note-${application.id}`}
                        maxLength={1_000}
                        onChange={(event) =>
                          updateDraft(
                            application.id,
                            "internalNote",
                            event.target.value,
                          )
                        }
                        placeholder="確認事項、対応履歴、引継ぎ事項。機微情報は必要最小限にします。"
                        value={draft.internalNote}
                      />
                    </label>
                    {message ? (
                      <div
                        className={`soft-control border-l-4 p-4 text-xs leading-6 sm:col-span-2 ${message.kind === "success" ? "border-future-mint bg-future-mint-soft" : "border-human-coral bg-human-coral-soft"}`}
                        role={message.kind === "error" ? "alert" : "status"}
                      >
                        <p>{message.text}</p>
                        <Button
                          className="mt-3"
                          onClick={() => window.location.reload()}
                          type="button"
                          variant="outline"
                        >
                          最新一覧を読み込む
                        </Button>
                      </div>
                    ) : null}
                    <Button
                      className="min-h-12 bg-sapphire text-white sm:col-span-2"
                      disabled={pendingId === application.id}
                      type="submit"
                    >
                      <Save className="size-4" aria-hidden="true" />
                      {pendingId === application.id
                        ? "保存しています…"
                        : "申込の対応内容を保存"}
                    </Button>
                  </div>
                </div>
              </form>
            );
          })}
        </div>
      )}

      {pageCount > 1 ? (
        <nav
          aria-label="申込一覧のページ"
          className="mt-7 flex items-center justify-between gap-4 text-xs"
        >
          {page > 1 ? (
            <Link
              className="soft-control inline-flex items-center gap-2 border border-rule bg-white px-4 py-3"
              href={`/admin?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
            >
              <ChevronLeft className="size-4" aria-hidden="true" /> 前へ
            </Link>
          ) : (
            <span />
          )}
          <span className="text-quiet">
            {page} / {pageCount}ページ
          </span>
          {page < pageCount ? (
            <Link
              className="soft-control inline-flex items-center gap-2 border border-rule bg-white px-4 py-3"
              href={`/admin?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
            >
              次へ <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}
