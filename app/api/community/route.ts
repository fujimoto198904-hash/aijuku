import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import {
  communityWriteAllowance,
  writeCommunityPost,
  writeCommunityReply,
  removeCommunityItem,
  getCommunityPost,
  communityRetry,
} from '@/db/community';
import { isCommunityKind, publicNickname } from '@/lib/community';
import { readBoundedJson } from '@/lib/limited-json';
import { isSameOriginRequest } from '@/lib/request-security';
import { noStoreJson } from '@/lib/auth-request';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { ownedCommunityMedia } from '@/db/community-media';
import { ownSocialProfile, canInteractWithPost } from '@/db/social';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return noStoreJson({ error: '送信元を確認できません。' }, { status: 403 });
  const user = await getChatGPTUser();
  if (!user)
    return noStoreJson({ error: 'ログインしてください。' }, { status: 401 });
  if (user.isDemo || user.userId.startsWith('aistock-system-'))
    return noStoreJson({ error: 'デモでは投稿できません。' }, { status: 403 });
  const member = await getMember(user.userId);
  if (
    !member ||
    member.status !== 'active' ||
    !hasCurrentMembershipConsent(member)
  )
    return noStoreJson(
      { error: '会員登録と利用規約への同意を完了してください。' },
      { status: 403 },
    );
  let data: Record<string, unknown>;
  try {
    data = await readBoundedJson(request);
  } catch {
    return noStoreJson(
      { error: '入力内容を確認してください。' },
      { status: 400 },
    );
  }
  const permissions = getAuthenticatedStaffPermissions(user);
  const isOwner = permissions.isOwner;
  const socialProfile = await ownSocialProfile(user.userId);
  if (socialProfile?.isPublic) data.nickname = socialProfile.name;
  if (data.publicConsent === true && publicNickname(data.nickname, isOwner)) {
    const retry = await communityRetry(
      user.userId,
      data,
      isOwner ? 'Aitock公式' : publicNickname(data.nickname, isOwner)!,
    );
    if (retry)
      return noStoreJson(
        retry.same
          ? { ok: true, next: retry.next }
          : {
              error:
                'この送信の投稿は保存済み、または削除済みです。内容を確認してから別の投稿として保存できます。',
              existingNext: retry.next,
            },
        { status: retry.same ? 200 : 409 },
      );
  }
  if (!(await communityWriteAllowance(user.userId)))
    return noStoreJson(
      { error: '投稿が続いています。1分ほどお待ちください。' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  try {
    if (data.action === 'delete') {
      if (
        (data.target !== 'post' && data.target !== 'reply') ||
        typeof data.id !== 'string'
      )
        return noStoreJson(
          { error: '対象を確認してください。' },
          { status: 400 },
        );
      const removed = await removeCommunityItem({
        kind: data.target,
        id: data.id,
        memberId: user.userId,
        isOwner,
      });
      return noStoreJson(
        removed ? { ok: true } : { error: '削除できる投稿がありません。' },
        { status: removed ? 200 : 404 },
      );
    }
    const name = publicNickname(data.nickname, isOwner);
    if (!name || data.publicConsent !== true)
      return noStoreJson(
        { error: '公開用の名前と公開への同意を確認してください。' },
        { status: 400 },
      );
    const authorName = isOwner ? 'Aitock公式' : name,
      authorRole = isOwner ? 'staff' : 'member';
    const body = typeof data.body === 'string' ? data.body.trim() : '';
    const requestId = typeof data.requestId === 'string' ? data.requestId : '';
    if (!body || body.length > 5000 || !/^[a-zA-Z0-9-]{16,64}$/.test(requestId))
      return noStoreJson(
        { error: '本文は1〜5,000文字で入力してください。' },
        { status: 400 },
      );
    if (data.action === 'reply') {
      if (
        typeof data.postId !== 'string' ||
        !(await getCommunityPost(data.postId))
      )
        return noStoreJson(
          { error: '投稿が見つかりません。' },
          { status: 404 },
        );
      if (!(await canInteractWithPost(user.userId, data.postId)))
        return noStoreJson(
          { error: 'この投稿にはコメントできません。' },
          { status: 403 },
        );
      const reply = await writeCommunityReply({
        postId: data.postId,
        authorId: user.userId,
        authorName,
        authorRole,
        requestId,
        body,
      });
      return noStoreJson(
        reply
          ? { ok: true, next: '/community/' + data.postId }
          : { error: '投稿が削除されたため、返信を保存できませんでした。' },
        { status: reply ? 200 : 409 },
      );
    }
    if (data.action !== 'post' || !isCommunityKind(data.kind))
      return noStoreJson(
        { error: '投稿の種類を選んでください。' },
        { status: 400 },
      );
    const title = typeof data.title === 'string' ? data.title.trim() : '';
    const taskId =
      typeof data.taskId === 'string' && data.taskId ? data.taskId : null;
    if (!title || title.length > 100 || (taskId && !findTextbookTask(taskId)))
      return noStoreJson(
        { error: 'タイトルや課題番号を確認してください。' },
        { status: 400 },
      );
    const mediaId =
      typeof data.mediaId === 'string' && data.mediaId ? data.mediaId : null;
    if (mediaId && !(await ownedCommunityMedia(mediaId, user.userId)))
      return noStoreJson(
        { error: '自分で追加した画像を選んでください。' },
        { status: 400 },
      );
    const post = await writeCommunityPost({
      authorId: user.userId,
      authorName,
      authorRole,
      requestId,
      kind: data.kind,
      title,
      body,
      taskId,
      mediaId,
      profileHandle: isOwner
        ? 'aitock'
        : socialProfile?.isPublic
          ? socialProfile.handle
          : null,
    });
    return noStoreJson(
      post
        ? { ok: true, next: '/community/' + post.id }
        : { error: '投稿を保存できませんでした。' },
      { status: post ? 200 : 409 },
    );
  } catch {
    return noStoreJson(
      { error: '保存できませんでした。しばらくしてからお試しください。' },
      { status: 503 },
    );
  }
}
