import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { updateSkillProfile } from '@/db/skill-passport';
import { rejectDemoWrite } from '@/lib/demo-access';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: 'スキルパスポートは正規会員サイトで編集してください。' },
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
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== 'active' ||
    !hasCurrentMembershipConsent(member)
  ) {
    return Response.json(
      { error: '先に無料会員登録と現行規約への同意を完了してください。' },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const headline = cleanRequestText(body.headline, 120);
    const targetRole = cleanRequestText(body.targetRole, 80);
    const bio = cleanRequestText(body.bio, 600);
    const shareEnabled = body.shareEnabled === true;

    if (shareEnabled && (headline.length < 3 || bio.length < 20)) {
      return Response.json(
        {
          error:
            '共有を始めるには、見出しを3文字以上、自己紹介を20文字以上入力してください。',
        },
        { status: 400 },
      );
    }

    const profile = await updateSkillProfile({
      memberId: user.userId,
      headline,
      targetRole,
      bio,
      shareEnabled,
    });
    return Response.json({ profile });
  } catch (error) {
    console.error('skill profile update failed', error);
    return Response.json(
      { error: 'プロフィールを保存できませんでした。' },
      { status: 500 },
    );
  }
}
