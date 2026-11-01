// Checks the memory hand view model (T-16) against the real engine. No Phaser needed.
// Run from the desktop folder: node tools/check-memory.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { memoryHand, trimView, playAction } from '../src/components/memory-layout.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const fixture = (name) => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));

// Give a state a hand of character memories with valid provenance (as make-fixtures.mjs does for trim).
const SOURCE = { 'MEM-LIGHT': 'SOUL-MOTHER', 'MEM-FOG': 'SOUL-MASON', 'MEM-CALM': 'SOUL-COOK', 'MEM-FORESIGHT': 'SOUL-POET' };
function withHand(state, types) {
  const s = structuredClone(state);
  const n0 = Number(s.nextMemory);
  s.hand = types.map((type, i) => ({
    id: 'MEMORY-' + (n0 + i), type, sourceRef: { kind: 'character', definitionId: SOURCE[type], instanceId: 'ACTOR-1' },
  }));
  s.nextMemory = String(n0 + types.length);
  Ferry.validate(s);
  return s;
}

let bad = 0;
const check = (ok, label, detail = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};
const byType = (view, type) => view.cards.find((c) => c.type === type);

// 1. Outward window before the fork: every card playable; Calm needs a target, Light does not.
const win = withHand(fixture('window'), ['MEM-LIGHT', 'MEM-CALM', 'MEM-FORESIGHT']);
let v = memoryHand(win, Ferry);
check(v.cards.length === 3 && v.counter === 'Memories 3/3', 'window: 3 cards, counter', v.counter);
check(v.cards.every((c) => c.playable), 'window: all playable', v.cards.map((c) => `${c.name}:${c.playable}`).join(' '));
const calm = byType(v, 'MEM-CALM');
const expectedTargets = Ferry.memoryTargets(win, 'MEM-CALM').map((x) => x.id);
check(calm.needsTarget && calm.targets.length === expectedTargets.length, 'window: Calm targets every shore and boat soul', `${calm.targets.length} targets`);
check(!byType(v, 'MEM-LIGHT').needsTarget, 'window: Light takes no target');
check(byType(v, 'MEM-LIGHT').source === 'Mother', 'window: source name from sourceRef', byType(v, 'MEM-LIGHT').source);

// 2. Playing through the view's action reaches the engine and removes the card.
const afterCalm = Ferry.transition(win, playAction(calm, calm.targets[0]));
check(afterCalm.hand.length === 2 && !afterCalm.hand.some((m) => m.id === calm.id), 'play Calm on a target: card leaves the hand');
const light = byType(v, 'MEM-LIGHT');
const afterLight = Ferry.transition(win, playAction(light));
check(afterLight.hand.length === 2, 'play Light: no target needed');

// 3. After START_CROSSING the hand is locked, with the engine's reason.
const fork = Ferry.transition(win, { type: 'START_CROSSING' });
v = memoryHand(fork, Ferry);
check(v.cards.every((c) => !c.playable) && !v.anyPlayable, 'fork: hand locked after approaching');
check(/before approaching a fork/.test(v.note), 'fork: engine reason shown', JSON.stringify(v.note));

// 4. Boarding: only Boat Space may be played, so Light is refused with the engine's reason.
const board = withHand(fixture('boarding'), ['MEM-LIGHT']);
v = memoryHand(board, Ferry);
check(!v.cards[0].playable && /Only Boat Space/.test(v.cards[0].reason), 'boarding: Light refused', JSON.stringify(v.cards[0].reason));

// 5. Return window: memories can still be played before returning.
const ret = withHand(fixture('return'), ['MEM-LIGHT', 'MEM-CALM']);
v = memoryHand(ret, Ferry);
check(v.cards.every((c) => c.playable), 'return: hand usable before returning');

// 6. Empty hand shows the no-memories line.
v = memoryHand(withHand(fixture('window'), []), Ferry);
check(v.cards.length === 0 && /No memories held/.test(v.note), 'empty hand: note shown');

// 7. Trim: four held, keep three; one discard returns to the window.
const trim = fixture('trim');
const t = trimView(trim, Ferry);
check(t.cards.length === 4 && t.excess === 1 && t.heading === 'Keep up to 3 memories', 'trim: 4 held, 1 excess, heading', t.counter);
v = memoryHand(trim, Ferry);
check(v.cards.every((c) => !c.playable) && /Excess rewards/.test(v.note), 'trim: hand not playable while over the limit');
const trimmed = Ferry.transition(trim, { type: 'DISCARD_MEMORY', id: t.cards[0].id });
check(trimmed.phase === 'window' && trimmed.hand.length === 3, 'trim: one discard returns to the window', `phase ${trimmed.phase}`);

console.log(bad ? `\n${bad} check(s) failed` : '\nAll memory checks passed');
process.exit(bad ? 1 : 0);
