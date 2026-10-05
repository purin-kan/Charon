'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const game = require('../engine.js');
const root = path.resolve(__dirname, '..');
const records = [];
const destination = name => 'DEST-' + name;
const soulId = name => 'SOUL-' + name;
const act = (state, type, extra = {}) => game.transition(state, {type, ...extra});
const route = (state, names = ['HAVEN', 'STYX']) => act(state, 'APPEND_ROUTES', {offers: [names.map(destination)]});
function board(names = ['CHILD'], round = '0') {
  let state = game.create(42);
  state.round = round;
  state.nextPolong = (BigInt(round) / 3n + 1n).toString();
  for (const name of names) {
    const id = soulId(name);
    if (!state.shore.some(soul => soul.id === id)) {
      const replaced = state.shore.pop();
      state.arrivals = state.arrivals.filter(item => item !== id);
      state.arrivals.push(replaced.id);
      state.shore.push({id, type: id, anger: 0});
    }
    state = act(state, 'BOARD', {id});
  }
  state = route(state);
  return act(state, 'DEPART');
}
function give(state, type, source) {
  state.hand.push({id: 'MEMORY-' + state.nextMemory, type: 'MEM-' + type, source: source === 'QUEST-FAMILY' ? source : soulId(source)});
  state.nextMemory = (BigInt(state.nextMemory) + 1n).toString();
  return state.hand.at(-1).id;
}
function polong(state, anger = 2) {
  const id = 'POLONG-' + (BigInt(state.nextPolong) - 1n);
  state.boat.push({id, type: soulId('POLONG'), anger});
  return id;
}
function check(name, run) {
  try { const detail = run(); records.push({name, status: 'PASS', ...(detail || {})}); }
  catch (error) { records.push({name, status: 'FAIL', error: error.stack}); }
}
check('setup, source roster, reversible boarding and Soldier seats', () => {
  const state = game.create();
  assert.equal(state.light, 6);
  assert.equal(state.shore.length, 5);
  assert.equal(state.arrivals.length, 3);
  let selected = act(state, 'BOARD', {id: soulId('MOTHER')});
  selected = act(selected, 'BOARD', {id: soulId('MOTHER')});
  assert.deepEqual(selected.selected, []);
  const soldier = board(['SOLDIER', 'CHILD', 'MOTHER']);
  assert.equal(game.seats(soldier), 4);
});
check('missing facilitator offers are transactional; no secret default', () => {
  let state = act(game.create(), 'BOARD', {id: soulId('CHILD')});
  const before = game.exportSave(state);
  assert.throws(() => act(state, 'DEPART'), /Facilitator/);
  assert.equal(game.exportSave(state), before);
  assert.throws(() => act(state, 'APPEND_ROUTES', {offers: [['DEST-HAVEN', 'bogus']]}));
});
check('crossing zero Light stops before last-chance delivery and rewards', () => {
  let state = board(['MERCHANT']);
  state.light = 1;
  state = act(state, 'CROSS', {destination: destination('STYX')});
  assert.equal(state.phase, 'ended');
  assert.equal(state.deliveries, '0');
  assert.equal(state.hand.length, 0);
  assert.equal(state.boat[0].type, soulId('MERCHANT'));
});
check('last-chance delivery precedes ship expiry; optional retention remains legal', () => {
  let state = board(['MERCHANT']);
  state.boat[0].anger = 3;
  state = act(state, 'CROSS', {destination: destination('STYX')});
  const delivered = act(state, 'DELIVER', {ids: [soulId('MERCHANT')]});
  assert.equal(delivered.light, 5);
  assert.equal(delivered.hand[0].type, 'MEM-FORESIGHT');
  const retained = act(state, 'DELIVER', {ids: []});
  assert.equal(retained.light, 4);
  assert.equal(retained.boat.length, 0);
  assert.ok(retained.discard.includes(soulId('MERCHANT')));
});
check('fresh repeated source memory and explicit full-hand discard', () => {
  let state = board(['MERCHANT']);
  const earlier = give(state, 'FORESIGHT', 'MERCHANT');
  give(state, 'FORESIGHT', 'MERCHANT');
  give(state, 'LIGHT', 'MOTHER');
  state = act(state, 'CROSS', {destination: destination('STYX')});
  state = act(state, 'DELIVER', {ids: [soulId('MERCHANT')]});
  assert.equal(state.phase, 'trim');
  assert.equal(state.hand.length, 4);
  assert.ok(state.hand.some(memory => memory.id === earlier));
  state = act(state, 'DISCARD_MEMORY', {id: state.hand.at(-1).id});
  assert.equal(state.hand.length, 3);
  assert.equal(state.window.kind, 'return');
  assert.equal(state.window.used, false);
});
check('Guard absorbs only one point including wraiths; expires at round boundary', () => {
  let state = board(['CHILD', 'MOTHER']);
  state.boat.forEach(soul => { soul.anger = 3; });
  const memory = give(state, 'GUARD', 'SOLDIER');
  state = act(state, 'PLAY_MEMORY', {id: memory});
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: []});
  assert.equal(state.light, 5);
  assert.equal(state.window.guard, 0);
  assert.equal(state.window.used, false);
});
check('Fog Shield cannot stop wraith damage; Haven does not heal', () => {
  let state = board(['MOTHER']);
  state.boat[0].anger = 3;
  state.light = 4;
  const memory = give(state, 'FOG', 'MASON');
  state = act(state, 'PLAY_MEMORY', {id: memory});
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: []});
  assert.equal(state.light, 3);
});
check('third global round boards PoLong with a full four-seat ordinary boat', () => {
  let state = board(['MOTHER', 'CHILD', 'MERCHANT', 'MASON'], '2');
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  assert.equal(state.round, '3');
  assert.equal(game.seats(state), 4);
  assert.equal(state.boat.at(-1).anger, 0);
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  assert.equal(state.boat.at(-1).anger, 1);
});
check('additive PoLong fog and Calm immediately reduce current contribution', () => {
  let state = board(['CHILD'], '6');
  state.boat.push({id: 'POLONG-1', type: soulId('POLONG'), anger: 2});
  state.boat.push({id: 'POLONG-2', type: soulId('POLONG'), anger: 3});
  assert.equal(game.preview(state, destination('HAVEN')).payment, 2);
  const memory = give(state, 'CALM', 'COOK');
  state = act(state, 'PLAY_MEMORY', {id: memory, target: 'POLONG-1'});
  assert.equal(game.preview(state, destination('HAVEN')).payment, 1);
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  assert.equal(state.boat.length, 1);
  assert.equal(state.light, 4);
});
check('shore expiry at zero halts before healing, refill and cycle increment', () => {
  let state = board(['CHILD']);
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  state.shore.forEach(soul => { soul.anger = 1; });
  state.light = 1;
  state = act(state, 'RETURN');
  assert.equal(state.phase, 'ended');
  assert.equal(state.light, 0);
  assert.equal(state.cycle, '1');
  assert.equal(state.completed, '0');
});
check('return Guard blocks next expiry then heals only survivors; new arrivals stay zero', () => {
  let state = board(['CHILD']);
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  state.shore[0].anger = 1;
  state.light = 1;
  const memory = give(state, 'GUARD', 'SOLDIER');
  state = act(state, 'PLAY_MEMORY', {id: memory});
  state = act(state, 'RETURN');
  assert.equal(state.light, 3);
  assert.equal(state.cycle, '2');
  assert.equal(state.shore.length, 5);
  assert.equal(state.shore.filter(soul => soul.anger === 0).length, 2);
});
check('family success across cycles grants both rewards; completed quest survives recycling', () => {
  let state = board(['CHILD']);
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  state = act(state, 'RETURN');
  state = act(state, 'BOARD', {id: soulId('MOTHER')});
  state = route(state, ['TARTARUS', 'HAVEN']);
  state = act(state, 'DEPART');
  state = act(state, 'CROSS', {destination: destination('TARTARUS')});
  state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
  assert.equal(state.quest, 'completed');
  assert.deepEqual(state.hand.map(memory => memory.type), ['MEM-LIGHT', 'MEM-PASSAGE']);
});
check('Mother first and required-family expiry fail permanently', () => {
  let state = board(['MOTHER']);
  state.routes.offers[0] = [destination('TARTARUS'), destination('HAVEN')];
  state = act(state, 'CROSS', {destination: destination('TARTARUS')});
  state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
  assert.equal(state.quest, 'failed');
  assert.equal(state.hand.length, 1);
  let expiry = board(['CHILD']);
  expiry.boat[0].anger = 3;
  expiry = act(expiry, 'CROSS', {destination: destination('HAVEN')});
  expiry = act(expiry, 'DELIVER', {ids: []});
  assert.equal(expiry.quest, 'failed');
  let later = board(['CHILD']);
  later.quest = 'child-delivered';
  later.boat[0].anger = 3;
  later = act(later, 'CROSS', {destination: destination('HAVEN')});
  later = act(later, 'DELIVER', {ids: []});
  assert.equal(later.quest, 'child-delivered');
});
check('Passage normal reward, no round or scheduled spawn, empty return uses allowance', () => {
  let state = board(['MOTHER'], '2');
  state.quest = 'completed';
  const memory = give(state, 'PASSAGE', 'QUEST-FAMILY');
  state.routes.offers = [];
  state.routes.revealed = 0;
  state = act(state, 'PLAY_MEMORY', {id: memory, target: soulId('MOTHER')});
  assert.equal(state.round, '2');
  assert.equal(state.nextPolong, '1');
  assert.equal(state.window.kind, 'return');
  assert.equal(state.window.used, true);
  assert.equal(state.hand[0].type, 'MEM-LIGHT');
  assert.throws(() => act(state, 'PLAY_MEMORY', {id: state.hand[0].id}), /already used/);
  state = act(state, 'RETURN');
  assert.equal(state.round, '2');
});
check('Passage can target PoLong, no ordinary score, no reward and no anger', () => {
  let state = board(['CHILD'], '3');
  const target = polong(state);
  state.quest = 'completed';
  const memory = give(state, 'PASSAGE', 'QUEST-FAMILY');
  state = act(state, 'PLAY_MEMORY', {id: memory, target});
  assert.equal(state.deliveries, '0');
  assert.equal(state.round, '3');
  assert.equal(state.hand.length, 0);
  assert.equal(state.boat[0].anger, 0);
});
check('Foresight exact visibility, missing data spends nothing, hidden replacement preserves reveals', () => {
  let state = board(['CHILD']);
  const memory = give(state, 'FORESIGHT', 'MERCHANT');
  const before = game.exportSave(state);
  assert.throws(() => act(state, 'PLAY_MEMORY', {id: memory}), /Facilitator/);
  assert.equal(game.exportSave(state), before);
  state = act(state, 'APPEND_ROUTES', {offers: [['ACHERON', 'ASPHODEL'], ['ELYSIUM', 'TARTARUS'], ['STYX', 'HAVEN']].map(pair => pair.map(destination))});
  assert.equal(game.offers(state).length, 1);
  state = act(state, 'PLAY_MEMORY', {id: memory});
  assert.equal(game.offers(state).length, 3);
  state = act(state, 'REPLACE_HIDDEN_ROUTES', {offers: [[destination('HAVEN'), destination('HAVEN')]]});
  assert.equal(state.routes.offers.length, 4);
  assert.equal(game.offers(state).length, 3);
});
check('save roundtrip in boarding, review, delivery, overflow, return and stopped phases', () => {
  const states = [game.create(), board(['MERCHANT'])];
  let state = states[1];
  give(state, 'FORESIGHT', 'MERCHANT');
  give(state, 'FORESIGHT', 'MERCHANT');
  give(state, 'FORESIGHT', 'MERCHANT');
  state = act(state, 'PLAN', {action: {type: 'CROSS', destination: destination('STYX')}});
  states.push(state);
  assert.equal(act(state, 'BACK').round, '0');
  state = act(state, 'CONFIRM');
  states.push(state);
  state = act(state, 'DELIVER', {ids: [soulId('MERCHANT')]});
  states.push(state);
  state = act(state, 'DISCARD_MEMORY', {id: state.hand[0].id});
  states.push(state, act(state, 'STOP'));
  for (const snapshot of states) assert.deepEqual(game.importSave(game.exportSave(snapshot)), snapshot);
  return {phases: states.map(snapshot => snapshot.phase)};
});
check('malformed saves rejected without mutation: conservation, identities, counters, quest, visibility, phase', () => {
  const variants = [
    state => state.discard.push(soulId('MOTHER')),
    state => { state.round = '3'; },
    state => { state.light = 0; },
    state => { state.quest = 'won'; },
    state => { state.routes.revealed = 1; },
    state => { state.phase = 'review'; },
    state => { state.version = '0.5'; },
    state => { state.cycle = '5'; },
    state => { state.shore[0].anger = 2; },
    state => { state.window.guard = 1; },
    state => { give(state, 'PASSAGE', 'QUEST-FAMILY'); }
  ];
  for (const mutate of variants) { const state = game.create(); mutate(state); assert.throws(() => game.importSave(JSON.stringify(state))); }
  const duplicate = board(['CHILD'], '3');
  polong(duplicate); polong(duplicate);
  assert.throws(() => game.validate(duplicate));
  const memory = board();
  give(memory, 'LIGHT', 'MOTHER'); memory.hand.push({...memory.hand[0]});
  assert.throws(() => game.validate(memory));
});
check('decimal counters preserve values beyond JavaScript safe integer range', () => {
  let state = board(['CHILD'], '9007199254740992');
  state.completed = '9007199254740992';
  state.cycle = '9007199254740993';
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  assert.equal(state.round, '9007199254740993');
  assert.equal(state.boat.at(-1).type, soulId('POLONG'));
  assert.deepEqual(game.importSave(game.exportSave(state)), state);
});
check('exhaustive relaxed PoLong overlap bound with unlimited Calm, no light constraints', () => {
  const queue = [{cadence: 0, anger: []}];
  const visited = new Set();
  let maximumBeforeTravel = 0;
  let maximumAfterRound = 0;
  for (let cursor = 0; cursor < queue.length; cursor++) {
    const state = queue[cursor];
    const key = state.cadence + ':' + state.anger.join(',');
    if (visited.has(key)) continue;
    visited.add(key);
    for (let target = -1; target < state.anger.length; target++) {
      const anger = state.anger.slice();
      if (target >= 0) anger[target] = Math.max(0, anger[target] - 1);
      const cadence = (state.cadence + 1) % 3;
      if (!cadence) anger.push(0);
      maximumBeforeTravel = Math.max(maximumBeforeTravel, anger.length);
      const next = anger.map(value => value + 1).filter(value => value < 4).sort();
      maximumAfterRound = Math.max(maximumAfterRound, next.length);
      const nextKey = cadence + ':' + next.join(',');
      if (!visited.has(nextKey)) queue.push({cadence, anger: next});
    }
  }
  assert.ok(maximumBeforeTravel <= 4);
  return {reachableRelaxedStates: visited.size, maximumBeforeTravel, maximumAfterRound, interpretation: 'An upper bound allowing one free Calm every round. Delivering/removing instances cannot increase overlap. Two base pieces plus two spares suffice under current rules; keep reusable slips for handling.'};
});
let randomizedTransitions = 0;
check('revealed offers remain available for the cycle and older v0.6 saves still load', () => {
  let state = board(['MOTHER', 'CHILD']);
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  assert.deepEqual(state.routes.history, [{offer: [destination('HAVEN'), destination('STYX')], chosen: destination('HAVEN')}]);
  state = game.importSave(game.exportSave(state));
  const malformed = game.clone(state);
  malformed.routes.history[0].chosen = destination('ELYSIUM');
  assert.throws(() => game.validate(malformed));
  const old = game.clone(state);
  delete old.routes.history;
  delete old.routes.historyStart;
  state = game.importSave(JSON.stringify(old));
  state = route(state, ['TARTARUS', 'HAVEN']);
  state = act(state, 'CROSS', {destination: destination('TARTARUS')});
  assert.equal(state.routes.historyStart, '1');
  assert.equal(state.routes.history.length, 1);
  assert.equal(state.round, '2');
  state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
  state = act(state, 'RETURN');
  assert.deepEqual(state.routes.history, []);
  assert.equal(state.routes.historyStart, '0');
});
check('scheduled third round spans two survived one-round cycles', () => {
  let state = board(['CHILD']);
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
  state = act(state, 'RETURN');
  state = act(state, 'BOARD', {id: soulId('MOTHER')});
  state = route(state, ['TARTARUS', 'HAVEN']);
  state = act(state, 'DEPART');
  state = act(state, 'CROSS', {destination: destination('TARTARUS')});
  state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
  const light = state.hand.find(memory => memory.type === 'MEM-LIGHT');
  state = act(state, 'PLAY_MEMORY', {id: light.id});
  state = act(state, 'RETURN');
  assert.equal(state.phase, 'boarding');
  assert.equal(state.cycle, '3');
  assert.equal(state.round, '2');
  state = act(state, 'BOARD', {id: state.shore[0].id});
  state = route(state);
  state = act(state, 'DEPART');
  state = act(state, 'CROSS', {destination: destination('HAVEN')});
  assert.equal(state.round, '3');
  assert.equal(state.boat.at(-1).id, 'POLONG-1');
});
check('family recycling cannot regrant Passage after completion or failure', () => {
  for (const quest of ['completed', 'failed']) {
    let state = board(['MOTHER', 'CHILD']);
    state.quest = quest;
    state = act(state, 'CROSS', {destination: destination('HAVEN')});
    state = act(state, 'DELIVER', {ids: [soulId('CHILD')]});
    state = route(state, ['TARTARUS', 'HAVEN']);
    state = act(state, 'CROSS', {destination: destination('TARTARUS')});
    state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
    assert.equal(state.quest, quest);
    assert.deepEqual(state.hand.map(memory => memory.type), ['MEM-LIGHT']);
  }
});
check('multiple quest rewards overflow together; Passage can be discarded by choice', () => {
  let state = board(['MOTHER']);
  state.quest = 'child-delivered';
  give(state, 'FORESIGHT', 'MERCHANT');
  give(state, 'FORESIGHT', 'MERCHANT');
  give(state, 'FOG', 'MASON');
  state.routes.offers[0] = [destination('TARTARUS'), destination('HAVEN')];
  state = act(state, 'CROSS', {destination: destination('TARTARUS')});
  state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
  assert.equal(state.hand.length, 5);
  state = act(state, 'DISCARD_MEMORY', {id: state.hand.find(memory => memory.type === 'MEM-PASSAGE').id});
  assert.equal(state.phase, 'trim');
  state = act(state, 'DISCARD_MEMORY', {id: state.hand[0].id});
  assert.equal(state.phase, 'window');
  assert.equal(state.quest, 'completed');
  assert.equal(state.window.kind, 'return');
});
check('Guard fog remainder and return expiry use only the next damage point', () => {
  let state = board(['MOTHER']);
  state.routes.offers[0] = [destination('TARTARUS'), destination('HAVEN')];
  const memory = give(state, 'GUARD', 'SOLDIER');
  state = act(state, 'PLAY_MEMORY', {id: memory});
  state = act(state, 'CROSS', {destination: destination('TARTARUS')});
  assert.equal(state.light, 4);
  assert.equal(state.window.guard, 0);
  state = act(state, 'DELIVER', {ids: [soulId('MOTHER')]});
  state.shore[0].anger = 1;
  state = act(state, 'RETURN');
  assert.equal(state.light, 5);
});
check('random legal runs conserve every ordinary soul and preserve save invariants', () => {
  for (let seed = 1; seed <= 150; seed++) {
    let state = game.create(seed);
    let random = seed;
    const choose = length => { random = (Math.imul(random, 1103515245) + 12345) >>> 0; return random % length; };
    for (let step = 0; step < 300 && state.phase !== 'ended'; step++) {
      if (state.phase === 'boarding') {
        for (const soul of state.shore) if (game.seats(state) + game.data.souls.find(item => item.id === soul.type).seats <= 4) state = act(state, 'BOARD', {id: soul.id});
        state = route(state, ['HAVEN', ['STYX', 'ASPHODEL', 'ACHERON', 'TARTARUS', 'ELYSIUM'][choose(5)]]);
        state = act(state, 'DEPART');
      } else if (state.phase === 'window') {
        if (state.window.kind === 'return') state = act(state, 'RETURN');
        else {
          if (!state.routes.offers.length) state = route(state, ['HAVEN', ['STYX', 'ASPHODEL', 'ACHERON', 'TARTARUS', 'ELYSIUM'][choose(5)]]);
          state = act(state, 'CROSS', {destination: state.routes.offers[0][choose(2)]});
        }
      } else if (state.phase === 'delivery') state = act(state, 'DELIVER', {ids: state.boat.filter(soul => game.data.souls.find(item => item.id === soul.type).wish === state.destination && choose(3) !== 0).map(soul => soul.id)});
      else if (state.phase === 'trim') state = act(state, 'DISCARD_MEMORY', {id: state.hand[choose(state.hand.length)].id});
      game.validate(state);
      assert.deepEqual(game.importSave(game.exportSave(state)), state);
      randomizedTransitions++;
    }
  }
  return {seeds: 150, transitions: randomizedTransitions, scope: 'Agent simulation, not human play or balance evidence'};
});
check('long-run recycling, repeated rewards and no ending cap across 1000 synthetic safe returns', () => {
  let state = game.create(82);
  let reshuffles = 0;
  for (let cycle = 0; cycle < 1000; cycle++) {
    state.light = 6;
    state.shore.forEach(soul => { soul.anger = 0; });
    const traveler = state.shore.find(soul => soul.type !== soulId('SOLDIER'));
    state = act(state, 'BOARD', {id: traveler.id});
    const wish = game.data.souls.find(soul => soul.id === traveler.type).wish;
    state = act(state, 'APPEND_ROUTES', {offers: [[wish, destination('TARTARUS')], [destination('TARTARUS'), destination('HAVEN')]]});
    state = act(state, 'DEPART');
    state = act(state, 'CROSS', {destination: wish});
    state = act(state, 'DELIVER', {ids: [traveler.id]});
    if (state.phase === 'trim') state = act(state, 'DISCARD_MEMORY', {id: state.hand[0].id});
    if (state.boat.length) {
      state.light = 6;
      state = act(state, 'CROSS', {destination: destination('TARTARUS')});
      state = act(state, 'DELIVER', {ids: state.boat.map(soul => soul.id)});
    }
    if (!state.arrivals.length) reshuffles++;
    state = act(state, 'RETURN');
    game.validate(state);
  }
  assert.equal(state.completed, '1000');
  assert.equal(state.deliveries, '1000');
  assert.ok(BigInt(state.nextMemory) > 3n);
  assert.ok(state.log.length <= 80);
  assert.ok(reshuffles > 0);
  return {completedCycles: state.completed, deliveries: state.deliveries, outwardRounds: state.round, reshuffles, logEntries: state.log.length, scope: 'Synthetic transition stress test resetting Light and shore anger between cycles, not a reachable survival or balance claim'};
});
const hashes = Object.fromEntries(['engine.js', 'content.json', 'tests/engine-check.js'].map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]));
const result = {version: '0.6', checkedAt: new Date().toISOString(), environment: {node: process.version, platform: process.platform, arch: process.arch}, hashes, passed: records.filter(record => record.status === 'PASS').length, failed: records.filter(record => record.status === 'FAIL').length, records};
fs.mkdirSync(path.join(root, 'verification'), {recursive: true});
if (!process.env.FERRY_CHECK_NO_WRITE) fs.writeFileSync(path.join(root, 'verification/engine-results.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.failed ? 1 : 0;
