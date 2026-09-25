/* The Ferryman, base paper trial v0.2. No optional modules or hidden randomness.
 * Source: The_Ferryman_Design_Workbook.md, sections 5 to 10, 17 September 2026.
 * Costs are paid in Load; rewards cannot finance departure; failure stops phases.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.FerrymanEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SOULS = [
    {id:'S01',name:'Mother',seats:2,fare:0,standing:1,partner:'S02',residue:'R06 solo / R05 joint',effect:'Linked to Child. Together: each leaves Joined Memory. If only one boards while both are on shore, the waiting partner gains one extra refusal.',flavor:'I told him I would be there when he woke.'},
    {id:'S02',name:'Child',seats:1,fare:0,standing:1,partner:'S01',residue:'R06 solo / R05 joint',effect:'Linked to Mother. Together: each leaves Joined Memory. If only one boards while both are on shore, the waiting partner gains one extra refusal.',flavor:'Will the boat remember the way back?'},
    {id:'S03',name:'Merchant',seats:1,fare:1,standing:0,partner:null,residue:'R02',effect:'No aboard effect.',flavor:'The coin is yours. The name on it is mine.'},
    {id:'S04',name:'Red Soldier',seats:2,fare:1,standing:0,partner:null,residue:'R04',effect:'With Blue Soldier aboard, add 1 conflict pressure once per boat.',flavor:'Someone on this shore knows what happened.'},
    {id:'S05',name:'Poet',seats:1,fare:0,standing:1,partner:null,residue:'R03',effect:'Grant 1 protection if at least two other souls are aboard.',flavor:'Let me tell their names while there is still time.'},
    {id:'S06',name:'Blue Soldier',seats:1,fare:1,standing:0,partner:null,residue:'R04',effect:'With Red Soldier aboard, add 1 conflict pressure once per boat.',flavor:'The war has ended for everyone except us.'},
    {id:'S07',name:'Cook',seats:1,fare:0,standing:1,partner:null,residue:'R03',effect:'No aboard effect.',flavor:'I made enough for everyone. I always did.'},
    {id:'S08',name:'Mason',seats:2,fare:1,standing:0,partner:null,residue:'R02',effect:'No aboard effect.',flavor:'There is one wall I never finished.'},
    {id:'S09',name:'Messenger',seats:1,fare:1,standing:0,partner:null,residue:'R01',effect:'No aboard effect.',flavor:'I arrived too late. The message did not.'},
    {id:'S10',name:'Keeper',seats:2,fare:0,standing:1,partner:null,residue:'R01',effect:'Grant 1 protection if this is the only passenger.',flavor:'I kept the light burning for someone else.'},
    {id:'S11',name:'Musician',seats:1,fare:0,standing:1,partner:'S12',residue:'R06 solo / R05 joint',effect:'Linked to Listener. Together: each leaves Joined Memory. If only one boards while both are on shore, the waiting partner gains one extra refusal.',flavor:'The last verse belongs to someone here.'},
    {id:'S12',name:'Listener',seats:1,fare:1,standing:0,partner:'S11',residue:'R06 solo / R05 joint',effect:'Linked to Musician. Together: each leaves Joined Memory. If only one boards while both are on shore, the waiting partner gains one extra refusal.',flavor:'I never told her I knew the song.'}
  ];
  const RESIDUES = [
    {id:'R01',name:'Steadiness',effect:'Grant 2 protection.'},
    {id:'R02',name:'Vigil',effect:'Grant 3 protection if any passenger has printed seat cost 2; otherwise grant 0.'},
    {id:'R03',name:'Recollection',effect:'Prevent one waiting soul’s normal refusal. Extra separation refusal still applies.'},
    {id:'R04',name:'Accord',effect:'Cancel the Red and Blue Soldiers’ conflict, and grant 1 protection.'},
    {id:'R05',name:'Joined Memory',effect:'Grant 2 protection and prevent one waiting soul’s normal refusal. Extra separation refusal still applies.'},
    {id:'R06',name:'Faint Memory',effect:'Grant 1 protection.'}
  ];
  const ROUTES = [
    {id:'EL01',name:'Elysium',toll:1,pressure:0,theme:'Preservation'},
    {id:'AS01',name:'Asphodel',toll:0,pressure:1,theme:'Release and belonging'},
    {id:'TA01',name:'Tartarus',toll:0,pressure:2,theme:'Reckoning'}
  ];
  SOULS.forEach(Object.freeze);
  RESIDUES.forEach(Object.freeze);
  ROUTES.forEach(Object.freeze);
  Object.freeze(SOULS); Object.freeze(RESIDUES); Object.freeze(ROUTES);
  const byId = Object.fromEntries(SOULS.map(s => [s.id, s]));
  const residuesById = Object.fromEntries(RESIDUES.map(r => [r.id, r]));

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  // Start-of-crossing phases preserve waiting counts and every card's order.
  function prepareCrossing(state) {
    const added = [];
    while (state.shore.length < 5 && state.supply.length) {
      const id = state.supply.shift();
      state.shore.push({id, refusals:0}); added.push(id);
    }
    const recalled = [];
    while (state.hand.length < 2) {
      if (!state.queue.length && state.discard.length) {
        state.queue = state.discard; state.discard = [];
      }
      if (!state.queue.length) break;
      const card = state.queue.shift();
      state.hand.push(card); recalled.push(card.key);
    }
    return {added, recalled};
  }

  function createGame() {
    const state = {version:'0.2',crossing:1,status:'playing',lossReason:null,
      obols:2,standing:3,shore:[],supply:SOULS.map(s => s.id),wraiths:[],
      queue:[],hand:[],discard:[],history:[],log:[]};
    prepareCrossing(state);
    return state;
  }

  function preview(state, selection) {
    selection = selection || {};
    const errors = [];
    if (state.status !== 'playing') errors.push('This run has ended. Start a new run to make another crossing.');
    const route = ROUTES.find(r => r.id === selection.routeId);
    if (!route) errors.push('Choose a destination.');
    const rawIds = Array.isArray(selection.soulIds) ? selection.soulIds : [];
    if (!Array.isArray(selection.soulIds)) errors.push('Choose passengers using a list of soul IDs.');
    if (new Set(rawIds).size !== rawIds.length) errors.push('A soul cannot board twice.');
    const shoreIds = new Set(state.shore.map(s => s.id));
    for (const id of rawIds) {
      if (!shoreIds.has(id)) errors.push(`${id} is not available on the shore.`);
    }
    // Ascending source ID is also the mandatory arrival queue order.
    const passengerIds = [...new Set(rawIds)].filter(id => shoreIds.has(id) && byId[id]).sort();
    const passengers = passengerIds.map(id => byId[id]);
    const boarded = new Set(passengerIds);
    const seats = passengers.reduce((sum, s) => sum + s.seats, 0);
    if (seats > 4) errors.push(`The boat holds 4 seats; this load uses ${seats}.`);
    const memoryKey = selection.memoryKey || null;
    const memory = memoryKey ? state.hand.find(m => m.key === memoryKey) : null;
    if (memoryKey && !memory) errors.push('That memory is not in your hand.');
    if (memory && !residuesById[memory.type]) errors.push('That memory has an unknown residue type.');
    const memoryCost = memory ? 1 : 0;
    const toll = route ? route.toll : 0;
    if (toll > state.obols) errors.push('Pay the toll from your current obols. Arrival fares cannot pay for departure.');
    if (memoryCost > state.standing) errors.push('Playing a memory costs 1 current Standing.');
    const mayTarget = Boolean(memory && (memory.type === 'R03' || memory.type === 'R05'));
    const waitingSouls = state.shore.filter(s => !boarded.has(s.id));
    const targetId = selection.targetId || null;
    if (mayTarget && waitingSouls.length && !waitingSouls.some(s => s.id === targetId)) {
      errors.push('Choose one soul staying ashore for this memory.');
    }
    if (targetId && (!mayTarget || !waitingSouls.some(s => s.id === targetId))) {
      errors.push('The memory target must be a waiting soul and the memory must prevent normal refusal.');
    }
    const protectionSources = [];
    const protect = (label, value) => { if (value) protectionSources.push({label,value}); };
    if (boarded.has('S05') && passengerIds.length >= 3) protect('Poet', 1);
    if (boarded.has('S10') && passengerIds.length === 1) protect('Keeper', 1);
    if (memory) {
      const protectionByType = {R01:2,R02:passengers.some(s => s.seats === 2) ? 3 : 0,R03:0,R04:1,R05:2,R06:1};
      protect(residuesById[memory.type] ? residuesById[memory.type].name : memory.type, protectionByType[memory.type] || 0);
    }
    const protection = protectionSources.reduce((sum, item) => sum + item.value, 0);
    const routePressure = route ? route.pressure : 0;
    const wraithPressure = state.wraiths.length;
    const conflictPressure = boarded.has('S04') && boarded.has('S06') && (!memory || memory.type !== 'R04') ? 1 : 0;
    const pressure = Math.max(0, routePressure + wraithPressure + conflictPressure - protection);
    const standingAfterLoad = state.standing - memoryCost;
    const obolsAfterLoad = state.obols - toll;
    const pressureFail = standingAfterLoad < pressure;
    // Failure does not subtract unaffordable pressure or produce negative resources.
    const standingAfterCross = pressureFail ? standingAfterLoad : standingAfterLoad - pressure;
    const fares = passengers.reduce((sum, s) => sum + s.fare, 0);
    const standingYield = passengers.reduce((sum, s) => sum + s.standing, 0);
    const service = route && route.id === 'TA01' && passengerIds.length ? 1 : 0;
    const quotaDue = state.crossing === 3 || state.crossing === 6 ? 3 : 0;
    const arrivalObols = obolsAfterLoad + fares + service;
    const quotaFail = !pressureFail && quotaDue > arrivalObols;
    const wouldFail = pressureFail ? 'pressure' : quotaFail ? 'quota' : null;
    const projectedObols = pressureFail ? obolsAfterLoad : quotaFail ? arrivalObols : arrivalObols - quotaDue;
    const projectedStanding = pressureFail ? standingAfterCross : standingAfterCross + standingYield;
    const waiting = waitingSouls.map(s => {
      const soul = byId[s.id];
      const prevented = mayTarget && s.id === targetId;
      const normal = prevented ? 0 : 1;
      const separation = soul.partner && shoreIds.has(soul.partner) && boarded.has(soul.partner) ? 1 : 0;
      const after = s.refusals + normal + separation;
      return {id:s.id,before:s.refusals,normal,separation,after,becomesWraith:after >= 3,prevented};
    });
    const newMemories = passengers.map(s => ({
      key:`memory-${s.id}`, sourceId:s.id,
      type:s.partner ? boarded.has(s.partner) ? 'R05' : 'R06' : s.residue
    }));
    return {valid:errors.length === 0, errors, seats,toll,memoryCost,routePressure,wraithPressure,conflictPressure,
      protection,protectionSources,pressure,standingAfterLoad,standingAfterCross,obolsAfterLoad,
      fares,standingYield,service,quotaDue,projectedObols,projectedStanding,wouldFail,
      waiting,newMemories,passengerIds,mayTarget};
  }

  function resolve(state, selection) {
    const planned = preview(state, selection);
    if (!planned.valid) throw new Error(planned.errors.join(' '));
    const next = clone(state);
    const route = ROUTES.find(r => r.id === selection.routeId);
    const memory = selection.memoryKey ? next.hand.find(m => m.key === selection.memoryKey) : null;
    const crossing = next.crossing;
    const result = {
      ...clone(planned),crossing,routeId:route.id,memory:memory ? clone(memory) : null,
      targetId:selection.targetId || null,
      before:{obols:next.obols,standing:next.standing},after:null,
      outcome:'playing',steps:[]
    };
    const step = (phase, text) => result.steps.push({phase,text});
    const finish = () => {
      result.after = {obols:next.obols,standing:next.standing};
      result.outcome = next.status === 'lost' ? next.lossReason : next.status;
      // Failure records planned values separately; these arrays represent applied changes.
      next.log.push(clone(result));
      return {state:next,result};
    };
    next.obols = planned.obolsAfterLoad;
    next.standing = planned.standingAfterLoad;
    step('Load', `Depart for ${route.name} with ${planned.passengerIds.length} soul${planned.passengerIds.length === 1 ? '' : 's'} using ${planned.seats}/4 seats. Pay ${planned.toll} obols and ${planned.memoryCost} Standing.`);
    if (planned.wouldFail === 'pressure') {
      next.status = 'lost'; next.lossReason = 'pressure';
      result.plannedWaiting = result.waiting; result.waiting = [];
      result.plannedMemories = result.newMemories; result.newMemories = [];
      step('Cross', `Pressure ${planned.pressure} exceeds remaining Standing ${next.standing}. The run ends before arrival. No arrival rewards, quota, decay, or cleanup occurs.`);
      return finish();
    }
    next.standing = planned.standingAfterCross;
    step('Cross', `Pressure ${planned.pressure} is paid from Standing. ${next.standing} Standing remains.`);
    next.obols += planned.fares + planned.service;
    next.standing += planned.standingYield;
    const boarded = new Set(planned.passengerIds);
    next.shore = next.shore.filter(s => !boarded.has(s.id));
    for (const card of planned.newMemories) {
      next.queue.push(clone(card));
      next.history.push({crossing,routeId:route.id,soulId:card.sourceId,residueType:card.type});
    }
    step('Arrive', `${planned.passengerIds.length} soul${planned.passengerIds.length === 1 ? '' : 's'} arrive. Gain ${planned.fares} fare obols, ${planned.service} service obols, ${planned.standingYield} Standing, and ${planned.newMemories.length} memories.`);
    if (planned.quotaDue) {
      if (next.obols < planned.quotaDue) {
        next.status = 'lost'; next.lossReason = 'quota';
        result.plannedWaiting = result.waiting; result.waiting = [];
        step('Quota', `The 3-obol quota cannot be paid from ${next.obols} obols. The run ends after arrival. No decay or cleanup occurs.`);
        return finish();
      }
      next.obols -= planned.quotaDue;
      step('Quota', `Pay the 3-obol quota. ${next.obols} obols remain.`);
    } else step('Quota', 'No quota is due on this crossing.');
    const newlyWraith = [];
    next.shore = planned.waiting.filter(item => {
      if (item.becomesWraith) {
        next.wraiths.push({id:item.id,since:crossing + 1});
        newlyWraith.push(item.id); return false;
      }
      return true;
    }).map(item => ({id:item.id,refusals:item.after}));
    step('Decay', planned.waiting.length
      ? `${planned.waiting.map(item => `${item.id}: ${item.before} to ${item.after} refusals${item.prevented ? ' (normal refusal prevented)' : ''}${item.separation ? ' (includes separation)' : ''}`).join('; ')}.${newlyWraith.length ? ` New wraiths: ${newlyWraith.join(', ')}. Their pressure begins next crossing.` : ''}`
      : 'No souls remain waiting.');
    if (memory) next.discard.push(clone(memory));
    next.hand.filter(card => !memory || card.key !== memory.key).forEach(card => next.discard.push(card));
    next.hand = [];
    step('Cleanup', `Discard ${memory ? 'the played memory first, then ' : ''}unplayed hand cards in order.`);
    if (crossing === 6) {
      next.status = 'won';
      step('End', 'Six crossings completed and both quotas paid. The trial is complete.');
    } else {
      next.crossing += 1;
      const prepared = prepareCrossing(next);
      step('Shore', `Crossing ${next.crossing}: ${prepared.added.length ? 'add ' + prepared.added.join(', ') + ' from supply' : 'no new souls available'}. ${next.shore.length} souls are on shore.`);
      step('Recall', `Draw ${prepared.recalled.length} memories from the ordered queue, recycling oldest discard first only when the queue is empty.`);
    }
    return finish();
  }

  return Object.freeze({SOULS,RESIDUES,ROUTES,createGame,preview,resolve,clone});
});
