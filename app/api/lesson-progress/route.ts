import { getChatGPTUser } from '@/app/chatgpt-auth';
import {
  consumeMemberLessonWriteAllowance,
  updateMemberLessonProgress,
} from '@/db/lesson-progress';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { rejectDemoWrite } from '@/lib/demo-access';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { cleanRequestText, isSameOriginRequest } from '@/lib/request-security';
import { isVercelRuntime } from '@/lib/site-runtime';

export const dynamic = 'force-dynamic';
const maxRequestBodyBytes = 2_048;

type LimitedJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; error: string };

async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<LimitedJsonResult> {
  const contentLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, status: 413, error: '送信内容が大きすぎます。' };
  }

  if (!request.body) {
    return {
      ok: false,
      status: 400,
      error: '送信内容を確認できませんでした。',
    };
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return { ok: false, status: 413, error: '送信内容が大きすぎます。' };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return {
      ok: false,
      status: 400,
      error: '送信内容を確認できませんでした。',
    };
  }
}

export async function PATCH(request: Request) {
  if (isVercelRuntime()) {
    return Response.json(
      { error: '学習状況は正規会員サイトで保存してください。' },
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

  const parsedBody = await readLimitedJson(request, maxRequestBodyBytes);
  if (!parsedBody.ok) {
    return Response.json(
      { error: parsedBody.error },
      { status: parsedBody.status },
    );
  }
  const payload = parsedBody.value;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return Response.json(
      { error: '送信内容を確認できませんでした。' },
      { status: 400 },
    );
  }

  try {
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

    const body = payload as Record<string, unknown>;
    const taskId = cleanRequestText(body.taskId, 40);
    if (!taskId || !findTextbookTask(taskId)) {
      return Response.json(
        { error: '教科書の課題を確認できませんでした。' },
        { status: 400 },
      );
    }
    if (
      typeof body.bookmarked !== 'boolean' ||
      typeof body.completed !== 'boolean'
    ) {
      return Response.json(
        { error: 'ブックマークと完了の状態を確認できませんでした。' },
        { status: 400 },
      );
    }
    if (body.bookmarked && body.completed) {
      return Response.json(
        { error: '課題は「あとでやる」か「完了」のどちらかを選んでください。' },
        { status: 400 },
      );
    }
    if (!(await consumeMemberLessonWriteAllowance(user.userId))) {
      return Response.json(
        { error: '操作が続いています。1分ほど待ってから再度お試しください。' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }

    const progress = await updateMemberLessonProgress({
      memberId: user.userId,
      taskId,
      bookmarked: body.bookmarked,
      completed: body.completed,
    });
    return Response.json({ progress });
  } catch (error) {
    console.error('lesson progress update failed', error);
    return Response.json(
      { error: '学習状況を保存できませんでした。' },
      { status: 500 },
    );
  }
}
