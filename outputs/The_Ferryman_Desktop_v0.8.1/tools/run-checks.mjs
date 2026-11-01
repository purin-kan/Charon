// Runs every check tool: `npm run check`.
// check-engine.mjs and check-router.mjs run first, then every other tools/check-*.mjs in name order.
// To add a check, drop a check-<name>.mjs file in tools/ that exits non-zero on failure;
// no edit to package.json is needed. All checks run even if one fails; the exit code is 1 if any failed.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const toolsDir = dirname(fileURLToPath(import.meta.url));
const first = ['check-engine.mjs', 'check-router.mjs'];
const found = readdirSync(toolsDir).filter((f) => /^check-.+\.mjs$/.test(f));
const order = [...first.filter((f) => found.includes(f)), ...found.filter((f) => !first.includes(f)).sort()];

const results = [];
for (const file of order) {
  console.log(`\n== ${file}`);
  const run = spawnSync(process.execPath, [join(toolsDir, file)], { stdio: 'inherit', cwd: join(toolsDir, '..') });
  results.push({ file, ok: run.status === 0, code: run.status ?? run.signal });
}

console.log('\n== Summary');
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FAIL'} ${r.file}${r.ok ? '' : ` (exit ${r.code})`}`);
const failed = results.filter((r) => !r.ok).length;
console.log(failed ? `${failed} of ${results.length} checks failed` : `All ${results.length} checks passed`);
process.exit(failed ? 1 : 0);
