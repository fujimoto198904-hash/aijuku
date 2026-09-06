import { env } from 'cloudflare:workers';
import { membershipTermsVersion, privacyPolicyVersion } from '@/db/membership';
import { getCommunityPost } from '@/db/community';
import { findOfficialPost } from '@/lib/official-posts';
import {
  avatarMediaId,
  publicUserId,
  ProfileInputError,
} from '@/lib/public-profile';
import { publicNickname } from '@/lib/community';
import { ownedCommunityMedia } from '@/db/community-media';

export type SocialProfile = {
  handle: string;
  publicId?: string | null;
  revision?: number;
  name: string;
  bio: string;
  kind: 'member' | 'official' | 'official_ai';
  avatar: string | null;
  isPublic: number;
  dmEnabled: number;
};
const profileColumns =
  "s.handle,s.public_id AS publicId,s.revision,s.name,s.bio,s.kind,COALESCE('media:'||s.avatar_media_id,s.avatar) AS avatar,s.is_public AS isPublic,s.dm_enabled AS dmEnabled";
const visible = `s.is_public=1 AND (s.member_id IS NULL OR EXISTS(SELECT 1 FROM members m WHERE m.id=s.member_id AND m.status='active' AND m.terms_version=? AND m.privacy_version=?))`;
const consent = [membershipTermsVersion, privacyPolicyVersion];
export const socialHandleValid = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{2,48}$/.test(value);

export async function resolveSocialHandle(id: string) {
  if (!socialHandleValid(id)) return null;
  const row = await env.DB.prepare(
    'SELECT handle FROM social_profiles WHERE handle=? UNION ALL SELECT profile_handle AS handle FROM social_public_ids WHERE id=? LIMIT 1',
  )
    .bind(id, id)
    .first<{ handle: string }>();
  return row?.handle ?? null;
}

