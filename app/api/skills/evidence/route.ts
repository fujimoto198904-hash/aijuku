import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import {
  createSkillEvidence,
  resubmitSkillEvidence,
  updateSkillEvidenceVisibility,
} from '@/db/skill-passport';
import {
  evidenceSourceTypes,
  evidenceVisibilityValues,
  type EvidenceSourceType,
  type EvidenceVisibility,
} from '@/lib/skill-passport';
import { rejectDemoWrite } from '@/lib/demo-access';
import {
  cleanHttpsUrl,
  cleanRequestText,
  isSameOriginRequest,
} from '@/lib/request-security';
import { skillDefinitions, type SkillKey } from '@/lib/skill-taxonomy';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

async function requireActiveMember() {
  const user = await getChatGPTUser();
  if (!user) return { error: 'ログインが必要です。', status: 401 } as const;
  const demoResponse = rejectDemoWrite(user);
  if (demoResponse) return { demoResponse } as const;
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== 'active' ||
    !hasCurrentMembershipConsent(member)
  ) {
    return {
      error: '先に無料会員登録と現行規約への同意を完了してください。',
      status: 403,
    } as const;
  }
  return { user } as const;
}

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: '学習記録は正規会員サイトで保存してください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  const auth = await requireActiveMember();
  if ('demoResponse' in auth) return auth.demoResponse;
  if ('error' in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sourceType = cleanRequestText(
      body.sourceType,
      20,
    ) as EvidenceSourceType;
    const requestedTaskId = cleanRequestText(body.taskId, 40) || null;
    const taskId = sourceType === 'curriculum' ? requestedTaskId : null;
    const clientRequestId = cleanRequestText(body.clientRequestId, 80);
    const title = cleanRequestText(body.title, 120);
    const summary = cleanRequestText(body.summary, 1_200);
    const evidenceUrl = cleanHttpsUrl(body.evidenceUrl);
    const rightsConfirmed = body.rightsConfirmed === true;
    const visibility = cleanRequestText(
      body.visibility,
      20,
    ) as EvidenceVisibility;
    const validSkillKeys = new Set(skillDefinitions.map((item) => item.key));
    const priorWorkSkillKeys =
      sourceType === 'prior-work' && Array.isArray(body.skillKeys)
        ? [...new Set(body.skillKeys)].filter(
            (value): value is SkillKey =>
              typeof value === 'string' &&
              validSkillKeys.has(value as SkillKey),
          )
        : [];

    if (!evidenceSourceTypes.includes(sourceType)) {
      return Response.json(
        { error: '記録の種類を選んでください。' },
        { status: 400 },
      );
    }
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        clientRequestId,
      )
    ) {
      return Response.json(
        {
          error:
            '送信識別子を確認できませんでした。画面を再読み込みしてください。',
        },
        { status: 400 },
      );
    }
    if (sourceType === 'curriculum' && !taskId) {
      return Response.json(
        { error: '教科書の課題を選んでください。' },
        { status: 400 },
      );
    }
    if (
      sourceType === 'prior-work' &&
      (priorWorkSkillKeys.length < 1 || priorWorkSkillKeys.length > 3)
    ) {
      return Response.json(
        { error: '今できるスキルを1〜3個選んでください。' },
        { status: 400 },
      );
    }
    if (title.length < 3) {
      return Response.json(
        { error: '成果物名を3文字以上で入力してください。' },
        { status: 400 },
      );
    }
    if (summary.length < 20) {
      return Response.json(
        {
          error:
            'できるようになったことと確認した内容を20文字以上で入力してください。',
        },
        { status: 400 },
      );
    }
    if (evidenceUrl === undefined) {
      return Response.json(
        { error: '成果物URLはhttps://から始まるURLにしてください。' },
        { status: 400 },
      );
    }
    if (!evidenceVisibilityValues.includes(visibility)) {
      return Response.json(
        { error: '公開範囲を選んでください。' },
        { status: 400 },
      );
    }
    if (!rightsConfirmed) {
      return Response.json(
        { error: '成果物の権利・機密情報・共有権限を確認してください。' },
        { status: 400 },
      );
    }

    const evidence = await createSkillEvidence({
      memberId: auth.user.userId,
      clientRequestId,
      sourceType,
      taskId,
      priorWorkSkillKeys,
      title,
      summary,
      evidenceUrl,
      rightsConfirmed,
      visibility,
    });
    return Response.json({ evidence }, { status: 201 });
  } catch (error) {
    console.error('skill evidence creation failed', error);
    const isRateLimit =
      error instanceof Error &&
      error.message === 'Skill evidence rate limit exceeded.';
    const message =
      error instanceof Error && error.message === 'Textbook task was not found.'
        ? '教科書の課題を確認できませんでした。'
        : isRateLimit
          ? '学習記録の作成回数が24時間の上限に達しました。時間をおいて再度お試しください。'
          : '学習記録を保存できませんでした。';
    return Response.json(
      { error: message },
      { status: isRateLimit ? 429 : 500 },
    );
  }
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: '公開範囲は正規会員サイトで変更してください。' },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return Response.json(
      { error: '送信元を確認できませんでした。' },
      { status: 403 },
    );
  }
  const auth = await requireActiveMember();
  if ('demoResponse' in auth) return auth.demoResponse;
  if ('error' in auth) {
    return Response.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const evidenceId = cleanRequestText(body.evidenceId, 80);
    const action = cleanRequestText(body.action, 20);
    if (action === 'resubmit') {
      const expectedUpdatedAt = Number(body.expectedUpdatedAt);
      const title = cleanRequestText(body.title, 120);
      const summary = cleanRequestText(body.summary, 1_200);
      const evidenceUrl = cleanHttpsUrl(body.evidenceUrl);
      const rightsConfirmed = body.rightsConfirmed === true;
      if (
        !evidenceId ||
        !Number.isSafeInteger(expectedUpdatedAt) ||
        title.length < 3 ||
        summary.length < 20 ||
        evidenceUrl === undefined ||
        !rightsConfirmed
      ) {
        return Response.json(
          {
            error:
              '成果物名、20文字以上の説明、httpsの成果物URL、権利確認を見直してください。',
          },
          { status: 400 },
        );
      }
      const result = await resubmitSkillEvidence({
        memberId: auth.user.userId,
        evidenceId,
        expectedUpdatedAt,
        title,
        summary,
        evidenceUrl,
        rightsConfirmed,
      });
      if (result === 'not_found') {
        return Response.json(
          { error: '学習記録が見つかりません。' },
          { status: 404 },
        );
      }
      if (result === 'conflict') {
        return Response.json(
          {
            error:
              'この記録はすでに更新されています。画面を再読み込みしてください。',
          },
          { status: 409 },
        );
      }
      return Response.json({ ok: true });
    }
    const visibility = cleanRequestText(
      body.visibility,
      20,
    ) as EvidenceVisibility;
    if (!evidenceId || !evidenceVisibilityValues.includes(visibility)) {
      return Response.json(
        { error: '変更内容を確認してください。' },
        { status: 400 },
      );
    }
    const updated = await updateSkillEvidenceVisibility({
      memberId: auth.user.userId,
      evidenceId,
      visibility,
    });
    if (!updated) {
      return Response.json(
        { error: '学習記録が見つかりません。' },
        { status: 404 },
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('skill evidence visibility update failed', error);
    return Response.json(
      { error: '公開範囲を変更できませんでした。' },
      { status: 500 },
    );
  }
}
