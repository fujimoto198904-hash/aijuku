"use client";

import { type SubmitEvent, useRef, useState } from "react";

import { memberServicePlans } from "@/lib/member-service-plans";
import { withSiteBasePath } from "@/lib/site-paths";

export function MemberApplicationForm({
  initialService,
}: {
  initialService?: string | null;
}) {
  const defaultService = memberServicePlans.some(
    (plan) => plan.id === initialService,
  )
    ? initialService!
    : memberServicePlans[0].id;
  const [serviceType, setServiceType] = useState(defaultService);
  const [participants, setParticipants] = useState(1);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const requestId = useRef("");

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    if (!requestId.current) requestId.current = crypto.randomUUID();

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(withSiteBasePath("/api/applications"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clientRequestId: requestId.current,
          serviceType,
          goal: form.get("goal"),
          preferredSchedule: form.get("preferredSchedule"),
          participants,
          notes: form.get("notes"),
        }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(body.error ?? "申込を保存できませんでした。");

      setStatus("success");
      setMessage(
        "申込希望を受け付けました。日程・料金・支払いはまだ確定していません。運営確認後、登録メールへご案内します。",
      );
      requestId.current = "";
      window.setTimeout(
        () => window.location.assign(withSiteBasePath("/mypage#applications")),
        900,
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "申込を保存できませんでした。時間をおいて再度お試しください。",
      );
    }
  }

  return (
    <form className="grid gap-8" onSubmit={handleSubmit}>
      <fieldset>
        <legend className="text-sm font-semibold">1. 受講方法を選ぶ</legend>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {memberServicePlans.map((plan) => (
            <label
              className={`soft-card soft-interactive cursor-pointer border p-5 transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-sapphire ${serviceType === plan.id ? "border-sapphire bg-sapphire-soft" : "border-rule bg-white hover:border-sapphire/60"}`}
              key={plan.id}
            >
              <input
                className="sr-only"
                checked={serviceType === plan.id}
                name="serviceType"
                onChange={() => {
                  setServiceType(plan.id);
                  if (plan.id !== "in-person-tutor") setParticipants(1);
                }}
                type="radio"
                value={plan.id}
              />
              <span className="numeric-text text-[11px] text-sapphire">
                {plan.number}
              </span>
              <span className="mt-3 block font-mincho text-xl">
                {plan.name}
              </span>
              <span className="numeric-text mt-3 block text-lg">
                {plan.price}
              </span>
              <span className="mt-2 block text-xs text-quiet">{plan.area}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold md:col-span-2">
          2. できるようになりたいこと
          <textarea
            className="min-h-28 border border-rule bg-white p-4 font-normal leading-7 outline-none transition-colors focus:border-sapphire"
            maxLength={600}
            minLength={3}
            name="goal"
            placeholder="例：商談後のお礼メールとToDoを、毎回10分で作れるようになりたい"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          3. 希望日時・開始時期
          <input
            className="min-h-12 border border-rule bg-white px-4 font-normal outline-none transition-colors focus:border-sapphire"
            maxLength={300}
            name="preferredSchedule"
            placeholder="例：平日19時以降／11月から"
            required
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          4. 参加人数
          <select
            className="min-h-12 border border-rule bg-white px-4 font-normal outline-none transition-colors focus:border-sapphire"
            name="participants"
            onChange={(event) => setParticipants(Number(event.target.value))}
            value={participants}
          >
            {(serviceType === "in-person-tutor" ? [1, 2, 3, 4, 5] : [1]).map(
              (count) => (
                <option key={count} value={count}>
                  {count}名
                </option>
              ),
            )}
          </select>
          <span className="text-xs font-normal leading-5 text-quiet">
            {serviceType === "in-person-tutor"
              ? "対面は企業受講を含め、1回5名まで同時受講できます。"
              : "オンライン・教科書自習式は1申込につき1名です。"}
          </span>
        </label>

        <label className="grid gap-2 text-sm font-semibold md:col-span-2">
          補足（任意）
          <textarea
            className="min-h-24 border border-rule bg-white p-4 font-normal leading-7 outline-none transition-colors focus:border-sapphire"
            maxLength={600}
            name="notes"
            placeholder="企業受講の場合は、業種や参加者の状況などをご記入ください。"
          />
        </label>
      </div>

      <div className="soft-control border-l-4 border-future-mint bg-future-mint-soft p-5 text-xs leading-6 text-brand-dark">
        これは申込希望の受付です。送信だけでは予約・契約・決済は確定しません。入会金10,000円と受講料は、内容・日程・取引条件を確認した後にご案内します。
      </div>

      {status === "success" || status === "error" ? (
        <output
          className={`soft-control border p-4 text-sm leading-7 ${status === "success" ? "border-future-mint bg-future-mint-soft text-brand-dark" : "border-human-coral bg-human-coral-soft text-brand-dark"}`}
        >
          {message}
        </output>
      ) : null}

      <button
        className="button-glow min-h-14 px-6 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
        disabled={status === "sending" || status === "success"}
        type="submit"
      >
        {status === "sending" ? "受付しています…" : "この内容で申込希望を送る"}
      </button>
    </form>
  );
}
