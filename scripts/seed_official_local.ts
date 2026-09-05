import { build } from 'esbuild';
import { Miniflare } from 'miniflare';
import { resolve } from 'node:path';
// Fixed local-only binding; never reads credentials or connects to production.
const mf = new Miniflare({
  modules: true,
  script: 'export default {fetch(){return new Response("seed")}}',
  compatibilityDate: '2026-05-22',
  d1Databases: { DB: '00000000-0000-4000-8000-000000000000' },
  d1Persist: resolve('.wrangler/state/v3/d1'),
});
try {
  const DB = await mf.getD1Database('DB');
  (
    globalThis as typeof globalThis & { localOfficialDB: unknown }
  ).localOfficialDB = DB;
  const output = await build({
    stdin: {
      contents:
        "export {seedOfficialCommunity} from './db/official-community';",
      resolveDir: process.cwd(),
    },
    bundle: true,
    write: false,
    platform: 'node',
    format: 'esm',
    plugins: [
      {
        name: 'local-only',
        setup(p) {
          p.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
            path: 'env',
            namespace: 'local',
          }));
          p.onLoad({ filter: /.*/, namespace: 'local' }, () => ({
            contents: 'export const env={DB:globalThis.localOfficialDB}',
            loader: 'js',
          }));
        },
      },
    ],
  });
  const api = await import(
    'data:text/javascript;base64,' +
      Buffer.from(output.outputFiles[0].contents).toString('base64')
  );
  console.log('Local official demo ready:', await api.seedOfficialCommunity());
} finally {
  await mf.dispose();
}
