// Pure logic for CrossingScene (T-19): state in, steps, buttons and outcomes out. No Phaser.
// Nothing here decides a rule: the meal, purify, the approach and the crossing are each tried on the
// engine (Ferry.transition on the state), and outcomes are the difference between two engine states.
// Text comes in as t: src/text.js imports JSON, which plain Node refuses.
import { boatZone, destinationName, soulName, tokenLabels } from './boarding-layout.js';
import { boatSpots } from './delivery-layout.js';
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

// ---- the stage -----------------------------------------------------------------------------
// The boat stays where BoardingScene and DeliveryScene draw it, and the water goes past it. Its bow points left, so the
// way ahead is the left of the screen: the two signs stand there, in the water.
export const SIGNS = { scale: 0.52, spots: [{ x: 268, y: 214 }, { x: 268, y: 376 }] };

/** home is the hull centre, the same at a stop and under way. */
export function worldLayout(state, Ferry) {
  const hull = boatZone(boatSpots(state, Ferry).slots);
  return { home: { x: hull.x, y: hull.y }, signs: SIGNS.spots };
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
      return { option: card.option, number: card.number, destination: card.destination, name: card.name, fog: card.hidden ? '?' : TEXT.routeCost(p.payment, p.remaining), wishes: card.wishes, hidden: card.hidden, lethal: card.lethal, picked: card.picked, action: card.action, detail };
    });
  }
  const first = model.mode === 'foresight' ? model.upcoming[0] : null;
  return [0, 1].map((option) => {
    const seen = first?.options[option];
    const name = seen ? seen.name : '?';
    return { option, number: option + 1, destination: seen?.destination ?? null, name, fog: '', wishes: '', hidden: !seen || seen.hidden, lethal: false, picked: false, action: null, detail: [seen ? '' : t('crossing.unknownBranch')].filter(Boolean) };
  });
}

// The engine's own checks for these: purify() is the Priest's, and DEPART refuses Merchant with both
// Blacksmith and Mason. Shown so a player can see it before picking, the engine still decides.
const TRIO = ['SOUL-MERCHANT', 'SOUL-BLACKSMITH', 'SOUL-MASON'];

/** Title for a soul type: its name, with its personal name when it has one. */
export function soulTitle(type, Ferry) {
  const def = Ferry.data.souls.find((s) => s.id === type) ?? {};
  return def.personalName ? `${def.name} (${def.personalName})` : def.name ?? type;
}

/**
 * What a kind of soul does, whoever it is: its own text (Longs), the Priest's purify, the Merchant,
 * Blacksmith and Mason rule, the memory it gives, and the quests it can take part in with whom.
 * Quests in skipQuests (already active for this soul) are left out.
 */
export function typeDetail(type, Ferry, t, skipQuests = []) {
  const def = Ferry.data.souls.find((s) => s.id === type) ?? {};
  const memory = Ferry.data.memories.find((m) => m.id === def.memory);
  const lines = [];
  if (def.text) lines.push(def.text);
  if (type === 'SOUL-PRIEST') lines.push(t('crossing.detailPurify'));
  if (TRIO.includes(type)) lines.push(t('crossing.detailTrio'));
  lines.push(memory ? t('crossing.detailGives', { memory: memory.name, text: memory.text }) : t('crossing.detailNoMemory'));
  for (const quest of Ferry.data.quests.filter((q) => q.roles.includes(type) && !skipQuests.includes(q.id))) {
    const partners = quest.roles.filter((r) => r !== type).map((r) => soulName(r, Ferry));
    lines.push(partners.length
      ? t('crossing.detailQuestWith', { name: quest.name, partners: partners.join(', '), description: quest.description })
      : t('crossing.detailQuest', { name: quest.name, description: quest.description }));
  }
  return lines;
}

/** Hover text for a soul on the shore or the boat: its wish and Anger, what it does, its quests. */
export function soulDetail(state, actor, Ferry, t) {
  const lines = [
    `${t('common.wish')}: ${destinationName(Ferry.wish(actor), Ferry)}`,
    `${t('common.anger')} ${actor.anger}/${Ferry.data.config.shipAngerLimit}`,
  ];
  if (Ferry.isTainted(actor) && !actor.origin) lines.push(t('crossing.detailLevel', { level: actor.level }));
  const active = state.quests.filter((x) => x.status === 'active' && x.participants.includes(actor.id));
  const activeLines = active
    .map((q) => Ferry.data.quests.find((x) => x.id === q.definitionId))
    .filter(Boolean)
    .map((quest) => t('crossing.detailQuest', { name: quest.name, description: quest.description }));
  lines.push(...typeDetail(actor.type, Ferry, t, active.map((q) => q.definitionId)), ...activeLines);
  return { title: soulTitle(actor.type, Ferry), lines };
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

/**
 * The line above "Approach the fork" when approaching would take something away: the engine is asked by
 * test-running START_CROSSING, so it says only what is really lost (the meal and purify end at the fork;
 * memories stay playable through the stop under one memory per stop).
 */
export function approachWarning(state, Ferry, t) {
  if (crossingStep(state) !== 'prepare') return '';
  const next = attempt(state, { type: 'START_CROSSING' }, Ferry);
  if (!next) return '';
  const losesAbilities = abilities(state, Ferry, t).length > 0 && abilities(next, Ferry, t).length === 0;
  const losesMemories = memoryHand(state, Ferry).anyPlayable && !memoryHand(next, Ferry).anyPlayable;
  if (losesAbilities && losesMemories) return t('crossing.approachWarning');
  if (losesAbilities) return t('crossing.approachWarningAbilities');
  return losesMemories ? t('crossing.approachWarningMemories') : '';
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
