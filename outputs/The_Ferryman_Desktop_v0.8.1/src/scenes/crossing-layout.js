// Pure logic for CrossingScene (T-19): state in, steps, buttons and outcomes out. No Phaser.
// Nothing here decides a rule: the meal, purify, the approach and the crossing are each tried on the
// engine (Ferry.transition on the state), and outcomes are the difference between two engine states.
// Text comes in as t: src/text.js imports JSON, which plain Node refuses.
import { destinationName, soulName, tokenLabels } from './boarding-layout.js';
import { boatSpots } from './delivery-layout.js';
import { memoryHand } from '../components/memory-layout.js';

/** The engine's next state for an action, or null when it refuses. */
export function attempt(state, action, Ferry) {
  try {
    return Ferry.transition(state, action);
  } catch {
    return null;
  }
}

/**
 * Which step the scene shows: 'prepare' (memories, meal, purify, then approach the fork), 'fork'
 * (pick a route), 'review' (Back or Confirm), or 'away' once the state has moved on (a choice over
 * this scene, the delivery or the end of the run).
 */
export function crossingStep(state) {
  if (state.window?.kind !== 'outward') return 'away';
  if (state.phase === 'review') return 'review';
  if (state.phase !== 'window') return 'away';
  return state.travelPrepared ? 'fork' : 'prepare';
}

/** Where the boat is: the last stop of this trip, or the Starting Shore on a cycle's first crossing. */
export function placeName(state, Ferry, t) {
  return state.destination ? destinationName(state.destination, Ferry) : t('common.startingShore');
}

export function statusText(state, Ferry, t) {
  return t('common.statusLine', {
    light: state.light, maxLight: Ferry.maxLight(state), cycle: state.cycle, round: state.round,
    seats: Ferry.seats(state), capacity: Ferry.capacity(state), place: placeName(state, Ferry, t),
  });
}

/** Every passenger with its seat (local to the boat) and labels. */
export function boatEntries(state, Ferry) {
  const { spots, slots } = boatSpots(state, Ferry);
  return {
    entries: spots.map((spot) => ({ ...spot, labels: tokenLabels({ actor: spot.actor, draggable: false }, Ferry) })),
    slots,
  };
}

export const purifyAction = (priestId, target) => ({ type: 'PURIFY', actorId: priestId, target });

/**
 * Passenger abilities the engine allows now: the shared meal (one button per meal quest) and the
 * Priest's purify (with the souls it may target). Empty after the fork.
 */
export function abilities(state, Ferry, t) {
  const out = [];
  for (const q of state.quests.filter((x) => x.status === 'active' && x.definitionId === 'QUEST-MEAL')) {
    const action = { type: 'MEAL', questId: q.id };
    if (attempt(state, action, Ferry)) out.push({ kind: 'meal', label: t('crossing.meal'), action });
  }
  for (const priest of state.boat.filter((x) => x.type === 'SOUL-PRIEST')) {
    const targets = state.boat.filter((x) => attempt(state, purifyAction(priest.id, x.id), Ferry)).map((x) => x.id);
    if (targets.length) out.push({ kind: 'purify', label: t('crossing.purify'), priestId: priest.id, targets });
  }
  return out;
}

/** The line above "Approach the fork" while a memory or ability would still be usable before it. */
export function approachWarning(state, Ferry, t) {
  if (crossingStep(state) !== 'prepare') return '';
  const usable = memoryHand(state, Ferry).anyPlayable || abilities(state, Ferry, t).length > 0;
  return usable ? t('crossing.approachWarning') : '';
}

/** Who came aboard and who left between two states, and whose wish changed. */
function boatChanges(before, after, Ferry, t) {
  const was = new Map(before.boat.map((x) => [x.id, x]));
  const now = new Map(after.boat.map((x) => [x.id, x]));
  const departed = before.boat.filter((x) => !now.has(x.id)).map((x) => x.id);
  const boarded = after.boat.filter((x) => !was.has(x.id));
  const lines = [
    ...before.boat.filter((x) => !now.has(x.id)).map((x) => t('crossing.soulLeaves', { name: soulName(x.type, Ferry) })),
    ...boarded.map((x) => (x.origin || !Ferry.isTainted(x)
      ? t('crossing.soulBoards', { name: soulName(x.type, Ferry) })
      : t('crossing.longBoards', { name: soulName(x.type, Ferry), level: x.level }))),
    ...after.boat
      .filter((x) => was.has(x.id) && Ferry.wish(was.get(x.id)) !== Ferry.wish(x))
      .map((x) => t('crossing.wishChanged', { name: soulName(x.type, Ferry), wish: destinationName(Ferry.wish(x), Ferry) })),
  ];
  return { departed, boarded: boarded.map((x) => x.id), lines };
}

/** What "Approach the fork" does to the boat: usually nothing, or a scheduled Long boards. */
export function approachOutcome(state, next, Ferry, t) {
  return boatChanges(state, next, Ferry, t);
}

/**
 * Everything the crossing shows, from the review state and the state after CONFIRM: where from and to
 * (a concealed route is named only here), the Light paid, whether the lantern goes out, and what
 * happened on arrival (Odysseus leaves for Tiresias, Cerberus boards and frightens souls off).
 */
export function crossingOutcome(state, next, Ferry, t) {
  const paid = Math.max(0, state.light - next.light);
  const concealed = !!Ferry.routeView(state)[0]?.[state.pending?.option]?.hidden;
  const ended = next.phase === 'ended';
  const changes = ended ? { departed: [], boarded: [], lines: [] } : boatChanges(state, next, Ferry, t);
  return {
    from: t('crossing.from', { place: placeName(state, Ferry, t) }),
    to: destinationName(next.destination, Ferry),
    concealed, // the scene shows "?" until arrival
    arrived: t('crossing.arrived', { destination: destinationName(next.destination, Ferry) }),
    paid,
    lightBefore: state.light,
    lightAfter: next.light,
    lightLine: paid ? t('crossing.lightLost', { n: paid }) : t('crossing.noLightLost'),
    ended,
    endLine: ended ? t('crossing.lanternOut') : '',
    ...changes,
  };
}
