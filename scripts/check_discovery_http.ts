import assert from 'node:assert/strict';
import { textbookCatalog } from '../lib/textbook-catalog';
import { discoveryPath } from '../lib/discovery';

// 読み取りだけのHTTP検査。ブラウザー描画・ログイン操作の検証とは分ける。
// npx tsx scripts/check_discovery_http.ts http://localhost:3101
// npx tsx scripts/check_discovery_http.ts https://mon-ai.jp/aistock
const base = process.argv[2]?.replace(/\/$/, '');
assert(
  base && /^https?:\/\//.test(base),
  'Pass the explicit local or public base URL',
);
let requests = 0;
async function page(path: string) {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, path);
  const html = (await response.text()).replace(/<!--[\s\S]*?-->/g, '');
  assert(!html.includes('Internal Server Error'), path);
  requests++;
  return html;
}
const lessonLinks = (html: string) => [
  ...new Set(
    [...html.matchAll(/href="([^"]*\/textbook\/lesson\/[^"?#]+)"/g)].map(
      (m) => m[1],
    ),
  ),
];
const q = '画像';
const tasks = textbookCatalog.tasks.filter((t) =>
  (t.title + t.outcome + t.tags.join(' ')).includes(q),
);
assert(tasks.length > 12, 'Fixture keyword must exercise multiple pages');
const first = await page(discoveryPath('textbook', q));
const second = await page(discoveryPath('textbook', q, 2));
assert.equal(lessonLinks(first).length, 12);
assert.equal(lessonLinks(second).length, 12);
assert(lessonLinks(second).every((href) => !lessonLinks(first).includes(href)));
assert(first.includes(`${tasks.length}件中 1–12件`));
assert(second.includes(`${tasks.length}件中 13–24件`));
assert(second.includes('page=3'));
const last = await page(discoveryPath('textbook', q, 1000));
assert.equal(lessonLinks(last).length, tasks.length % 12 || 12);
assert(
  last.includes(
    `${tasks.length}件中 ${Math.floor((tasks.length - 1) / 12) * 12 + 1}–${tasks.length}件`,
  ),
);
for (const view of ['textbook', 'posts'] as const) {
  const empty = await page(discoveryPath(view, 'zz_no_matching_fixture_9135'));
  assert(empty.includes('まだ見つかりませんでした'));
}
const following = await page('/community?view=following&kind=question');
assert(following.includes('好きな人の投稿を、ここに。'));
assert(!following.includes('最初の「やってみた」も、困ったことも。'));
assert(following.includes('return_to='));
const textbookFeed = await page('/community?view=textbook&kind=question');
assert(textbookFeed.includes('as-official-post'));
assert(!textbookFeed.includes('class="as-feed-options"'));
const intro = await page('/posts/official-web');
assert(intro.includes('準備から始める'));
assert(lessonLinks(intro).some((href) => href.endsWith('/WEB-01')));
assert(lessonLinks(intro).some((href) => href.endsWith('/WEB-03')));
console.log(
  `Discovery HTTP checks passed: ${requests} read-only routes; pagination, no-results, following guest guidance and textbook preparation. No browser interaction tested.`,
);
