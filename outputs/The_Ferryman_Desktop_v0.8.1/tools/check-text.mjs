// Checks src/data/scene-text.json (T-27): every entry is text, every t('key') used in src/ exists,
// and every help heading matches a section of the rules data. Run: node tools/check-text.mjs
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const text = JSON.parse(readFileSync(join(root, 'src/data/scene-text.json'), 'utf8'));
const rules = JSON.parse(readFileSync(join(root, 'rules/content.json'), 'utf8')).rules ?? {};
let failed = 0;
const report = (ok, label) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`); if (!ok) failed++; };

// 1. Every leaf (except _about) is a non-empty string with balanced braces.
const keys = new Set();
const walk = (node, path) => {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('_')) continue;
    const key = path ? `${path}.${k}` : k;
    if (v && typeof v === 'object') walk(v, key);
    else {
      keys.add(key);
      const ok = typeof v === 'string' && v.trim() !== '' && (v.match(/\{/g) ?? []).length === (v.match(/\}/g) ?? []).length;
      if (!ok) report(false, `entry ${key} is not usable text`);
    }
  }
};
walk(text, '');
report(keys.size > 0, `${keys.size} text entries read`);

// 2. Every literal t('...') key in src/ exists.
const files = [];
const collect = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) collect(p);
    else if (p.endsWith('.js')) files.push(p);
  }
};
collect(join(root, 'src'));
let used = 0;
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
    used++;
    if (!keys.has(m[1])) report(false, `${relative(root, file)} uses missing key "${m[1]}"`);
  }
}
report(true, `${used} t('...') uses checked in ${files.length} source files`);

// 3. Help headings and rules sections match both ways.
const headings = Object.keys(text.help?.sections ?? {});
const sections = Object.keys(rules);
const missingHeading = sections.filter((s) => !headings.includes(s));
const unusedHeading = headings.filter((h) => !sections.includes(h));
report(missingHeading.length === 0, `every rules section has a help heading${missingHeading.length ? ': missing ' + missingHeading.join(', ') : ''}`);
report(unusedHeading.length === 0, `every help heading has a rules section${unusedHeading.length ? ': unused ' + unusedHeading.join(', ') : ''}`);

console.log(failed ? `${failed} problem(s)` : 'scene text OK');
process.exit(failed ? 1 : 0);
