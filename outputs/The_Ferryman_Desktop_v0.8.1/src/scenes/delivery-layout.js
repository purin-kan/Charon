// Pure layout and outcomes for DeliveryScene and ChoiceOverlay: state in, positions and views out. No Phaser.
// DELIVER takes every chosen soul at once and each is checked after the one before, so eligibility
// comes from test-running the whole list, not from deliveryReason on the current state.
// Text comes in as t: src/text.js imports JSON, so a Node tool could not load this file otherwise.
import { SLOT, TOKEN, boatZone, destinationName, layoutBoarding, soulName, tokenLabels } from './boarding-layout.js';

export const DOCK = { x: 300, y: 345, w: 520, h: 430 };
export const REWARD = { w: 220, h: 150, gap: 20, y: 360 };

const DOCK_SPOT = { x: 130, y: 240, cellW: 130, cellH: 150, cols: 3 }; // the first row clears the Dock label
const DECK = { y: 470, width: 336 }; // souls with no seat ride here, inside the width of a four-seat hull
const ROWS = { left: 60, width: 1160, top: 210, rowH: 84, gap: 10, perCol: 5 };

const dockSpot = (i) => ({
  x: DOCK_SPOT.x + (i % DOCK_SPOT.cols) * DOCK_SPOT.cellW,
  y: DOCK_SPOT.y + Math.floor(i / DOCK_SPOT.cols) * DOCK_SPOT.cellH,
});

/** Every passenger with its spot. Seats fill in order; souls with no seat ride on the deck. canLeave is the engine's answer for that soul joining the marked list. */
export function layoutDelivery(state, marked, Ferry) {
  const { slots } = layoutBoarding(state, Ferry);
  const seatX = (i) => slots[0].x + i * (SLOT.w + SLOT.gap);
  const riders = state.boat.filter((actor) => Ferry.actorSeats(actor) === 0);
  const riderStep = Math.min(SLOT.w + SLOT.gap, DECK.width / Math.max(1, riders.length - 1));
  let seat = 0;
  const entries = state.boat.map((actor) => {
    const span = Ferry.actorSeats(actor);
    const aboard = span
      ? { x: (seatX(seat) + seatX(seat + span - 1)) / 2, y: slots[0].y }
      : { x: seatX(0) + riders.indexOf(actor) * riderStep, y: DECK.y };
    seat += span;
    const i = marked.indexOf(actor.id);
    return {
      id: actor.id,
      actor,
      area: i >= 0 ? 'dock' : 'seat',
      ...(i >= 0 ? dockSpot(i) : aboard),
      span,
      canLeave: i >= 0 || testRun(state, [...marked, actor.id], Ferry).ok,
      labels: tokenLabels({ actor, draggable: false }, Ferry), // draggable false picks the ship limit
    };
  });
  return { entries, slots };
}

const inside = (r, x, y) => Math.abs(x - r.x) <= r.w / 2 && Math.abs(y - r.y) <= r.h / 2;

/** The boat is the hull and the deck row below it, so a soul can go back to either. */
export function dropArea(x, y, slots) {
  if (inside(DOCK, x, y)) return 'dock';
  const hull = boatZone(slots);
  const top = hull.y - hull.h / 2;
  const bottom = DECK.y + TOKEN.h / 2;
  return inside({ x: hull.x, y: (top + bottom) / 2, w: hull.w, h: bottom - top }, x, y) ? 'boat' : null;
}

export const deliverAction = (marked) => ({ type: 'DELIVER', ids: marked });

// A soul that ends the run stops DELIVER there, so the engine never judges the souls after it.
// The last soul is unreached when it is still aboard and the run already ends without it; a soul
// that ends the run itself stays allowed, as the engine allows it.
function testRun(state, ids, Ferry) {
  try {
    const next = Ferry.transition(state, deliverAction(ids));
    const stopped = next.phase === 'ended' && next.boat.some((x) => x.id === ids[ids.length - 1]);
    const unreached = stopped && ids.length > 1 && Ferry.transition(state, deliverAction(ids.slice(0, -1))).phase === 'ended';
    return { ok: !unreached, unreached };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

/** The engine's reason the last soul of this list can't leave, or null if it can. */
export function refusal(state, ids, Ferry, t) {
  const { ok, reason, unreached } = testRun(state, ids, Ferry);
  if (ok) return null;
  if (!unreached) return reason;
  const last = state.boat.find((x) => x.id === ids[ids.length - 1]);
  return Ferry.deliveryReason(state, last) ?? t('delivery.runEnds');
}

/** What a finished drag does to the marked list. Unmarking rechecks the rest, in order, and says why a soul went back. */
export function applyDrop(state, marked, entry, area, Ferry, t) {
  if (entry.area === 'seat' && area === 'dock') {
    const ids = [...marked, entry.id];
    const reason = refusal(state, ids, Ferry, t);
    return reason ? { marked, reason } : { marked: ids, reason: null };
  }
  if (entry.area === 'dock' && area === 'boat') {
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
  return { marked, reason: null };
}

export const headingText = (state, Ferry, t) => t('delivery.heading', { place: destinationName(state.destination, Ferry) });

export const introText = (state, t) => t(state.boat.length ? 'delivery.intro' : 'delivery.emptyBoat');

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
    wraiths: expired.map((x) => soulName(x.type, Ferry)),
    ...lightChange(state, next, action, departed, Ferry),
    lost: state.hand.filter((m) => !kept.has(m.id) && m.id !== action.id).map((m) => memoryView(m, Ferry)),
    takenBy: action.branch === 'charybdis' ? 'charybdis' : 'SOUL-PO-LUEM',
    stolenRewards: Number(next.nextMemory) - Number(state.nextMemory) - rewards.length,
  };
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

/** Wraiths and Light first, then memories. A gain shows only beside a loss, which it would otherwise hide. */
export function lossLines({ wraiths, lightLost, lightGained, lost, takenBy, stolenRewards }, t, Ferry) {
  const thief = takenBy === 'charybdis' ? t('choice.charybdis') : soulName(takenBy, Ferry);
  return [
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

/** The pending choice in display form, with the action each button dispatches. */
export function choiceView(state, Ferry, t) {
  if (state.choice.kind === 'odysseus') {
    const option = (branch) => {
      const name = t(`choice.${branch}`);
      return {
        name,
        cost: t(`choice.${branch}Cost`),
        reward: t(`choice.${branch}Reward`),
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
