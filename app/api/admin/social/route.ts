import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getAuthenticatedStaffPermissions } from '@/lib/staff-permissions';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { communityWriteAllowance } from '@/db/community';
import {
  seedOfficialCommunity,
  queueOfficialPost,
  publishDueOfficialPosts,
  cancelOfficialPost,
} from '@/db/official-community';
import { resolveSocialReport, socialHandleValid } from '@/db/social';
import { isSameOriginRequest } from '@/lib/request-security';
import { readBoundedJson } from '@/lib/limited-json';
import { noStoreJson } from '@/lib/auth-request';
import { findTextbookTask } from '@/lib/textbook-catalog';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  const fail = (error: string, status = 400) =>
    noStoreJson({ error }, { status });
  if (!isSameOriginRequest(request))
    return fail('送信元を確認できません。', 403);
  const user = await getChatGPTUser();
  if (!user || user.isDemo || !getAuthenticatedStaffPermissions(user).isOwner)
    return fail('運営専用の操作です。', 403);
  const member = await getMember(user.userId);
  if (member?.status !== 'active' || !hasCurrentMembershipConsent(member))
    return fail('会員状態を確認してください。', 403);
  if (!(await communityWriteAllowance(user.userId)))
    return fail('1分ほどお待ちください。', 429);
  try {
    const d = await readBoundedJson(request);
    if (d.action === 'seed')
      return noStoreJson({ ok: true, ...(await seedOfficialCommunity()) });
    if (d.action === 'publish')
      return noStoreJson({
        ok: true,
        published: await publishDueOfficialPosts(),
      });
    if (d.action === 'cancel' && typeof d.id === 'string') {
      await cancelOfficialPost(d.id);
      return noStoreJson({ ok: true });
    }
    if (d.action === 'resolve' && typeof d.id === 'string') {
      await resolveSocialReport(d.id, user.userId);
      return noStoreJson({ ok: true });
    }
    if (
      d.action === 'queue' &&
      socialHandleValid(d.handle) &&
      typeof d.title === 'string' &&
      d.title.trim().length > 0 &&
      d.title.length <= 100 &&
      typeof d.body === 'string' &&
      d.body.trim().length > 0 &&
      d.body.length <= 5000 &&
      typeof d.requestId === 'string' &&
      /^[a-zA-Z0-9-]{16,64}$/.test(d.requestId) &&
      typeof d.publishAfter === 'number' &&
      Number.isSafeInteger(d.publishAfter) &&
      d.publishAfter > 0 &&
      d.approved === true
    ) {
      const taskId = typeof d.taskId === 'string' && d.taskId ? d.taskId : null;
      if (taskId && !findTextbookTask(taskId))
        return fail('課題番号を確認してください。');
      return (await queueOfficialPost({
        handle: d.handle,
        title: d.title.trim(),
        body: d.body.trim(),
        taskId,
        publishAfter: d.publishAfter,
        requestId: d.requestId,
        ownerId: user.userId,
      }))
        ? noStoreJson({ ok: true })
        : fail('保存済み、または対象の公式アカウントがありません。', 409);
    }
    return fail('入力を確認してください。');
  } catch {
    return fail('操作できませんでした。内容を確認してお試しください。', 503);
  }
}
