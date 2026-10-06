import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

const fileEnv = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
const env = {
  ...process.env,
  SITE_URL: process.env.SITE_URL?.trim() || fileEnv.SITE_URL?.trim() || 'https://ttp-cosplay-offline.pages.dev',
};
if (!process.env.npm_execpath) throw new Error('Run this script with npm run deploy.');
const commands = [
  [process.execPath, ['node_modules/astro/bin/astro.mjs', 'build']],
  [process.execPath, ['scripts/verify.mjs']],
  [process.execPath, [process.env.npm_execpath, 'exec', '--yes', '--package=wrangler@4.147.0', '--', 'wrangler', 'pages', 'deploy', 'dist', '--project-name', 'ttp-cosplay-offline', '--branch', 'main', '--commit-dirty=true']],
];

for (const [command, args] of commands) {
  const result = spawnSync(command, args, {
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
