// Pure layout for BoardingScene: state in, positions and labels out. No Phaser.
// The engine has no seat numbers, so seats fill in order: state.boat, then state.selected.
// boatZone, SLOT and TOKEN also measure the boat for CrossingScene and DeliveryScene, which take their seats from layoutStage.
// BoardingScene itself draws from layoutStage and the panel helpers at the end of this file.
export const TOKEN = { w: 100, h: 140 };
export const SLOT = { w: 104, h: 150, gap: 8 };

const BOAT = { x: 700, y: 300 }; // centre of the first seat
const HULL_PAD = 16;
const SHORE = { x: 100, y: 170, cellW: 130, cellH: 150, cols: 4 };

const slotX = (i) => BOAT.x + i * (SLOT.w + SLOT.gap);

/** Every visible actor with its spot, plus one drop slot per seat. */
export function layoutBoarding(state, Ferry) {
  const entries = [];
  let seat = 0;
  const seatActor = (actor, draggable) => {
    const span = Ferry.actorSeats(actor);
    const x = (slotX(seat) + slotX(seat + span - 1)) / 2;
    entries.push({ id: actor.id, actor, area: 'seat', x, y: BOAT.y, span, draggable });
    seat += span;
  };
  for (const actor of state.boat) seatActor(actor, false); // BOARD rejects souls already on the boat
  for (const id of state.selected) seatActor(state.shore.find((x) => x.id === id), true);

  const waiting = state.shore.filter((x) => !state.selected.includes(x.id));
  waiting.forEach((actor, i) => {
    const col = i % SHORE.cols;
    const row = Math.floor(i / SHORE.cols);
    entries.push({
      id: actor.id,
      actor,
      area: 'shore',
      x: SHORE.x + col * SHORE.cellW,
      y: SHORE.y + row * SHORE.cellH,
      span: 1,
      draggable: true,
    });
  });

  const slots = Array.from({ length: Ferry.capacity(state) }, (_, i) => ({ x: slotX(i), y: BOAT.y, w: SLOT.w, h: SLOT.h }));
  return { entries, slots };
}

/** The hull around the seats. */
export function boatZone(slots) {
  const left = slots[0].x - SLOT.w / 2 - HULL_PAD;
  const right = slots[slots.length - 1].x + SLOT.w / 2 + HULL_PAD;
  return { x: (left + right) / 2, y: slots[0].y, w: right - left, h: SLOT.h + HULL_PAD * 2 };
}

export function soulName(type, Ferry) {
  return Ferry.data.souls.find((s) => s.id === type)?.name ?? type;
}

export function destinationName(id, Ferry) {
  return Ferry.data.destinations.find((d) => d.id === id)?.name ?? '?';
}

export function tokenLabels(entry, Ferry) {
  const { shoreAngerLimit, shipAngerLimit } = Ferry.data.config;
  const limit = entry.draggable ? shoreAngerLimit : shipAngerLimit; // draggable means still on the shore
  return {
    name: soulName(entry.actor.type, Ferry),
    wish: destinationName(Ferry.wish(entry.actor), Ferry),
    anger: `Anger ${entry.actor.anger}/${limit}`,
  };
}

export function statusLine(state, Ferry) {
  const next = state.nextPolong ? soulName(state.nextPolong, Ferry) : 'none';
  return `Light ${state.light}/${Ferry.maxLight(state)}   Cycle ${state.cycle}   Seats ${Ferry.seats(state)}/${Ferry.capacity(state)}   Next Long: ${next}`;
}

/** The unresolved hero offer in display form, or null. needsToll mirrors the engine, which has no data field for it. */
export function heroPrompt(state, Ferry) {
  const offer = state.heroOffer;
  if (!offer || offer.resolved) return null;
  return { type: offer.type, name: soulName(offer.type, Ferry), needsToll: offer.type === 'SOUL-HERACLES' };
}

// BoardingScene's stage and panel. Sizes come in as view (the tuning values, STAGE by default), so this file needs
// neither Phaser nor tuning.js. Text comes in as t: src/text.js imports JSON, which plain Node refuses.

/** Default sizes and positions in game coordinates. y values are the ground under a soul, not its centre. */
export const STAGE = { soulHeight: 190, seatHeight: 150, groundY: 538, shoreLeft: 70, shoreStep: 104, deckX: 880, deckY: 484, seatStep: 80 };

// Presentation only: the rules data gives destinations no colour.
export const DESTINATION_COLORS = {
  'DEST-HAVEN': 0xc9d6c0,
  'DEST-STYX': 0x6f9fb3,
  'DEST-ACHERON': 0xb5714f,
  'DEST-ASPHODEL': 0x9c8fb5,
  'DEST-ELYSIUM': 0xd8b25e,
  'DEST-TARTARUS': 0x9c4040,
};
const NO_DESTINATION_COLOR = 0xb9c3bd;

/**
 * Every visible actor with its spot, plus the seats. Seats fill in order and are centred on the deck. Each shore soul keeps
 * the spot of its place in state.shore, so a soul sent back returns to its own spot and nobody else moves.
 */
