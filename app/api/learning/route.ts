import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getMember, hasCurrentMembershipConsent } from '@/db/membership';
import { communityWriteAllowance, getCommunityPost } from '@/db/community';
import {
  listPostStocks,
  saveLearningNote,
  removeLearningNote,
  importLearningNotes,
  setPostStock,
  editLearningNote,
} from '@/db/learning-notes';
import { parseNote, parseAitockImport } from '@/lib/learning-notes';
import { findOfficialPost } from '@/lib/official-posts';
import { findTextbookTask } from '@/lib/textbook-catalog';
import { noStoreJson } from '@/lib/auth-request';
import { readBoundedJson } from '@/lib/limited-json';
import { isSameOriginRequest } from '@/lib/request-security';
export const dynamic = 'force-dynamic';
async function memberUser() {
  const user = await getChatGPTUser();
  if (!user) return null;
  const member = await getMember(user.userId);
  return member?.status === 'active' && hasCurrentMembershipConsent(member)
    ? user
    : null;
}
export async function GET() {
  const user = await memberUser();
  if (!user)
    return noStoreJson({ error: 'ログインしてください。' }, { status: 401 });
  try {
    return noStoreJson({
      stocks: await listPostStocks(user.userId),
      readOnly: !!user.isDemo,
    });
  } catch {
    return noStoreJson(
      { error: '保存一覧を読み込めませんでした。' },
      { status: 503 },
    );
  }
}
export async function POST(request: Request) {
  if (!isSameOriginRequest(request))
    return noStoreJson({ error: '送信元を確認できません。' }, { status: 403 });
  const user = await memberUser();
  if (!user)
    return noStoreJson(
      { error: 'ログインして参加手続きを完了してください。' },
      { status: 401 },
    );
  if (user.isDemo)
    return noStoreJson({ error: 'デモでは保存できません。' }, { status: 403 });
  try {
    const data = await readBoundedJson(request, 400000);
    if (!(await communityWriteAllowance(user.userId)))
      return noStoreJson(
        { error: '1分ほど待ってからお試しください。' },
        { status: 429 },
      );
    if (data.action === 'stock') {
      if (
        typeof data.ref !== 'string' ||
        data.ref.length > 100 ||
        typeof data.saved !== 'boolean'
      )
        return noStoreJson(
          { error: '投稿を確認してください。' },
          { status: 400 },
        );
      if (
        data.saved &&
        !findOfficialPost(data.ref) &&
        !(await getCommunityPost(data.ref))
      )
        return noStoreJson(
          { error: '投稿が見つかりません。' },
          { status: 404 },
        );
      const ok = await setPostStock(user.userId, data.ref, data.saved);
      return noStoreJson(
        ok
          ? { ok: true }
          : { error: '保存は200件までです。不要な保存を外してください。' },
        { status: ok ? 200 : 409 },
      );
    }
    if (data.action === 'delete') {
      const ok =
        typeof data.id === 'string' &&
        (await removeLearningNote(user.userId, data.id));
      return noStoreJson(
        ok ? { ok: true } : { error: '自分の記録が見つかりません。' },
        { status: ok ? 200 : 404 },
      );
    }
    if (data.action === 'import') {
      const notes = parseAitockImport(data.export);
      if (!notes)
        return noStoreJson(
          { error: 'Aitockの書き出しファイルを確認してください。' },
          { status: 400 },
        );
      return noStoreJson({
        ok: true,
        ...(await importLearningNotes(user.userId, notes)),
      });
    }
    const note = parseNote(data);
    if (data.action === 'edit') {
      if (
        !note ||
        typeof data.id !== 'string' ||
        !Array.isArray(data.expected) ||
        data.expected.length !== 4 ||
        data.expected.some((v) => typeof v !== 'string' || v.length > 2000)
      )
        return noStoreJson(
          { error: '編集内容を確認してください。' },
          { status: 400 },
        );
      const ok = await editLearningNote(
        user.userId,
        data.id,
        note,
        data.expected as string[],
      );
      return noStoreJson(
        ok
          ? { ok: true }
          : {
              error:
                '別の画面で変更されたか、削除されています。入力を控えてから、保存済みの記録を確認してください。',
            },
        { status: ok ? 200 : 409 },
      );
    }
    if (
      data.action !== 'note' ||
      !note ||
      (note.taskId && !findTextbookTask(note.taskId)) ||
      typeof data.requestId !== 'string' ||
      !/^[a-zA-Z0-9-]{16,64}$/.test(data.requestId)
    )
      return noStoreJson(
        { error: '記録の内容を確認してください。' },
        { status: 400 },
      );
    const saved = await saveLearningNote(user.userId, data.requestId, note);
    return noStoreJson(
      saved
        ? { ok: true, id: saved.id }
        : {
            error:
              'この送信の記録は保存済みですが、内容が変わっています。下の記録を確認してください。',
          },
      { status: saved ? 200 : 409 },
    );
  } catch {
    return noStoreJson(
      { error: '保存できませんでした。入力内容と通信状態を確認してください。' },
      { status: 503 },
    );
  }
}
