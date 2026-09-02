import { spawnSync } from 'node:child_process';

const wranglerExecutable =
  process.platform === 'win32' ? 'wrangler.cmd' : 'wrangler';
const stateDirectory =
  process.env.AIJUKU_D1_STATE_DIR?.trim() || '.wrangler/state';
const sharedArguments = [
  'DB',
  '--local',
  '--config',
  'wrangler.local.jsonc',
  '--persist-to',
  stateDirectory,
];
const commandEnvironment = { ...process.env, CI: 'true' };

function executeJson(command) {
  const result = spawnSync(
    wranglerExecutable,
    ['d1', 'execute', ...sharedArguments, '--json', '--command', command],
    {
      encoding: 'utf8',
      env: commandEnvironment,
    },
  );

  if (result.error || result.status !== 0) {
    if (result.stderr) process.stderr.write(result.stderr);
    console.error(
      `ローカルD1の状態を確認できませんでした${result.error ? `: ${result.error.message}` : '。'}`,
    );
    process.exit(1);
  }

  try {
    return JSON.parse(result.stdout);
  } catch {
    console.error('ローカルD1の確認結果を読み取れませんでした。');
    process.exit(1);
  }
}

function firstNumber(response, key) {
  const value = response?.[0]?.results?.[0]?.[key];
  return typeof value === 'number' ? value : 0;
}

const schemaState = executeJson(`
  SELECT COUNT(*) AS migration_table_count
  FROM sqlite_master
  WHERE type = 'table' AND name = 'd1_migrations';
  SELECT COUNT(*) AS app_table_count
  FROM sqlite_master
  WHERE type = 'table'
    AND name IN ('members', 'applications', 'skill_profiles', 'member_lesson_progress');
`);
const migrationTableCount = firstNumber(schemaState, 'migration_table_count');
const appTableCount = firstNumber(schemaState?.slice(1), 'app_table_count');
const appliedMigrationCount = migrationTableCount
  ? firstNumber(
      executeJson('SELECT COUNT(*) AS applied_count FROM d1_migrations;'),
      'applied_count',
    )
  : 0;

if (appTableCount > 0 && appliedMigrationCount === 0) {
  console.error(`
旧形式のローカルD1を検出したため、自動変更を止めました。
対象: ${stateDirectory}

このフォルダには、マイグレーション履歴なしで作られたローカル試用データがあります。
必要なら .wrangler/state を別名へ退避してから、npm run db:migrate:local を再実行してください。
本番D1には接続しておらず、公開中の会員データには影響しません。
`);
  process.exit(2);
}

const result = spawnSync(
  wranglerExecutable,
  ['d1', 'migrations', 'apply', ...sharedArguments],
  {
    env: commandEnvironment,
    stdio: 'inherit',
  },
);

if (result.error) {
  console.error(
    `ローカルD1の移行を開始できませんでした: ${result.error.message}`,
  );
  process.exit(1);
}

process.exit(result.status ?? 1);
