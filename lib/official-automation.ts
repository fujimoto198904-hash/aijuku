import { officialCharacters } from './official-characters';
import { communityPostTitle, communityTextLength } from './community-composer';
import { findTextbookTask } from './textbook-catalog';

export const editorialActor = 'aistock-system-editorial';
export const editorialHandles = [
  'aitock',
  ...officialCharacters.map((p) => p.handle),
];
export const editorialMaxPosts = 11;
export type EditorialPost = {
  id: string;
  handle: string;
  kind: 'official' | 'official_ai';
  title: string;
  body: string;
  taskId: string | null;
};
export type EditorialBatch = {
  slot: string;
  publishAfter: number;
  posts: EditorialPost[];
};

// Two current-day windows only. Missed runs are not backfilled into the feed.
export function editorialSlot(now = Date.now()) {
  const jst = new Date(now + 9 * 3600000);
  const day = jst.toISOString().slice(0, 10);
  const hour = jst.getUTCHours();
  return hour >= 9 && hour < 11
    ? `${day}-am`
    : hour >= 19 && hour < 21
      ? `${day}-pm`
      : null;
}

export function parseEditorialBatch(
  data: Record<string, unknown>,
): EditorialBatch {
  if (
    typeof data.slot !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}-(am|pm)$/.test(data.slot)
  )
    throw new Error('投稿枠は YYYY-MM-DD-am または YYYY-MM-DD-pm です。');
  const slot = data.slot;
  const day = slot.slice(0, 10);
  const publishAfter = Date.parse(
    `${day}T${data.slot.endsWith('-am') ? '09' : '19'}:00:00+09:00`,
  );
  if (
    !Number.isFinite(publishAfter) ||
    new Date(publishAfter + 9 * 3600000).toISOString().slice(0, 10) !== day
  )
    throw new Error('投稿する日付を確認してください。');
  if (
    !Array.isArray(data.posts) ||
    data.posts.length < 1 ||
    data.posts.length > editorialMaxPosts
  )
    throw new Error('1回に投稿できるのは1〜11件です。');
  const handles = new Set<string>(),
    bodies = new Set<string>();
  const posts = data.posts.map((raw): EditorialPost => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw))
      throw new Error('投稿内容を確認してください。');
    const p = raw as Record<string, unknown>;
    if (
      typeof p.handle !== 'string' ||
      !editorialHandles.includes(p.handle) ||
      handles.has(p.handle)
    )
      throw new Error('既存の公式アカウントごとに1件まで投稿できます。');
    const body =
      typeof p.body === 'string' ? p.body.trim().normalize('NFC') : '';
    if (
      !body ||
      communityTextLength(body) > 1000 ||
      Array.from(body).some(
        (c) => c.charCodeAt(0) < 32 && ![9, 10, 13].includes(c.charCodeAt(0)),
      )
    )
      throw new Error('本文は1〜1,000文字で入力してください。');
    if (bodies.has(body))
      throw new Error('同じ本文を複数のアカウントから投稿できません。');
    if (
      p.taskId != null &&
      (typeof p.taskId !== 'string' || !findTextbookTask(p.taskId))
    )
      throw new Error('関連する教科書の課題が見つかりません。');
    handles.add(p.handle);
    bodies.add(body);
    return {
      id: `routine-${day.replaceAll('-', '')}-${slot.endsWith('-am') ? 'am' : 'pm'}-${p.handle}`,
      handle: p.handle,
      kind: p.handle === 'aitock' ? 'official' : 'official_ai',
      title: communityPostTitle(body),
      body,
      taskId: (p.taskId as string | null) ?? null,
    };
  });
  return { slot: data.slot, publishAfter, posts };
}

export async function editorialTokenMatches(
  header: string | null,
  expected: string | undefined,
) {
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const supplied = header?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!supplied) return false;
  const hash = async (value: string) =>
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)),
    );
  const [a, b] = await Promise.all([hash(supplied), hash(expected)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
