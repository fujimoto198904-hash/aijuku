import { env } from 'cloudflare:workers';
import { membershipTermsVersion, privacyPolicyVersion } from '@/db/membership';
import { getCommunityPost } from '@/db/community';
import { findOfficialPost } from '@/lib/official-posts';

export type SocialProfile = {
  handle: string;
  name: string;
  bio: string;
  kind: 'member' | 'official' | 'official_ai';
  avatar: string | null;
  isPublic: number;
  dmEnabled: number;
};
const profileColumns =
  's.handle,s.name,s.bio,s.kind,s.avatar,s.is_public AS isPublic,s.dm_enabled AS dmEnabled';
const visible = `s.is_public=1 AND (s.member_id IS NULL OR EXISTS(SELECT 1 FROM members m WHERE m.id=s.member_id AND m.status='active' AND m.terms_version=? AND m.privacy_version=?))`;
const consent = [membershipTermsVersion, privacyPolicyVersion];
export const socialHandleValid = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{2,48}$/.test(value);
export async function ownSocialProfile(memberId: string) {
  return env.DB.prepare(
    `SELECT ${profileColumns} FROM social_profiles s WHERE member_id=?`,
  )
    .bind(memberId)
    .first<SocialProfile>();
}
export async function publicSocialProfile(handle: string) {
  if (!socialHandleValid(handle)) return null;
  return env.DB.prepare(
    `SELECT ${profileColumns} FROM social_profiles s WHERE handle=? AND ${visible}`,
  )
    .bind(handle, ...consent)
    .first<SocialProfile>();
}
export async function searchSocialProfiles(query = '', page = 1) {
  const { results } = await env.DB.prepare(
    `SELECT ${profileColumns} FROM social_profiles s WHERE ${visible} AND (instr(lower(name),lower(?))>0 OR instr(lower(bio),lower(?))>0) ORDER BY kind,name,handle LIMIT 21 OFFSET ?`,
  )
    .bind(...consent, query, query, (page - 1) * 20)
    .all<SocialProfile>();
  return { profiles: results.slice(0, 20), hasMore: results.length > 20 };
}
export async function saveSocialProfile(
  memberId: string,
  input: { name: string; bio: string; isPublic: boolean; dmEnabled: boolean },
) {
  const handle = 'm-' + crypto.randomUUID().replaceAll('-', '').slice(0, 20);
  await env.DB.prepare(
    `INSERT INTO social_profiles(handle,member_id,name,bio,is_public,dm_enabled,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(member_id) DO UPDATE SET name=excluded.name,bio=excluded.bio,is_public=excluded.is_public,dm_enabled=excluded.dm_enabled WHERE social_profiles.kind='member'`,
  )
    .bind(
      handle,
      memberId,
      input.name,
      input.bio,
      +input.isPublic,
      +(input.isPublic && input.dmEnabled),
      Date.now(),
    )
    .run();
  return ownSocialProfile(memberId);
}
export async function socialCounts(handle: string) {
  const rows = await env.DB.batch<{ n: number }>([
    env.DB.prepare(
      'SELECT count(*) AS n FROM community_posts WHERE profile_handle=? AND deleted_at IS NULL',
    ).bind(handle),
    env.DB.prepare(
      `SELECT count(*) AS n FROM social_follows f JOIN social_profiles s ON s.handle=f.follower WHERE f.following=? AND ${visible}`,
    ).bind(handle, ...consent),
    env.DB.prepare(
      `SELECT count(*) AS n FROM social_follows f JOIN social_profiles s ON s.handle=f.following WHERE f.follower=? AND ${visible}`,
    ).bind(handle, ...consent),
  ]);
  return {
    posts: Number(rows[0].results[0]?.n ?? 0),
    followers: Number(rows[1].results[0]?.n ?? 0),
    following: Number(rows[2].results[0]?.n ?? 0),
  };
}
export async function followList(
  handle: string,
  direction: 'followers' | 'following',
  page = 1,
) {
  const col = direction === 'followers' ? 'follower' : 'following',
    match = direction === 'followers' ? 'following' : 'follower';
  const { results } = await env.DB.prepare(
    `SELECT ${profileColumns} FROM social_follows f JOIN social_profiles s ON s.handle=f.${col} WHERE f.${match}=? AND ${visible} ORDER BY f.created_at DESC,s.handle LIMIT 21 OFFSET ?`,
  )
    .bind(handle, ...consent, (page - 1) * 20)
    .all<SocialProfile>();
  return { profiles: results.slice(0, 20), hasMore: results.length > 20 };
}
export async function blockedPair(a: string, b: string) {
  return !!(await env.DB.prepare(
    'SELECT 1 FROM social_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)',
  )
    .bind(a, b, b, a)
    .first());
}
export async function relationship(
  memberId: string | undefined,
  target: string,
) {
  const me = memberId ? await ownSocialProfile(memberId) : null;
  if (!me)
    return {
      following: false,
      blocked: false,
      blockedByMe: false,
      self: false,
      canMessage: false,
    };
  const [following, block, mine, other] = await Promise.all([
    env.DB.prepare(
      'SELECT 1 FROM social_follows WHERE follower=? AND following=?',
    )
      .bind(me.handle, target)
      .first(),
    blockedPair(me.handle, target),
    env.DB.prepare('SELECT 1 FROM social_blocks WHERE blocker=? AND blocked=?')
      .bind(me.handle, target)
      .first(),
    publicSocialProfile(target),
  ]);
  return {
    following: !!following,
    blocked: block,
    blockedByMe: !!mine,
    self: me.handle === target,
    canMessage: !!(
      me.isPublic &&
      other?.dmEnabled &&
      other.kind === 'member' &&
      !block &&
      me.handle !== target
    ),
  };
}
export async function setFollow(
  memberId: string,
  target: string,
  follow: boolean,
) {
  const me = await ownSocialProfile(memberId),
    other = await publicSocialProfile(target);
  if (
    !me?.isPublic ||
    !other ||
    me.handle === target ||
    (await blockedPair(me.handle, target))
  )
    return false;
  if (follow)
    await env.DB.prepare(
      'INSERT INTO social_follows(follower,following,created_at) SELECT ?,?,? WHERE NOT EXISTS(SELECT 1 FROM social_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)) AND EXISTS(SELECT 1 FROM social_profiles WHERE handle=? AND is_public=1) ON CONFLICT DO NOTHING',
    )
      .bind(
        me.handle,
        target,
        Date.now(),
        me.handle,
        target,
        target,
        me.handle,
        target,
      )
      .run();
  else
    await env.DB.prepare(
      'DELETE FROM social_follows WHERE follower=? AND following=?',
    )
      .bind(me.handle, target)
      .run();
  return true;
}
export async function setBlock(
  memberId: string,
  target: string,
  block: boolean,
) {
  const me = await ownSocialProfile(memberId);
  if (
    !me ||
    me.handle === target ||
    !(await env.DB.prepare('SELECT handle FROM social_profiles WHERE handle=?')
      .bind(target)
      .first())
  )
    return false;
  if (block)
    await env.DB.batch([
      env.DB.prepare(
        'INSERT INTO social_blocks(blocker,blocked,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING',
      ).bind(me.handle, target, Date.now()),
      env.DB.prepare(
        'DELETE FROM social_follows WHERE (follower=? AND following=?) OR (follower=? AND following=?)',
      ).bind(me.handle, target, target, me.handle),
    ]);
  else
    await env.DB.prepare(
      'DELETE FROM social_blocks WHERE blocker=? AND blocked=?',
    )
      .bind(me.handle, target)
      .run();
  return true;
}
export async function postLikeStates(refs: string[], memberId?: string) {
  if (!refs.length)
    return {} as Record<string, { count: number; liked: boolean }>;
  const unique = [...new Set(refs)].slice(0, 100);
  const { results } = await env.DB.prepare(
    `SELECT post_ref AS ref,count(*) AS n,max(CASE WHEN member_id=? THEN 1 ELSE 0 END) AS liked FROM social_likes WHERE post_ref IN (${unique.map(() => '?').join(',')}) GROUP BY post_ref`,
  )
    .bind(memberId ?? '', ...unique)
    .all<{ ref: string; n: number; liked: number }>();
  return Object.fromEntries(
    unique.map((ref) => {
      const r = results.find((row) => row.ref === ref);
      return [ref, { count: r?.n ?? 0, liked: !!r?.liked }];
    }),
  );
}
export async function setLike(memberId: string, ref: string, like: boolean) {
  const post = await getCommunityPost(ref);
  if (!post && !findOfficialPost(ref)) return false;
  if (!(await canInteractWithPost(memberId, ref))) return false;
  if (like)
    await env.DB.prepare(
      'INSERT INTO social_likes(member_id,post_ref,created_at) VALUES(?,?,?) ON CONFLICT DO NOTHING',
    )
      .bind(memberId, ref, Date.now())
      .run();
  else
    await env.DB.prepare(
      'DELETE FROM social_likes WHERE member_id=? AND post_ref=?',
    )
      .bind(memberId, ref)
      .run();
  return true;
}
// Internal authorization only: never publish the author login ID or silently
// join old nicknames into a public profile.
export async function canInteractWithPost(memberId: string, postId: string) {
  return !(await env.DB.prepare(
    `SELECT 1 FROM social_blocks b JOIN social_profiles me ON me.member_id=? JOIN community_posts p ON p.id=? LEFT JOIN social_profiles author ON author.member_id=p.author_id WHERE (b.blocker=me.handle AND b.blocked=COALESCE(p.profile_handle,author.handle)) OR (b.blocked=me.handle AND b.blocker=COALESCE(p.profile_handle,author.handle))`,
  )
    .bind(memberId, postId)
    .first());
}
export async function ownPostCount(memberId: string) {
  const row = await env.DB.prepare(
    'SELECT count(*) AS n FROM community_posts WHERE author_id=? AND deleted_at IS NULL',
  )
    .bind(memberId)
    .first<{ n: number }>();
  return row?.n ?? 0;
}
export type DirectThread = {
  id: string;
  personA: string;
  personB: string;
  initiator: string;
  acceptedAt: number | null;
  createdAt: number;
};
const threadColumns =
  'id,person_a AS personA,person_b AS personB,initiator,accepted_at AS acceptedAt,created_at AS createdAt';
