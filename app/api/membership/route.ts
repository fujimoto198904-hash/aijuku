import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  getMember,
  hasCurrentMembershipConsent,
  registerMember,
  updateMemberDisplayName,
} from "@/db/membership";
import { cleanRequestText, isSameOriginRequest } from "@/lib/request-security";
import { isVercelRuntime } from "@/lib/site-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "会員登録は藤本実学塾の正規会員サイトから行ってください。" },
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

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const displayName = cleanRequestText(body.displayName, 80);
    if (displayName.length < 1 || displayName.length > 80) {
      return Response.json(
        { error: "表示名は1〜80文字で入力してください。" },
        { status: 400 },
      );
    }
    if (body.termsAccepted !== true || body.privacyAccepted !== true) {
      return Response.json(
        { error: "利用規約とプライバシーポリシーの確認が必要です。" },
        { status: 400 },
      );
    }

    await registerMember({ user, displayName });
    return Response.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("membership registration failed", error);
    if (
      error instanceof Error &&
      error.message === "Suspended membership cannot be reactivated."
    ) {
      return Response.json(
        { error: "停止中の会員登録は画面上で再開できません。" },
        { status: 403 },
      );
    }
    if (
      error instanceof Error &&
      error.message === "Withdrawn membership requires explicit reactivation."
    ) {
      return Response.json(
        {
          error:
            "退会済みの会員登録は自動で再開できません。登録メールから運営へ再登録を依頼してください。",
        },
        { status: 409 },
      );
    }
    return Response.json(
      { error: "登録を保存できませんでした。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "会員情報は藤本実学塾の正規会員サイトで変更してください。" },
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

  try {
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
    const body = (await request.json()) as Record<string, unknown>;
    const displayName = cleanRequestText(body.displayName, 80);
    if (displayName.length < 1) {
      return Response.json(
        { error: "表示名は1〜80文字で入力してください。" },
        { status: 400 },
      );
    }
    const updated = await updateMemberDisplayName({
      memberId: user.userId,
      displayName,
    });
    if (!updated) {
      return Response.json(
        { error: "会員情報を更新できませんでした。" },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("membership profile update failed", error);
    return Response.json(
      { error: "会員情報を保存できませんでした。" },
      { status: 500 },
    );
  }
}
