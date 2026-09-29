import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { build } from 'esbuild';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  editorialPhotoCatalog,
  editorialPhotoForPost,
  editorialPhotoPath,
  editorialPhotoTopic,
  type EditorialPhotoPost,
} from '../lib/editorial-photos';
import { officialCharacters } from '../lib/official-characters';

const base: EditorialPhotoPost = {
  id: 'routine-20260909-am-aitock',
  profileHandle: 'aitock',
  profileKind: 'official',
  mediaId: null,
  taskId: 'Lv.01',
  title: 'まずは自分に合う使い方から',
  body: '自分に合う返事を作ってみよう。',
};
assert.ok(editorialPhotoForPost(base));
assert.equal(editorialPhotoForPost({ ...base, id: 'official-email' }), null);
assert.equal(editorialPhotoForPost({ ...base, id: 'official-image' }), null);
assert.equal(editorialPhotoForPost({ ...base, mediaId: 'real-upload' }), null);
assert.equal(editorialPhotoForPost({ ...base, profileHandle: null }), null);
assert.equal(editorialPhotoForPost({ ...base, profileKind: 'member' }), null);
assert.equal(
  editorialPhotoForPost({ ...base, profileKind: 'official_ai' }),
  null,
);
assert.equal(
  editorialPhotoForPost({
    ...base,
    profileKind: 'official_ai',
    profileHandle: 'unknown',
  }),
  null,
);
// A name or ID that looks official never grants a member an editorial image.
assert.equal(
  editorialPhotoForPost({
    ...base,
    profileKind: 'member',
    profileHandle: 'madoka',
  }),
  null,
);
for (const character of officialCharacters) {
  const post = {
    ...base,
    profileKind: 'official_ai',
    profileHandle: character.handle,
    title: character.title,
    body: character.body,
    taskId: character.task,
  };
  assert.ok(editorialPhotoForPost(post), character.handle);
  assert.equal(editorialPhotoForPost(post), editorialPhotoForPost({ ...post }));
}
for (const [taskId, topic] of [
  ['TRV-02', 'travel'],
  ['WEB-06', 'web'],
  ['XLS-01', 'data'],
  ['AGR-01', 'farm'],
] as const) {
  assert.equal(editorialPhotoTopic({ ...base, taskId }), topic);
}
assert.equal(
  editorialPhotoTopic({
    ...base,
    profileHandle: 'ken',
    body: '自己紹介を、家族にも伝わる言葉にして',
  }),
  'work',
);
assert.equal(
  editorialPhotoTopic({ ...base, body: '作業メモの葉の色を記録する' }),
  'farm',
);
const rotation = Array.from(
  { length: 12 },
  (_, i) => editorialPhotoForPost({ ...base, id: `post-${i}` })!.key,
);
assert.ok(new Set(rotation).size >= 2, 'Rotate images across different posts');
for (const [taskId, body, handle, expected] of [
  ['NOV-02', '農園のかかしを主人公に、小説を書く', 'daichi', 'writing'],
  ['NOV-03', '家族旅行の伏線を考える', 'haruka', 'writing'],
  ['MUS-06', '店内BGMを編集する', 'aitock', 'audio'],
  ['POD-05', '旅の話を音声にする', 'haruka', 'audio'],
  ['SLD-06', '画像にせずPowerPointを編集できるように', 'ken', 'data'],
  ['CS-09', '問い合わせ記録を伏字で確認する', 'sota', 'support'],
  ['CS-01', '薬局での問い合わせ対応', 'sota', 'health'],
  ['TRV-04', '旅の予算を見直す', 'haruka', 'travel'],
  ['TRV-03', '家族旅行の予定を立てる', 'haruka', 'family'],
] as const) {
  assert.equal(
    editorialPhotoTopic({ ...base, taskId, body, profileHandle: handle }),
    expected,
    `${taskId}: match the subject, not incidental words or account identity`,
  );
}
const sameSlotPhotos = officialCharacters.map(
  ({ handle }) =>
    editorialPhotoForPost({
      ...base,
      id: `routine-20260913-am-${handle}`,
      profileKind: 'official_ai',
      profileHandle: handle,
      taskId: 'MUS-06',
    })!.key,
);
assert.equal(
  new Set(sameSlotPhotos).size,
  2,
  'Same-slot handles do not cancel in two-photo pools',
);
assert.equal(new Set(editorialPhotoCatalog.map((p) => p.key)).size, 12);
let deliveryBytes = 0;
for (const photo of editorialPhotoCatalog) {
  assert.match(photo.key, /^[a-z0-9-]+$/);
  assert.doesNotMatch(photo.key, /fujimoto|profile|portrait/);
  assert.ok(photo.alt.length > 10);
  for (const compact of [false, true]) {
    const path = editorialPhotoPath(photo, compact);
    assert.match(path, new RegExp(`-${compact ? 480 : 960}\\.webp$`));
    const bytes = readFileSync(`public${path}`);
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    assert.ok(bytes.length > 1000 && bytes.length <= 180000, path);
    // Exif/XMP must not be carried into public delivery files.
    for (let offset = 12; offset + 8 <= bytes.length;) {
      const chunk = bytes.toString('ascii', offset, offset + 4);
      assert.ok(
        chunk !== 'EXIF' && chunk !== 'XMP ',
        `${path}: metadata removed`,
      );
      const size = bytes.readUInt32LE(offset + 4);
      offset += 8 + size + (size % 2);
    }
    deliveryBytes += bytes.length;
  }
}
assert.ok(deliveryBytes < 1200000, 'Keep the reusable library small');

