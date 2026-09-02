import { getChatGPTUser } from '@/app/chatgpt-auth';
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
  const reviewer = await getChatGPTUser();
  if (!reviewer) {
    return Response.json({ error: 'ログインが必要です。' }, { status: 401 });
  }
  const demoResponse = rejectDemoWrite(reviewer);
  if (demoResponse) return demoResponse;
  return externalReviewUnavailableResponse();
}
