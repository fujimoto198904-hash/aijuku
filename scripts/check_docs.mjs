/**
 * ドキュメントの軽量検査。
 * - Markdownの相対リンク切れ(README.md、AGENTS.md、docs/*.md)
 * - コードフェンス(``` と ~~~)の開閉不整合
 *
 * 実行: node scripts/check_docs.mjs
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'README.md',
  'AGENTS.md',
  ...readdirSync(join(projectRoot, 'docs'))
    .filter((name) => name.endsWith('.md'))
    .map((name) => `docs/${name}`),
];

const failures = [];

for (const target of targets) {
  const text = readFileSync(join(projectRoot, target), 'utf8');
  const lines = text.split('\n');

  // コードフェンスの開閉(``` / ~~~ をそれぞれ数える)
  let backtickFences = 0;
  let tildeFences = 0;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```')) backtickFences += 1;
    else if (trimmed.startsWith('~~~')) tildeFences += 1;
  }
  if (backtickFences % 2 !== 0) {
    failures.push(`${target}: コードフェンス\`\`\`の開閉が合いません(${backtickFences}個)`);
  }
  if (tildeFences % 2 !== 0) {
    failures.push(`${target}: コードフェンス~~~の開閉が合いません(${tildeFences}個)`);
  }

  // 相対リンク(コードフェンス内は除外)
  let inFence = false;
  for (const line of lines) {
    const trimmed = line.trimStart();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    for (const match of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      const href = match[1];
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const withoutAnchor = href.split('#')[0];
      if (!withoutAnchor) continue;
      const base = withoutAnchor.startsWith('/')
        ? join(projectRoot, withoutAnchor)
        : join(projectRoot, dirname(target), withoutAnchor);
      if (!existsSync(base)) {
        failures.push(`${target}: リンク切れ ${href}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error('ドキュメント検査に失敗しました。');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Docs are clean: ${targets.length} files (links + code fences)`);