// Render the real photo component, stubbing only the framework image adapter.
// This is a component/HTML check, not browser or device verification.
const bundle = await build({
  stdin: {
    contents: "export * from './components/editorial-photo';",
    resolveDir: process.cwd(),
    loader: 'tsx',
  },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  plugins: [
    {
      name: 'editorial-photo-check',
      setup(plugin) {
        plugin.onResolve({ filter: /^next\/image$/ }, () => ({
          path: 'image',
          namespace: 'photo-check',
        }));
        plugin.onLoad({ filter: /.*/, namespace: 'photo-check' }, () => ({
          contents: `import { createElement } from 'react';
          export default function Image({fill, unoptimized, ...props}) {
            return createElement('img', {...props, 'data-fill': fill, 'data-unoptimized': unoptimized});
          }`,
          loader: 'js',
        }));
        plugin.onResolve({ filter: /^[^./]/ }, ({ path }) => {
          if (path.startsWith('@/') || path.startsWith('next/')) return;
          return { path: import.meta.resolve(path), external: true };
        });
      },
    },
  ],
});
const { EditorialPhotoView, EditorialPhotoImage } = await import(
  'data:text/javascript;base64,' +
    Buffer.from(bundle.outputFiles[0].text).toString('base64')
);
const photo = editorialPhotoForPost(base)!;
const html = renderToStaticMarkup(createElement(EditorialPhotoView, { photo }));
assert.match(html, /<figure[^>]+as-editorial-photo/);
assert.match(html, /loading="lazy"/);
assert.match(html, /decoding="async"/);
assert.match(html, /<picture><source[^>]+480w,[^>]+960w/);
assert.match(html, /data-unoptimized="true"/);
assert.ok(html.includes(editorialPhotoPath(photo)));
assert.ok(html.includes(photo.alt));
assert.match(html, /<figcaption[^>]*>イメージ写真<\/figcaption>/);
const thumbnail = renderToStaticMarkup(
  createElement(EditorialPhotoImage, {
    photo,
    compact: true,
    decorative: true,
  }),
);
assert.ok(thumbnail.includes(editorialPhotoPath(photo, true)));
assert.match(thumbnail, /alt=""/);
assert.doesNotMatch(thumbnail, /960w/);
for (const consumer of [
  'components/community-feed.tsx',
  'app/community/[id]/page.tsx',
  'components/social-profile.tsx',
]) {
  const source = readFileSync(consumer, 'utf8');
  assert.match(source, /editorialPhotoForPost\(/, consumer);
  assert.match(source, /<EditorialPhoto(View|Image)/, consumer);
}
const css = readFileSync('app/aistock.css', 'utf8');
assert.match(
  readFileSync('components/social-profile.tsx', 'utf8'),
  /as-editorial-tile-note.*イメージ写真/,
);
assert.ok(
  /\.as-editorial-photo\s*\{\s*aspect-ratio: 3\s*\/\s*2/.test(css),
  'Reserve photo height before loading',
);
console.log(
  `Editorial photos OK: official-only, stable matching, lazy images, 24 WebP files (${deliveryBytes} bytes)`,
);
