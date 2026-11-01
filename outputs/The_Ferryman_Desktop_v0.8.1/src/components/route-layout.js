// Pure view model for the route UI (T-22): state in, fork cards, Foresight rows and review out. No Phaser.
// Destinations and fog come only from the engine: Ferry.routeView (which forks the player may see,
// with Po Mued concealment) and Ferry.preview (the fog calculation for one option). Nothing is
// recomputed here.
// Wording follows src/data/scene-text.json "crossing" (T-27, PR 15); switch to t() once it is on main.

export const TEXT = {
  heading: 'Where next?', // crossing.routeHeading
  intro: 'The round has begun and any scheduled Polong is aboard. Confirm one route to cross.', // crossing.routeIntro
  currentFork: 'The current fork', // crossing.currentFork
  firstFork: 'The first fork', // crossing.firstFork
  foresightFork: (n) => `Foresight: fork ${n}`, // crossing.foresightFork
  concealed: 'Concealed route', // crossing.concealed
  concealedDetail: 'Po Mued conceals this destination. Confirm to reveal it and pay its fog.', // crossing.concealedDetail
  baseFog: (fog) => `Base fog ${fog}`, // crossing.baseFog
  routeCost: (payment, remaining) => `${payment} Light · ${remaining} remaining`, // crossing.routeCost
  breakdown: (p) => `Base ${p.base} + tainted ${p.tainted} + overload ${p.overload}`, // crossing.routeBreakdown
  chooseOption: (n, name) => `Choose option ${n}: ${name}`, // crossing.chooseOption
  reviewHeading: 'Review your crossing', // crossing.reviewHeading
  reviewIntro: 'Back returns to the same fork without rerolling it.', // crossing.reviewIntro
  concealedDestination: 'Concealed destination', // crossing.concealedDestination
  concealedWarning: 'The destination and its fog remain hidden until you confirm. This may put out the lantern.', // crossing.concealedWarning
  crossCost: (payment, remaining) => `${payment} Light to cross; ${remaining} remains.`, // crossing.crossCost
  lethal: 'Zero Light ends the run before delivery.', // crossing.lethal
  wishes: (names) => `Wish of ${names}`,
  modifiers: (p) => `Fog Shield −${p.shield} · Guard −${p.guard}`,
  back: 'Back', // common.back
  confirm: 'Confirm', // common.confirm
};

const destName = (Ferry, id) => Ferry.data.destinations.find((d) => d.id === id)?.name ?? '?';
const soulName = (Ferry, type) => Ferry.data.souls.find((s) => s.id === type)?.name ?? type;

/** Boat passengers whose wish is this destination (helps the player pick a fork). */
function wishesFor(state, Ferry, destination) {
  if (!destination) return [];
  return state.boat.filter((x) => Ferry.wish(x) === destination).map((x) => soulName(Ferry, x.type));
}

/**
 * The engine's fog preview for one option of the current fork. In review the engine's own
 * validate() previews the pending CROSS as if back in the window, so this does the same.
 */
export function previewOption(state, Ferry, option) {
  const asWindow = state.phase === 'review' ? { ...state, phase: 'window' } : state;
  try {
    return Ferry.preview(asWindow, option);
  } catch {
    return null;
  }
}

function optionCard(state, Ferry, opt, pickedOption) {
  const p = previewOption(state, Ferry, opt.option);
  const hidden = opt.hidden || !p || p.hidden;
  const name = hidden ? TEXT.concealed : destName(Ferry, opt.destination);
  const wishes = hidden ? [] : wishesFor(state, Ferry, opt.destination);
  return {
    option: opt.option,
    number: opt.option + 1,
    destination: hidden ? null : opt.destination,
    name,
    hidden,
    fog: hidden ? TEXT.concealedDetail : `${TEXT.baseFog(p.base)} · ${TEXT.routeCost(p.payment, p.remaining)}`,
    wishes: wishes.length ? TEXT.wishes(wishes.join(', ')) : '',
    lethal: !hidden && p.lethal,
    picked: pickedOption === opt.option,
    label: TEXT.chooseOption(opt.option + 1, name),
    action: { type: 'PLAN', action: { type: 'CROSS', option: opt.option } },
  };
}

function forkRow(Ferry, fork, label) {
  return {
    label,
    options: fork.map((opt) => (opt.hidden ? { name: TEXT.concealed, hidden: true } : { name: destName(Ferry, opt.destination), hidden: false })),
  };
}

/**
 * What the route UI shows:
 *  - 'hidden'    outward window before the fork, no Foresight: nothing to show yet.
 *  - 'foresight' outward window before the fork, Foresight played: the revealed forks as a preview.
 *  - 'fork'      after START_CROSSING: the current fork's two options (click = PLAN CROSS).
 *  - 'review'    a CROSS is pending: the chosen option's fog, Back and Confirm.
 * Return windows and other phases are 'hidden' (ReturnScene handles the way home).
 */
export function routeModel(state, Ferry) {
  const outward = state.window?.kind === 'outward';
  const reviewing = state.phase === 'review' && state.pending?.type === 'CROSS';
  const atFork = state.phase === 'window' && outward && state.travelPrepared;
  const beforeFork = state.phase === 'window' && outward && !state.travelPrepared;
  const forks = outward ? Ferry.routeView(state) : [];

  if (beforeFork && state.routes.foresight > 0) {
    return {
      mode: 'foresight',
      upcoming: forks.map((fork, i) => forkRow(Ferry, fork, i === 0 ? TEXT.firstFork : TEXT.foresightFork(i + 1))),
    };
  }
  if (!atFork && !reviewing) return { mode: 'hidden' };

  const picked = reviewing ? state.pending.option : null;
  const current = forks[0].map((opt) => optionCard(state, Ferry, opt, picked));
  const upcoming = forks.slice(1).map((fork, i) => forkRow(Ferry, fork, TEXT.foresightFork(i + 2)));
  const model = { mode: reviewing ? 'review' : 'fork', heading: TEXT.heading, intro: TEXT.intro, forkLabel: TEXT.currentFork, current, upcoming, review: null };

  if (reviewing) {
    const card = current.find((c) => c.option === picked);
    const p = previewOption(state, Ferry, picked);
    const hidden = card.hidden;
    model.review = {
      heading: TEXT.reviewHeading,
      intro: TEXT.reviewIntro,
      name: hidden ? TEXT.concealedDestination : card.name,
      breakdown: hidden ? '' : TEXT.breakdown(p),
      modifiers: hidden ? '' : TEXT.modifiers(p),
      cost: hidden ? '' : TEXT.crossCost(p.payment, p.remaining),
      warning: hidden ? TEXT.concealedWarning : p.lethal ? TEXT.lethal : '',
      lethal: hidden || p.lethal,
      back: { label: TEXT.back, action: { type: 'BACK' } },
      confirm: { label: TEXT.confirm, action: { type: 'CONFIRM' } },
    };
  }
  return model;
}
