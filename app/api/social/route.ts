import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { communityWriteAllowance } from '@/db/community';
import { readBoundedJson } from '@/lib/limited-json';
import { isSameOriginRequest } from '@/lib/request-security';
import { noStoreJson } from '@/lib/auth-request';
import { publicNickname } from '@/lib/community';
import {
  acceptThread,
  postLikeStates,
  reportSocial,
  saveSocialProfile,
  sendDirectMessage,
  setBlock,
  setFollow,
  setLike,
  socialHandleValid,
} from '@/db/social';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const fail = (error: string, status = 400) =>
    noStoreJson({ error }, { status });
  if (!isSameOriginRequest(request))
    return fail('送信元を確認できません。', 403);
  const user = await getChatGPTUser();
  if (!user) return fail('ログインしてください。', 401);
  const member = await getMember(user.userId);
  if (
    user.isDemo ||
    user.userId.startsWith('aistock-system-') ||
    member?.status !== 'active' ||
    !hasCurrentMembershipConsent(member)
  )
    return fail(
      '無料会員登録と利用規約への同意を完了してください。デモでは変更できません。',
      403,
    );
  let d: Record<string, unknown>;
  try {
    d = await readBoundedJson(request);
  } catch {
    return fail('入力を確認してください。');
  }
  if (!(await communityWriteAllowance(user.userId)))
    return fail('操作が続いています。1分ほどお待ちください。', 429);
  try {
    if (d.action === 'profile') {
      const name = publicNickname(d.name, false),
        bio = typeof d.bio === 'string' ? d.bio.trim() : '';
      if (
        !name ||
        bio.length > 300 ||
        typeof d.isPublic !== 'boolean' ||
        typeof d.dmEnabled !== 'boolean' ||
        (d.isPublic && d.publicConsent !== true)
      )
        return fail(
          '公開する名前と内容を確認してください。自己紹介は300文字までです。',
        );
      const profile = await saveSocialProfile(user.userId, {
        name,
        bio,
        isPublic: d.isPublic,
        dmEnabled: d.dmEnabled,
      });
      return noStoreJson({ ok: true, profile });
    }
    if (
      d.action === 'like' &&
      typeof d.ref === 'string' &&
      d.ref.length <= 100 &&
      typeof d.liked === 'boolean'
    ) {
      if (!(await setLike(user.userId, d.ref, d.liked)))
        return fail('この投稿には操作できません。', 404);
      return noStoreJson({
        ok: true,
        ...(await postLikeStates([d.ref], user.userId))[d.ref],
      });
    }
    if (
      d.action === 'follow' &&
      socialHandleValid(d.target) &&
      typeof d.following === 'boolean'
    ) {
      return (await setFollow(user.userId, d.target, d.following))
        ? noStoreJson({ ok: true, following: d.following })
        : fail(
            '公開プロフィールを作ってからフォローできます。相手が利用を制限している場合もあります。',
            409,
          );
    }
    if (
      d.action === 'block' &&
      socialHandleValid(d.target) &&
      typeof d.blocked === 'boolean'
    ) {
      return (await setBlock(user.userId, d.target, d.blocked))
        ? noStoreJson({ ok: true })
        : fail('この相手には操作できません。', 404);
    }
    if (
      d.action === 'message' &&
      socialHandleValid(d.target) &&
      typeof d.body === 'string' &&
      d.body.trim().length > 0 &&
      d.body.trim().length <= 2000 &&
      typeof d.requestId === 'string' &&
      /^[a-zA-Z0-9-]{16,64}$/.test(d.requestId)
    ) {
      const id = await sendDirectMessage(user.userId, {
        target: d.target,
        body: d.body.trim(),
        requestId: d.requestId,
      });
      return id
        ? noStoreJson({ ok: true, next: '/messages/' + id })
        : fail(
            '送信できません。相手の受信設定や承認待ちの状態を確認してください。',
            409,
          );
    }
    if (d.action === 'accept' && typeof d.thread === 'string')
      return (await acceptThread(user.userId, d.thread))
        ? noStoreJson({ ok: true })
        : fail('この会話は承認できません。', 404);
    if (
      d.action === 'report' &&
      typeof d.targetType === 'string' &&
      typeof d.target === 'string' &&
      typeof d.reason === 'string' &&
      d.reason.trim().length >= 3 &&
      d.reason.length <= 500
    ) {
      return (await reportSocial(
        user.userId,
        d.targetType,
        d.target,
        d.reason.trim(),
      ))
        ? noStoreJson({ ok: true })
        : fail('通報できる対象がありません。', 404);
    }
    return fail('入力を確認してください。');
  } catch {
    return fail('保存できませんでした。少し待ってからお試しください。', 503);
  }
}
