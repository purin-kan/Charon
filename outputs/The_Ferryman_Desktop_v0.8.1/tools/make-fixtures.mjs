// Drives seeded games with a random legal-action policy and saves the first
// state seen per phase into src/dev/fixtures/<name>.json. Run: npm run fixtures
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const Ferry = require('../rules/engine.js'); // under Node it reads content.json itself
const outDir = path.join(here, '..', 'src', 'dev', 'fixtures');
mkdirSync(outDir, { recursive: true });

// Fixture name -> predicate. "return" is the window/review of kind return.
const WANTED = {
  boarding: (s) => s.phase === 'boarding',
  'boarding-heracles': (s) => s.phase === 'boarding' && s.heroOffer?.type === 'SOUL-HERACLES' && !s.heroOffer.resolved && s.shore.length > 3,
  window: (s) => s.phase === 'window' && s.window.kind === 'outward' && !s.travelPrepared,
  fork: (s) => s.phase === 'window' && s.window.kind === 'outward' && s.travelPrepared,
  review: (s) => s.phase === 'review' && s.window.kind === 'outward',
  delivery: (s) => s.phase === 'delivery',
  choice: (s) => s.phase === 'choice',
  trim: (s) => s.phase === 'trim',
  return: (s) => s.phase === 'window' && s.window.kind === 'return',
  'review-return': (s) => s.phase === 'review' && s.window.kind === 'return',
  ended: (s) => s.phase === 'ended',
};

function lcg(seed) {
  let x = seed >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
}

function candidates(s, rnd) {
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  switch (s.phase) {
    case 'boarding': {
      const out = [];
      if (s.heroOffer && !s.heroOffer.resolved) out.push({ type: 'DECLINE_HERO' });
      for (const x of s.shore) out.push({ type: 'BOARD', id: x.id });
      if (s.selected.length || s.boat.length) out.push({ type: 'DEPART' }, { type: 'DEPART' });
      return out;
    }
    case 'window': {
      if (s.window.kind === 'return') return [{ type: 'PLAN', action: { type: 'RETURN' } }];
      if (!s.travelPrepared) return [{ type: 'START_CROSSING' }];
      return [{ type: 'PLAN', action: { type: 'CROSS', option: pick([0, 1]) } }];
    }
    case 'review':
      return [{ type: 'CONFIRM' }];
    case 'delivery': {
      const ids = s.boat.filter(() => rnd() < 0.9).map((x) => x.id);
      return [{ type: 'DELIVER', ids }, { type: 'DELIVER', ids: [] }];
    }
    case 'choice':
      return s.choice.kind === 'memory-loss'
        ? s.hand.map((m) => ({ type: 'CHOOSE', id: m.id }))
        : [{ type: 'CHOOSE', branch: pick(['charybdis', 'zilla']) }];
    case 'trim':
      return s.hand.map((m) => ({ type: 'DISCARD_MEMORY', id: m.id }));
    default:
      return [];
  }
}

const found = {};
const names = Object.keys(WANTED);
for (let seed = 1; seed <= 400 && Object.keys(found).length < names.length; seed++) {
  const rnd = lcg(seed * 7919);
  let s = Ferry.create(seed);
  for (let step = 0; step < 600 && s.phase !== 'ended'; step++) {
    for (const n of names) if (!found[n] && WANTED[n](s)) found[n] = { seed, step, state: s };
    const list = candidates(s, rnd);
    let moved = false;
    while (list.length && !moved) {
      const a = list.splice(Math.floor(rnd() * list.length), 1)[0];
      try {
        s = Ferry.transition(s, a);
        moved = true;
      } catch {
        /* illegal, try another */
      }
    }
    if (!moved) break;
  }
  if (!found.ended && WANTED.ended(s)) found.ended = { seed, step: -1, state: s };
}

// Random play rarely reaches the hand limit, so "trim" is the window fixture with an
// overfull hand (4 memories with valid character provenance). validate() still passes.
if (!found.trim && found.window) {
  const s = structuredClone(found.window.state);
  const n0 = Number(s.nextMemory);
  const src = { 'MEM-LIGHT': 'SOUL-MOTHER', 'MEM-FOG': 'SOUL-MASON', 'MEM-CALM': 'SOUL-COOK', 'MEM-FORESIGHT': 'SOUL-POET' };
  s.hand = Object.keys(src).map((type, i) => ({
    id: 'MEMORY-' + (n0 + i),
    type,
    sourceRef: { kind: 'character', definitionId: src[type], instanceId: 'ACTOR-1' },
  }));
  s.nextMemory = String(n0 + 4);
  s.phase = 'trim';
  s.trimNext = 'same-window';
  found.trim = { seed: found.window.seed, step: 'synthetic', state: s };
}

for (const n of names) {
  if (!found[n]) {
    console.log(`MISSING  ${n}`);
    continue;
  }
  Ferry.validate(found[n].state);
  writeFileSync(path.join(outDir, `${n}.json`), JSON.stringify(found[n].state, null, 2) + '\n');
  console.log(`saved    ${n}.json  (seed ${found[n].seed}, step ${found[n].step})`);
}
