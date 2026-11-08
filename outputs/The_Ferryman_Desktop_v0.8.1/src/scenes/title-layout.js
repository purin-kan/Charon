// Pure title screen logic (T-11): no Phaser, so Node checks can test it (tools/check-title.mjs).

/**
 * Whether New game must ask before it replaces the save. A run still in progress, or a save that
 * cannot be read, asks first. A run that has already ended starts over without asking (QA-05, #56).
 * @param {{state: object|null, broken: boolean}} save what readSave() returned
 */
export function asksBeforeNewGame(save) {
  if (save.broken) return true;
  return !!save.state && save.state.phase !== 'ended';
}