export function layoutStage(state, Ferry, view = STAGE) {
  const capacity = Ferry.capacity(state);
  const seatX = (i) => view.deckX + (i - (capacity - 1) / 2) * view.seatStep;
  const entries = [];
  let seat = 0;
  const sit = (actor, locked) => {
    const span = Math.max(1, Ferry.actorSeats(actor));
    const x = (seatX(seat) + seatX(seat + span - 1)) / 2;
    entries.push({ id: actor.id, actor, area: 'seat', x, y: view.deckY, span, locked, selected: !locked });
    seat += span;
  };
  for (const actor of state.boat) sit(actor, true); // BOARD refuses souls already on the boat
  for (const id of state.selected) sit(state.shore.find((x) => x.id === id), false);
  state.shore.forEach((actor, i) => {
    if (state.selected.includes(actor.id)) return;
    entries.push({
      id: actor.id,
      actor,
      area: 'shore',
      x: view.shoreLeft + i * view.shoreStep,
      y: view.groundY,
      span: Ferry.actorSeats(actor),
      locked: false,
      selected: false,
    });
  });
  const seats = Array.from({ length: capacity }, (_, i) => ({ x: seatX(i), y: view.deckY }));
  return { entries, seats };
}

/** What shows over a soul. pips is null for locked souls: Anger resets at departure, so shore Anger means nothing to them. */
export function soulBadge(entry, Ferry) {
  const limit = Ferry.data.config.shoreAngerLimit;
  const { anger } = entry.actor;
  return {
    name: soulName(entry.actor.type, Ferry),
    color: DESTINATION_COLORS[Ferry.wish(entry.actor)] ?? NO_DESTINATION_COLOR,
    locked: entry.locked,
    // Each return adds 1 Anger, and a selected soul is not on the shore for it.
    pips: entry.locked ? null : { filled: Math.min(anger, limit), total: limit, danger: entry.area === 'shore' && anger + 1 >= limit },
  };
}

/** The badge of a passenger under way: the same marks as on the shore, counted to the ship's Anger limit. */
export function shipBadge(actor, Ferry) {
  const limit = Ferry.data.config.shipAngerLimit;
  return {
    name: soulName(actor.type, Ferry),
    color: DESTINATION_COLORS[Ferry.wish(actor)] ?? NO_DESTINATION_COLOR,
    locked: false,
    pips: { filled: Math.min(actor.anger, limit), total: limit, danger: actor.anger + 1 >= limit },
  };
}

/** Which panel buttons work. Cast off follows the engine: anyone aboard may leave, even a lone hero with nothing selected. */
export function panelButtons(state, tollMode = false) {
  const picked = state.selected.length > 0;
  return { undo: picked && !tollMode, clear: picked && !tollMode, castOff: (picked || state.boat.length > 0) && !tollMode };
}

/** The soul Undo sends back, or null. */
export const lastBoarded = (state) => state.selected.at(-1) ?? null;

/** One BOARD per selected soul. A copy, because each dispatch changes state.selected. */
export const clearActions = (state) => [...state.selected].map((id) => ({ type: 'BOARD', id }));

export function seatBar(state, Ferry) {
  const used = Ferry.seats(state);
  const capacity = Ferry.capacity(state);
  return { used, capacity, boxes: Array.from({ length: capacity }, (_, i) => i < used) };
}

/** One lit or unlit flag per point of maximum Light. */
export const flames = (state, Ferry) => Array.from({ length: Ferry.maxLight(state) }, (_, i) => i < state.light);

/** One chip per selected soul, in boarding order, on a row starting at x. */
export const aboardChips = (state, Ferry, x, step) =>
  state.selected.map((id, i) => ({ id, name: soulName(state.shore.find((s) => s.id === id).type, Ferry), x: x + i * step }));

/** The first hover lines for a soul. The scene adds typeDetail after them. */
export const soulFacts = (actor, Ferry, t) => [
  t('boarding.tipDestination', { name: destinationName(Ferry.wish(actor), Ferry) }),
  t('boarding.tipSeats', { n: Ferry.actorSeats(actor) }),
];

export const nextLongName = (state, Ferry) => (state.nextPolong ? soulName(state.nextPolong, Ferry) : null);

// Motion maths for BoardingScene: plain numbers in and out, so it can be tested. Time t is in seconds.

/** A soul's spot p (0 to 1) along a walk: a straight line lifted by a sine arc, which ends exactly on the target. */
export function arcPoint(from, to, p, arc) {
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p - arc * Math.sin(Math.PI * p) };
}

/** The boat's resting motion: two slow sines each, so it never reads as a loop. angle is in radians. */
export function boatSway(t, heave, roll) {
  return {
    y: heave * (Math.sin(t * 0.9) + 0.4 * Math.sin(t * 2.1 + 1)) / 1.4,
    angle: roll * (Math.sin(t * 0.7 + 0.5) + 0.35 * Math.sin(t * 1.6)) / 1.35,
  };
}

/** Where a point fixed to the boat is after the boat turns by angle around pivot and moves by offset. */
export function ridePoint(point, pivot, angle, offset) {
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: pivot.x + dx * cos - dy * sin + offset.x, y: pivot.y + dx * sin + dy * cos + offset.y };
}

/** One step of a damped spring pulling value to 0: the boat's dip when someone steps aboard. dt is in seconds. */
export function springStep(spring, dt, stiffness, damping) {
  const step = Math.min(dt, 1 / 20); // a slow frame must not throw the boat
  const velocity = spring.velocity + (-stiffness * spring.value - damping * spring.velocity) * step;
  return { value: spring.value + velocity * step, velocity };
}

/** Sideways bend of a soul at height k (0 head, 1 tail tip). The upper body holds still; the tail takes the sway. */
export function tailOffset(k, t, seed, amp, speed) {
  const bend = Math.max(0, (k - 0.45) / 0.55) ** 2;
  return amp * bend * Math.sin(t * speed + seed + k * 4.5);
}
