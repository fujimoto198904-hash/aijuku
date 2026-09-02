import { getChatGPTUser } from '@/app/chatgpt-auth';
import { reviewSkillEvidence } from '@/db/skill-passport';
import { externalReviewUnavailableResponse } from '@/lib/external-review-availability';
import { rejectDemoWrite } from '@/lib/demo-access';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';
import { getStaffPermissions, hasStaffAccess } from '@/lib/staff-permissions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: '管理操作は正規会員サイトで行ってください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  const user = await getChatGPTUser();
  if (!user) {
    return Response.json({ error: 'ログインが必要です。' }, { status: 401 });
  }
  const demoResponse = rejectDemoWrite(user);
  if (demoResponse) return demoResponse;
  const permissions = getStaffPermissions(user.email);
  if (!hasStaffAccess(permissions)) {
    return Response.json({ error: '管理権限がありません。' }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanRequestText(body.action, 40);
    if (action === 'approve-external' || action === 'reject-external') {
      return externalReviewUnavailableResponse();
    }

    const id = cleanRequestText(body.id, 80);
    if (!id) {
      return Response.json(
        { error: '対象を確認できません。' },
        { status: 400 },
      );
    }

    if (action === 'verify-evidence' || action === 'request-changes') {
      if (!permissions.canReviewEvidence) {
        return Response.json(
          { error: '講師確認の権限がありません。' },
          { status: 403 },
        );
      }
      const note = cleanRequestText(body.note, 1_000);
      const expectedUpdatedAt = Number(body.expectedUpdatedAt);
      if (note.length < 5) {
        return Response.json(
          { error: '確認範囲または修正点を5文字以上で記録してください。' },
          { status: 400 },
        );
      }
      if (!Number.isSafeInteger(expectedUpdatedAt)) {
        return Response.json(
          { error: '成果物の更新日時を確認できませんでした。' },
          { status: 400 },
        );
      }
      const result = await reviewSkillEvidence({
        evidenceId: id,
        expectedUpdatedAt,
        status: action === 'verify-evidence' ? 'verified' : 'changes_requested',
        note,
        reviewer: user,
      });
      if (result === 'not_found') {
        return Response.json(
          { error: '成果物が見つかりません。' },
          { status: 404 },
        );
      }
      if (result === 'conflict') {
        return Response.json(
          {
            error: '別の確認で更新されています。画面を再読み込みしてください。',
          },
          { status: 409 },
        );
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: '操作を確認できません。' }, { status: 400 });
  } catch (error) {
    console.error('admin skill operation failed', error);
    if (
      error instanceof Error &&
      error.message === 'Self instructor review is not allowed.'
    ) {
      return Response.json(
        {
          error:
            '自分の成果物は確認できません。別の管理者・講師へ依頼してください。',
        },
        { status: 409 },
      );
    }
    return Response.json(
      { error: '管理操作を保存できませんでした。' },
      { status: 500 },
    );
  }
}
