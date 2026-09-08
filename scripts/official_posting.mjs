import { execFileSync } from 'node:child_process';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Fixed origin; redirects must never carry the editorial credential elsewhere.
const endpoint = 'https://mon-ai.jp/aistock/api/official-automation';
const service = 'mon-ai.aistock.official-posts';
const account = 'codex-automation';
const [command, file] = process.argv.slice(2);
if (
  !['context', 'validate', 'publish'].includes(command) ||
  (command !== 'context' && !file)
) {
  console.error(
    '使い方: node scripts/official_posting.mjs context | validate <JSONファイル> | publish <JSONファイル>',
  );
  process.exit(1);
}
let token;
try {
  token = execFileSync(
    '/usr/bin/security',
    ['find-generic-password', '-s', service, '-a', account, '-w'],
    {
      encoding: 'utf8',
      timeout: 15000,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  ).trim();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error();
} catch {
  console.error(
    '公式投稿の専用キーをKeychainから取得できません。自動ログイン等で代替せず、運営者に確認してください。',
  );
  process.exit(1);
}
try {
  let body;
  if (file) {
    if (statSync(file).size > 65536)
      throw new Error('JSONファイルは64KBまでです。');
    const payload = JSON.parse(readFileSync(file, 'utf8'));
    body = JSON.stringify({ ...payload, dryRun: command === 'validate' });
  }
  const response = await fetch(endpoint, {
    method: command === 'context' ? 'GET' : 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body,
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
  });
  const result = await response.json();
  const receipt = {
    checkedAt: new Date().toISOString(),
    operation: command,
    httpStatus: response.status,
    ...result,
  };
  // Public payload receipts only. Never store headers, cookies or credentials.
  if (file)
    writeFileSync(
      `${resolve(file)}.${command}.receipt.json`,
      `${JSON.stringify(receipt, null, 2)}\n`,
      { mode: 0o600 },
    );
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
  if (!response.ok || (command === 'publish' && result.complete !== true))
    process.exitCode = 1;
} catch {
  console.error(
    '投稿結果を確認できませんでした。contextで履歴を確認し、同じ投稿枠の本文を変えずに再確認してください。自動再送はしていません。',
  );
  process.exitCode = 1;
}
