// Pure view model for the memory hand (T-16): state in, cards and labels out. No Phaser.
// Whether a memory or a target is legal is never decided here: each one is tried on the engine
// (Ferry.transition on a copy of the state) and the engine's own reason is shown when it refuses.
// Shared by MemoryHand (BoardingScene, CrossingScene, ReturnScene) and TrimOverlay.

// Wording follows the keys in Tinpatpun's src/data/scene-text.json (T-27, PR 17). Switch these to
// t('memory.play', ...) etc. once that file is on main.
export const TEXT = {
  heading: 'Memories', // crossing.prepHeading is the panel title the host scene shows
  held: (held, limit) => `Memories ${held}/${limit}`,
  from: (source) => `From ${source}`, // memory.from
  chooseTarget: (name) => `Choose a target for ${name}`, // memory.chooseTarget
  noMemories: 'No memories held. Deliver passengers and complete quests to earn them.', // crossing.noMemories
  overLimit: 'Excess rewards cannot be played. Finish this round and choose what to keep.', // crossing.overLimit
  cancel: 'Cancel', // common.cancel
  trimHeading: (limit) => `Keep up to ${limit} memories`, // trim.heading
  trimIntro: 'Choose excess memories to discard. They cannot be used instead.', // trim.intro
  discard: (name) => `Discard ${name}`, // trim.discard
};

function attempt(Ferry, state, action) {
  try {
    Ferry.transition(state, action);
    return null;
  } catch (err) {
    return err.message;
  }
}

function definition(Ferry, type) {
  return Ferry.data.memories.find((m) => m.id === type) ?? { id: type, name: type, text: '' };
}

/** Display name of where a held memory came from: the soul or quest that granted it. */
export function sourceName(memory, Ferry) {
  const ref = memory.sourceRef ?? {};
  const soul = Ferry.data.souls.find((s) => s.id === ref.definitionId);
  if (soul) return soul.name;
  const quest = Ferry.data.quests.find((q) => q.id === ref.definitionId);
  return quest ? quest.name : '?';
}

/** Target ids the engine accepts for this held memory, or null when it takes no target. */
export function legalTargets(state, Ferry, memory) {
  const candidates = Ferry.memoryTargets(state, memory.type);
  if (!candidates) return null;
  return candidates
    .map((x) => x.id)
    .filter((target) => !attempt(Ferry, state, { type: 'PLAY_MEMORY', id: memory.id, target }));
}

/** The engine action for playing a card (target only for memories that take one). */
export function playAction(card, target) {
  return card.needsTarget ? { type: 'PLAY_MEMORY', id: card.id, target } : { type: 'PLAY_MEMORY', id: card.id };
}

/** One card per held memory, in hand order. */
export function memoryCards(state, Ferry) {
  return state.hand.map((memory) => {
    const def = definition(Ferry, memory.type);
    const targets = legalTargets(state, Ferry, memory);
    const needsTarget = targets !== null;
    // With no legal target, try a target-less play anyway so the engine's own reason is shown.
    const reason = needsTarget
      ? targets.length ? null : attempt(Ferry, state, { type: 'PLAY_MEMORY', id: memory.id, target: null }) ?? 'No eligible target.'
      : attempt(Ferry, state, { type: 'PLAY_MEMORY', id: memory.id });
    return {
      id: memory.id,
      type: memory.type,
      name: def.name,
      text: def.text,
      source: sourceName(memory, Ferry),
      needsTarget,
      targets: targets ?? [],
      playable: !reason,
      reason,
    };
  });
}

/** Everything the hand shows: cards, counter and the line under them. */
export function memoryHand(state, Ferry) {
  const limit = Ferry.data.config.handLimit;
  const cards = memoryCards(state, Ferry);
  const anyPlayable = cards.some((c) => c.playable);
  let note = '';
  if (!cards.length) note = TEXT.noMemories;
  else if (cards.length > limit) note = TEXT.overLimit;
  else if (!anyPlayable) note = cards[0].reason;
  return { cards, held: cards.length, limit, counter: TEXT.held(cards.length, limit), anyPlayable, note };
}

/** The trim prompt: every held card, and how many must go. */
export function trimView(state, Ferry) {
  const limit = Ferry.data.config.handLimit;
  const cards = state.hand.map((memory) => {
    const def = definition(Ferry, memory.type);
    return { id: memory.id, type: memory.type, name: def.name, text: def.text, source: sourceName(memory, Ferry) };
  });
  return {
    cards,
    limit,
    excess: Math.max(0, cards.length - limit),
    heading: TEXT.trimHeading(limit),
    intro: TEXT.trimIntro,
    counter: `Held ${cards.length} · keep ${limit}`,
  };
}
