(function(root, factory) {
  const data = typeof module === 'object' && module.exports ? require('./content.json') : root.FerryData;
  const api = factory(data);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Ferry = api;
})(globalThis, function(data) {
  'use strict';
  const config = data.config;
  const indexById = items => Object.fromEntries(items.map(item => [item.id, item]));
  const souls = indexById(data.souls);
  const memories = indexById(data.memories);
  const destinations = indexById(data.destinations);
  const ordinaryIds = data.souls.filter(soul => soul.ordinary).map(soul => soul.id);
  const clone = value => JSON.parse(JSON.stringify(value));
  const need = (condition, message) => { if (!condition) throw new Error(message); };
  const decimal = value => typeof value === 'string' && /^(0|[1-9][0-9]*)$/.test(value) && value.length <= 1000;
  const increment = value => (BigInt(value) + 1n).toString();
  const unique = values => Array.isArray(values) && new Set(values).size === values.length;
  const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
  function record(state, text) {
    state.log.push({round: state.round, cycle: state.cycle, text});
    if (state.log.length > 80) state.log.shift();
  }
  function shuffle(state, values) {
    const result = values.slice();
    for (let position = result.length - 1; position > 0; position--) {
      state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
      const other = Math.floor(state.rng / 4294967296 * (position + 1));
      [result[position], result[other]] = [result[other], result[position]];
    }
    return result;
  }
  const freshWindow = kind => ({kind, used: false, guard: 0, shield: 0});
  function create(seed = 1) {
    need(integer(seed, 0, 4294967295), 'Seed must be an unsigned 32-bit integer.');
    const state = {
      format: 'the-ferryman-save', version: '0.6', schemaVersion: 1,
      seed, rng: seed, phase: 'boarding', paused: false, light: config.startLight,
      round: '0', cycle: '1', completed: '0', deliveries: '0', nextMemory: '1', nextPolong: '1',
      shore: config.initialShore.map(id => ({id, type: id, anger: 0})),
      arrivals: [], discard: [], boat: [], selected: [], hand: [], quest: 'available',
      routes: {offers: [], revealed: 0, used: '0', history: [], historyStart: '0'}, window: freshWindow('outward'),
      pending: null, destination: null, trimNext: null, ending: null, uiStep: 'memory', log: []
    };
    state.arrivals = shuffle(state, config.initialArrivals);
    record(state, 'Endless survival begins. The facilitator supplies this cycle’s route offers.');
    return state;
  }
  function seats(state) {
    const passengers = state.phase === 'boarding' ? state.selected.map(id => ({type: id})) : state.boat;
    return passengers.reduce((total, soul) => total + souls[soul.type].seats, 0);
  }
  function exposeCurrent(state) {
    if (state.routes.offers.length) state.routes.revealed = Math.max(1, state.routes.revealed);
  }
  function offers(state) { return state.routes.offers.slice(0, state.routes.revealed).map(pair => pair.slice()); }
  function requireOffers(state, count) {
    need(state.routes.offers.length >= count, `Facilitator input needed: ${count} complete route offer${count === 1 ? '' : 's'} required. Nothing was spent or advanced.`);
  }
  function finishLoss(state, reason) {
    state.phase = 'ended';
    state.ending = reason;
    state.pending = null;
    state.trimNext = null;
    record(state, reason);
  }
  function damage(state, amount, reason) {
    const prevented = Math.min(amount, state.window.guard);
    state.window.guard -= prevented;
    const paid = Math.min(state.light, amount - prevented);
    state.light -= paid;
    record(state, `${reason}: ${paid} Light lost${prevented ? ', Guard prevented 1' : ''}.`);
    if (state.light === 0) finishLoss(state, `The lantern went out during ${reason}.`);
  }
  function familyExpiry(state, soul) {
    if (state.quest === 'available' && (soul.type === 'SOUL-CHILD' || soul.type === 'SOUL-MOTHER')) state.quest = 'failed';
    if (state.quest === 'child-delivered' && soul.type === 'SOUL-MOTHER') state.quest = 'failed';
  }
  function removeSoul(state, soul, location) {
    state[location] = state[location].filter(item => item.id !== soul.id);
    if (souls[soul.type].ordinary) state.discard.push(soul.type);
  }
  function reward(state, type, source) {
    state.hand.push({id: 'MEMORY-' + state.nextMemory, type, source});
    state.nextMemory = increment(state.nextMemory);
    record(state, `${souls[source]?.name || 'Family quest'} grants a fresh ${memories[type].name} memory.`);
  }
  function deliver(state, id) {
    const soul = state.boat.find(item => item.id === id);
    need(soul, 'Choose a soul aboard.');
    removeSoul(state, soul, 'boat');
    record(state, `${souls[soul.type].name} delivered to ${destinations[souls[soul.type].wish].name}.`);
    if (souls[soul.type].ordinary) state.deliveries = increment(state.deliveries);
    if (souls[soul.type].memory) reward(state, souls[soul.type].memory, soul.type);
    if (soul.type === 'SOUL-CHILD' && state.quest === 'available') state.quest = 'child-delivered';
    if (soul.type === 'SOUL-MOTHER') {
      if (state.quest === 'available') state.quest = 'failed';
      else if (state.quest === 'child-delivered') {
        state.quest = 'completed';
        reward(state, 'MEM-PASSAGE', 'QUEST-FAMILY');
      }
    }
  }
  function afterOverflow(state, next) {
    state.trimNext = state.hand.length > config.handLimit ? next : null;
    state.phase = state.trimNext ? 'trim' : 'window';
    if (!state.trimNext) finishWindow(state, next);
  }
  function finishWindow(state, next) {
    if (next === 'new-outward') state.window = freshWindow('outward');
    if (next === 'new-return') state.window = freshWindow('return');
    if (next === 'passage-return') state.window = {...freshWindow('return'), used: true};
    state.phase = 'window';
    state.trimNext = null;
    state.uiStep = state.window.used ? 'route' : 'memory';
    exposeCurrent(state);
  }
  function memoryReady(state, id, target) {
    need(state.phase === 'window', 'Memories are played before a round or return.');
    need(!state.window.used, 'The memory allowance for this round or return is already used.');
    const held = state.hand.find(memory => memory.id === id);
    need(held, 'Choose a held memory instance.');
    const memory = memories[held.type];
    if (memory.kind === 'calm') need([...state.shore, ...state.boat].some(soul => soul.id === target), 'Calm needs a living shore or boat target.');
    else if (memory.kind === 'passage') need(state.boat.some(soul => soul.id === target), 'Passage needs an onboard target.');
    else need(target === null || target === undefined, 'This memory has no target.');
    if (memory.kind === 'foresight') requireOffers(state, config.foresightForks);
    else if (state.window.kind === 'outward' && !(memory.kind === 'passage' && state.boat.length === 1)) requireOffers(state, 1);
    return memory;
  }
  function playMemory(state, id, target) {
    const memory = memoryReady(state, id, target);
    state.hand = state.hand.filter(item => item.id !== id);
    state.window.used = true;
    state.uiStep = 'route';
    record(state, `Played ${memory.name}.`);
    if (memory.kind === 'light') state.light = Math.min(config.maxLight, state.light + memory.amount);
    if (memory.kind === 'guard') state.window.guard = memory.amount;
    if (memory.kind === 'fog') state.window.shield = memory.amount;
    if (memory.kind === 'foresight') state.routes.revealed = Math.max(state.routes.revealed, config.foresightForks);
    if (memory.kind === 'calm') {
      const soul = [...state.shore, ...state.boat].find(item => item.id === target);
      soul.anger = Math.max(0, soul.anger - memory.amount);
    }
    if (memory.kind === 'passage') {
      deliver(state, target);
      afterOverflow(state, state.boat.length ? 'same' : 'passage-return');
    }
  }
  function preview(state, destination) {
    need(state.phase === 'window' && state.window.kind === 'outward', 'Choose a route before an outward crossing.');
    requireOffers(state, 1);
    need(state.routes.offers[0].includes(destination), 'Choose a destination in the current offer.');
    const base = destinations[destination].fog;
    const tainted = state.boat.filter(soul => soul.type === 'SOUL-POLONG' && soul.anger >= config.polongFogThreshold).length * config.polongFog;
    const fog = Math.max(0, base + tainted - state.window.shield);
    const payment = Math.max(0, fog - state.window.guard);
    return {destination, base, tainted, shield: state.window.shield, guard: state.window.guard, fog, payment, remaining: Math.max(0, state.light - payment), lethal: payment >= state.light, spawn: BigInt(increment(state.round)) % BigInt(config.spawnInterval) === 0n};
  }
  function cross(state, destination) {
    const calculation = preview(state, destination);
    state.round = increment(state.round);
    if (calculation.spawn) {
      state.boat.push({id: 'POLONG-' + state.nextPolong, type: 'SOUL-POLONG', anger: 0});
      state.nextPolong = increment(state.nextPolong);
      record(state, 'A scheduled PoLong boards at Ship Anger 0, using no ordinary seat.');
    }
    state.destination = destination;
    if (!state.routes.history) { state.routes.history = []; state.routes.historyStart = state.routes.used; }
    state.routes.history.push({offer: state.routes.offers[0].slice(), chosen: destination});
    state.routes.offers.shift();
    state.routes.revealed = Math.max(0, state.routes.revealed - 1);
    state.routes.used = increment(state.routes.used);
    damage(state, calculation.fog, 'crossing fog');
    if (state.phase !== 'ended') state.phase = 'delivery';
  }
  function resolveDelivery(state, ids) {
    need(state.phase === 'delivery' && unique(ids), 'Choose unique passengers to deliver, or retain all.');
    for (const id of ids) need(state.boat.some(soul => soul.id === id && souls[soul.type].wish === state.destination), 'Only matching passengers can be delivered here.');
    for (const id of ids) deliver(state, id);
    for (const soul of state.boat) soul.anger++;
    for (const soul of state.boat.slice()) {
      if (soul.anger < config.shipAngerLimit) continue;
      familyExpiry(state, soul);
      damage(state, config.wraithDamage, `${souls[soul.type].name} Ship Anger expiry`);
      removeSoul(state, soul, 'boat');
      if (state.phase === 'ended') return;
    }
    afterOverflow(state, state.boat.length ? 'new-outward' : 'new-return');
  }
  function returnToShore(state) {
    need(state.phase === 'window' && state.window.kind === 'return' && !state.boat.length, 'Return only with an empty boat.');
    for (const soul of state.shore) soul.anger++;
    for (const soul of state.shore.slice()) {
      if (soul.anger < config.shoreAngerLimit) continue;
      familyExpiry(state, soul);
      damage(state, config.wraithDamage, `${souls[soul.type].name} Shore Anger expiry`);
      removeSoul(state, soul, 'shore');
      if (state.phase === 'ended') return;
    }
    state.light = Math.min(config.maxLight, state.light + config.returnLight);
    state.completed = increment(state.completed);
    state.cycle = increment(state.cycle);
    while (state.shore.length < config.shoreTarget) {
      if (!state.arrivals.length) {
        state.arrivals = shuffle(state, state.discard);
        state.discard = [];
      }
      if (!state.arrivals.length) break;
      const id = state.arrivals.shift();
      state.shore.push({id, type: id, anger: 0});
    }
    record(state, `Survived return. Restore ${config.returnLight} Light, capped at ${config.maxLight}. Begin the next cycle.`);
    state.routes = {offers: [], revealed: 0, used: '0', history: [], historyStart: '0'};
    state.window = freshWindow('outward');
    state.destination = null;
    state.phase = 'boarding';
    state.uiStep = 'memory';
  }
  function routePairs(pairs) {
    need(Array.isArray(pairs) && pairs.length > 0 && pairs.length <= 1000, 'Supply 1 to 1000 two-destination offers at a time.');
    for (const pair of pairs) need(Array.isArray(pair) && pair.length === 2 && pair.every(id => Object.hasOwn(destinations, id)), 'Each offer must contain exactly two of the six destination IDs.');
  }
  function transition(input, action) {
    validate(input);
    const state = clone(input);
    need(action && typeof action.type === 'string', 'Choose an action.');
    if (action.type === 'STOP') { need(state.phase !== 'ended', 'This run already ended at zero Light.'); state.paused = true; record(state, 'Session stopped voluntarily and saved. This is not a victory.'); return state; }
    if (action.type === 'RESUME') { state.paused = false; return state; }
    need(!state.paused, 'Resume this saved session first.');
    need(state.phase !== 'ended', 'The run has ended.');
    if (action.type === 'SET_VIEW') {
      need(state.phase === 'window' && !state.window.used && ['memory', 'route'].includes(action.screen), 'Invalid window view.');
      state.uiStep = action.screen;
    } else if (action.type === 'APPEND_ROUTES' || action.type === 'REPLACE_HIDDEN_ROUTES') {
      routePairs(action.offers);
      if (action.type === 'REPLACE_HIDDEN_ROUTES') state.routes.offers = state.routes.offers.slice(0, state.routes.revealed);
      need(state.routes.offers.length + action.offers.length <= 10000, 'Route queue limit: use or replace pending offers before adding more.');
      state.routes.offers.push(...clone(action.offers));
      exposeCurrent(state);
    } else if (action.type === 'BOARD') {
      need(state.phase === 'boarding' && state.shore.some(soul => soul.id === action.id), 'Select a waiting soul before departure.');
      if (state.selected.includes(action.id)) state.selected = state.selected.filter(id => id !== action.id);
      else { need(seats(state) + souls[action.id].seats <= config.seats, 'Not enough ordinary seats. Soldier uses two.'); state.selected.push(action.id); }
    } else if (action.type === 'DEPART') {
      need(state.phase === 'boarding' && state.selected.length, 'Board at least one ordinary soul.');
      requireOffers(state, 1);
      state.boat = state.shore.filter(soul => state.selected.includes(soul.id)).map(soul => ({...soul, anger: 0}));
      state.shore = state.shore.filter(soul => !state.selected.includes(soul.id));
      state.selected = [];
      state.phase = 'window';
      exposeCurrent(state);
    } else if (action.type === 'PLAY_MEMORY') playMemory(state, action.id, action.target);
    else if (action.type === 'PLAN') {
      need(state.phase === 'window', 'Plan at the memory, route or return window.');
      if (action.action?.type === 'PLAY_MEMORY') memoryReady(state, action.action.id, action.action.target);
      else if (action.action?.type === 'CROSS') preview(state, action.action.destination);
      else need(action.action?.type === 'RETURN' && state.window.kind === 'return', 'Choose a valid action to review.');
      state.pending = clone(action.action);
      state.phase = 'review';
    } else if (action.type === 'BACK') {
      need(state.phase === 'review', 'No confirmation to go back from.');
      state.uiStep = state.pending.type === 'PLAY_MEMORY' && !state.window.used ? 'memory' : 'route';
      state.phase = 'window';
      state.pending = null;
    } else if (action.type === 'CONFIRM') {
      need(state.phase === 'review' && state.pending, 'Review an action first.');
      const pending = state.pending;
      state.pending = null;
      state.phase = 'window';
      return transition(state, pending);
    } else if (action.type === 'CROSS') cross(state, action.destination);
    else if (action.type === 'DELIVER') resolveDelivery(state, action.ids);
    else if (action.type === 'RETURN') returnToShore(state);
    else if (action.type === 'DISCARD_MEMORY') {
      need(state.phase === 'trim' && state.hand.some(memory => memory.id === action.id), 'Choose a held memory to discard during overflow.');
      state.hand = state.hand.filter(memory => memory.id !== action.id);
      if (state.hand.length <= config.handLimit) finishWindow(state, state.trimNext);
    } else throw new Error('Unknown action.');
    validate(state);
    return state;
  }
  function validate(state) {
    need(state && typeof state === 'object' && state.format === 'the-ferryman-save' && state.version === '0.6' && state.schemaVersion === 1, 'This is not a v0.6 save. Older saves remain in their original game.');
    need(['boarding', 'window', 'review', 'delivery', 'trim', 'ended'].includes(state.phase), 'Invalid phase.');
    need(['memory', 'route'].includes(state.uiStep), 'Invalid saved interface step.');
    need(typeof state.paused === 'boolean' && integer(state.light, 0, config.maxLight), 'Invalid Light or pause state.');
    need((state.phase === 'ended') === (state.light === 0), 'Only zero Light ends survival.');
    need(integer(state.seed, 0, 4294967295) && integer(state.rng, 0, 4294967295), 'Invalid shuffle state.');
    for (const key of ['round', 'cycle', 'completed', 'deliveries', 'nextMemory', 'nextPolong']) need(decimal(state[key]), 'Invalid decimal counter: ' + key);
    need(BigInt(state.cycle) === BigInt(state.completed) + 1n && BigInt(state.nextMemory) > 0n && BigInt(state.nextPolong) > 0n, 'Inconsistent cycle or instance counters.');
    need(BigInt(state.nextPolong) === BigInt(state.round) / BigInt(config.spawnInterval) + 1n, 'Spawn counter does not match global outward rounds.');
    need(['available', 'child-delivered', 'completed', 'failed'].includes(state.quest), 'Invalid quest state.');
    for (const location of ['shore', 'boat', 'arrivals', 'discard', 'hand', 'selected']) need(Array.isArray(state[location]), 'Invalid ' + location + '.');
    need(state.shore.length <= config.shoreTarget && state.boat.length <= 20, 'Invalid active soul counts.');
    const ordinaryLocations = [...state.arrivals, ...state.discard];
    const activeIds = [];
    for (const location of ['shore', 'boat']) {
      for (const soul of state[location]) {
        need(soul && Object.hasOwn(souls, soul.type) && typeof soul.id === 'string', 'Invalid soul identity.');
        const max = location === 'shore' ? config.shoreAngerLimit : config.shipAngerLimit;
        need(integer(soul.anger, 0, state.phase === 'ended' ? max : max - 1), 'Invalid soul anger.');
        if (souls[soul.type].ordinary) { need(soul.id === soul.type, 'Ordinary soul identity changed.'); ordinaryLocations.push(soul.type); }
        else {
          const number = soul.id.replace(/^POLONG-/, '');
          need(location === 'boat' && soul.id.startsWith('POLONG-') && decimal(number) && BigInt(number) > 0n && BigInt(number) < BigInt(state.nextPolong), 'Invalid active PoLong instance.');
        }
        activeIds.push(soul.id);
      }
    }
    need(unique(activeIds) && unique(ordinaryLocations) && ordinaryLocations.length === ordinaryIds.length && ordinaryIds.every(id => ordinaryLocations.includes(id)), 'Ordinary conservation or unique active identity failed.');
    need(unique(state.selected) && state.selected.every(id => state.shore.some(soul => soul.id === id)), 'Invalid boarding selection.');
    need(seats(state) <= config.seats, 'Boat seat capacity exceeded.');
    need(state.phase === 'boarding' ? state.boat.length === 0 : state.selected.length === 0, 'Invalid boarding phase state.');
    need(state.window && ['outward', 'return'].includes(state.window.kind) && typeof state.window.used === 'boolean' && integer(state.window.guard, 0, 1) && integer(state.window.shield, 0, 1), 'Invalid memory window.');
    need(state.window.used || (!state.window.guard && !state.window.shield), 'Unused memory window has protection.');
    need(!(state.window.guard && state.window.shield), 'Two memories cannot protect one window.');
    if (['window', 'review', 'trim'].includes(state.phase)) {
      const passageReturn = state.phase === 'trim' && state.trimNext === 'passage-return';
      const newReturn = state.phase === 'trim' && state.trimNext === 'new-return';
      need((state.boat.length === 0) === (state.window.kind === 'return' || passageReturn || newReturn), 'Boat and return window disagree.');
    }
    if (state.phase === 'boarding') need(state.window.kind === 'outward' && !state.window.used && !state.destination, 'Invalid boarding window.');
    if (state.phase === 'delivery') need(state.boat.length > 0 && state.window.kind === 'outward' && Object.hasOwn(destinations, state.destination), 'Invalid delivery phase.');
    need(state.destination === null || Object.hasOwn(destinations, state.destination), 'Unknown current destination.');
    need(state.routes && Array.isArray(state.routes.offers) && state.routes.offers.length <= 10000 && integer(state.routes.revealed, 0, Math.min(3, state.routes.offers.length)) && decimal(state.routes.used), 'Invalid route visibility.');
    for (const pair of state.routes.offers) need(Array.isArray(pair) && pair.length === 2 && pair.every(id => Object.hasOwn(destinations, id)), 'Invalid route pair.');
    need(BigInt(state.routes.used) <= BigInt(state.round), 'Invalid cycle route counter.');
    if (state.routes.history !== undefined) {
      need(Array.isArray(state.routes.history) && decimal(state.routes.historyStart) && BigInt(state.routes.historyStart) + BigInt(state.routes.history.length) === BigInt(state.routes.used), 'Invalid revealed route history.');
      for (const entry of state.routes.history) need(entry && Array.isArray(entry.offer) && entry.offer.length === 2 && entry.offer.every(id => Object.hasOwn(destinations, id)) && entry.offer.includes(entry.chosen), 'Invalid historical route offer.');
    } else need(state.routes.historyStart === undefined, 'Route history is missing.');
    if (state.routes.offers.length && ['boarding', 'window', 'review'].includes(state.phase)) need(state.routes.revealed >= 1, 'Current route must be revealed.');
    need(unique(state.hand.map(memory => memory?.id)) && state.hand.length <= 8, 'Invalid memory instances or reward overflow.');
    for (const memory of state.hand) {
      need(memory && Object.hasOwn(memories, memory.type) && typeof memory.id === 'string' && memory.id.startsWith('MEMORY-'), 'Invalid memory identity.');
      const number = memory.id.slice(7);
      need(decimal(number) && BigInt(number) > 0n && BigInt(number) < BigInt(state.nextMemory), 'Memory counter is inconsistent.');
      need(memory.type === 'MEM-PASSAGE' ? memory.source === 'QUEST-FAMILY' && state.quest === 'completed' : Object.hasOwn(souls, memory.source) && souls[memory.source].memory === memory.type, 'Invalid memory source or quest reward.');
    }
    need(state.hand.filter(memory => memory.type === 'MEM-PASSAGE').length <= 1, 'Passage is once per run.');
    need(state.phase === 'trim' ? state.hand.length > config.handLimit && ['same', 'new-outward', 'new-return', 'passage-return'].includes(state.trimNext) : state.trimNext === null, 'Invalid overflow phase.');
    if (state.phase !== 'trim' && state.phase !== 'ended') need(state.hand.length <= config.handLimit, 'Resolve hand overflow first.');
    if (state.phase === 'review') {
      need(state.pending && ['CROSS', 'RETURN', 'PLAY_MEMORY'].includes(state.pending.type), 'Invalid reviewed action.');
      const ready = {...state, phase: 'window'};
      if (state.pending.type === 'CROSS') preview(ready, state.pending.destination);
      if (state.pending.type === 'PLAY_MEMORY') memoryReady(ready, state.pending.id, state.pending.target);
      if (state.pending.type === 'RETURN') need(state.window.kind === 'return', 'Invalid reviewed return.');
    } else need(state.pending === null, 'Unexpected pending action.');
    need(state.phase === 'ended' ? typeof state.ending === 'string' && state.ending.length < 1000 : state.ending === null, 'Invalid ending.');
    need(Array.isArray(state.log) && state.log.length <= 80 && state.log.every(entry => entry && decimal(entry.round) && decimal(entry.cycle) && typeof entry.text === 'string' && entry.text.length <= 1000), 'Invalid bounded log.');
    return true;
  }
  function importSave(text) {
    need(typeof text === 'string' && text.length <= 5000000, 'Save must be text under 5 MB.');
    const state = JSON.parse(text);
    validate(state);
    return clone(state);
  }
  function exportSave(state) { validate(state); return JSON.stringify(state, null, 2); }
  return {data, create, transition, validate, importSave, exportSave, seats, offers, preview, clone};
});
