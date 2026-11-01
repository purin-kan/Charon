// Pure layout for BoardingScene: state in, positions and labels out. No Phaser.
// The engine has no seat numbers, so seats fill in order: state.boat, then state.selected.
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

/** The hull, which is also the one drop zone: seats fill in order, so where a soul lands on it does not matter. */
export function boatZone(slots) {
  const left = slots[0].x - SLOT.w / 2 - HULL_PAD;
  const right = slots[slots.length - 1].x + SLOT.w / 2 + HULL_PAD;
  return { x: (left + right) / 2, y: slots[0].y, w: right - left, h: SLOT.h + HULL_PAD * 2 };
}

/** The action for a finished drag, or null if the soul should just snap back. */
export function dropAction(entry, dropped) {
  const crossesBoatEdge = entry.area === 'shore' ? dropped : !dropped;
  return crossesBoatEdge ? { type: 'BOARD', id: entry.id } : null;
}

export function soulName(type, Ferry) {
  return Ferry.data.souls.find((s) => s.id === type)?.name ?? type;
}

function destinationName(id, Ferry) {
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
  return `Light ${state.light}/${Ferry.maxLight(state)}   Cycle ${state.cycle}   Seats ${Ferry.seats(state)}/${Ferry.capacity(state)}   Next Polong: ${next}`;
}

/** The unresolved hero offer in display form, or null. needsToll mirrors the engine, which has no data field for it. */
export function heroPrompt(state, Ferry) {
  const offer = state.heroOffer;
  if (!offer || offer.resolved) return null;
  return { type: offer.type, name: soulName(offer.type, Ferry), needsToll: offer.type === 'SOUL-HERACLES' };
}
