import { env } from 'cloudflare:workers';
import {
  editorialActor,
  editorialHandles,
  type EditorialBatch,
} from '@/lib/official-automation';

const inputCte = `WITH input AS (
  SELECT json_extract(value,'$.id') AS id, json_extract(value,'$.handle') AS handle,
    json_extract(value,'$.kind') AS kind, json_extract(value,'$.title') AS title,
    json_extract(value,'$.body') AS body, json_extract(value,'$.taskId') AS task_id
  FROM json_each(?)
)`;
// Repeated within the same atomic D1 batch, not merely checked before writing.
// A conflicting retry, changed profile or stopped actor blocks the whole batch.
const batchGate = `EXISTS(SELECT 1 FROM members WHERE id='${editorialActor}' AND status='active')
  AND NOT EXISTS(SELECT 1 FROM input i LEFT JOIN social_profiles s ON s.handle=i.handle
    WHERE s.handle IS NULL OR s.is_public<>1 OR s.kind<>i.kind OR s.member_id IS NOT NULL)
  AND NOT EXISTS(SELECT 1 FROM input i JOIN official_queue q ON q.id=i.id
    WHERE q.profile_handle<>i.handle OR q.title<>i.title OR q.body<>i.body
      OR q.task_id IS NOT i.task_id OR q.approved_by<>'${editorialActor}' OR q.publish_after<>?)
  AND NOT EXISTS(SELECT 1 FROM input i JOIN community_posts p ON p.body=i.body
    WHERE p.author_id='${editorialActor}' AND p.id<>i.id AND p.created_at>=?)`;

export async function editorialReceipts(batch: EditorialBatch) {
  const { results } = await env.DB.prepare(`${inputCte}
    SELECT i.id,i.handle,q.published_at AS publishedAt,q.cancelled_at AS cancelledAt,
      CASE WHEN q.id IS NOT NULL AND (q.profile_handle<>i.handle OR q.title<>i.title OR q.body<>i.body
        OR q.task_id IS NOT i.task_id OR q.approved_by<>? OR q.publish_after<>?) THEN 'conflict'
      WHEN q.cancelled_at IS NOT NULL THEN 'cancelled'
      WHEN s.handle IS NULL OR s.is_public<>1 OR s.kind<>i.kind OR s.member_id IS NOT NULL THEN 'unavailable'
      WHEN p.deleted_at IS NOT NULL OR (q.published_at IS NOT NULL AND p.id IS NULL) THEN 'removed'
      WHEN p.id IS NOT NULL AND q.published_at IS NOT NULL THEN 'published'
      ELSE 'pending' END AS status
    FROM input i LEFT JOIN official_queue q ON q.id=i.id
    LEFT JOIN community_posts p ON p.id=i.id LEFT JOIN social_profiles s ON s.handle=i.handle`)
    .bind(JSON.stringify(batch.posts), editorialActor, batch.publishAfter)
    .all<{
      id: string;
      handle: string;
      publishedAt: number | null;
      cancelledAt: number | null;
      status: string;
    }>();
  return results.map((r) => ({
    ...r,
    url:
      r.status === 'published'
        ? `https://mon-ai.jp/aistock/community/${r.id}`
        : null,
  }));
}

export async function checkEditorialBatch(
  batch: EditorialBatch,
  now = Date.now(),
) {
  const gate = await env.DB.prepare(
    `${inputCte} SELECT (${batchGate}) AS allowed`,
  )
    .bind(JSON.stringify(batch.posts), batch.publishAfter, now - 30 * 86400000)
    .first<{ allowed: number }>();
  return {
    allowed: gate?.allowed === 1,
    receipts: await editorialReceipts(batch),
  };
}

export async function publishEditorialBatch(
  batch: EditorialBatch,
  now = Date.now(),
) {
  const json = JSON.stringify(batch.posts),
    recent = now - 30 * 86400000;
  const results = await env.DB.batch([
    env.DB.prepare(`${inputCte}
      INSERT INTO official_queue(id,profile_handle,title,body,task_id,publish_after,approved_by)
      SELECT i.id,i.handle,i.title,i.body,i.task_id,?,'${editorialActor}' FROM input i
      WHERE ${batchGate} ON CONFLICT(id) DO NOTHING`).bind(
      json,
      batch.publishAfter,
      batch.publishAfter,
      recent,
    ),
    env.DB.prepare(`${inputCte}
      INSERT INTO community_posts(id,author_id,request_id,kind,title,body,task_id,author_name,author_role,created_at,profile_handle)
      SELECT q.id,'${editorialActor}',q.id,'tip',q.title,q.body,q.task_id,s.name,'member',?,s.handle
      FROM input i JOIN official_queue q ON q.id=i.id JOIN social_profiles s ON s.handle=i.handle
      WHERE ${batchGate} AND q.published_at IS NULL AND q.cancelled_at IS NULL AND q.publish_after<=?
      ON CONFLICT(id) DO NOTHING`).bind(
      json,
      now,
      batch.publishAfter,
      recent,
      now,
    ),
    env.DB.prepare(`${inputCte}
      UPDATE official_queue SET published_at=? WHERE id IN(SELECT id FROM input)
      AND ${batchGate} AND published_at IS NULL AND cancelled_at IS NULL
      AND EXISTS(SELECT 1 FROM community_posts p WHERE p.id=official_queue.id AND p.deleted_at IS NULL
        AND p.author_id='${editorialActor}' AND p.body=official_queue.body AND p.task_id IS official_queue.task_id
        AND p.profile_handle=official_queue.profile_handle)`).bind(
      json,
      now,
      batch.publishAfter,
      recent,
    ),
  ]);
  return {
    slot: batch.slot,
    inserted: results[1].meta.changes,
    receipts: await editorialReceipts(batch),
  };
}

export async function editorialContext() {
  const placeholders = editorialHandles.map(() => '?').join(',');
  const [profiles, posts, runs, actor] = await Promise.all([
    env.DB.prepare(`SELECT handle,name,bio,kind,is_public AS isPublic FROM social_profiles
      WHERE handle IN (${placeholders}) AND member_id IS NULL AND kind IN ('official','official_ai')`)
      .bind(...editorialHandles)
      .all(),
    env.DB.prepare(`SELECT p.id,p.profile_handle AS handle,p.body,p.task_id AS taskId,p.created_at AS createdAt
      FROM community_posts p JOIN social_profiles s ON s.handle=p.profile_handle
      WHERE s.handle IN (${placeholders}) AND s.is_public=1 AND s.member_id IS NULL
        AND s.kind IN ('official','official_ai') AND p.deleted_at IS NULL ORDER BY p.created_at DESC LIMIT 200`)
      .bind(...editorialHandles)
      .all(),
    env.DB.prepare(`SELECT id,profile_handle AS handle,publish_after AS publishAfter,published_at AS publishedAt,
      cancelled_at AS cancelledAt FROM official_queue WHERE approved_by=? AND id LIKE 'routine-%'
      ORDER BY publish_after DESC,id LIMIT 200`)
      .bind(editorialActor)
      .all(),
    env.DB.prepare("SELECT id FROM members WHERE id=? AND status='active'")
      .bind(editorialActor)
      .first(),
  ]);
  return {
    actorReady: !!actor,
    profiles: profiles.results,
    recentPosts: posts.results,
    runs: runs.results,
  };
}
