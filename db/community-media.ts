import { env } from 'cloudflare:workers';
import { membershipTermsVersion, privacyPolicyVersion } from '@/db/membership';
import { communityMediaLimits as limits } from '@/lib/community-media-limits';
export class CommunityMediaLimitError extends Error {
  constructor() {
    super('画像の保存上限に達しました。しばらくしてからお試しください。');
  }
}
export type PostMedia = {
  id: string;
  objectKey: string;
  width: number;
  height: number;
};
export async function storeCommunityMedia(
  memberId: string,
  image: { bytes: Uint8Array; width: number; height: number },
) {
  const id = crypto.randomUUID(),
    key = 'community/' + id + '.png';
  if (
    !image.bytes.length ||
    image.bytes.length > limits.maxBytes ||
    image.width > limits.maxEdge ||
    image.height > limits.maxEdge
  )
    throw new Error('画像は500KB以下にしてください。');
  // 同時アップロードも1文で判定・予約する。未使用／削除待ちも容量に含む。
  const reserved =
    await env.DB.prepare(`INSERT INTO community_media(id,member_id,object_key,width,height,byte_size,created_at)
    SELECT ?,?,?,?,?,?,?
    WHERE (SELECT COALESCE(SUM(byte_size),0) FROM community_media WHERE member_id=?)
      + (SELECT COALESCE(SUM(byte_size),0) FROM community_media_deletion_queue WHERE member_id=?) + ? <= ?
    AND (SELECT COALESCE(SUM(byte_size),0) FROM community_media)
      + (SELECT COALESCE(SUM(byte_size),0) FROM community_media_deletion_queue) + ? <= ?
    AND (SELECT COUNT(*) FROM community_media WHERE member_id=? AND created_at>?) < ?
    AND (SELECT COUNT(*) FROM community_media m WHERE member_id=?
      AND NOT EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=m.id)
      AND NOT EXISTS(SELECT 1 FROM social_profiles s WHERE s.avatar_media_id=m.id)) < ? RETURNING id`)
      .bind(
        id,
        memberId,
        key,
        image.width,
        image.height,
        image.bytes.length,
        Date.now(),
        memberId,
        memberId,
        image.bytes.length,
        limits.memberMaxBytes,
        image.bytes.length,
        limits.siteMaxBytes,
        memberId,
        Date.now() - 86400000,
        limits.dailyUploads,
        memberId,
        limits.pendingUploads,
      )
      .first();
  if (!reserved) throw new CommunityMediaLimitError();
  try {
    await env.MEDIA.put(key, image.bytes, {
      httpMetadata: { contentType: 'image/png' },
    });
  } catch (e) {
    // PUTの成否が不明でも追跡情報を残す。復旧後は24時間を待たず回収する。
    try {
      await queueUnusedCommunityMedia(id);
    } catch {
      /* DB障害時は予約行を残し、後で未使用画像として回収する */
    }
    throw e;
  }
  return { id, width: image.width, height: image.height };
}
export async function ownedCommunityMedia(id: string, memberId: string) {
  return !!(await env.DB.prepare(
    'SELECT id FROM community_media WHERE id=? AND member_id=?',
  )
    .bind(id, memberId)
    .first());
}
export async function readCommunityMedia(id: string, memberId?: string) {
  const row = await env.DB.prepare(
    `SELECT m.id,m.object_key AS objectKey,m.width,m.height FROM community_media m WHERE m.id=? AND (m.member_id=? OR EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=m.id AND p.deleted_at IS NULL)
    OR EXISTS(SELECT 1 FROM social_profiles s JOIN members u ON u.id=s.member_id WHERE s.avatar_media_id=m.id AND s.is_public=1 AND u.status='active' AND u.terms_version=? AND u.privacy_version=?))`,
  )
    .bind(id, memberId ?? '', membershipTermsVersion, privacyPolicyVersion)
    .first<PostMedia>();
  return row ? env.MEDIA.get(row.objectKey) : null;
}
async function queueUnusedCommunityMedia(failedId?: string) {
  // 削除待ちへ移す処理と参照元の削除は同じトランザクション。公開済み・アバターは触らない。
  await env.DB.batch([
    env.DB.prepare(`INSERT OR IGNORE INTO community_media_deletion_queue(id,member_id,object_key,byte_size,created_at)
      SELECT m.id,m.member_id,m.object_key,m.byte_size,m.created_at FROM community_media m WHERE ((? IS NULL AND m.created_at<?) OR m.id=?)
      AND NOT EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=m.id)
      AND NOT EXISTS(SELECT 1 FROM social_profiles s WHERE s.avatar_media_id=m.id) LIMIT 10`).bind(
      failedId ?? null,
      Date.now() - 86400000,
      failedId ?? null,
    ),
    env.DB
      .prepare(`DELETE FROM community_media WHERE id IN(SELECT id FROM community_media_deletion_queue)
      AND NOT EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=community_media.id)
      AND NOT EXISTS(SELECT 1 FROM social_profiles s WHERE s.avatar_media_id=community_media.id)`),
  ]);
}
export async function cleanUnusedCommunityMedia() {
  await queueUnusedCommunityMedia();
  const { results } = await env.DB.prepare(
    'SELECT id,object_key AS objectKey FROM community_media_deletion_queue LIMIT 10',
  ).all<{ id: string; objectKey: string }>();
  for (const row of results) {
    try {
      await env.MEDIA.delete(row.objectKey);
      await env.DB.prepare(
        'DELETE FROM community_media_deletion_queue WHERE id=?',
      )
        .bind(row.id)
        .run();
    } catch {
      /* オブジェクト削除に失敗しても追跡情報は残し、次の回収で再試行 */
    }
  }
}
