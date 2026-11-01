// Pure layout and outcomes for DeliveryScene and ChoiceOverlay: state in, positions and views out. No Phaser.
// DELIVER takes every chosen soul at once and each is checked after the one before, so eligibility
// comes from test-running the whole list, not from deliveryReason on the current state.
// Text comes in as t: src/text.js imports JSON, so a Node tool could not load this file otherwise.
import { SLOT, boatZone, layoutBoarding, tokenLabels } from './boarding-layout.js';

export const DOCK = { x: 300, y: 345, w: 520, h: 430 };
export const REWARD = { w: 220, h: 150, gap: 20, y: 360 };

const DOCK_SPOT = { x: 130, y: 220, cellW: 130, cellH: 150, cols: 3 };
const DECK = { y: 470, width: 448 }; // souls with no seat ride here
const ROWS = { left: 60, width: 1160, top: 210, rowH: 76, perCol: 5 };

const dockSpot = (i) => ({
  x: DOCK_SPOT.x + (i % DOCK_SPOT.cols) * DOCK_SPOT.cellW,
  y: DOCK_SPOT.y + Math.floor(i / DOCK_SPOT.cols) * DOCK_SPOT.cellH,
});

/** Every passenger with its spot. Seats fill in order; souls with no seat ride on the deck. */
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
      matches: Ferry.wish(actor) === state.destination,
      labels: tokenLabels({ actor, draggable: false }, Ferry), // draggable false picks the ship limit
    };
  });
  return { entries, slots };
}

const inside = (r, x, y) => Math.abs(x - r.x) <= r.w / 2 && Math.abs(y - r.y) <= r.h / 2;

export function dropArea(x, y, slots) {
  if (inside(DOCK, x, y)) return 'dock';
  return inside(boatZone(slots), x, y) ? 'boat' : null;
}

export const deliverAction = (marked) => ({ type: 'DELIVER', ids: marked });

/** The engine's reason this list of souls can't leave, or null if it can. */
export function refusal(state, ids, Ferry) {
  try {
    Ferry.transition(state, deliverAction(ids));
    return null;
  } catch (err) {
    return err.message;
  }
}

/** What a finished drag does to the marked list. Unmarking rechecks the rest, in order. */
export function applyDrop(state, marked, entry, area, Ferry) {
  if (entry.area === 'seat' && area === 'dock') {
    const ids = [...marked, entry.id];
    const reason = refusal(state, ids, Ferry);
    return reason ? { marked, reason } : { marked: ids, reason: null };
  }
  if (entry.area === 'dock' && area === 'boat') {
    const kept = [];
    for (const id of marked) if (id !== entry.id && !refusal(state, [...kept, id], Ferry)) kept.push(id);
    return { marked: kept, reason: null };
  }
  return { marked, reason: null };
}

export function headingText(state, Ferry, t) {
  const place = Ferry.data.destinations.find((d) => d.id === state.destination)?.name ?? '?';
  return t('delivery.heading', { place });
}

export const introText = (state, t) => t(state.boat.length ? 'delivery.intro' : 'delivery.emptyBoat');

export function confirmLabel(state, marked, t) {
  if (!state.boat.length) return t('delivery.finishRound');
  return t(marked.length ? 'delivery.deliverSelected' : 'delivery.keepEveryone');
}

const memoryView = (m, Ferry) => {
  const def = Ferry.data.memories.find((d) => d.id === m.type);
  return { id: m.id, type: m.type, name: def?.name ?? m.type, text: def?.text ?? '' };
};

/** What to play before dispatching. A lethal DELIVER stops partway, so departed can be shorter than marked. */
export function arrivalOutcome(state, next, marked, Ferry) {
  const aboard = new Set(next.boat.map((x) => x.id));
  const held = new Set(state.hand.map((m) => m.id));
  return {
    departed: marked.filter((id) => !aboard.has(id)),
    rewards: next.hand.filter((m) => !held.has(m.id)).map((m) => memoryView(m, Ferry)),
  };
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

/** Rows for held memories. The hand can be over the limit here, so rows wrap into columns. */
export function memoryRowSpots(n) {
  const cols = Math.max(1, Math.ceil(n / ROWS.perCol));
  const w = ROWS.width / cols;
  return Array.from({ length: n }, (_, i) => ({
    x: ROWS.left + Math.floor(i / ROWS.perCol) * w,
    y: ROWS.top + (i % ROWS.perCol) * ROWS.rowH,
    w,
  }));
}
