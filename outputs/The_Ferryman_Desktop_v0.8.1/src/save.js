// The single save slot (T-11). Saves go through Ferry.exportSave / importSave, so the engine
// validates every save it reads. Keys use the desktop namespace only; v0.6 and v0.7-trial keys
// are never read or written.
//   player:  the-ferryman:desktop:player:save
//   QA:      the-ferryman:desktop:qa:<name>:save
// A QA name comes from ?qa=<name>. Set $env:FERRY_QA = 'smoke' before `npm start` or before running
// the packaged .exe; src/main.js adds it to the page address.
import { Ferry } from './ferry.js';

const QA_NAME = /^[a-z0-9_-]{1,60}$/i;

export function qaName() {
  const name = new URLSearchParams(globalThis.location?.search ?? '').get('qa');
  return name && QA_NAME.test(name) ? name : null;
}

export function saveKey() {
  const qa = qaName();
  return 'the-ferryman:desktop:' + (qa ? `qa:${qa}:` : 'player:') + 'save';
}

/**
 * Reads the saved run. Never throws.
 * @returns {{state: object|null, broken: boolean, unavailable: boolean}}
 *   broken: a save exists but the engine rejected it; unavailable: storage cannot be used at all.
 */
export function readSave() {
  let raw;
  try {
    raw = globalThis.localStorage.getItem(saveKey());
  } catch {
    return { state: null, broken: false, unavailable: true };
  }
  if (raw === null) return { state: null, broken: false, unavailable: false };
  try {
    return { state: Ferry.importSave(raw), broken: false, unavailable: false };
  } catch (err) {
    console.warn(`[ferry] save: stored run rejected (${err.message})`);
    return { state: null, broken: true, unavailable: false };
  }
}

/** Writes the run. Returns false if storage failed (quota, disabled storage). */
export function writeSave(state) {
  try {
    globalThis.localStorage.setItem(saveKey(), Ferry.exportSave(state));
    return true;
  } catch (err) {
    console.warn(`[ferry] save: write failed (${err.message})`);
    return false;
  }
}

export function deleteSave() {
  try {
    globalThis.localStorage.removeItem(saveKey());
  } catch {
    // Nothing to delete if storage is unavailable.
  }
}

let autosaving = false;

/**
 * Saves after every state change from now on. Called by TitleScene when a run starts, so the dev
 * launcher (which skips TitleScene) never overwrites the player's save with a fixture.
 */
export function startAutosave(game, onFail = () => {}) {
  if (autosaving) return;
  autosaving = true;
  game.events.on('ferry-state', (state) => {
    if (state && !writeSave(state)) onFail();
  });
}
