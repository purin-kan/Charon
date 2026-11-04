// Pure view model for GameOverScene (T-17): ended state in, labels out. No Phaser, no rules.
// Wording follows src/data/scene-text.json "gameOver" (T-27, PR 15); switch to t() once it is on main.

export const TEXT = {
  heading: 'The river remembers', // gameOver.heading
  summary: (v) => `${v.cycles} cycles survived · ${v.deliveries} ordinary souls delivered · ${v.quests} quests completed`, // gameOver.summary
  newRun: 'Start a new run', // gameOver.newRun
  questsHeading: 'Quests',
  noQuests: 'No quests were started on this run.',
  more: (n) => `+${n} more`,
  status: { completed: 'Done', failed: 'Failed', active: 'Unfinished' },
};

export const MAX_QUEST_ROWS = 8;

function questName(Ferry, definitionId) {
  return Ferry.data.quests.find((q) => q.id === definitionId)?.name ?? definitionId;
}

/** Everything GameOverScene shows. Counters are decimal strings in the engine, shown as they are. */
export function gameOverView(state, Ferry) {
  const quests = state.quests.map((q) => ({
    id: q.id,
    name: questName(Ferry, q.definitionId),
    status: q.status,
    label: TEXT.status[q.status] ?? q.status,
    reason: q.status === 'failed' && q.reason ? q.reason : '',
    cycle: q.cycle,
  }));
  const completedQuests = quests.filter((q) => q.status === 'completed').length;
  const shown = quests.slice(0, MAX_QUEST_ROWS);
  return {
    heading: TEXT.heading,
    summary: TEXT.summary({ cycles: state.completed, deliveries: state.deliveries, quests: completedQuests }),
    ending: state.ending ?? '',
    reached: `Reached cycle ${state.cycle}, round ${state.round}`,
    quests: shown,
    more: quests.length > shown.length ? TEXT.more(quests.length - shown.length) : '',
    questNote: quests.length ? '' : TEXT.noQuests,
  };
}
