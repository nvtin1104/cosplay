import { spawnSync } from 'node:child_process';
const base = process.argv[2] || 'https://ttp.likecactus.com';
const result = spawnSync(process.execPath, ['scripts/verify-seo.mjs', base], { stdio: 'inherit' });
if (result.error) throw result.error;
process.exit(result.status || 0);
