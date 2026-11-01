// Pure view model for ReturnScene (T-21): return-window state in, labels and actions out. No Phaser.
// What the return will do is never computed here: the engine's own RETURN (or CONFIRM, in review) is
// run on a copy of the state, and the scene shows the difference plus the log lines the engine wrote
// ("Mother shore expiry: 1 Light lost.", "Return survived: +1 Light. Cycle 2.").
// Wording follows src/data/scene-text.json "return" (T-27, PR 15); switch to t() once it is on main.

export const TEXT = {
  heading: 'Return to the Starting Shore', // return.heading
  intro: 'The boat is empty. Souls left waiting on the shore grow angrier while you row back.',
  prepHeading: 'Before you return', // return.prepHeading
  reviewHeading: 'Review return', // return.reviewReturn
  reviewButton: 'Review return', // return.reviewReturn
  back: 'Back', // common.back
  confirm: 'Confirm', // common.confirm
  lethal: 'The lantern goes out before healing.', // return.lethal
  shore: 'Shore',
  arrivals: (names) => `New on the shore: ${names}`,
  wraith: 'Becomes a Wraith',
  light: (a, b, max) => `Light ${a}/${max} → ${b}/${max}`,
};

const soulName = (Ferry, type) => Ferry.data.souls.find((s) => s.id === type)?.name ?? type;
const destName = (Ferry, id) => Ferry.data.destinations.find((d) => d.id === id)?.name ?? '?';

/** Log entries the engine added between two states (the log keeps its last 80 entries). */
export function newLogLines(before, after) {
  const last = before.log[before.log.length - 1];
  if (!last) return after.log.map((e) => e.text);
  const key = JSON.stringify(last);
  for (let i = after.log.length - 1; i >= 0; i--) {
    if (JSON.stringify(after.log[i]) === key) return after.log.slice(i + 1).map((e) => e.text);
  }
  return after.log.slice(-6).map((e) => e.text);
}

/** The engine's result of returning now, or the reason it refuses. */
export function dryRunReturn(state, Ferry) {
  const action = state.phase === 'review' ? { type: 'CONFIRM' } : { type: 'RETURN' };
  try {
    return { after: Ferry.transition(state, action), reason: null };
  } catch (err) {
    return { after: null, reason: err.message };
  }
}

/** Everything ReturnScene shows. `mode` is 'prepare' (window) or 'review' (pending RETURN). */
export function returnView(state, Ferry) {
  const { shoreAngerLimit } = Ferry.data.config;
  const mode = state.phase === 'review' ? 'review' : 'prepare';
  const { after, reason } = dryRunReturn(state, Ferry);
  const afterById = new Map((after?.shore ?? []).map((x) => [x.id, x]));
  const ends = after?.phase === 'ended';

  const souls = state.shore.map((x) => {
    const next = afterById.get(x.id);
    const removed = !!after && !next;
    return {
      id: x.id,
      type: x.type,
      name: soulName(Ferry, x.type),
      wish: destName(Ferry, x.wish),
      anger: x.anger,
      angerAfter: next ? next.anger : removed ? shoreAngerLimit : x.anger,
      limit: shoreAngerLimit,
      wraith: removed,
      label: `Anger ${x.anger} → ${next ? next.anger : removed ? shoreAngerLimit : x.anger}/${shoreAngerLimit}`,
    };
  });
  const beforeIds = new Set(state.shore.map((x) => x.id));
  const arrivals = ends ? [] : (after?.shore ?? []).filter((x) => !beforeIds.has(x.id)).map((x) => soulName(Ferry, x.type));

  return {
    mode,
    heading: TEXT.heading,
    intro: TEXT.intro,
    panelHeading: mode === 'review' ? TEXT.reviewHeading : TEXT.prepHeading,
    souls,
    lines: after ? newLogLines(state, after) : [],
    arrivals: arrivals.length ? TEXT.arrivals(arrivals.join(', ')) : '',
    light: after ? TEXT.light(state.light, after.light, after.maxLight) : '',
    ends,
    warning: ends ? TEXT.lethal : '',
    reason,
    // Actions the panel buttons dispatch.
    primary: mode === 'review' ? { label: TEXT.confirm, action: { type: 'CONFIRM' } } : { label: TEXT.reviewButton, action: { type: 'PLAN', action: { type: 'RETURN' } } },
    secondary: mode === 'review' ? { label: TEXT.back, action: { type: 'BACK' } } : null,
  };
}

/** Status line in the format of scene-text common.statusLine. */
export function statusLine(state, Ferry) {
  const place = state.destination ? destName(Ferry, state.destination) : 'Starting Shore';
  return `Light ${state.light}/${state.maxLight}   Cycle ${state.cycle}   Round ${state.round}   Seats ${Ferry.seats(state)}/${Ferry.capacity(state)}   At ${place}`;
}
