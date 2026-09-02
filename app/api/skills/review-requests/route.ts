import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getMember, hasCurrentMembershipConsent } from "@/db/membership";
import {
  createExternalReviewRequest,
  revokeExternalReviewRequest,
} from "@/db/skill-passport";
import { cleanRequestText, isSameOriginRequest } from "@/lib/request-security";
import { isVercelRuntime } from "@/lib/site-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "評価依頼は正規会員サイトで作成してください。" },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "送信元を確認できませんでした。" },
      { status: 403 },
    );
  }
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    return Response.json(
      { error: "先に無料会員登録と現行規約への同意を完了してください。" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const evidenceId = cleanRequestText(body.evidenceId, 80);
    if (!evidenceId) {
      return Response.json(
        { error: "成果物を選んでください。" },
        { status: 400 },
      );
    }
    const invitation = await createExternalReviewRequest({
      memberId: user.userId,
      evidenceId,
    });
    return Response.json({ invitation }, { status: 201 });
  } catch (error) {
    console.error("external review request creation failed", error);
    const message =
      error instanceof Error &&
      error.message === "Only verified evidence can request an external review."
        ? "講師確認済みの成果物だけ、第三者へ評価を依頼できます。"
        : error instanceof Error &&
            error.message === "Too many open external review requests."
          ? "未回答の評価依頼が10件あります。回答後に新しい依頼を作成してください。"
          : error instanceof Error &&
              error.message === "External review request rate limit exceeded."
            ? "評価依頼の作成回数が24時間の上限に達しました。時間をおいて再度お試しください。"
            : "評価依頼を作成できませんでした。";
    const status =
      error instanceof Error &&
      error.message === "External review request rate limit exceeded."
        ? 429
        : 400;
    return Response.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "評価依頼は正規会員サイトで管理してください。" },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: "送信元を確認できませんでした。" },
      { status: 403 },
    );
  }
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: "ログインが必要です。" }, { status: 401 });
  }
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== "active" ||
    !hasCurrentMembershipConsent(member)
  ) {
    return Response.json(
      { error: "先に無料会員登録と現行規約への同意を完了してください。" },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const requestId = cleanRequestText(body.requestId, 80);
    if (cleanRequestText(body.action, 20) !== "revoke" || !requestId) {
      return Response.json(
        { error: "失効する評価依頼を確認できませんでした。" },
        { status: 400 },
      );
    }
    const revoked = await revokeExternalReviewRequest({
      memberId: user.userId,
      requestId,
    });
    if (!revoked) {
      return Response.json(
        { error: "評価依頼が見つからないか、すでに回答・失効済みです。" },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("external review request revocation failed", error);
    return Response.json(
      { error: "評価依頼を失効できませんでした。" },
      { status: 500 },
    );
  }
}
