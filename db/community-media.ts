import { env } from 'cloudflare:workers';
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
  await env.MEDIA.put(key, image.bytes, {
    httpMetadata: { contentType: 'image/png' },
  });
  try {
    await env.DB.prepare(
      'INSERT INTO community_media(id,member_id,object_key,width,height,byte_size,created_at) VALUES(?,?,?,?,?,?,?)',
    )
      .bind(
        id,
        memberId,
        key,
        image.width,
        image.height,
        image.bytes.length,
        Date.now(),
      )
      .run();
  } catch (e) {
    await env.MEDIA.delete(key);
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
    `SELECT m.id,m.object_key AS objectKey,m.width,m.height FROM community_media m WHERE m.id=? AND (m.member_id=? OR EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=m.id AND p.deleted_at IS NULL))`,
  )
    .bind(id, memberId ?? '')
    .first<PostMedia>();
  return row ? env.MEDIA.get(row.objectKey) : null;
}
export async function cleanUnusedCommunityMedia() {
  const { results } = await env.DB.prepare(
    'SELECT m.id,m.object_key AS objectKey FROM community_media m WHERE m.created_at<? AND NOT EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=m.id) LIMIT 10',
  )
    .bind(Date.now() - 86400000)
    .all<{ id: string; objectKey: string }>();
  // Delete only rows still unreferenced; a concurrently published image must survive.
  for (const row of results) {
    const deleted = await env.DB.prepare(
      'DELETE FROM community_media WHERE id=? AND NOT EXISTS(SELECT 1 FROM community_posts p WHERE p.media_id=community_media.id) RETURNING id',
    )
      .bind(row.id)
      .first();
    if (deleted) await env.MEDIA.delete(row.objectKey);
  }
}