export async function memberThread(memberId: string, id: string) {
  const me = await ownSocialProfile(memberId);
  if (!me) return null;
  const thread = await env.DB.prepare(
    `SELECT ${threadColumns} FROM social_threads WHERE id=? AND (person_a=? OR person_b=?)`,
  )
    .bind(id, me.handle, me.handle)
    .first<DirectThread>();
  if (!thread) return null;
  const otherHandle =
    thread.personA === me.handle ? thread.personB : thread.personA;
  const other = (await publicSocialProfile(otherHandle)) ?? {
    handle: otherHandle,
    name: '非公開のメンバー',
    kind: 'member' as const,
    bio: '',
    avatar: null,
    isPublic: 0,
    dmEnabled: 0,
  };
  return { thread, me, other };
}
export async function listThreads(memberId: string) {
  const { results } = await env.DB.prepare(
    `WITH public_people AS (SELECT ${profileColumns} FROM social_profiles s WHERE ${visible})
    SELECT t.id,t.person_a AS personA,t.person_b AS personB,t.initiator,t.accepted_at AS acceptedAt,t.created_at AS createdAt,
    CASE WHEN t.person_a=me.handle THEN t.person_b ELSE t.person_a END AS otherHandle,
    COALESCE(p.name,'非公開のメンバー') AS otherName,p.avatar AS otherAvatar,COALESCE(p.isPublic,0) AS otherPublic
    FROM social_profiles me JOIN social_threads t ON (t.person_a=me.handle OR t.person_b=me.handle)
    LEFT JOIN public_people p ON p.handle=CASE WHEN t.person_a=me.handle THEN t.person_b ELSE t.person_a END
    WHERE me.member_id=? ORDER BY (SELECT max(created_at) FROM social_messages WHERE thread_id=t.id) DESC,t.id DESC LIMIT 100`,
  )
    .bind(...consent, memberId)
    .all<
      DirectThread & {
        otherHandle: string;
        otherName: string;
        otherAvatar: string | null;
        otherPublic: number;
      }
    >();
  return results.map(
    ({ otherHandle, otherName, otherAvatar, otherPublic, ...thread }) => ({
      ...thread,
      other: {
        handle: otherHandle,
        name: otherName,
        avatar: otherAvatar,
        kind: 'member' as const,
        bio: '',
        isPublic: otherPublic,
        dmEnabled: 0,
      },
    }),
  );
}
export async function threadMessages(
  memberId: string,
  id: string,
  before = Date.now() + 1,
  beforeId = '',
) {
  if (!(await memberThread(memberId, id))) return null;
  const { results } = await env.DB.prepare(
    'SELECT id,sender,body,created_at AS createdAt FROM social_messages WHERE thread_id=? AND (created_at<? OR (created_at=? AND id<?)) ORDER BY created_at DESC,id DESC LIMIT 51',
  )
    .bind(id, before, before, beforeId)
    .all<{ id: string; sender: string; body: string; createdAt: number }>();
  return {
    messages: results.slice(0, 50).reverse(),
    hasMore: results.length > 50,
  };
}
export async function sendDirectMessage(
  memberId: string,
  input: { target: string; body: string; requestId: string },
) {
  const me = await ownSocialProfile(memberId),
    other = await publicSocialProfile(input.target);
  if (
    !me?.isPublic ||
    !other?.dmEnabled ||
    other.kind !== 'member' ||
    me.handle === other.handle ||
    (await blockedPair(me.handle, other.handle))
  )
    return null;
  const prior = await env.DB.prepare(
    'SELECT thread_id AS threadId,body FROM social_messages WHERE sender=? AND request_id=?',
  )
    .bind(me.handle, input.requestId)
    .first<{ threadId: string; body: string }>();
  if (prior) {
    const context = await memberThread(memberId, prior.threadId);
    return context?.other.handle === input.target && prior.body === input.body
      ? prior.threadId
      : null;
  }
  const [a, b] = [me.handle, other.handle].sort(),
    id = crypto.randomUUID(),
    now = Date.now();
  await env.DB.prepare(
    'INSERT INTO social_threads(id,person_a,person_b,initiator,created_at) VALUES(?,?,?,?,?) ON CONFLICT(person_a,person_b) DO NOTHING',
  )
    .bind(id, a, b, me.handle, now)
    .run();
  const t = await env.DB.prepare(
    `SELECT ${threadColumns} FROM social_threads WHERE person_a=? AND person_b=?`,
  )
    .bind(a, b)
    .first<DirectThread>();
  if (!t) return null;
  // One request message until the recipient accepts. Enforced atomically in SQL.
  const result = await env.DB.prepare(
    `INSERT INTO social_messages(id,thread_id,sender,request_id,body,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM social_threads t WHERE t.id=? AND (t.accepted_at IS NOT NULL OR (t.initiator=? AND NOT EXISTS(SELECT 1 FROM social_messages WHERE thread_id=t.id)))) AND (SELECT count(*) FROM social_messages WHERE sender=? AND created_at>?)<100 AND NOT EXISTS(SELECT 1 FROM social_blocks WHERE (blocker=? AND blocked=?) OR (blocker=? AND blocked=?)) AND EXISTS(SELECT 1 FROM social_profiles s WHERE s.handle=? AND s.dm_enabled=1 AND ${visible}) AND EXISTS(SELECT 1 FROM social_profiles s WHERE s.handle=? AND ${visible}) ON CONFLICT(sender,request_id) DO NOTHING`,
  )
    .bind(
      crypto.randomUUID(),
      t.id,
      me.handle,
      input.requestId,
      input.body,
      now,
      t.id,
      me.handle,
      me.handle,
      now - 86400000,
      me.handle,
      other.handle,
      other.handle,
      me.handle,
      other.handle,
      ...consent,
      me.handle,
      ...consent,
    )
    .run();
  return result.meta.changes ? t.id : null;
}
export async function acceptThread(memberId: string, id: string) {
  const c = await memberThread(memberId, id);
  if (
    !c ||
    c.thread.initiator === c.me.handle ||
    !c.me.dmEnabled ||
    !c.me.isPublic ||
    !c.other.isPublic ||
    (await blockedPair(c.me.handle, c.other.handle))
  )
    return false;
  await env.DB.prepare(
    'UPDATE social_threads SET accepted_at=COALESCE(accepted_at,?) WHERE id=?',
  )
    .bind(Date.now(), id)
    .run();
  return true;
}
export async function reportSocial(
  memberId: string,
  type: string,
  id: string,
  reason: string,
) {
  let snapshot: string | undefined;
  if (type === 'post') {
    const p = await getCommunityPost(id);
    if (p) snapshot = p.title + '\n' + p.body;
  }
  if (type === 'profile') {
    const p = await publicSocialProfile(id);
    if (p) snapshot = p.name + '\n' + p.bio;
  }
  if (type === 'message') {
    const m = await env.DB.prepare(
      'SELECT thread_id AS threadId,body,sender FROM social_messages WHERE id=?',
    )
      .bind(id)
      .first<{ threadId: string; body: string; sender: string }>();
    if (m && (await memberThread(memberId, m.threadId)))
      snapshot = m.sender + '\n' + m.body;
  }
  if (!snapshot) return false;
  await env.DB.prepare(
    'INSERT INTO social_reports(id,reporter_id,target_type,target_id,reason,snapshot,created_at) VALUES(?,?,?,?,?,?,?)',
  )
    .bind(crypto.randomUUID(), memberId, type, id, reason, snapshot, Date.now())
    .run();
  return true;
}
export async function listSocialReports() {
  return (
    await env.DB.prepare(
      'SELECT id,target_type AS targetType,target_id AS targetId,reason,snapshot,created_at AS createdAt FROM social_reports WHERE resolved_at IS NULL ORDER BY created_at LIMIT 100',
    ).all<{
      id: string;
      targetType: string;
      targetId: string;
      reason: string;
      snapshot: string;
      createdAt: number;
    }>()
  ).results;
}
export async function resolveSocialReport(id: string, ownerId: string) {
  await env.DB.prepare(
    'UPDATE social_reports SET resolved_at=?,resolved_by=? WHERE id=? AND resolved_at IS NULL',
  )
    .bind(Date.now(), ownerId, id)
    .run();
}
