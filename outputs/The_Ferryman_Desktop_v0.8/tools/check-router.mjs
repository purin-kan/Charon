// Checks the phase -> scene mapping against every saved fixture (no Phaser needed).
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { sceneFor } from '../src/phase-map.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const expected = {
  boarding: 'BoardingScene', window: 'CrossingScene', fork: 'CrossingScene', review: 'CrossingScene',
  delivery: 'DeliveryScene', choice: 'ChoiceOverlay', trim: 'TrimOverlay', return: 'ReturnScene',
  'review-return': 'ReturnScene', ended: 'GameOverScene',
};
let bad = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const name = f.replace('.json', '');
  const s = JSON.parse(readFileSync(path.join(dir, f), 'utf8'));
  const got = sceneFor(s);
  const ok = got === expected[name];
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name.padEnd(14)} phase=${s.phase.padEnd(8)} window=${s.window.kind.padEnd(8)} -> ${got}`);
}
process.exit(bad ? 1 : 0);
