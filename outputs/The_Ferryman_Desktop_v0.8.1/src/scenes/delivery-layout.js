// Pure layout and outcomes for DeliveryScene and ChoiceOverlay: state in, positions and views out. No Phaser.
// DELIVER takes every chosen soul at once and each is checked after the one before, so eligibility
// comes from test-running the whole list, not from deliveryReason on the current state.
// Text comes in as t: src/text.js imports JSON, so a Node tool could not load this file otherwise.
import { SLOT, STAGE, TOKEN, destinationName, layoutStage, soulName, tokenLabels } from './boarding-layout.js';

export const REWARD = { w: 220, h: 150, gap: 20, y: 360 };

// At a stop the pier is on the right, at the screen edge, and the boat pulls up to it: the whole boat sits STOP_SHIFT left of
// where it sits at the starting shore. CrossingScene parks there too, so the change of scene shows no jump.
export const STOP_SHIFT = 350;
const SHORE_LEFT = 940; // the row of souls ashore starts here, on the pier, clear of the boat
const SHORE_WIDTH = 280; // and stops here, inside the screen
const SHORE_FEET = 500; // they stand on the pier's boards, above the panel
export const SHORE_Y = SHORE_FEET - TOKEN.h / 2;
const TIGHT_STEP = 78; // below this the names in the row would touch, so every other one sits higher
// A name label wraps at 96 px (soul-token.js); this guesses its width from its letters, so two wide names side by side
// (Long Grasp next to Merchant, #56) also lift every other name, while short names keep the row level.
const NAME = { charPx: 11, maxPx: 96, gapPx: 6 };
const nameWidth = (actor, Ferry) => Math.min(NAME.maxPx, soulName(actor.type, Ferry).length * NAME.charPx);
const ROW_EDGE = { left: 0.2, right: 0.6 }; // how far past the end seats the row reaches with Longs aboard, in seat steps: between the lantern and the ferryman
const ROWS = { left: 60, width: 1160, top: 210, rowH: 84, gap: 10, perCol: 5 };

/** A soul on the pier, spaced like BoardingScene's shore row, tighter if more leave than the row holds. */
const shoreSpot = (i, count) => ({
  x: SHORE_LEFT + i * Math.min(STAGE.shoreStep, SHORE_WIDTH / Math.max(1, count - 1)),
  y: SHORE_Y,
});

/** BoardingScene's seats, as the slots the row below and CrossingScene's world are measured from. */
const deckSlots = (state, Ferry) => layoutStage(state, Ferry).seats.map((seat) => ({ x: seat.x, y: seat.y - TOKEN.h / 2, w: SLOT.w, h: SLOT.h }));

/**
 * Where each passenger rides. Every soul shares one row on the deck: all the Longs from the left, then the others.
 * Most Longs take no seat, so with one aboard the row tightens to fit between the lantern and the ferryman.
 * Shared with CrossingScene.
 */
export function boatSpots(state, Ferry) {
  const slots = deckSlots(state, Ferry);
  const seatStep = STAGE.seatStep;
  const riders = state.boat.filter((actor) => Ferry.actorSeats(actor) === 0);
  const seats = state.boat.reduce((n, actor) => n + Ferry.actorSeats(actor), 0);
  const first = slots[0].x - (riders.length ? ROW_EDGE.left * seatStep : 0);
  const last = slots[slots.length - 1].x + ROW_EDGE.right * seatStep;
  const places = riders.length + seats;
  const step = riders.length ? Math.min(seatStep, (last - first) / Math.max(1, places - 1)) : seatStep;
  const placeX = (i) => first + i * step;
  const isLong = (actor) => Ferry.isTainted(actor);
  const widthOf = (actor) => Math.max(1, Ferry.actorSeats(actor));
  const order = [...state.boat.filter(isLong), ...state.boat.filter((actor) => !isLong(actor))];
  let place = 0;
  const row = order.map((actor) => {
    const spot = { actor, x: (placeX(place) + placeX(place + widthOf(actor) - 1)) / 2, place };
    place += widthOf(actor);
    return spot;
  });
  const namesTouch = row.some((s, i) => i > 0
    && (nameWidth(s.actor, Ferry) + nameWidth(row[i - 1].actor, Ferry)) / 2 + NAME.gapPx > s.x - row[i - 1].x);
  const tierOf = (place) => (step < TIGHT_STEP || namesTouch ? place % 2 : 0);
  const placed = new Map(row.map((s) => [s.actor.id, { x: s.x, tier: tierOf(s.place) }]));
  const spots = state.boat.map((actor) => ({ id: actor.id, actor, span: Ferry.actorSeats(actor), y: slots[0].y, ...placed.get(actor.id) }));
  return { spots, slots };
}

