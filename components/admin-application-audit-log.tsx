import { History } from "lucide-react";

import type { AdminApplicationStatusEvent } from "@/db/membership";
import {
  applicationStatusLabels,
  findMemberServicePlan,
} from "@/lib/member-service-plans";

function formatDate(value: number) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function describeTransition(event: AdminApplicationStatusEvent) {
  if (
    event.actorType === "member" &&
    event.fromStatus === "received" &&
    event.toStatus === "received"
  ) {
    return "新規申込";
  }
  if (event.actorType === "member" && event.toStatus === "cancelled") {
    return "会員による取消";
  }
  if (event.fromStatus === event.toStatus) {
    return "対応内容を更新";
  }
  return `${applicationStatusLabels[event.fromStatus]} → ${applicationStatusLabels[event.toStatus]}`;
}

export function AdminApplicationAuditLog({
  events,
}: {
  events: AdminApplicationStatusEvent[];
}) {
  return (
    <section className="mt-14 scroll-mt-24" id="application-history">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-sapphire">
            <History className="size-4" aria-hidden="true" />
            APPLICATION HISTORY
          </p>
          <h2 className="mt-4 font-mincho text-3xl">申込の操作履歴</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-quiet">
            受付・取消・運営更新を新しい順に表示します。内部メモや会場・Meet案内の本文は履歴一覧へ出しません。
          </p>
        </div>
        <span className="soft-badge w-fit bg-paper-white px-3 py-2 text-xs text-quiet">
          最新{events.length}件
        </span>
      </div>

      {events.length === 0 ? (
        <div className="soft-work-surface mt-6 border border-rule bg-paper-white p-7 text-sm text-quiet">
          操作履歴はまだありません。
        </div>
      ) : (
        <ol className="mt-6 grid gap-3">
          {events.map((event) => {
            const plan = findMemberServicePlan(event.serviceType);
            return (
              <li
                className="soft-work-surface border border-rule bg-paper-white p-5 sm:p-6"
                key={event.id}
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="soft-badge bg-sapphire-soft px-3 py-1 text-xs font-semibold text-sapphire">
                        {describeTransition(event)}
                      </span>
                      <span className="text-xs text-quiet">
                        {event.actorType === "owner" ? "運営操作" : "会員操作"}
                      </span>
                    </div>
                    <p className="mt-3 break-words font-semibold text-ink">
                      {event.memberDisplayName}
                      <span className="ml-2 font-normal text-quiet">
                        {event.memberEmail}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-quiet">
                      {plan?.name ?? event.serviceType}／操作：{event.actorName}
                    </p>
                    {event.hasMemberMessage ? (
                      <p className="mt-3 text-xs text-quiet">
                        会員向け案内を含む更新
                      </p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-xs leading-6 text-quiet md:text-right">
                    <time dateTime={new Date(event.createdAt).toISOString()}>
                      {formatDate(event.createdAt)}
                    </time>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
