// Pure layout and outcomes for DeliveryScene and ChoiceOverlay: state in, positions and views out. No Phaser.
// DELIVER takes every chosen soul at once and each is checked after the one before, so eligibility
// comes from test-running the whole list, not from deliveryReason on the current state.
// Text comes in as t: src/text.js imports JSON, so a Node tool could not load this file otherwise.
import { SLOT, destinationName, layoutBoarding, soulName, tokenLabels } from './boarding-layout.js';

export const DOCK = { x: 300, y: 345, w: 520, h: 430 };
// A stop: land on the left with the dock at its edge, the river from there to the right. CrossingScene
// draws the same scenery (stopScenery), so arriving at a stop and opening DeliveryScene look like one place.
export const RIVER = { y: 300, h: 250, color: 0x15303c };
export const BANK = { right: DOCK.x + DOCK.w / 2, color: 0x2a2418 };

/** The bank and the river band of a stop as rectangles {x, y, w, h} (centres), for a frame whose top left is origin. */
export function stopScenery(origin = { x: 0, y: 0 }) {
  return {
    bank: { x: origin.x + BANK.right / 2, y: origin.y + 360, w: BANK.right, h: 720, color: BANK.color },
    river: { x: origin.x + (BANK.right + 1280) / 2, y: origin.y + RIVER.y, w: 1280 - BANK.right, h: RIVER.h, color: RIVER.color },
  };
}
export const REWARD = { w: 220, h: 150, gap: 20, y: 360 };

const DOCK_SPOT = { x: 130, y: 258, cellW: 130, cellH: 150, cols: 3 }; // the first row's names clear the Dock sign
const TIGHT_STEP = 96; // below this the names in the row would touch, so every other one sits higher
const ROW_EDGE = 0.3; // how far past the last seat the row may reach with Longs aboard, in seat widths: clear of the ferryman
const ROWS = { left: 60, width: 1160, top: 210, rowH: 84, gap: 10, perCol: 5 };

const dockSpot = (i) => ({
  x: DOCK_SPOT.x + (i % DOCK_SPOT.cols) * DOCK_SPOT.cellW,
  y: DOCK_SPOT.y + Math.floor(i / DOCK_SPOT.cols) * DOCK_SPOT.cellH,
});

/**
 * Where each passenger rides. Every soul shares one row on the deck: the Longs from the left, then the seats in order.
 * Longs take no seat, so with Longs aboard the row tightens to fit between the lantern and the ferryman.
 * Shared with CrossingScene.
 */
export function boatSpots(state, Ferry) {
  const { slots } = layoutBoarding(state, Ferry);
  const seatStep = SLOT.w + SLOT.gap;
  const riders = state.boat.filter((actor) => Ferry.actorSeats(actor) === 0);
  const seats = state.boat.reduce((n, actor) => n + Ferry.actorSeats(actor), 0);
  const first = slots[0].x; // the lantern stands just left of this, so nobody sits behind it
  const last = slots[slots.length - 1].x + ROW_EDGE * seatStep;
  const places = riders.length + seats;
  const step = riders.length ? Math.min(seatStep, (last - first) / Math.max(1, places - 1)) : seatStep;
  const placeX = (i) => first + i * step;
  const tierOf = (place) => (step < TIGHT_STEP ? place % 2 : 0);
  let seat = riders.length;
  const spots = state.boat.map((actor) => {
    const span = Ferry.actorSeats(actor);
    const place = span ? seat : riders.indexOf(actor);
    const x = span ? (placeX(seat) + placeX(seat + span - 1)) / 2 : placeX(place);
    seat += span;
    return { id: actor.id, actor, span, x, y: slots[0].y, tier: tierOf(place) };
  });
  return { spots, slots };
}

/**
 * Every passenger with its spot. canLeave is the engine's answer for that soul joining the marked list. Any soul may
 * leave at any stop (a Long too, Long Grasp only from Anger 2; heroes only at their wish), but only wishMatches gives
 * its memory, quest step or fare.
 */
export function layoutDelivery(state, marked, Ferry) {
  const { spots, slots } = boatSpots(state, Ferry);
  const entries = spots.map(({ id, actor, span, tier, x, y }) => {
    const i = marked.indexOf(id);
    return {
      id,
      actor,
      area: i >= 0 ? 'dock' : 'seat',
      ...(i >= 0 ? dockSpot(i) : { x, y }),
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

/** The marked souls that leave away from their wish cost 1 Light each, and Guard cannot stop it. A warning, before confirming, when that would put the lantern out. */
export function exitWarning(state, marked, Ferry, t) {
  const strays = marked.filter((id) => {
    const actor = state.boat.find((x) => x.id === id);
    return actor && Ferry.wish(actor) !== state.destination;
  }).length;
  return strays > 0 && strays >= state.light ? t('delivery.exitWarning', { n: strays, light: state.light }) : '';
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
