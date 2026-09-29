import assert from 'node:assert/strict';

// 空の検査リクエストのみ。実会員・投稿・ファイルは作らない。
const base = process.argv[2]?.replace(/\/$/, '');
if (!base || !/^https?:\/\//.test(base))
  throw new Error('Pass the exact local or public base URL.');
let checks = 0;
for (const path of [
  '/',
  '/about',
  '/discover',
  '/learn',
  '/textbook',
  '/textbook/explore',
  '/textbook/lesson/Lv.05',
  '/textbook/columns',
  '/terms',
  '/privacy',
]) {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert(html.includes('制作実績'), `${path}: portfolio disclosure`);
  assert(
    !/(?:href=["'](?:mailto:|tel:))|info@mon-ai\.jp/.test(html),
    `${path}: no contact details`,
  );
  checks++;
}
for (const path of [
  '/join',
  '/login',
  '/messages',
  '/messages/test',
  '/mypage',
  '/mypage/profile',
  '/account/recover',
  '/admin',
  '/community/new',
]) {
  const response = await fetch(base + path, {
    redirect: 'manual',
    signal: AbortSignal.timeout(30_000),
  });
  assert.equal(response.status, 307, path);
  assert(
    new URL(response.headers.get('location')!, base).pathname.endsWith(
      '/about',
    ),
    path,
  );
  checks++;
}
for (const [method, path] of [
  ['POST', '/api/community'],
  ['POST', '/api/social'],
  ['POST', '/api/community/media'],
  ['POST', '/api/auth/register'],
  ['POST', '/api/auth/login'],
  ['POST', '/api/auth/recover'],
  ['POST', '/api/membership'],
  ['PATCH', '/api/membership'],
  ['POST', '/api/learning'],
  ['PATCH', '/api/lesson-progress'],
  ['POST', '/api/official-automation'],
  ['POST', '/api/admin/social'],
  ['POST', '/api/skills/evidence'],
  ['POST', '/api/applications'],
  ['GET', '/api/auth/google'],
  ['GET', '/api/auth/google/callback'],
  ['GET', '/api/official-automation'],
] as const) {
  for (const cookie of ['', 'aistock_session=invalid-old-session']) {
    const response = await fetch(base + path, {
      method,
      redirect: 'manual',
      headers: { cookie },
      signal: AbortSignal.timeout(30_000),
    });
    assert.equal(response.status, 410, `${method} ${path}`);
    assert.equal((await response.json()).code, 'PORTFOLIO_READ_ONLY', path);
    checks++;
  }
}
console.log(
  `Portfolio HTTP: ${checks} read-only/contact/closure checks passed at ${base}.`,
);
