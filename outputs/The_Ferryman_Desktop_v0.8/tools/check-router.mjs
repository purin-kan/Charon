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
// Router.dispatch relies on Ferry.transition returning the next state (it throws on an illegal
// action). Check that contract with one legal action from a fresh run.
import { createRequire } from 'node:module';
const Ferry = createRequire(import.meta.url)('../../The_Ferryman_v0.7/engine.js');
const s0 = Ferry.create(1);
const s1 = Ferry.transition(s0, { type: 'BOARD', id: s0.shore[0].id });
Ferry.validate(s1);
const dispatchOk = typeof s1.phase === 'string' && typeof sceneFor(s1) === 'string';
if (!dispatchOk) bad++;
console.log(`${dispatchOk ? 'OK  ' : 'FAIL'} dispatch       BOARD from create(1) -> phase=${s1.phase} -> ${sceneFor(s1)}`);
process.exit(bad ? 1 : 0);
