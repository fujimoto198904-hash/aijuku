import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  editorialPhotoCatalog,
  editorialPhotoForPost,
  editorialPhotoPath,
} from '../lib/editorial-photos';
import { officialCharacters } from '../lib/official-characters';

// Read-only HTTP checks. Seeded official examples must already exist.
// No browser, cookies, credentials or database mutations are used.
const base = new URL(process.argv[2] || 'http://localhost:3187/');
assert.ok(['http:', 'https:'].includes(base.protocol));
assert.ok(!base.username && !base.password && !base.search && !base.hash);
const root = base.href.replace(/\/$/, '');
async function get(path: string) {
  const response = await fetch(root + path, {
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
  assert.equal(response.status, 200, path);
  return response;
}
const home = await (await get('/')).text();
assert.ok(
  home.includes('data-editorial-photo='),
  'Feed contains rendered editorial photos',
);
let images = 0,
  details = 0,
  profiles = 0;
for (const photo of editorialPhotoCatalog) {
  for (const compact of [false, true]) {
    const path = editorialPhotoPath(photo, compact);
    const response = await get(path);
    assert.match(response.headers.get('content-type') ?? '', /^image\/webp/);
    const actual = Buffer.from(await response.arrayBuffer());
    assert.ok(
      actual.equals(readFileSync(`public${path}`)),
      `${path}: exact image bytes`,
    );
    images++;
  }
}
for (const character of officialCharacters) {
  const profile = await (await get(`/u/${character.handle}`)).text();
  for (const n of [1, 2]) {
    const post = {
      id: `example-${character.handle}-${n}`,
      profileKind: 'official_ai',
      profileHandle: character.handle,
      taskId: character.task,
      title: n === 1 ? character.title : '次に試すなら、このひと工夫。',
      body: character.body,
    };
    const photo = editorialPhotoForPost(post)!;
    const html = await (await get(`/community/${post.id}`)).text();
    assert.ok(html.includes(`data-editorial-photo="${photo.key}"`), post.id);
    assert.ok(
      html.includes(editorialPhotoPath(photo)),
      `${post.id}: full size`,
    );
    assert.ok(
      profile.includes(editorialPhotoPath(photo, true)),
      `${post.id}: matching thumbnail`,
    );
    details++;
  }
  profiles++;
}
console.log(
  JSON.stringify({
    base: root,
    feed: 'ok',
    images,
    details,
    profiles,
    verification: 'HTTP only',
  }),
);
