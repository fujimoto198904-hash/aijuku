// One-time, recoverable consolidation. Never moves secrets, caches or Git metadata.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve, join, dirname, relative } from 'node:path';
const original = '/Users/fujimotoryoushi/Documents/Codex/2026-09-02/aitock';
const old = join(original, 'work/aitock');
const root = resolve(import.meta.dirname, '..');
const archive = join(root, 'archives/aitock-2026-09-05');
const source = join(archive, 'source');
const references = join(root, 'docs/references/aitock');
if (
  !existsSync(join(root, '.openai/hosting.json')) ||
  !existsSync(join(old, '.git'))
)
  throw Error('Expected project locations not found.');
if (existsSync(join(archive, 'SHA256SUMS.json')))
  throw Error(
    'Already consolidated; verify the existing manifest instead of running again.',
  );
const candidates = execFileSync(
  'git',
  ['ls-files', '-z', '--cached', '--others', '--exclude-standard'],
  { cwd: old, encoding: 'utf8' },
)
  .split('\0')
  .filter(Boolean);
const excluded =
  /(^|\/)(\.env(?!\.example$)[^/]*|\.vercel|\.git|node_modules|\.next)(\/|$)|\.tsbuildinfo$/;
const entries = candidates.filter((p) => !excluded.test(p));
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const sourceHashes = entries.map((p) => ({
  path: p,
  sha256: hash(join(old, p)),
}));
const topNames = [...new Set(entries.map((p) => p.split('/')[0]))];
// Refuse to move any directory containing files omitted from the sanitized inventory.
function filesIn(path, prefix = '') {
  return readdirSync(path, { withFileTypes: true }).flatMap((e) => {
    const p = join(path, e.name),
      r = join(prefix, e.name);
    if (e.isSymbolicLink()) throw Error('Unexpected symlink: ' + r);
    return e.isDirectory() ? filesIn(p, r) : [r];
  });
}
const moveNames = topNames.flatMap((name) => {
  const p = join(old, name);
  return lstatSync(p).isDirectory() &&
    filesIn(p).some((child) => !entries.includes(name + '/' + child))
    ? entries.filter((entry) => entry.startsWith(name + '/'))
    : [name];
});
for (const name of moveNames)
  if (existsSync(join(source, name)))
    throw Error('Destination already exists: ' + name);
const extra = [
  { from: join(original, 'outputs'), to: join(references, 'outputs') },
  {
    from: join(original, 'work/supabase-security-design.md'),
    to: join(references, 'supabase-security-design.md'),
  },
];
for (const e of extra)
  if (existsSync(e.to) || lstatSync(e.from).isSymbolicLink())
    throw Error('Reference destination already exists.');
const referenceHashes = extra.flatMap((e) => {
  const paths = lstatSync(e.from).isDirectory() ? filesIn(e.from) : [''];
  return paths.map((p) => ({
    path: relative(root, join(e.to, p)),
    sha256: hash(join(e.from, p)),
  }));
});
if (!process.argv.includes('--apply')) {
  console.log(
    JSON.stringify(
      {
        mode: 'dry-run',
        sourceFiles: entries.length,
        moveEntries: moveNames,
        referenceFiles: referenceHashes.length,
        archive,
      },
      null,
      2,
    ),
  );
  process.exit(0);
}
mkdirSync(source, { recursive: true });
mkdirSync(references, { recursive: true });
const moved = [];
try {
  for (const name of moveNames) {
    const from = join(old, name),
      to = join(source, name);
    mkdirSync(dirname(to), { recursive: true });
    renameSync(from, to);
    moved.push({ from, to });
    symlinkSync(to, from);
  }
  for (const e of extra) {
    mkdirSync(dirname(e.to), { recursive: true });
    renameSync(e.from, e.to);
    moved.push(e);
    symlinkSync(e.to, e.from);
  }
  for (const entry of sourceHashes)
    if (
      hash(join(source, entry.path)) !== entry.sha256 ||
      hash(join(old, entry.path)) !== entry.sha256
    )
      throw Error('Source verification failed: ' + entry.path);
  for (const entry of referenceHashes)
    if (hash(join(root, entry.path)) !== entry.sha256)
      throw Error('Reference verification failed: ' + entry.path);
  writeFileSync(
    join(archive, 'SHA256SUMS.json'),
    JSON.stringify(
      {
        date: '2026-09-05',
        original,
        source: sourceHashes,
        references: referenceHashes,
        moves: moved,
      },
      null,
      2,
    ) + '\n',
    { flag: 'wx' },
  );
  console.log(
    JSON.stringify(
      {
        verified: true,
        sourceFiles: sourceHashes.length,
        referenceFiles: referenceHashes.length,
        archive,
        originalPaths: 'preserved via symlinks',
        secretsAndCaches: 'unchanged',
      },
      null,
      2,
    ),
  );
} catch (e) {
  console.error(
    'Stopped. Preserve both locations; inspect the move list before recovery.',
  );
  console.error(JSON.stringify(moved));
  throw e;
}
