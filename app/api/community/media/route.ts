import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { communityWriteAllowance } from '@/db/community';
import {
  cleanUnusedCommunityMedia,
  storeCommunityMedia,
} from '@/db/community-media';
import { cleanPostPng } from '@/lib/post-image';
import { noStoreJson } from '@/lib/auth-request';
import { isSameOriginRequest } from '@/lib/request-security';
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return noStoreJson({ error: '送信元を確認できません。' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user)
    return noStoreJson({ error: 'ログインしてください。' }, { status: 401 });
  const member = await getMember(user.userId);
  if (
    user.isDemo ||
    member?.status !== 'active' ||
    !hasCurrentMembershipConsent(member)
  )
    return noStoreJson(
      { error: '会員登録を完了してください。' },
      { status: 403 },
    );
  if (request.headers.get('content-type') !== 'image/png' || !request.body)
    return noStoreJson(
      { error: '画像を選び直してください。' },
      { status: 400 },
    );
  if (!(await communityWriteAllowance(user.userId)))
    return noStoreJson({ error: '1分ほど待ってください。' }, { status: 429 });
  const chunks: Uint8Array[] = [];
  let length = 0;
  const reader = request.body.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.length;
      if (length > 1500000) {
        await reader.cancel();
        return noStoreJson({ error: '画像が大きすぎます。' }, { status: 413 });
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length);
    let pos = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, pos);
      pos += chunk.length;
    }
    let image;
    try {
      image = await cleanPostPng(bytes);
    } catch {
      return noStoreJson(
        { error: '画像を読み取れませんでした。別の画像を選んでください。' },
        { status: 400 },
      );
    }
    await cleanUnusedCommunityMedia();
    const media = await storeCommunityMedia(user.userId, image);
    return noStoreJson({ ok: true, ...media });
  } catch {
    return noStoreJson(
      { error: '画像を保存できませんでした。しばらくしてからお試しください。' },
      { status: 503 },
    );
  }
}