/**
 * Every passenger with its spot. canLeave is the engine's answer for that soul joining the marked list. Any soul may
 * leave at any stop (a Long too, Long Grasp only from Anger 2; heroes only at their wish), but only wishMatches gives
 * its memory, quest step or fare.
 */
export function layoutDelivery(state, marked, Ferry) {
  const parked = boatSpots(state, Ferry);
  const spots = parked.spots.map((s) => ({ ...s, x: s.x - STOP_SHIFT }));
  const slots = parked.slots.map((s) => ({ ...s, x: s.x - STOP_SHIFT }));
  const entries = spots.map(({ id, actor, span, tier, x, y }) => {
    const i = marked.indexOf(id);
    return {
      id,
      actor,
      area: i >= 0 ? 'shore' : 'seat',
      ...(i >= 0 ? shoreSpot(i, marked.length) : { x, y }),
      span,
      tier: i >= 0 ? 0 : tier,
      canLeave: i >= 0 || testRun(state, [...marked, id], Ferry).ok,
      wishMatches: Ferry.wish(actor) === state.destination,
      labels: tokenLabels({ actor, draggable: false }, Ferry), // draggable false picks the ship limit
    };
  });
  return { entries, slots };
}

export const deliverAction = (marked) => ({ type: 'DELIVER', ids: marked });

// A soul that ends the run stops DELIVER there, so the engine never judges the souls after it.
// The last soul is unreached when it is still aboard and the run already ends without it; a soul
// that ends the run itself stays allowed, as the engine allows it.
export function testRun(state, ids, Ferry) {
  // Every render asks the same questions of the same state (layout, valid marks, refusals), so answers are kept per
  // state object; a changed state is a new object and starts empty. A state is plain data, so a cache hit is safe.
  let runs = testRuns.get(state);
  if (!runs) testRuns.set(state, (runs = new Map()));
  const key = ids.join('|');
  if (!runs.has(key)) runs.set(key, runTest(state, ids, Ferry));
  return runs.get(key);
}
const testRuns = new WeakMap();

