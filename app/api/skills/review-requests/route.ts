import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { rejectDemoWrite } from '@/lib/demo-access';
import { externalReviewUnavailableResponse } from '@/lib/external-review-availability';
import { isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (isVercelRuntime()) {
    return externalReviewUnavailableResponse();
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
  return externalReviewUnavailableResponse();
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return externalReviewUnavailableResponse();
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
  return externalReviewUnavailableResponse();
}
