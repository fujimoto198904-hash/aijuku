"use client";

import { type SubmitEvent, useState } from "react";

import Link from "@/components/site-link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  externalObservationOptions,
  externalRatingLabels,
  externalRelationshipLabels,
  externalRelationshipValues,
  type ExternalObservationId,
} from "@/lib/skill-passport";
import { withSiteBasePath } from "@/lib/site-paths";

export function ExternalReviewForm({
  token,
  defaultName,
}: {
  token: string;
  defaultName: string;
}) {
  const [reviewerName, setReviewerName] = useState(defaultName);
  const [observations, setObservations] = useState<ExternalObservationId[]>([]);
  const [consentPublic, setConsentPublic] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "sending" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  function toggleObservation(id: ExternalObservationId, checked: boolean) {
    setObservations((current) =>
      checked
        ? [...new Set([...current, id])]
        : current.filter((item) => item !== id),
    );
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch(
        withSiteBasePath("/api/skills/external-reviews"),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            token,
            reviewerName,
            reviewerAffiliation: form.get("reviewerAffiliation"),
            relationship: form.get("relationship"),
            rating: Number(form.get("rating")),
            observations,
            comment: form.get("comment"),
            consentPublic,
            policyAccepted,
          }),
        },
      );
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "評価を送信できませんでした。");
      }
      setStatus("success");
      setMessage(
        "評価を受け付けました。内容は受講生へ届き、公開同意がある場合も運営確認後に共有プロフィールへ表示されます。",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "評価を送信できませんでした。",
      );
    }
  }

  if (status === "success") {
    return (
      <output className="soft-panel block border border-future-mint bg-future-mint-soft p-6 text-sm leading-7 text-brand-dark">
        {message}
      </output>
    );
  }

  return (
    <form className="grid gap-7" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label
          className="grid gap-2 text-sm font-semibold"
          htmlFor="external-reviewer-name"
        >
          公開時の表示名
          <Input
            className="min-h-12 bg-white px-4 font-normal"
            id="external-reviewer-name"
            maxLength={80}
            minLength={1}
            onChange={(event) => setReviewerName(event.target.value)}
            required
            value={reviewerName}
          />
        </label>
        <label
          className="grid gap-2 text-sm font-semibold"
          htmlFor="external-reviewer-affiliation"
        >
          所属・役割（任意）
          <Input
            className="min-h-12 bg-white px-4 font-normal"
            id="external-reviewer-affiliation"
            maxLength={120}
            name="reviewerAffiliation"
            placeholder="例：株式会社〇〇 営業責任者"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          受講生との関係
          <select
            className="min-h-12 border border-input bg-white px-4 font-normal outline-none focus:border-sapphire focus:ring-3 focus:ring-sapphire/20"
            defaultValue=""
            name="relationship"
            required
          >
            <option disabled value="">
              選んでください
            </option>
            {externalRelationshipValues.map((value) => (
              <option key={value} value={value}>
                {externalRelationshipLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          どの場面まで確認しましたか
          <select
            className="min-h-12 border border-input bg-white px-4 font-normal outline-none focus:border-sapphire focus:ring-3 focus:ring-sapphire/20"
            defaultValue=""
            name="rating"
            required
          >
            <option disabled value="">
              選んでください
            </option>
            {Object.entries(externalRatingLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold">
          実際に確認したこと（複数可）
        </legend>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {externalObservationOptions.map((option) => (
            <label
              className="soft-control flex cursor-pointer items-start gap-3 border border-rule bg-white p-4 text-sm leading-6"
              htmlFor={`external-observation-${option.id}`}
              key={option.id}
            >
              <Checkbox
                checked={observations.includes(option.id)}
                className="mt-1"
                id={`external-observation-${option.id}`}
                onCheckedChange={(checked) =>
                  toggleObservation(option.id, checked === true)
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label
        className="grid gap-2 text-sm font-semibold"
        htmlFor="external-review-comment"
      >
        具体的に良かった点・今後の改善点
        <Textarea
          className="min-h-36 bg-white p-4 font-normal leading-7"
          id="external-review-comment"
          maxLength={1_000}
          minLength={10}
          name="comment"
          placeholder="どの場面で、何ができていたかを具体的に書いてください。肩書や資格そのものを証明する欄ではありません。"
          required
        />
      </label>

      <label
        className="soft-control flex cursor-pointer items-start gap-3 border border-sapphire/25 bg-sapphire-soft p-5 text-sm leading-7"
        htmlFor="external-review-public-consent"
      >
        <Checkbox
          checked={consentPublic}
          className="mt-1"
          id="external-review-public-consent"
          onCheckedChange={(checked) => setConsentPublic(checked === true)}
        />
        <span>
          表示名・所属・関係・評価内容を、受講生のURL共有プロフィールへ掲載することに同意します。URLを知る人は閲覧できます。未チェックでも評価は受講生と運営だけが確認できます。
        </span>
      </label>

      <label
        className="soft-control flex cursor-pointer items-start gap-3 border border-rule bg-paper p-5 text-sm leading-7"
        htmlFor="external-review-policy-accepted"
      >
        <Checkbox
          checked={policyAccepted}
          className="mt-1"
          id="external-review-policy-accepted"
          onCheckedChange={(checked) => setPolicyAccepted(checked === true)}
        />
        <span>
          <Link
            className="font-semibold text-sapphire underline"
            href="/terms"
            rel="noopener noreferrer"
            target="_blank"
          >
            利用規約
          </Link>
          と
          <Link
            className="font-semibold text-sapphire underline"
            href="/privacy"
            rel="noopener noreferrer"
            target="_blank"
          >
            プライバシーポリシー
          </Link>
          を確認し、評価者情報と評価内容の取得・保存に同意します。
        </span>
      </label>

      {status === "error" ? (
        <p
          className="soft-control border-l-4 border-human-coral bg-human-coral-soft p-4 text-sm text-brand-dark"
          role="alert"
        >
          {message}
        </p>
      ) : null}

      <Button
        className="button-glow min-h-14 text-sm font-semibold text-white"
        disabled={
          status === "sending" ||
          !policyAccepted ||
          observations.length < 1 ||
          reviewerName.trim().length < 1
        }
        type="submit"
      >
        {status === "sending" ? "送信しています…" : "確認した事実を送る"}
      </Button>
      <p className="text-xs leading-6 text-quiet">
        ChatGPTログインは同一人物による自己評価と重複投稿を防ぐために使います。メールアドレスやChatGPT利用者IDは公開しません。所属・関係は自己申告です。
      </p>
    </form>
  );
}