export async function publicIdAvailable(id: string, memberId?: string) {
  if (!publicUserId(id)) return false;
  return !(await env.DB.prepare(`SELECT 1 FROM social_profiles WHERE handle=? AND (member_id IS NULL OR member_id<>?)
    UNION ALL SELECT 1 FROM social_public_ids i JOIN social_profiles s ON s.handle=i.profile_handle WHERE i.id=? AND (s.member_id IS NULL OR s.member_id<>?) LIMIT 1`)
    .bind(id, memberId ?? '', id, memberId ?? '')
    .first());
}
export async function ownSocialProfile(memberId: string) {
  return env.DB.prepare(
    `SELECT ${profileColumns} FROM social_profiles s WHERE member_id=?`,
  )
    .bind(memberId)
    .first<SocialProfile>();
}
export async function publicSocialProfile(handle: string) {
  if (!socialHandleValid(handle)) return null;
  const resolved = await resolveSocialHandle(handle);
  if (!resolved) return null;
  return env.DB.prepare(
    `SELECT ${profileColumns} FROM social_profiles s WHERE handle=? AND ${visible}`,
  )
    .bind(resolved, ...consent)
    .first<SocialProfile>();
}
export async function searchSocialProfiles(query = '', page = 1) {
  const { results } = await env.DB.prepare(
    `SELECT ${profileColumns} FROM social_profiles s WHERE ${visible} AND (instr(lower(name),lower(?))>0 OR instr(lower(bio),lower(?))>0 OR instr(COALESCE(public_id,handle),lower(?))>0) ORDER BY kind,name,handle LIMIT 21 OFFSET ?`,
  )
    .bind(...consent, query, query, query.replace(/^@/, ''), (page - 1) * 20)
    .all<SocialProfile>();
  return { profiles: results.slice(0, 20), hasMore: results.length > 20 };
}
export async function saveSocialProfile(
  memberId: string,
  input: {
    name: string;
    bio: string;
    isPublic: boolean;
    dmEnabled: boolean;
    publicId?: string;
    expectedRevision?: number;
    avatarMediaId?: string | null;
  },
) {
  const current = await ownSocialProfile(memberId);
  if (current && current.kind !== 'member')
    throw new ProfileInputError('このプロフィールは変更できません。', 403);
  const name = publicNickname(input.name, false);
  if (!name || input.bio.length > 300)
    throw new ProfileInputError(
      '表示名は30文字、自己紹介は300文字までです。',
      400,
    );
  const expected = input.expectedRevision ?? current?.revision ?? 0;
  if (expected !== (current?.revision ?? 0))
    throw new ProfileInputError(
      '別の画面で変更されています。ページを開き直してください。',
    );
  const publicId =
    input.publicId === undefined
      ? (current?.publicId ?? null)
      : publicUserId(input.publicId);
  if (
    input.publicId !== undefined &&
    (!publicId || !(await publicIdAvailable(publicId, memberId)))
  )
    throw new ProfileInputError(
      'このユーザーIDは使えません。別のIDをお試しください。',
    );
  const mediaId =
    input.avatarMediaId === undefined
      ? avatarMediaId(current?.avatar)
      : input.avatarMediaId;
  if (mediaId && !(await ownedCommunityMedia(mediaId, memberId)))
    throw new ProfileInputError('自分で選んだ写真を指定してください。', 400);
  const handle = current?.handle ?? 'profile-' + crypto.randomUUID();
  const statements = [
    env.DB.prepare(
      'INSERT INTO social_profiles(handle,member_id,name,created_at) VALUES(?,?,?,?) ON CONFLICT(member_id) DO NOTHING',
    ).bind(handle, memberId, name, Date.now()),
  ];
  if (publicId)
    statements.push(
      env.DB.prepare(`INSERT INTO social_public_ids(id,profile_handle,created_at)
    SELECT ?,handle,? FROM social_profiles WHERE member_id=? AND revision=? AND kind='member'
    ON CONFLICT(id) DO UPDATE SET profile_handle=CASE WHEN social_public_ids.profile_handle=excluded.profile_handle THEN excluded.profile_handle ELSE NULL END`).bind(
        publicId,
        Date.now(),
        memberId,
        expected,
      ),
    );
  const updateIndex = statements.length;
  statements.push(
    env.DB.prepare(`UPDATE social_profiles SET name=?,bio=?,public_id=?,avatar_media_id=?,is_public=?,dm_enabled=?,revision=revision+1
    WHERE member_id=? AND revision=? AND kind='member'`).bind(
      name,
      input.bio,
      publicId,
      mediaId,
      +input.isPublic,
      +(input.isPublic && input.dmEnabled),
      memberId,
      expected,
    ),
  );
  statements.push(
    env.DB.prepare(`UPDATE members SET display_name=?,updated_at=? WHERE id=? AND status='active'
    AND EXISTS(SELECT 1 FROM social_profiles WHERE member_id=? AND revision=? AND name=? AND public_id IS ?)`).bind(
      name,
      Date.now(),
      memberId,
      memberId,
      expected + 1,
      name,
      publicId,
    ),
  );
  // Return the same transaction's snapshot, never a newer revision from another tab.
  statements.push(
    env.DB.prepare(
      `SELECT ${profileColumns} FROM social_profiles s WHERE s.member_id=?`,
    ).bind(memberId),
  );
  try {
    const results = await env.DB.batch(statements);
    if (results[updateIndex].meta.changes !== 1)
      throw new ProfileInputError(
        '別の画面で変更されています。ページを開き直してください。',
      );
    return results[results.length - 1].results[0] as SocialProfile;
  } catch (e) {
    if (/UNIQUE|NOT NULL|reserved_public_id/.test(String(e)))
      throw new ProfileInputError(
        'このユーザーIDは使われています。別のIDをお試しください。',
      );
    throw e;
  }
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
  target = (await resolveSocialHandle(target)) ?? target;
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
  target = (await resolveSocialHandle(target)) ?? target;
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
  target = (await resolveSocialHandle(target)) ?? target;
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
    COALESCE(p.name,'非公開のメンバー') AS otherName,p.publicId AS otherPublicId,p.avatar AS otherAvatar,COALESCE(p.isPublic,0) AS otherPublic
    FROM social_profiles me JOIN social_threads t ON (t.person_a=me.handle OR t.person_b=me.handle)
    LEFT JOIN public_people p ON p.handle=CASE WHEN t.person_a=me.handle THEN t.person_b ELSE t.person_a END
    WHERE me.member_id=? ORDER BY (SELECT max(created_at) FROM social_messages WHERE thread_id=t.id) DESC,t.id DESC LIMIT 100`,
  )
    .bind(...consent, memberId)
    .all<
      DirectThread & {
        otherHandle: string;
        otherName: string;
        otherPublicId: string | null;
        otherAvatar: string | null;
        otherPublic: number;
      }
    >();
  return results.map(
    ({
      otherHandle,
      otherName,
      otherPublicId,
      otherAvatar,
      otherPublic,
      ...thread
    }) => ({
      ...thread,
      other: {
        handle: otherHandle,
        publicId: otherPublicId,
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
    return context?.other.handle === other.handle && prior.body === input.body
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
    if (p) {
      snapshot = p.name + '\n' + p.bio;
      id = p.handle;
    }
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
