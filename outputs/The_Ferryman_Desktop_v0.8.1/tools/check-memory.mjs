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
// The engine decides; the view must agree. Error message if the engine refuses, else null.
const engineRefusal = (state, card, target) => {
  try { Ferry.transition(state, playAction(card, target)); return null; } catch (e) { return e.message; }
};

// 1. Outward window before the fork: every card playable; targets match the engine (Calm has none since T-45), Light has none.
const win = withHand(fixture('window'), ['MEM-LIGHT', 'MEM-CALM', 'MEM-FORESIGHT']);
let v = memoryHand(win, Ferry);
check(v.cards.length === 3 && v.counter === 'Memories 3/3', 'window: 3 cards, counter', v.counter);
check(v.cards.every((c) => c.playable), 'window: all playable', v.cards.map((c) => `${c.name}:${c.playable}`).join(' '));
const calm = byType(v, 'MEM-CALM');
const expectedTargets = Ferry.memoryTargets(win, 'MEM-CALM')?.map((x) => x.id) ?? null;
check(expectedTargets === null ? !calm.needsTarget : calm.needsTarget && calm.targets.length === expectedTargets.length, 'window: Calm targets match the engine', expectedTargets ? `${calm.targets.length} targets` : 'no target');
check(!byType(v, 'MEM-LIGHT').needsTarget, 'window: Light takes no target');
check(byType(v, 'MEM-LIGHT').source === 'Mother', 'window: source name from sourceRef', byType(v, 'MEM-LIGHT').source);

// 2. Playing through the view's action reaches the engine and removes the card.
const afterCalm = Ferry.transition(win, playAction(calm, calm.needsTarget ? calm.targets[0] : undefined));
check(afterCalm.hand.length === 2 && !afterCalm.hand.some((m) => m.id === calm.id), 'play Calm: card leaves the hand');
const light = byType(v, 'MEM-LIGHT');
const afterLight = Ferry.transition(win, playAction(light));
check(afterLight.hand.length === 2, 'play Light: no target needed');

// 3. At the fork (after START_CROSSING) and 4. during boarding: each card is playable exactly when the
// engine accepts it, and a refused card shows the engine's reason (the rules decide which moments allow memories).
const agrees = (state, view) => view.cards.every((c) => {
  const refusal = engineRefusal(state, c, c.needsTarget ? c.targets[0] : undefined);
  return refusal === null ? c.playable : !c.playable && c.reason === refusal;
});
const fork = Ferry.transition(win, { type: 'START_CROSSING' });
v = memoryHand(fork, Ferry);
check(agrees(fork, v), 'fork: playable and reasons match the engine', v.cards.map((c) => `${c.name}:${c.playable}`).join(' '));
const forkUsed = Ferry.transition(fork, playAction(byType(v, 'MEM-LIGHT')));
v = memoryHand(forkUsed, Ferry);
check(agrees(forkUsed, v), 'fork after one play: playable and reasons match the engine', v.cards.map((c) => `${c.name}:${c.playable}`).join(' '));

const board = withHand(fixture('boarding'), ['MEM-LIGHT']);
v = memoryHand(board, Ferry);
check(agrees(board, v), 'boarding: playable and reasons match the engine', JSON.stringify(v.cards[0].reason ?? 'playable'));

// 5. Return window: each card is playable exactly when the engine accepts it (the rules may forbid memories on the way back).
const ret = withHand(fixture('return'), ['MEM-LIGHT', 'MEM-CALM']);
v = memoryHand(ret, Ferry);
check(v.cards.every((c) => c.playable === (engineRefusal(ret, c, c.needsTarget ? c.targets[0] : undefined) === null)), 'return: playable matches the engine', v.cards.map((c) => `${c.name}:${c.playable}`).join(' '));

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
