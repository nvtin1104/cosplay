import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const webDir = resolve(fileURLToPath(new URL('..', import.meta.url)));
const mode = process.argv[2];
if (!['build', 'deploy'].includes(mode)) {
  throw new Error('Usage: node scripts/cloudflare.mjs <build|deploy>');
}

const env = { ...process.env, NODE_ENV: 'production' };
const run = (script, args) => {
  const result = spawnSync(process.execPath, [resolve(webDir, script), ...args], {
    cwd: webDir,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
};

run('node_modules/vinext/dist/cli.js', ['build']);

const workerDir = resolve(webDir, 'dist/server');
const workerEntry = resolve(workerDir, 'index.js');
if (!existsSync(workerEntry) || !existsSync(resolve(workerDir, '__vinext_action_owner_manifest.js'))) {
  throw new Error('Vinext did not emit the expected Cloudflare Worker files.');
}

if (mode === 'deploy') run('node_modules/@vinext/cloudflare/dist/cli.js', ['deploy', '--skip-build']);
