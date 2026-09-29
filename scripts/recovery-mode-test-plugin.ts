import { readFile } from 'node:fs/promises';
import type { Plugin } from 'esbuild';

// 復元用機能の既存検査は隔離DB内で継続する。本番フラグや環境値は変更しない。
// 現行の受付停止は check_portfolio.ts と HTTP 検査が別に担保する。
export const recoveryModeTestPlugin: Plugin = {
  name: 'recovery-mode-test-only',
  setup(plugin) {
    plugin.onLoad(
      { filter: /[/\\]lib[/\\]site-features\.ts$/ },
      async ({ path }) => ({
        contents: (await readFile(path, 'utf8')).replace(
          'export const portfolioOnly: boolean = true;',
          'export const portfolioOnly: boolean = false;',
        ),
        loader: 'ts',
      }),
    );
  },
};
