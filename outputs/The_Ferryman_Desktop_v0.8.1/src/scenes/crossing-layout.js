// Pure logic for CrossingScene (T-19): state in, steps, buttons and outcomes out. No Phaser.
// Nothing here decides a rule: the meal, purify, the approach and the crossing are each tried on the
// engine (Ferry.transition on the state), and outcomes are the difference between two engine states.
// Text comes in as t: src/text.js imports JSON, which plain Node refuses.
import { boatZone, destinationName, soulName, tokenLabels } from './boarding-layout.js';
import { DOCK, boatSpots } from './delivery-layout.js';
import { memoryHand } from '../components/memory-layout.js';
import { previewOption, routeModel, routeText } from '../components/route-layout.js';

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

// ---- the river world ------------------------------------------------------------------------
// One world the scene pans and zooms over. "home" is where the boat sits at a stop: the hull centre
// that BoardingScene and DeliveryScene use, so a stop looks the same in all three scenes. The river
// runs right to a fork; option 0 branches up, option 1 down. Each branch ends level, at a spot where the
// boat sits exactly as DeliveryScene draws it once the view is back at zoom 1 (see arrivalView).
export const WORLD = { forkAhead: 1000, approachBack: 400, branchRun: 900, branchRise: 420, signAhead: 760, signRise: 110, viewAhead: 550, forkZoom: 0.48 };

/** A view is the world point at the centre of the screen and a zoom. */
export const homeView = () => ({ x: 640, y: 360, zoom: 1 });

export function worldLayout(state, Ferry) {
  const hull = boatZone(boatSpots(state, Ferry).slots);
  const home = { x: hull.x, y: hull.y };
  const fork = { x: home.x + WORLD.forkAhead, y: home.y };
  const approach = { x: fork.x - WORLD.approachBack, y: home.y };
  const branches = [-1, 1].map((dir, option) => {
    const end = { x: fork.x + WORLD.branchRun, y: home.y + dir * WORLD.branchRise };
    return {
      option,
      end,
      // fork, two bends, the level end, and the river running on past it
      points: [fork, { x: fork.x + 350, y: home.y + dir * 250 }, { x: fork.x + 700, y: home.y + dir * (WORLD.branchRise - 10) }, end, { x: end.x + 900, y: end.y }],
      sign: { x: fork.x + WORLD.signAhead, y: home.y + dir * WORLD.signRise }, // on the land between the branches
      dock: { x: end.x - home.x + DOCK.x, y: end.y - home.y + DOCK.y },
      view: { x: end.x - home.x + 640, y: end.y - home.y + 360, zoom: 1 },
    };
  });
  // The fork view leaves the right of the screen free for the review panel.
  return { home, fork, approach, branches, forkView: { x: fork.x + WORLD.viewAhead, y: home.y, zoom: WORLD.forkZoom } };
}

/** Where a world point lands on the 1280x720 screen for a view. */
export function onScreen(point, view) {
  return { x: 640 + (point.x - view.x) * view.zoom, y: 360 + (point.y - view.y) * view.zoom };
}

/** The boat's path for a crossing: from the approach point down the chosen branch to its end. */
export function crossingPath(layout, option) {
  return [layout.approach, ...layout.branches[option].points.slice(0, 4)];
}

/**
 * The sign on each branch: the destination, its fog and who wishes for it, from Jaoguya's route
 * model (Ferry.routeView and Ferry.preview). Before the fork the options are unseen unless Foresight
 * revealed them. detail is the hover text.
 */
export function branchSigns(state, Ferry, t) {
  const model = routeModel(state, Ferry, t);
  const TEXT = routeText(Ferry, t);
  if (model.mode === 'fork' || model.mode === 'review') {
    return model.current.map((card) => {
      const p = card.hidden ? null : previewOption(state, Ferry, card.option);
      const detail = card.hidden
        ? [TEXT.concealedDetail]
        : [TEXT.breakdown(p), TEXT.modifiers(p), TEXT.routeCost(p.payment, p.remaining), card.wishes, card.lethal ? TEXT.lethal : ''].filter(Boolean);
      return { option: card.option, number: card.number, name: card.name, fog: card.hidden ? '?' : TEXT.routeCost(p.payment, p.remaining), wishes: card.wishes, hidden: card.hidden, lethal: card.lethal, picked: card.picked, action: card.action, detail };
    });
  }
  const first = model.mode === 'foresight' ? model.upcoming[0] : null;
  return [0, 1].map((option) => {
    const seen = first?.options[option];
    const name = seen ? seen.name : '?';
    return { option, number: option + 1, name, fog: '', wishes: '', hidden: !seen || seen.hidden, lethal: false, picked: false, action: null, detail: [seen ? '' : t('crossing.unknownBranch')].filter(Boolean) };
  });
}

/** Hover text for a passenger: who it is, its wish and Anger, what it gives, its quests. */
export function soulDetail(state, actor, Ferry, t) {
  const def = Ferry.data.souls.find((s) => s.id === actor.type) ?? {};
  const memory = Ferry.data.memories.find((m) => m.id === def.memory);
  const lines = [
    `${t('common.wish')}: ${destinationName(Ferry.wish(actor), Ferry)}`,
    `${t('common.anger')} ${actor.anger}/${Ferry.data.config.shipAngerLimit}`,
  ];
  if (Ferry.isTainted(actor) && !actor.origin) lines.push(t('crossing.detailLevel', { level: actor.level }));
  if (def.text) lines.push(def.text);
  lines.push(memory ? t('crossing.detailGives', { memory: memory.name, text: memory.text }) : t('crossing.detailNoMemory'));
  for (const q of state.quests.filter((x) => x.status === 'active' && x.participants.includes(actor.id))) {
    const quest = Ferry.data.quests.find((x) => x.id === q.definitionId);
    if (quest) lines.push(t('crossing.detailQuest', { name: quest.name, description: quest.description }));
  }
  return { title: def.personalName ? `${def.name} (${def.personalName})` : def.name ?? actor.type, lines };
}

/** Hover text for a prepare-step button: the meal quest's own description, purify, or the approach. */
export function buttonDetail(kind, state, Ferry, t) {
  if (kind === 'meal') return Ferry.data.quests.find((q) => q.id === 'QUEST-MEAL')?.description ?? '';
  if (kind === 'purify') return t('crossing.purifyTitle');
  return approachWarning(state, Ferry, t) || t('crossing.approachDetail');
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
