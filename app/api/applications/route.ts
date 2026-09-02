import { getChatGPTUser } from "@/app/chatgpt-auth";
import {
  cancelMemberApplication,
  createMemberApplication,
  getMember,
  hasCurrentMembershipConsent,
  serviceTypeValues,
  type ServiceType,
} from "@/db/membership";
import { findMemberServicePlan } from "@/lib/member-service-plans";
import { cleanRequestText, isSameOriginRequest } from "@/lib/request-security";
import { isVercelRuntime } from "@/lib/site-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "受講申込は藤本実学塾の正規会員サイトから行ってください。" },
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
    const clientRequestId = cleanRequestText(body.clientRequestId, 80);
    const serviceType = cleanRequestText(body.serviceType, 40) as ServiceType;
    const goal = cleanRequestText(body.goal, 600);
    const preferredSchedule = cleanRequestText(body.preferredSchedule, 300);
    const notes = cleanRequestText(body.notes, 600) || null;
    const participants = Number(body.participants);

    if (!/^[a-zA-Z0-9-]{20,80}$/.test(clientRequestId)) {
      return Response.json(
        { error: "申込識別子が不正です。" },
        { status: 400 },
      );
    }
    if (!serviceTypeValues.includes(serviceType)) {
      return Response.json(
        { error: "受講方法を選んでください。" },
        { status: 400 },
      );
    }
    if (goal.length < 3) {
      return Response.json(
        { error: "できるようになりたいことを3文字以上で入力してください。" },
        { status: 400 },
      );
    }
    if (!preferredSchedule) {
      return Response.json(
        { error: "希望日時・開始時期を入力してください。" },
        { status: 400 },
      );
    }
    const maxParticipants = serviceType === "in-person-tutor" ? 5 : 1;
    if (
      !Number.isInteger(participants) ||
      participants < 1 ||
      participants > maxParticipants
    ) {
      return Response.json(
        {
          error:
            serviceType === "in-person-tutor"
              ? "対面受講の参加人数は1〜5名で入力してください。"
              : "この受講方法は1申込につき1名です。",
        },
        { status: 400 },
      );
    }

    const plan = findMemberServicePlan(serviceType);
    if (!plan) {
      return Response.json(
        { error: "受講方法を確認できませんでした。" },
        { status: 400 },
      );
    }

    const application = await createMemberApplication({
      user,
      clientRequestId,
      serviceType,
      goal,
      preferredSchedule,
      participants,
      notes,
      offerSnapshot: {
        serviceName: plan.name,
        price: plan.price,
        area: plan.area,
        enrollmentFee: "10,000円",
        pricingNote: "税込区分・支払方法・変更取消条件は確定前に提示",
      },
    });
    return Response.json({ application }, { status: 201 });
  } catch (error) {
    console.error("application creation failed", error);
    if (
      error instanceof Error &&
      error.message === "Too many active applications."
    ) {
      return Response.json(
        {
          error:
            "対応中の申込が3件あります。完了または取消後に追加してください。",
        },
        { status: 409 },
      );
    }
    if (
      error instanceof Error &&
      error.message === "Application rate limit exceeded."
    ) {
      return Response.json(
        {
          error:
            "短時間の申込回数が上限に達しました。24時間後に再度お試しください。",
        },
        { status: 429 },
      );
    }
    return Response.json(
      { error: "申込を保存できませんでした。時間をおいて再度お試しください。" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: "申込変更は藤本実学塾の正規会員サイトで行ってください。" },
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
    if (cleanRequestText(body.action, 20) !== "cancel") {
      return Response.json(
        { error: "操作を確認できません。" },
        { status: 400 },
      );
    }
    const applicationId = cleanRequestText(body.applicationId, 80);
    const expectedUpdatedAt = Number(body.expectedUpdatedAt);
    if (!applicationId || !Number.isSafeInteger(expectedUpdatedAt)) {
      return Response.json(
        { error: "申込情報を確認できませんでした。" },
        { status: 400 },
      );
    }
    const result = await cancelMemberApplication({
      memberId: user.userId,
      applicationId,
      expectedUpdatedAt,
      actorName: member.displayName,
    });
    if (result === "not_found") {
      return Response.json(
        { error: "申込が見つかりません。" },
        { status: 404 },
      );
    }
    if (result === "conflict") {
      return Response.json(
        {
          error:
            "申込状態が更新されています。画面を再読み込みして確認してください。",
        },
        { status: 409 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("application cancellation failed", error);
    return Response.json(
      { error: "申込を取り消せませんでした。" },
      { status: 500 },
    );
  }
}
