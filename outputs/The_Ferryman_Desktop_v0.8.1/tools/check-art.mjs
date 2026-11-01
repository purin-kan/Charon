// Checks src/asset-names.js: how engine ids find art-pipeline file names. Run: node tools/check-art.mjs
// Fails only on resolver mistakes. Engine ids without a matching handoff file are listed for information.
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fileIdFor, patternName, ALIASES } from '../src/asset-names.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'rules/content.json'), 'utf8'));
let failed = 0;
const report = (ok, label) => { console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`); if (!ok) failed++; };

// 1. Lookup order: exact file, then alias, then pattern.
report(patternName('art', 'SOUL-RED-SOLDIER') === 'sprite-red-soldier', 'SOUL-RED-SOLDIER -> sprite-red-soldier');
report(patternName('art', 'CHAR-CERBERUS') === 'sprite-cerberus', 'CHAR-CERBERUS -> sprite-cerberus');
report(patternName('art', 'MEM-BOAT-SPACE') === 'memory-boat-space', 'MEM-BOAT-SPACE -> memory-boat-space');
report(patternName('backgrounds', 'DEST-STYX') === 'bg-styx', 'DEST-STYX -> bg-styx');
report(patternName('art', 'sprite-boat-horizontal') === null, 'a file id is not rewritten');
report(fileIdFor('art', 'SOUL-MOTHER', ['SOUL-MOTHER', 'sprite-mother']) === 'SOUL-MOTHER', 'an exact file wins over the pattern');
report(fileIdFor('art', 'SOUL-MOTHER', ['sprite-mother']) === 'sprite-mother', 'the pattern is used when no exact file exists');
report(fileIdFor('art', 'SOUL-MOTHER', []) === null, 'no file gives null (letter emblem)');
report(fileIdFor('art', 'sprite-boat-horizontal', new Set(['sprite-boat-horizontal'])) === 'sprite-boat-horizontal', 'a file id loads directly');
ALIASES.art['SOUL-TEST-ALIAS'] = 'sprite-long-mist';
report(fileIdFor('art', 'SOUL-TEST-ALIAS', ['sprite-long-mist', 'sprite-test-alias']) === 'sprite-long-mist', 'an alias wins over the pattern');
delete ALIASES.art['SOUL-TEST-ALIAS'];

// 2. Every alias points at a pattern-style name (no typos like a missing "sprite-").
for (const [kind, table] of Object.entries(ALIASES)) {
  for (const [id, file] of Object.entries(table)) {
    report(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(file), `alias ${kind} ${id} -> ${file} is a lowercase kebab-case file id`);
  }
}

// 3. Information: engine ids against the art handoff v4 file names (issue 11) and the files in assets/.
const HANDOFF = {
  art: ['sprite-mother', 'sprite-child', 'sprite-merchant', 'sprite-poet', 'sprite-cook', 'sprite-mason', 'sprite-keeper',
    'sprite-red-soldier', 'sprite-blue-soldier', 'sprite-messenger', 'sprite-musician', 'sprite-listener', 'sprite-farmer',
    'sprite-blacksmith', 'sprite-priest', 'sprite-priest-exhausted', 'sprite-soldier', 'sprite-traveler',
    'sprite-long-mist', 'sprite-long-hollow', 'sprite-long-burden', 'sprite-long-veil', 'sprite-long-grasp',
    'sprite-heracles', 'sprite-odysseus', 'sprite-cerberus', 'sprite-tiresias', 'sprite-scylla', 'sprite-wraith',
    'sprite-apprentice', 'sprite-old-master', 'sprite-boat-horizontal',
    'memory-last-masterwork', 'memory-last-prayer', 'memory-boat-space', 'memory-shared-harvest', 'memory-golden-apple',
    'memory-nobody', 'memory-all-fog', 'memory-moly', 'memory-soldier-peace'],
  backgrounds: ['bg-haven', 'bg-styx', 'bg-acheron', 'bg-asphodel', 'bg-elysium', 'bg-tartarus', 'bg-starting-shore'],
};
const onDisk = (kind) => {
  try { return readdirSync(join(root, 'assets', kind)).filter((f) => /\.png$/.test(f)).map((f) => f.slice(0, -4)); } catch { return []; }
};
const ids = {
  art: [...data.souls.map((s) => s.id), ...data.memories.map((m) => m.id)],
  backgrounds: data.destinations.map((d) => d.id),
};
for (const kind of ['art', 'backgrounds']) {
  const available = new Set([...HANDOFF[kind], ...onDisk(kind)]);
  const missing = ids[kind].filter((id) => !fileIdFor(kind, id, available));
  console.log(`info ${kind}: ${ids[kind].length - missing.length} of ${ids[kind].length} engine ids have a handoff or assets file`);
  if (missing.length) console.log(`info ${kind}: emblem until art or an alias exists: ${missing.join(', ')}`);
}

console.log(failed ? `${failed} problem(s)` : 'art names OK');
process.exit(failed ? 1 : 0);
