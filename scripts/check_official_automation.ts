import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';

const mf = new Miniflare({
  modules: true,
  script: 'export default {fetch(){return new Response("test")}}',
  d1Databases: ['DB'],
  compatibilityDate: '2026-05-22',
});
const testGlobal = globalThis as typeof globalThis & {
  editorialTestEnv: Record<string, unknown>;
};
const originalNow = Date.now;
try {
  const DB = await mf.getD1Database('DB');
  for (const name of (await readdir('drizzle'))
    .filter((n) => n.endsWith('.sql'))
    .sort())
    for (const sql of (await readFile(`drizzle/${name}`, 'utf8'))
      .split('--> statement-breakpoint')
      .map((s) => s.trim())
      .filter(Boolean))
      await DB.prepare(sql).run();
  const token = 'a'.repeat(64);
  testGlobal.editorialTestEnv = {
    DB,
    OFFICIAL_POST_AUTOMATION_TOKEN: token,
    OFFICIAL_POST_AUTOMATION_ENABLED: 'true',
  };
  const bundled = await build({
    stdin: {
      contents: `export { GET,POST } from './app/api/official-automation/route'; export * from './lib/official-automation'; export * from './db/official-automation'; export {publishDueOfficialPosts,queueOfficialPost,cancelOfficialPost} from './db/official-community'; export {listCommunityPosts,getCommunityPost} from './db/community';`,
      resolveDir: process.cwd(),
      loader: 'ts',
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    target: 'node22',
    plugins: [
      {
        name: 'isolated-editorial-db',
        setup(plugin) {
          plugin.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
            path: 'env',
            namespace: 'editorial-test',
          }));
          plugin.onLoad({ filter: /.*/, namespace: 'editorial-test' }, () => ({
            contents: 'export const env=globalThis.editorialTestEnv;',
          }));
        },
      },
    ],
  });
  const api = await import(
    'data:text/javascript;base64,' +
      Buffer.from(bundled.outputFiles[0].contents).toString('base64')
  );
  const now = Date.parse('2026-09-09T09:15:00+09:00');
  Date.now = () => now;
  const req = (
    data?: unknown,
    authorization: string | null = `Bearer ${token}`,
  ) =>
    new Request('https://mon-ai.jp/aistock/api/official-automation', {
      method: data ? 'POST' : 'GET',
      headers: {
        ...(authorization ? { authorization } : {}),
        'content-type': 'application/json',
        cookie: 'member=not-a-service-credential',
      },
      ...(data ? { body: JSON.stringify(data) } : {}),
    });
  const payload = {
    slot: '2026-09-09-am',
    posts: api.editorialHandles.map((handle: string, i: number) => ({
      handle,
      body: `${handle}：テスト用の学習ヒント${i}です。実在の投稿として公開しません。`,
      taskId: 'Lv.05',
    })),
  };
  const count = async () =>
    (await DB.prepare(
      "SELECT count(*) AS n FROM community_posts WHERE id LIKE 'routine-%'",
    ).first<{ n: number }>())!.n;
  assert.equal((await api.GET(req(undefined, null))).status, 401);
  assert.equal(
    (await api.POST(req(payload, `Bearer ${'b'.repeat(64)}`))).status,
    401,
  );
  delete testGlobal.editorialTestEnv.OFFICIAL_POST_AUTOMATION_TOKEN;
  assert.equal((await api.POST(req(payload))).status, 401);
  testGlobal.editorialTestEnv.OFFICIAL_POST_AUTOMATION_TOKEN = token;
  testGlobal.editorialTestEnv.OFFICIAL_POST_AUTOMATION_ENABLED = 'false';
  assert.equal((await api.POST(req(payload))).status, 503);
  testGlobal.editorialTestEnv.OFFICIAL_POST_AUTOMATION_ENABLED = 'true';
  const context = await (await api.GET(req())).json();
  assert.equal(context.actorReady, true);
  assert.equal(context.profiles.length, 11);
  assert.equal(context.currentSlot, payload.slot);
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-09T08:59:59+09:00')),
    null,
  );
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-09T09:00:00+09:00')),
    '2026-09-09-am',
  );
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-09T10:59:59+09:00')),
    '2026-09-09-am',
  );
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-09T11:00:00+09:00')),
    null,
  );
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-09T19:00:00+09:00')),
    '2026-09-09-pm',
  );
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-09T21:00:00+09:00')),
    null,
  );
  assert.equal(
    api.editorialSlot(Date.parse('2026-09-10T00:00:00+09:00')),
    null,
  );
  const invalid = [
    { ...payload, posts: [...payload.posts, payload.posts[0]] },
    { ...payload, posts: [payload.posts[0], payload.posts[0]] },
    { ...payload, posts: [{ handle: 'unknown', body: 'テスト' }] },
    { ...payload, posts: [{ handle: 'yu', body: '字'.repeat(1001) }] },
    {
      ...payload,
      posts: [{ handle: 'yu', body: 'テスト', taskId: 'nonexistent' }],
    },
    { ...payload, slot: '2026-02-30-am' },
    {
      ...payload,
      posts: [
        { handle: 'yu', body: '重複' },
        { handle: 'aya', body: '重複' },
      ],
    },
  ];
  for (const p of invalid) assert.equal((await api.POST(req(p))).status, 400);
  assert.equal(
    (await api.POST(req({ ...payload, posts: [], ignored: 'x'.repeat(65536) })))
      .status,
    400,
  );
  assert.equal(
    (await api.POST(req({ ...payload, slot: '2026-09-08-am' }))).status,
    409,
  );
  assert.equal(
    (await api.POST(req({ ...payload, slot: '2026-09-09-pm' }))).status,
    409,
  );
  assert.equal((await api.POST(req({ ...payload, dryRun: true }))).status, 200);
  assert.equal(await count(), 0);
  await DB.prepare(
    "UPDATE social_profiles SET kind='member' WHERE handle='yu'",
  ).run();
  assert.equal((await api.POST(req(payload))).status, 409);
  await DB.prepare(
    "UPDATE social_profiles SET kind='official_ai' WHERE handle='yu'",
  ).run();
  await DB.prepare("UPDATE members SET status='withdrawn' WHERE id=?")
    .bind(api.editorialActor)
    .run();
  assert.equal((await api.POST(req(payload))).status, 409);
  await DB.prepare("UPDATE members SET status='active' WHERE id=?")
    .bind(api.editorialActor)
    .run();
  // Unrelated hand-reviewed queue must remain unpublished by this batch.
  await api.queueOfficialPost({
    handle: 'aitock',
    title: '手動',
    body: '手動で確認した別の投稿',
    taskId: null,
    publishAfter: now - 1,
    ownerId: api.editorialActor,
    requestId: 'manual-not-part-of-routine',
  });
  const both = await Promise.all([
    api.POST(req(payload)),
    api.POST(req(payload)),
  ]);
  for (const response of both) assert.equal(response.status, 200);
  const receipts = (await Promise.all(both.map((r: Response) => r.json()))) as {
    inserted: number;
  }[];
  assert.equal(
    receipts.reduce((n, r) => n + r.inserted, 0),
    11,
  );
  assert.equal(await count(), 11);
  assert.equal(
    (await DB.prepare('SELECT published_at AS p FROM official_queue WHERE id=?')
      .bind('manual-not-part-of-routine')
      .first())!.p,
    null,
  );
  assert.equal((await (await api.POST(req(payload))).json()).inserted, 0);
  const changed = {
    ...payload,
    posts: payload.posts.map((p: { body: string }, i: number) =>
      i ? p : { ...p, body: '本文を差し替えた再試行' },
    ),
  };
  assert.equal((await api.POST(req(changed))).status, 409);
  const feed = await api.listCommunityPosts();
  assert.equal(
    feed.posts.filter((p: { id: string }) => p.id.startsWith('routine-'))
      .length,
    11,
  );
  assert.equal(
    (await api.getCommunityPost('routine-20260909-am-yu')).profileKind,
    'official_ai',
  );
  const retry = api.parseEditorialBatch(payload);
  await DB.prepare('UPDATE community_posts SET deleted_at=? WHERE id=?')
    .bind(now, retry.posts[0].id)
    .run();
  assert.equal((await api.POST(req(payload))).status, 409);
  assert.equal((await api.editorialReceipts(retry))[0].status, 'removed');
  await DB.prepare(
    "UPDATE social_profiles SET is_public=0 WHERE handle='madoka'",
  ).run();
  assert.equal((await api.POST(req(payload))).status, 409);
  await DB.prepare(
    "UPDATE social_profiles SET is_public=1 WHERE handle='madoka'",
  ).run();
  // New PM payload cannot duplicate the previous batch; includes deleted posts.
  Date.now = () => Date.parse('2026-09-09T19:15:00+09:00');
  assert.equal(
    (await api.POST(req({ ...payload, slot: '2026-09-09-pm' }))).status,
    409,
  );
  const pm = {
    slot: '2026-09-09-pm',
    posts: [{ handle: 'yu', body: '夜の新しいテストです。' }],
  };
  const parsedPm = api.parseEditorialBatch(pm);
  await api.queueOfficialPost({
    ...parsedPm.posts[0],
    publishAfter: parsedPm.publishAfter,
    ownerId: api.editorialActor,
    requestId: parsedPm.posts[0].id,
  });
  await api.cancelOfficialPost(parsedPm.posts[0].id);
  const cancelled = await (await api.POST(req(pm))).json();
  assert.equal(cancelled.inserted, 0);
  assert.equal(cancelled.receipts[0].status, 'cancelled');
  // Manual runner does not release routine rows, even when due and uncancelled.
  const pendingPm = api.parseEditorialBatch({
    ...pm,
    posts: [{ handle: 'aya', body: '保留中の公式AIテスト' }],
  });
  await api.queueOfficialPost({
    ...pendingPm.posts[0],
    publishAfter: pendingPm.publishAfter,
    ownerId: api.editorialActor,
    requestId: pendingPm.posts[0].id,
  });
  assert.equal(await api.publishDueOfficialPosts(), 1);
  assert.equal(await api.getCommunityPost(pendingPm.posts[0].id), null);
  assert.equal(await api.publishDueOfficialPosts(), 0);
  assert.equal(await count(), 11);
  // A cancelled row plus new rows is a partial success, not a reason to repost.
  const partial = {
    ...pm,
    posts: [
      ...pm.posts,
      { handle: 'riko', body: 'りこの夜の新しい学習ヒントです。' },
    ],
  };
  const partialResponse = await api.POST(req(partial));
  assert.equal(partialResponse.status, 409);
  const partialResult = await partialResponse.json();
  assert.equal(partialResult.inserted, 1);
  assert.equal(partialResult.complete, false);
  assert.deepEqual(
    partialResult.receipts.map((r: { status: string }) => r.status),
    ['cancelled', 'published'],
  );
  assert.equal((await (await api.POST(req(partial))).json()).inserted, 0);
  // A simultaneous different-body retry never publishes two versions.
  const first = {
    slot: pm.slot,
    posts: [{ handle: 'haruka', body: '旅行の予定を比べるテストA' }],
  };
  const second = {
    slot: pm.slot,
    posts: [{ handle: 'haruka', body: '旅行の予定を比べるテストB' }],
  };
  const racing = await Promise.all([
    api.POST(req(first)),
    api.POST(req(second)),
  ]);
  assert.deepEqual(
    racing.map((r: Response) => r.status).sort((a, b) => a - b),
    [200, 409],
  );
  assert.equal(await count(), 13);
  console.log(
    'Official automation: auth, windows, 11-post limit, atomic retries, deduplication, cancellation, moderation and feed checks passed (isolated D1 only).',
  );
} finally {
  Date.now = originalNow;
  await mf.dispose();
}