function runTest(state, ids, Ferry) {
  try {
    const next = Ferry.transition(state, deliverAction(ids));
    const stopped = next.phase === 'ended' && next.boat.some((x) => x.id === ids[ids.length - 1]);
    const unreached = stopped && ids.length > 1 && Ferry.transition(state, deliverAction(ids.slice(0, -1))).phase === 'ended';
    return { ok: !unreached, unreached };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

/**
 * After a memory changes the state at delivery (Passenger takes a soul, Sword removes one), the marked list keeps
 * only souls still aboard, and drops each mark the engine no longer accepts, in order, so the valid ones after an
 * invalid one stay.
 */
export function keepValidMarks(state, marked, Ferry) {
  const kept = [];
  for (const id of marked) {
    if (state.boat.some((x) => x.id === id) && testRun(state, [...kept, id], Ferry).ok) kept.push(id);
  }
  return kept;
}

/** The engine's reason the last soul of this list can't leave, or null if it can. */
export function refusal(state, ids, Ferry, t) {
  const { ok, reason, unreached } = testRun(state, ids, Ferry);
  if (ok) return null;
  if (!unreached) return reason;
  const last = state.boat.find((x) => x.id === ids[ids.length - 1]);
  return Ferry.deliveryReason(state, last) ?? t('delivery.runEnds');
}

/** What a click on a soul does to the marked list: a seated soul is marked, a soul on the dock goes back. Unmarking rechecks the rest, in order, and says why a soul went back. */
export function toggleMark(state, marked, entry, Ferry, t) {
  if (entry.area === 'seat') {
    const ids = [...marked, entry.id];
    const reason = refusal(state, ids, Ferry, t);
    return reason ? { marked, reason } : { marked: ids, reason: null };
  }
  const kept = [];
  let reason = null;
  for (const id of marked) {
    if (id === entry.id) continue;
    const refused = refusal(state, [...kept, id], Ferry, t);
    if (refused) reason ??= refused;
    else kept.push(id);
  }
  return { marked: kept, reason };
}

export const headingText = (state, Ferry, t) => t('delivery.heading', { place: destinationName(state.destination, Ferry) });

export const introText = (state, t) => t(state.boat.length ? 'delivery.intro' : 'delivery.emptyBoat');

/**
 * What the marked souls do to the Light as they leave, before the rest of the round runs. It mirrors the engine's
 * deliver() and resolveDelivery() (rules/engine.js): the Mason leaves last; a Long Grasp at level 3 or more does 1 damage,
 * which Guard can absorb; a soul away from its wish costs 1 Light, which Guard cannot stop; a Long Mist at its wish,
 * Tartarus, pays 1 Light. The rest of DELIVER (Anger, Wraiths, thefts) is left out on purpose: it is not the cost of
 * leaving, and test-running it would show the round's random outcome before the player confirms (QA-01, #56).
 * The engine stops at the soul that puts the lantern out; strays still counts every marked soul away from its wish,
 * as the warning always has. check-delivery compares this with the engine.
 */
export function exitCost(state, marked, Ferry) {
  const aboard = marked.map((id) => state.boat.find((x) => x.id === id)).filter(Boolean);
  const order = [...aboard.filter((x) => x.type !== 'SOUL-MASON'), ...aboard.filter((x) => x.type === 'SOUL-MASON')];
  let light = state.light;
  let guard = state.window?.guard ?? 0;
  let strays = 0;
  for (const x of order) {
    const away = Ferry.wish(x) !== state.destination;
    if (away) strays++;
    if (!light) continue; // the run has already ended here
    if (x.type === 'SOUL-PO-DUE' && x.level >= 3) {
      const prevented = Math.min(1, guard);
      guard -= prevented;
      light -= Math.min(light, 1 - prevented);
      if (!light) continue;
    }
    if (away) light -= 1;
    else if (x.type === 'SOUL-POLONG' && !x.spread && state.destination === 'DEST-TARTARUS') light = Math.min(state.maxLight, light + 1);
  }
  return { strays, light: state.light, after: light, ends: light <= 0 };
}

/** The red warning before confirming: the marked souls leaving away from their wish would put the lantern out. */
export function exitWarning(state, marked, Ferry, t) {
  const cost = exitCost(state, marked, Ferry);
  return cost.strays > 0 && cost.ends ? t('delivery.exitWarning', { n: cost.strays, light: state.light }) : '';
}

/** A plain line under the intro whenever a marked soul leaves away from its wish and the lantern survives it (QA-01, #56). */
export function exitCostLine(state, marked, Ferry, t) {
  const cost = exitCost(state, marked, Ferry);
  return cost.strays > 0 && !cost.ends && cost.after < cost.light ? t('delivery.exitCost', { n: cost.strays, light: cost.light, after: cost.after }) : '';
}

export function confirmLabel(state, marked, t) {
  if (!state.boat.length) return t('delivery.finishRound');
  return t(marked.length ? 'delivery.deliverSelected' : 'delivery.keepEveryone');
}

const memoryView = (m, Ferry) => {
  const def = Ferry.data.memories.find((d) => d.id === m.type);
  return { id: m.id, type: m.type, name: def?.name ?? m.type, text: def?.text ?? '' };
};

/**
 * What to play before dispatching action (DELIVER, or CHOOSE from ChoiceOverlay). A lethal DELIVER stops partway,
 * so departed can be shorter than marked.
 * Passengers who stay can turn into Wraiths inside DELIVER. A lethal one ends the run, and souls after it stay aboard unchanged.
 * A Po Luem at level 3 steals inside DELIVER with no choice to show, from any memory, even one just received.
 * The memory the player picks for a Po Luem is not listed as lost; Charybdis's pick is.
 */
export function arrivalOutcome(state, next, action, Ferry) {
  const marked = action.ids ?? [];
  const aboard = new Set(next.boat.map((x) => x.id));
  const held = new Set(state.hand.map((m) => m.id));
  const kept = new Set(next.hand.map((m) => m.id));
  const rewards = next.hand.filter((m) => !held.has(m.id)).map((m) => memoryView(m, Ferry));
  const expired = state.boat.filter((x) => !aboard.has(x.id) && !marked.includes(x.id));
  const departed = marked.filter((id) => !aboard.has(id));
  return {
    departed,
    rewards,
    strays: departed.map((id) => state.boat.find((x) => x.id === id)).filter((x) => strayed(state, x, Ferry))
      .map((x) => ({ name: soulName(x.type, Ferry), wish: destinationName(Ferry.wish(x), Ferry) })),
    wraiths: expired.map((x) => soulName(x.type, Ferry)),
    // A quest that failed here (a soul left before its wish, became a Wraith, ...), with the engine's own reason.
    failedQuests: (state.quests ?? []).filter((q) => q.status === 'active' && next.quests?.find((n) => n.id === q.id)?.status === 'failed')
      .map((q) => ({ name: Ferry.data.quests.find((d) => d.id === q.definitionId)?.name ?? q.definitionId, reason: next.quests.find((n) => n.id === q.id).reason })),
    ...lightChange(state, next, action, departed, Ferry),
    lost: state.hand.filter((m) => !kept.has(m.id) && m.id !== action.id).map((m) => memoryView(m, Ferry)),
    takenBy: action.branch === 'charybdis' ? 'charybdis' : 'SOUL-PO-LUEM',
    stolenRewards: Number(next.nextMemory) - Number(state.nextMemory) - rewards.length,
  };
}

// A soul that left at a stop other than its wish, and so gave none of the memory it carries.
function strayed(state, actor, Ferry) {
  const memory = Ferry.data.souls.find((d) => d.id === actor.type)?.memory;
  return Boolean(memory) && Ferry.wish(actor) !== state.destination;
}

// The net change would let a Po Long's +1 hide a Wraith's -1 at the same stop. Light is only gained here by a
// delivery, so with someone departed the same action is run again with the lantern full, where a gain has no
// room, and only what it cost shows. A run that ends spent all the Light there was.
function lightChange(state, next, action, departed, Ferry) {
  if (next.phase === 'ended') return { lightLost: state.light, lightGained: 0 };
  if (!departed.length) return { lightLost: Math.max(0, state.light - next.light), lightGained: 0 };
  const full = Ferry.transition({ ...state, light: state.maxLight }, action);
  const lightLost = state.maxLight - full.light;
  return { lightLost, lightGained: next.light - state.light + lightLost };
}

/** Memories not given first, then Wraiths and Light, then memories taken. A gain shows only beside a loss, which it would otherwise hide. */
export function lossLines({ strays = [], failedQuests = [], wraiths, lightLost, lightGained, lost, takenBy, stolenRewards }, t, Ferry) {
  const thief = takenBy === 'charybdis' ? t('choice.charybdis') : soulName(takenBy, Ferry);
  return [
    ...strays.map(({ name, wish }) => t('delivery.noMemory', { name, wish })),
    ...failedQuests.map(({ name, reason }) => t('delivery.questFailed', { name, reason })),
    ...wraiths.map((name) => t('delivery.wraith', { name })),
    ...(lightLost ? [t('delivery.lightLost', { amount: lightLost })] : []),
    ...(lightLost && lightGained ? [t('delivery.lightGained', { amount: lightGained })] : []),
    ...lost.map(({ name }) => t('delivery.lost', { thief, name })),
    ...Array.from({ length: stolenRewards }, () => t('delivery.lostReward', { thief })),
  ];
}

/** A centred row of reward cards. */
export function rewardSpots(n) {
  const rowW = n * REWARD.w + (n - 1) * REWARD.gap;
  return Array.from({ length: n }, (_, i) => ({ x: 640 - rowW / 2 + REWARD.w / 2 + i * (REWARD.w + REWARD.gap), y: REWARD.y }));
}

// Art ids for Odysseus's two options. There is no Charybdis file yet, so that card shows its name plate.
export const CHOICE_ART = { charybdis: 'sprite-charybdis', zilla: 'sprite-scylla' };

/** The pending choice in display form, with the action each button dispatches. */
export function choiceView(state, Ferry, t) {
  if (state.choice.kind === 'odysseus') {
    const option = (branch) => {
      const name = t(`choice.${branch}`);
      return {
        name,
        cost: t(`choice.${branch}Cost`),
        reward: t(`choice.${branch}Reward`),
        art: CHOICE_ART[branch],
        label: t('memory.choose', { name }),
        action: { type: 'CHOOSE', branch },
      };
    };
    return { kind: 'odysseus', heading: t('choice.odysseusHeading'), intro: t('choice.odysseusIntro'), options: [option('charybdis'), option('zilla')] };
  }
  return {
    kind: 'memory-loss',
    heading: t('choice.theftHeading'),
    intro: t('choice.theftIntro'),
    rows: state.hand.map((m) => {
      const view = memoryView(m, Ferry);
      return { ...view, label: t('choice.lose', { name: view.name }), action: { type: 'CHOOSE', id: m.id } };
    }),
  };
}

/**
 * Rows for held memories. The hand can be over the limit here, so rows wrap into columns. heights[i] is how tall
 * row i's text is; a row taller than ROWS.rowH pushes the rows below it down, so long memory text is never cut.
 */
export function memoryRowSpots(n, heights = []) {
  const cols = Math.max(1, Math.ceil(n / ROWS.perCol));
  const w = ROWS.width / cols;
  let y = ROWS.top;
  return Array.from({ length: n }, (_, i) => {
    if (i % ROWS.perCol === 0) y = ROWS.top;
    const spot = { x: ROWS.left + Math.floor(i / ROWS.perCol) * w, y, w };
    y += Math.max(ROWS.rowH, (heights[i] ?? 0) + ROWS.gap);
    return spot;
  });
}
