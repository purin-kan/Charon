// Pure view model for GameOverScene (T-17): ended state in, labels out. No Phaser, no rules.
// Wording follows src/data/scene-text.json "gameOver" (T-27, PR 15); switch to t() once it is on main.

export const TEXT = {
  heading: 'The river remembers', // gameOver.heading
  summary: (v) => `${v.cycles} cycles survived · ${v.deliveries} ordinary souls delivered · ${v.quests} quests completed`, // gameOver.summary
  newRun: 'Start a new run', // gameOver.newRun
  questsHeading: 'Quests',
  noQuests: 'No quests were started on this run.',
  status: { completed: 'Done', failed: 'Failed', active: 'Unfinished' },
};

function questName(Ferry, definitionId) {
  return Ferry.data.quests.find((q) => q.id === definitionId)?.name ?? definitionId;
}

/** Everything GameOverScene shows. Counters are decimal strings in the engine, shown as they are. */
export function gameOverView(state, Ferry) {
  // Every quest is listed. A quest done (or failed) more than once is one row with a count, so the list stays short.
  const quests = [];
  for (const q of state.quests) {
    const name = questName(Ferry, q.definitionId);
    const same = quests.find((x) => x.name === name && x.status === q.status);
    const reason = q.status === 'failed' && q.reason ? q.reason : '';
    if (same) {
      same.count += 1;
      same.label = `${TEXT.status[q.status] ?? q.status} ×${same.count}`;
      if (reason) same.reason = reason;
      continue;
    }
    quests.push({ id: q.id, name, status: q.status, count: 1, label: TEXT.status[q.status] ?? q.status, reason, cycle: q.cycle });
  }
  const completedQuests = state.quests.filter((q) => q.status === 'completed').length;
  return {
    heading: TEXT.heading,
    summary: TEXT.summary({ cycles: state.completed, deliveries: state.deliveries, quests: completedQuests }),
    ending: state.ending ?? '',
    reached: `Reached cycle ${state.cycle}, round ${state.round}`,
    quests,
    questNote: quests.length ? '' : TEXT.noQuests,
  };
}
