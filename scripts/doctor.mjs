#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const warnings = [];
const details = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(root, path), 'utf8'));
  } catch (error) {
    failures.push(path + ' を読み込めません: ' + error.message);
    return null;
  }
}

function compareVersions(actual, required) {
  const left = actual.split('.').map(Number);
  const right = required.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    if ((left[index] ?? 0) > (right[index] ?? 0)) return 1;
    if ((left[index] ?? 0) < (right[index] ?? 0)) return -1;
  }
  return 0;
}

const requiredNode = '22.13.0';
const actualNode = process.versions.node;
if (compareVersions(actualNode, requiredNode) < 0) {
  failures.push(
    'Node.js ' + requiredNode + ' 以上が必要です（現在: ' + actualNode + '）',
  );
} else {
  details.push('Node.js ' + actualNode);
}

const requiredFiles = [
  '.openai/hosting.json',
  'app/page.tsx',
  'app/reserve/page.tsx',
  'app/mypage/page.tsx',
  'app/level-test/page.tsx',
  'components/level-test.tsx',
  'lib/site-content.ts',
  'public/og.png',
  'public/downloads/toyota-ai-school-start-guide.pdf',
  'AGENTS.md',
  'README.md',
  'docs/HANDOFF.md',
];

for (const path of requiredFiles) {
  if (!existsSync(resolve(root, path))) {
    failures.push('必要なファイルがありません: ' + path);
  }
}

const packageJson = readJson('package.json');
const packageLock = readJson('package-lock.json');
const hosting = readJson('.openai/hosting.json');

if (packageJson && packageLock && packageJson.name !== packageLock.name) {
  failures.push(
    'package.json と package-lock.json のプロジェクト名が一致しません',
  );
}

if (!hosting?.project_id || !hosting.project_id.startsWith('appgprj_')) {
  failures.push('.openai/hosting.json の Sites project_id を確認してください');
} else {
  details.push('Sites公開先の設定あり');
}

if (!existsSync(resolve(root, 'node_modules'))) {
  warnings.push('node_modules がありません。npm ci を実行してください');
} else {
  details.push('npm依存関係をインストール済み');
}

try {
  const branch = execFileSync('git', ['-C', root, 'branch', '--show-current'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  details.push('Gitブランチ: ' + (branch || '(detached HEAD)'));

  const status = execFileSync('git', ['-C', root, 'status', '--short'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  if (status) {
    warnings.push(
      '未コミットの変更があります。公開前に git status を確認してください',
    );
  } else {
    details.push('Git作業ツリーはクリーン');
  }
} catch {
  warnings.push('Git状態を確認できませんでした');
}

console.log('\n藤本実学塾 移行・公開前チェック\n');
for (const detail of details) console.log('  OK  ' + detail);
for (const warning of warnings) console.log('  注意  ' + warning);
for (const failure of failures) console.log('  エラー  ' + failure);

if (failures.length > 0) {
  console.log('\n修正が必要な項目があります。\n');
  process.exit(1);
}

console.log(
  '\n基本設定は正常です。続けて npm run build で本番ビルドを確認できます。\n',
);
