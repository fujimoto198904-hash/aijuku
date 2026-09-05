import { env } from 'cloudflare:workers';
import type { CommunityKind } from '@/lib/community';

export type CommunityPost = {
  id: string;
  kind: CommunityKind;
  title: string;
  body: string;
  taskId: string | null;
  authorName: string;
  authorRole: string;
  createdAt: number;
  replyCount: number;
  mediaId: string | null;
};
export type CommunityReply = {
  id: string;
  body: string;
  authorName: string;
  authorRole: string;
  createdAt: number;
};
const columns = `p.id, p.kind, p.title, p.body, p.task_id AS taskId,p.media_id AS mediaId, p.author_name AS authorName,
  p.author_role AS authorRole, p.created_at AS createdAt,
  (SELECT count(*) FROM community_replies r WHERE r.post_id=p.id AND r.deleted_at IS NULL) AS replyCount`;
export async function listCommunityPosts(
  kind?: CommunityKind,
  page = 1,
  memberId?: string,
  query = '',
) {
  const filters = ['p.deleted_at IS NULL'];
  const binds: (string | number)[] = [];
  if (kind) {
    filters.push('p.kind = ?');
    binds.push(kind);
  }
  if (memberId) {
    filters.push('p.author_id = ?');
    binds.push(memberId);
  }
  if (query) {
    filters.push(
      '(instr(lower(p.title), lower(?)) > 0 OR instr(lower(p.body), lower(?)) > 0)',
    );
    binds.push(query, query);
  }
  const { results } =
    await env.DB.prepare(`SELECT ${columns} FROM community_posts p WHERE ${filters.join(' AND ')}
    ORDER BY p.created_at DESC, p.id DESC LIMIT 21 OFFSET ?`)
      .bind(...binds, (page - 1) * 20)
      .all<CommunityPost>();
  return { posts: results.slice(0, 20), hasMore: results.length > 20 };
}
export async function getCommunityPost(id: string) {
  return env.DB.prepare(
    `SELECT ${columns} FROM community_posts p WHERE p.id=? AND p.deleted_at IS NULL`,
  )
    .bind(id)
    .first<CommunityPost>();
}
export async function getCommunityReplies(id: string, page = 1) {
  const { results } =
    await env.DB.prepare(`SELECT id, body, author_name AS authorName, author_role AS authorRole,
    created_at AS createdAt FROM community_replies WHERE post_id=? AND deleted_at IS NULL ORDER BY created_at, id LIMIT 50 OFFSET ?`)
      .bind(id, (page - 1) * 50)
      .all<CommunityReply>();
  return results;
}
export async function communityWriteAllowance(memberId: string) {
  const now = Date.now(),
    window = now - 60000;
  const row =
    await env.DB.prepare(`INSERT INTO community_write_limits(member_id,window_start,request_count) VALUES(?,?,1)
    ON CONFLICT(member_id) DO UPDATE SET window_start=CASE WHEN window_start<=? THEN ? ELSE window_start END,
    request_count=CASE WHEN window_start<=? THEN 1 ELSE request_count+1 END
    WHERE window_start<=? OR request_count<8 RETURNING request_count`)
      .bind(memberId, now, window, now, window, window)
      .first();
  return !!row;
}
export async function communityRetry(
  memberId: string,
  data: Record<string, unknown>,
  authorName: string,
) {
  if (
    typeof data.requestId !== 'string' ||
    !/^[a-zA-Z0-9-]{16,64}$/.test(data.requestId)
  )
    return null;
  const body = typeof data.body === 'string' ? data.body.trim() : '';
  if (data.action === 'post') {
    const row = await env.DB.prepare(
      'SELECT id,kind,title,body,task_id AS taskId,media_id AS mediaId,author_name AS authorName,deleted_at AS deletedAt FROM community_posts WHERE author_id=? AND request_id=?',
    )
      .bind(memberId, data.requestId)
      .first<{
        id: string;
        kind: string;
        title: string;
        body: string;
        taskId: string | null;
        mediaId: string | null;
        authorName: string;
        deletedAt: number | null;
      }>();
    if (!row) return null;
    const same =
      !row.deletedAt &&
      row.kind === data.kind &&
      row.title === (typeof data.title === 'string' ? data.title.trim() : '') &&
      row.body === body &&
      row.authorName === authorName &&
      row.taskId ===
        (typeof data.taskId === 'string' && data.taskId ? data.taskId : null) &&
      row.mediaId ===
        (typeof data.mediaId === 'string' && data.mediaId
          ? data.mediaId
          : null);
    return { same, next: row.deletedAt ? '/mypage' : '/community/' + row.id };
  }
  if (data.action === 'reply') {
    const row = await env.DB.prepare(
      'SELECT r.post_id AS postId,r.body,r.author_name AS authorName,r.deleted_at AS deletedAt,p.deleted_at AS parentDeletedAt FROM community_replies r JOIN community_posts p ON p.id=r.post_id WHERE r.author_id=? AND r.request_id=?',
    )
      .bind(memberId, data.requestId)
      .first<{
        postId: string;
        body: string;
        authorName: string;
        deletedAt: number | null;
        parentDeletedAt: number | null;
      }>();
    if (!row) return null;
    return {
      same:
        !row.deletedAt &&
        !row.parentDeletedAt &&
        row.body === body &&
        row.postId === data.postId &&
        row.authorName === authorName,
      next: row.parentDeletedAt ? '/mypage' : '/community/' + row.postId,
    };
  }
  return null;
}
export async function writeCommunityPost(input: {
  authorId: string;
  authorName: string;
  authorRole: string;
  requestId: string;
  kind: CommunityKind;
  title: string;
  body: string;
  taskId: string | null;
  mediaId?: string | null;
}) {
  const id = crypto.randomUUID(),
    now = Date.now();
  await env.DB.prepare(`INSERT INTO community_posts(id,author_id,request_id,kind,title,body,task_id,author_name,author_role,created_at,media_id)
    SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE ? IS NULL OR EXISTS(SELECT 1 FROM community_media WHERE id=? AND member_id=?) ON CONFLICT(author_id,request_id) DO NOTHING`)
    .bind(
      id,
      input.authorId,
      input.requestId,
      input.kind,
      input.title,
      input.body,
      input.taskId,
      input.authorName,
      input.authorRole,
      now,
      input.mediaId ?? null,
      input.mediaId ?? null,
      input.mediaId ?? null,
      input.authorId,
    )
    .run();
  return env.DB.prepare(
    'SELECT id FROM community_posts WHERE author_id=? AND request_id=? AND kind=? AND title=? AND body=? AND task_id IS ? AND author_name=? AND media_id IS ? AND deleted_at IS NULL',
  )
    .bind(
      input.authorId,
      input.requestId,
      input.kind,
      input.title,
      input.body,
      input.taskId,
      input.authorName,
      input.mediaId ?? null,
    )
    .first<{ id: string }>();
}
export async function writeCommunityReply(input: {
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  requestId: string;
  body: string;
}) {
  await env.DB.prepare(`INSERT INTO community_replies(id,post_id,author_id,request_id,body,author_name,author_role,created_at)
    SELECT ?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM community_posts WHERE id=? AND deleted_at IS NULL)
    ON CONFLICT(author_id,request_id) DO NOTHING`)
    .bind(
      crypto.randomUUID(),
      input.postId,
      input.authorId,
      input.requestId,
      input.body,
      input.authorName,
      input.authorRole,
      Date.now(),
      input.postId,
    )
    .run();
  return env.DB.prepare(`SELECT r.id FROM community_replies r JOIN community_posts p ON p.id=r.post_id
    WHERE r.author_id=? AND r.request_id=? AND r.post_id=? AND r.body=? AND r.author_name=? AND r.deleted_at IS NULL AND p.deleted_at IS NULL`)
    .bind(
      input.authorId,
      input.requestId,
      input.postId,
      input.body,
      input.authorName,
    )
    .first<{ id: string }>();
}
export async function communityOwnedIds(postId: string, memberId: string) {
  const post = await env.DB.prepare(
    'SELECT id FROM community_posts WHERE id=? AND author_id=? AND deleted_at IS NULL',
  )
    .bind(postId, memberId)
    .first<{ id: string }>();
  const replies = await env.DB.prepare(
    'SELECT id FROM community_replies WHERE post_id=? AND author_id=? AND deleted_at IS NULL',
  )
    .bind(postId, memberId)
    .all<{ id: string }>();
  return { post: !!post, replies: replies.results.map((r) => r.id) };
}
export async function removeCommunityItem(input: {
  kind: 'post' | 'reply';
  id: string;
  memberId: string;
  isOwner: boolean;
}) {
  const table = input.kind === 'post' ? 'community_posts' : 'community_replies';
  const result = await env.DB.prepare(
    `UPDATE ${table} SET deleted_at=?,deleted_by=? WHERE id=? AND deleted_at IS NULL AND (author_id=? OR ?=1)`,
  )
    .bind(
      Date.now(),
      input.memberId,
      input.id,
      input.memberId,
      input.isOwner ? 1 : 0,
    )
    .run();
  return result.meta.changes > 0;
}
