import { getChatGPTUser } from "@/app/chatgpt-auth";
import { submitExternalReview } from "@/db/skill-passport";
import {
  externalObservationOptions,
  externalRelationshipValues,
  type ExternalObservationId,
  type ExternalRelationship,
} from "@/lib/skill-passport";
import { cleanRequestText, isSameOriginRequest } from "@/lib/request-security";
import { isVercelRuntime } from "@/lib/site-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "第三者評価は藤本実学塾の正規サイトから送信してください。" },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "送信元を確認できませんでした。" },
      { status: 403 },
    );
  }
  const reviewer = await getChatGPTUser();
  if (!reviewer) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const token = cleanRequestText(body.token, 80);
    const reviewerName = cleanRequestText(body.reviewerName, 80);
    const reviewerAffiliation =
      cleanRequestText(body.reviewerAffiliation, 120) || null;
    const relationship = cleanRequestText(
      body.relationship,
      30,
    ) as ExternalRelationship;
    const rating = Number(body.rating);
    const comment = cleanRequestText(body.comment, 1_000);
    const consentPublic = body.consentPublic === true;
    const policyAccepted = body.policyAccepted === true;
    const validObservations = new Set(
      externalObservationOptions.map((option) => option.id),
    );
    const observations = Array.isArray(body.observations)
      ? [...new Set(body.observations)].filter(
          (value): value is ExternalObservationId =>
            typeof value === "string" &&
            validObservations.has(value as ExternalObservationId),
        )
      : [];

    if (!/^[a-f0-9]{64}$/.test(token)) {
      return Response.json(
        { error: "評価リンクを確認できません。" },
        { status: 400 },
      );
    }
    if (reviewerName.length < 1) {
      return Response.json(
        { error: "表示名を入力してください。" },
        { status: 400 },
      );
    }
    if (!externalRelationshipValues.includes(relationship)) {
      return Response.json(
        { error: "受講生との関係を選んでください。" },
        { status: 400 },
      );
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 4) {
      return Response.json(
        { error: "確認した場面を選んでください。" },
        { status: 400 },
      );
    }
    if (observations.length < 1) {
      return Response.json(
        { error: "実際に確認したことを1つ以上選んでください。" },
        { status: 400 },
      );
    }
    if (comment.length < 10) {
      return Response.json(
        { error: "具体的な評価を10文字以上で入力してください。" },
        { status: 400 },
      );
    }
    if (!policyAccepted) {
      return Response.json(
        { error: "利用規約とプライバシーポリシーを確認してください。" },
        { status: 400 },
      );
    }

    await submitExternalReview({
      token,
      reviewer,
      reviewerName,
      reviewerAffiliation,
      relationship,
      rating,
      observations,
      comment,
      consentPublic,
      policyAccepted,
    });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("external review submission failed", error);
    if (
      error instanceof Error &&
      error.message === "Self review is not allowed."
    ) {
      return Response.json(
        { error: "自分の成果物を第三者評価することはできません。" },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      error.message === "External review request is unavailable."
    ) {
      return Response.json(
        { error: "この評価リンクは使用済みか、有効期限が切れています。" },
        { status: 410 },
      );
    }
    if (
      error instanceof Error &&
      error.message.includes("UNIQUE constraint failed")
    ) {
      return Response.json(
        { error: "同じ成果物への評価は、すでに送信済みです。" },
        { status: 409 },
      );
    }
    return Response.json(
      {
        error: "評価を保存できませんでした。時間をおいて再度お試しください。",
      },
      { status: 500 },
    );
  }
}
