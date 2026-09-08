import { env } from 'cloudflare:workers';
import { noStoreJson } from '@/lib/auth-request';
import { readBoundedJson } from '@/lib/limited-json';
import {
  editorialSlot,
  editorialTokenMatches,
  parseEditorialBatch,
} from '@/lib/official-automation';
import {
  checkEditorialBatch,
  editorialContext,
  publishEditorialBatch,
} from '@/db/official-automation';

async function authorize(request: Request) {
  // No cookies or member identity are accepted on this service-only endpoint.
  if (
    !(await editorialTokenMatches(
      request.headers.get('authorization'),
      env.OFFICIAL_POST_AUTOMATION_TOKEN,
    ))
  )
    return noStoreJson(
      { error: '公式投稿の専用認証が必要です。' },
      { status: 401 },
    );
  if (env.OFFICIAL_POST_AUTOMATION_ENABLED !== 'true')
    return noStoreJson(
      { error: '公式の自動投稿は停止中です。' },
      { status: 503 },
    );
  return null;
}

export async function GET(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    return noStoreJson({
      ...(await editorialContext()),
      currentSlot: editorialSlot(),
      timeZone: 'Asia/Tokyo',
      maxPosts: 11,
    });
  } catch {
    return noStoreJson(
      {
        error:
          '投稿履歴を確認できませんでした。再投稿せず接続を確認してください。',
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return noStoreJson({ error: 'JSONで送信してください。' }, { status: 415 });
  let batch, dryRun;
  try {
    const data = await readBoundedJson(request, 65536);
    batch = parseEditorialBatch(data);
    if (data.dryRun != null && typeof data.dryRun !== 'boolean')
      throw new Error('dryRunは真偽値です。');
    dryRun = data.dryRun === true;
  } catch (error) {
    return noStoreJson(
      {
        error:
          error instanceof Error
            ? error.message
            : '入力内容を確認してください。',
      },
      { status: 400 },
    );
  }
  const now = Date.now(),
    currentSlot = editorialSlot(now);
  if (!dryRun && batch.slot !== currentSlot)
    return noStoreJson(
      {
        error:
          '当日の9〜11時・19〜21時（日本時間）だけ公開できます。過去分は投稿しません。',
        currentSlot,
      },
      { status: 409 },
    );
  try {
    const check = await checkEditorialBatch(batch, now);
    if (!check.allowed)
      return noStoreJson(
        {
          error: '内容の衝突・重複または公開できないアカウントがあります。',
          ...check,
        },
        { status: 409 },
      );
    if (dryRun)
      return noStoreJson({
        dryRun: true,
        inserted: 0,
        slot: batch.slot,
        withinWindow: batch.slot === currentSlot,
        ...check,
      });
    const result = await publishEditorialBatch(batch, now);
    const complete = result.receipts.every((r) => r.status === 'published');
    return noStoreJson(
      { ...result, complete },
      { status: complete ? 200 : 409 },
    );
  } catch {
    return noStoreJson(
      {
        error:
          '公開結果を確認できませんでした。本文を変えず履歴を確認してください。',
      },
      { status: 503 },
    );
  }
}
