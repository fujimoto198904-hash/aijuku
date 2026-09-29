import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { editorialPhotoCatalog } from '../lib/editorial-photos';

// Repeatable image delivery optimization only. Supplied originals stay intact;
// no crop, retouch, generated content or metadata is copied into the derivatives.
const target = 'public/brand/editorial';
mkdirSync(target, { recursive: true });
let originalBytes = 0,
  deliveryBytes = 0;
for (const photo of editorialPhotoCatalog) {
  const source = `sozai/${photo.key}.jpg`;
  originalBytes += statSync(source).size;
  for (const width of [480, 960]) {
    const out = `${target}/${photo.key}-${width}.webp`;
    execFileSync(
      'cwebp',
      [
        '-quiet',
        '-q',
        '76',
        '-m',
        '6',
        '-metadata',
        'none',
        '-resize',
        String(width),
        '0',
        source,
        '-o',
        out,
      ],
      { stdio: 'pipe' },
    );
    const bytes = statSync(out).size;
    if (bytes > 180000) throw new Error(`${out}: delivery image is too large`);
    deliveryBytes += bytes;
  }
}
console.log(
  JSON.stringify({
    photos: editorialPhotoCatalog.length,
    derivatives: editorialPhotoCatalog.length * 2,
    originalBytes,
    deliveryBytes,
  }),
);
