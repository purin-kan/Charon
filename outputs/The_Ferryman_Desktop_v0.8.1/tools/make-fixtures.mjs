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
  // One soul that leaves with a memory, one that can leave without one, and one the engine refuses.
  'delivery-match': (s) => mixedDelivery(s) && s.boat.some((x) => Ferry.deliveryReason(s, x)),
  choice: (s) => s.phase === 'choice',
  'choice-odysseus': (s) => s.phase === 'choice' && s.choice.kind === 'odysseus',
  trim: (s) => s.phase === 'trim',
  return: (s) => s.phase === 'window' && s.window.kind === 'return',
  'review-return': (s) => s.phase === 'review' && s.window.kind === 'return',
  ended: (s) => s.phase === 'ended',
  // CrossingScene (T-19): a fork where one option puts out the lantern. The other crossing fixtures are scripted below.
  'crossing-lethal': (s) => atFork(s) && [0, 1].some((o) => { const p = Ferry.preview(s, o); return !p.hidden && p.lethal; }),
};

function atFork(s) {
  return s.phase === 'window' && s.window.kind === 'outward' && s.travelPrepared;
}

// Any soul may leave at any stop; only a matching wish gives its memory.
function mixedDelivery(s) {
  if (s.phase !== 'delivery') return false;
  const leaves = (x) => !Ferry.deliveryReason(s, x);
  const memory = (x) => Ferry.data.souls.find((d) => d.id === x.type).memory;
  return s.boat.some((x) => leaves(x) && Ferry.wish(x) === s.destination && memory(x))
    && s.boat.some((x) => leaves(x) && Ferry.wish(x) !== s.destination);
}

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
      // Players drop souls at their wish; dropping everyone everywhere would empty the boat each stop.
      const ids = s.boat.filter((x) => rnd() < 0.9 && Ferry.wish(x) === s.destination).map((x) => x.id);
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
const scripted = ['crossing-prep', 'crossing-concealed', 'crossing-odysseus', 'crossing-heracles'];
let mixedFallback = null; // used when no seed has a refused soul beside the other two
for (let seed = 1; seed <= 400 && Object.keys(found).length < names.length; seed++) {
  const rnd = lcg(seed * 7919);
  let s = Ferry.create(seed);
  for (let step = 0; step < 600 && s.phase !== 'ended'; step++) {
    for (const n of names) if (!found[n] && WANTED[n](s)) found[n] = { seed, step, state: s };
    if (!mixedFallback && mixedDelivery(s)) mixedFallback = { seed, step, state: s };
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

// The random policy never accepts a hero, so Odysseus's choice is scripted: he sails alone and
// the boat takes his wish at the first fork that offers it. After CHOOSE the boat is empty.
function odysseusChoice() {
  for (let seed = 1; seed <= 400; seed++) {
    let s = Ferry.create(seed);
    if (s.heroOffer?.type !== 'SOUL-ODYSSEUS') continue;
    s = Ferry.transition(s, { type: 'ACCEPT_HERO' });
    s = Ferry.transition(s, { type: 'DEPART' });
    for (let step = 0; step < 40 && !['choice', 'ended'].includes(s.phase); step++) {
      if (s.phase === 'delivery') s = Ferry.transition(s, { type: 'DELIVER', ids: [] });
      else if (s.phase === 'review') s = Ferry.transition(s, { type: 'CONFIRM' });
      else if (!s.travelPrepared) s = Ferry.transition(s, { type: 'START_CROSSING' });
      else {
        const option = Math.max(0, s.routes.offers[0].indexOf(Ferry.wish(s.boat[0])));
        s = Ferry.transition(s, { type: 'PLAN', action: { type: 'CROSS', option } });
      }
    }
    if (s.phase === 'choice') return { seed, step: 'scripted', state: s };
  }
  return null;
}
if (!found['choice-odysseus']) found['choice-odysseus'] = odysseusChoice();
// Any soul, Longs included, may leave at any stop, so random play rarely has a refused soul at a dock.
// The fallback adds a calm Long Grasp, which the engine refuses below Anger 2.
function withCalmGrasp({ seed, state }) {
  const s = structuredClone(state);
  const boardingId = s.boat[0]?.boardingId ?? String(BigInt(s.nextBoarding) - 1n);
  s.boat.push({ id: 'ACTOR-' + s.nextActor, type: 'SOUL-PO-DUE', origin: null, wish: Ferry.data.souls.find((d) => d.id === 'SOUL-PO-DUE').wish, anger: 0, boardingId, bornRound: s.round, level: 1, spread: false, exhausted: false });
  s.nextActor = String(BigInt(s.nextActor) + 1n);
  return { seed, step: 'synthetic', state: s };
}
if (!found['delivery-match'] && mixedFallback) found['delivery-match'] = withCalmGrasp(mixedFallback);

// CrossingScene (T-19). Random play delivers too often to keep souls aboard for three rounds, so these
// runs board chosen souls, pick a fork nobody wishes for, and deliver no one until the wanted state.
const wishes = (s) => s.boat.map((x) => Ferry.wish(x));
function keepAboard(s, until) {
  for (let step = 0; step < 60 && s.phase !== 'ended'; step++) {
    if (until(s)) return s;
    if (s.phase === 'delivery') s = Ferry.transition(s, { type: 'DELIVER', ids: [] });
    else if (s.phase === 'review') s = Ferry.transition(s, { type: 'CONFIRM' });
    else if (s.phase !== 'window' || s.window.kind !== 'outward') return null;
    else if (!s.travelPrepared) s = Ferry.transition(s, { type: 'START_CROSSING' });
    else {
      const pair = s.routes.offers[0];
      const avoid = pair.findIndex((d) => !wishes(s).includes(d));
      s = Ferry.transition(s, { type: 'PLAN', action: { type: 'CROSS', option: Math.max(0, avoid) } });
    }
  }
  return null;
}

// Random and scripted play die before the Farmer or Long Veil (third encounter) can show up, so these
// two are synthetic like "trim": an engine state with souls swapped, checked by validate() below.
const soulDef = (type) => Ferry.data.souls.find((d) => d.id === type);
function retype(x, type) {
  x.type = type;
  if (x.origin) x.origin = type;
  x.wish = soulDef(type).wish;
}

// The window before a fork where a Long is due: Farmer and Cook (the shared meal) and an unexhausted
// Priest aboard, two memories held. Built from "window" by swapping types with the shore and arrivals.
function crossingPrep() {
  if (!found.window) return null;
  const s = structuredClone(found.window.state);
  const [a, b] = s.boat;
  const cook = s.shore.find((x) => x.type === 'SOUL-COOK');
  const child = s.shore.find((x) => x.type === 'SOUL-CHILD');
  if (!a || !b || !cook || !child) return null;
  const swap = (list, from, to) => { const i = list.indexOf(from); if (i >= 0) list[i] = to; };
  const types = { a: a.type, b: b.type };
  swap(s.arrivals, 'SOUL-FARMER', types.a);
  retype(a, 'SOUL-FARMER');
  retype(cook, types.b);
  retype(b, 'SOUL-COOK');
  swap(s.arrivals, 'SOUL-PRIEST', 'SOUL-CHILD');
  s.shore = s.shore.filter((x) => x !== child);
  retype(child, 'SOUL-PRIEST');
  s.boat.push({ ...child, anger: 0, boardingId: a.boardingId, exhausted: false });
  s.quests.push({ id: 'QUEST-' + s.nextQuest, definitionId: 'QUEST-MEAL', participants: [a.id, b.id], status: 'active', stage: 'active', sharedRoutes: 0, delivered: [], rewardClaimed: false, rewardType: null, reason: null, cycle: s.cycle, data: {} });
  s.nextQuest = String(Number(s.nextQuest) + 1);
  s.longForks = [s.routes.history.length + 1]; // a Long is due at this fork
  const n0 = Number(s.nextMemory);
  const src = { 'MEM-LIGHT': 'SOUL-MOTHER', 'MEM-FORESIGHT': 'SOUL-POET' };
  s.hand = Object.keys(src).map((type, i) => ({ id: 'MEMORY-' + (n0 + i), type, sourceRef: { kind: 'character', definitionId: src[type], instanceId: 'ACTOR-1' } }));
  s.nextMemory = String(n0 + 2);
  return { seed: found.window.seed, step: 'synthetic', state: s };
}

// Longs arrive from cycle 3, which random play rarely reaches, so these start from the "window" fixture with a
// chosen Long due at the next fork (the only edit); the engine plays the rest.
function withLong(state, type) {
  const s = structuredClone(state);
  s.effects.moly = false;
  s.longForks = [s.routes.history.length + 1];
  s.nextPolong = type;
  return Ferry.transition(s, { type: 'START_CROSSING' });
}

// A fork with one option concealed: Long Veil boards at the fork and hides one option.
function crossingConcealed() {
  if (!found.window) return null;
  const s = withLong(found.window.state, 'SOUL-PO-MUED');
  return Ferry.routeView(s)[0].some((o) => o.hidden) ? { seed: found.window.seed, step: 'synthetic', state: s } : null;
}

// Long Hollow's choice: it boards at a fork, skips its boarding round, then asks for a held memory.
function theftChoice() {
  if (!found.window) return null;
  let s = withLong(found.window.state, 'SOUL-PO-LUEM');
  const n0 = Number(s.nextMemory);
  s.hand = ['MEM-LIGHT', 'MEM-FORESIGHT'].map((type, i) => ({ id: 'MEMORY-' + (n0 + i), type, sourceRef: { kind: 'character', definitionId: type === 'MEM-LIGHT' ? 'SOUL-MOTHER' : 'SOUL-POET', instanceId: 'ACTOR-1' } }));
  s.nextMemory = String(n0 + 2);
  s = keepAboard(s, (x) => x.phase === 'choice' && x.choice.kind === 'memory-loss');
  return s ? { seed: found.window.seed, step: 'synthetic', state: s } : null;
}
if (!found.choice) found.choice = theftChoice();

// The fork that offers a hero's wish. Odysseus sails alone; Heracles takes a shore toll and two souls
// Cerberus can frighten off the boat.
function heroFork(type) {
  for (let seed = 1; seed <= 400; seed++) {
    let s = Ferry.create(seed);
    if (s.heroOffer?.type !== type) continue;
    try {
      if (type === 'SOUL-HERACLES') {
        const [toll, ...others] = s.shore;
        s = Ferry.transition(s, { type: 'ACCEPT_HERO', target: toll.id });
        for (const x of others.slice(0, 2)) s = Ferry.transition(s, { type: 'BOARD', id: x.id });
      } else s = Ferry.transition(s, { type: 'ACCEPT_HERO' });
      s = Ferry.transition(s, { type: 'DEPART' });
    } catch {
      continue;
    }
    const hero = (x) => x.boat.find((a) => a.type === type);
    const frightenable = (x) => type !== 'SOUL-HERACLES' || x.boat.filter((a) => a.origin && !Ferry.isTainted(a)).length >= 2;
    const offered = (x) => x.routes.offers[0].indexOf(Ferry.wish(hero(x)));
    s = keepAboard(s, (x) => atFork(x) && hero(x) && offered(x) >= 0 && !Ferry.preview(x, offered(x)).lethal && frightenable(x));
    if (s) return { seed, step: 'scripted', state: s };
  }
  return null;
}
found['crossing-prep'] = crossingPrep();
found['crossing-concealed'] = crossingConcealed();
found['crossing-odysseus'] = heroFork('SOUL-ODYSSEUS');
found['crossing-heracles'] = heroFork('SOUL-HERACLES');

for (const n of [...names, ...scripted]) {
  if (!found[n]) {
    console.log(`MISSING  ${n}`);
    continue;
  }
  Ferry.validate(found[n].state);
  writeFileSync(path.join(outDir, `${n}.json`), JSON.stringify(found[n].state, null, 2) + '\n');
  console.log(`saved    ${n}.json  (seed ${found[n].seed}, step ${found[n].step})`);
}
