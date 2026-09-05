import { env } from 'cloudflare:workers';
import { officialCharacters } from '@/lib/official-characters';
import { officialPosts } from '@/lib/official-posts';
import { membershipTermsVersion, privacyPolicyVersion } from '@/db/membership';
const publisher = 'aistock-system-editorial';
export async function seedOfficialCommunity() {
  const now = Date.now();
  // No auth account, identity, session or password is ever created for this record.
  await env.DB.prepare(
    "INSERT INTO members(id,email,display_name,status,terms_version,terms_accepted_at,privacy_version,privacy_accepted_at,created_at,updated_at) VALUES(?,?,?,'active',?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING",
  )
    .bind(
      publisher,
      'editorial@example.invalid',
      '公式コンテンツ管理レコード',
      membershipTermsVersion,
      now,
      privacyPolicyVersion,
      now,
      now,
      now,
    )
    .run();
  const profiles = [
    {
      handle: 'aitock',
      name: 'Aitock公式',
      bio: '気になる投稿から、教科書へ。AIでできることを、一緒に増やしていこう。',
      avatar: null,
      kind: 'official',
    },
    ...officialCharacters.map((c) => ({ ...c, kind: 'official_ai' })),
  ];
  for (const p of profiles)
    await env.DB.prepare(
      'INSERT INTO social_profiles(handle,name,bio,kind,avatar,is_public,dm_enabled,created_at) VALUES(?,?,?,?,?,1,0,?) ON CONFLICT(handle) DO NOTHING',
    )
      .bind(p.handle, p.name, p.bio, p.kind, p.avatar, now)
      .run();
  const posts = [
    ...officialPosts.map((p) => ({
      id: p.id,
      handle: 'aitock',
      name: 'Aitock公式',
      title: p.title,
      body: p.body,
      task: p.taskId,
      example: null as string | null,
    })),
    ...officialCharacters.flatMap((c, i) => [
      {
        id: 'example-' + c.handle + '-1',
        handle: c.handle,
        name: c.name,
        title: c.title,
        body: c.body,
        task: c.task,
        example: '2026-08-' + String(20 + i).padStart(2, '0'),
      },
      {
        id: 'example-' + c.handle + '-2',
        handle: c.handle,
        name: c.name,
        title: '次に試すなら、このひと工夫。',
        body:
          c.body +
          '\n\n次の練習では「まず質問を3つしてから、一緒に進めて」と伝える設定。自分が何に迷っているのかも、言葉にしてみよう。',
        task: c.task,
        example: '2026-09-' + String(1 + (i % 4)).padStart(2, '0'),
      },
    ]),
  ];
  for (const p of posts)
    await env.DB.prepare(
      "INSERT INTO community_posts(id,author_id,request_id,kind,title,body,task_id,author_name,author_role,created_at,profile_handle,example_date) VALUES(?,?,?,'tip',?,?,?,?,'member',?,?,?) ON CONFLICT(id) DO NOTHING",
    )
      .bind(
        p.id,
        publisher,
        p.id,
        p.title,
        p.body,
        p.task,
        p.name,
        now,
        p.handle,
        p.example,
      )
      .run();
  return { profiles: profiles.length, posts: posts.length };
}
export async function queueOfficialPost(input: {
  handle: string;
  title: string;
  body: string;
  taskId: string | null;
  publishAfter: number;
  ownerId: string;
  requestId: string;
}) {
  const result = await env.DB.prepare(
    "INSERT INTO official_queue(id,profile_handle,title,body,task_id,publish_after,approved_by) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM social_profiles WHERE handle=? AND kind IN ('official','official_ai')) ON CONFLICT(id) DO NOTHING",
  )
    .bind(
      input.requestId,
      input.handle,
      input.title,
      input.body,
      input.taskId,
      input.publishAfter,
      input.ownerId,
      input.handle,
    )
    .run();
  return result.meta.changes > 0;
}
export async function listOfficialQueue() {
  return (
    await env.DB.prepare(
      'SELECT id,profile_handle AS handle,title,publish_after AS publishAfter,published_at AS publishedAt,cancelled_at AS cancelledAt FROM official_queue ORDER BY publish_after DESC LIMIT 50',
    ).all<{
      id: string;
      handle: string;
      title: string;
      publishAfter: number;
      publishedAt: number | null;
      cancelledAt: number | null;
    }>()
  ).results;
}
export async function cancelOfficialPost(id: string) {
  await env.DB.prepare(
    'UPDATE official_queue SET cancelled_at=? WHERE id=? AND published_at IS NULL',
  )
    .bind(Date.now(), id)
    .run();
}
// Deliberately no recurring scheduler. Owner review approves each payload;
// this idempotent runner can later be called by an authenticated scheduler.
export async function publishDueOfficialPosts() {
  const now = Date.now();
  const { results } = await env.DB.prepare(
    "SELECT q.id FROM official_queue q JOIN social_profiles s ON s.handle=q.profile_handle WHERE q.published_at IS NULL AND q.cancelled_at IS NULL AND q.publish_after<=? AND s.is_public=1 AND s.kind IN ('official','official_ai') ORDER BY q.publish_after LIMIT 20",
  )
    .bind(now)
    .all<{ id: string }>();
  for (const { id } of results)
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO community_posts(id,author_id,request_id,kind,title,body,task_id,author_name,author_role,created_at,profile_handle) SELECT q.id,q.approved_by,q.id,'tip',q.title,q.body,q.task_id,s.name,'member',?,s.handle FROM official_queue q JOIN social_profiles s ON s.handle=q.profile_handle WHERE q.id=? AND q.published_at IS NULL AND q.cancelled_at IS NULL ON CONFLICT(id) DO NOTHING",
      ).bind(now, id),
      env.DB.prepare(
        'UPDATE official_queue SET published_at=? WHERE id=? AND EXISTS(SELECT 1 FROM community_posts WHERE id=?)',
      ).bind(now, id, id),
    ]);
  return results.length;
}
