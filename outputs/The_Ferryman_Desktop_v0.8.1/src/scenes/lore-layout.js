// Pure logic for the lore intro that plays after New game: no Phaser, so Node checks can test it
// (tools/check-lore.mjs). TitleScene draws the screens; this module decides what to show and when.

/** Which ways into a run show the lore. Only a new game does; Continue goes straight back to the run. */
export function showsLore(kind) {
  return kind === 'new';
}

/** How a run is entered: 'lore' plays the intro first (New game), 'direct' starts at once (Continue). */
export function entryPlan(kind) {
  return showsLore(kind) ? 'lore' : 'direct';
}

const QUIET_KEYS = new Set(['Alt', 'AltGraph', 'Control', 'Shift', 'Meta', 'OS', 'CapsLock', 'NumLock', 'ScrollLock', 'Tab']);

/**
 * Whether a keydown moves the lore to the next screen. Repeats, modifier keys on their own, keys held
 * with Ctrl, Alt or Meta (Alt+Tab, shortcuts) and the F-keys (F2 dev tools, F11, F12) do not.
 * @param {{key?:string, repeat?:boolean, ctrlKey?:boolean, altKey?:boolean, metaKey?:boolean}} e
 */
export function advancesLore(e) {
  if (!e || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return false;
  const key = e.key ?? '';
  if (QUIET_KEYS.has(key) || /^F\d{1,2}$/.test(key)) return false;
  return true;
}

/**
 * The screens from the scene text (lore.screens), as arrays of lines. Blank lines and empty screens
 * are dropped, so a missing or broken table gives no screens and the run starts at once.
 * @param {unknown} table the value of lookup('lore.screens')
 * @returns {string[][]}
 */
export function loreScreens(table) {
  if (!Array.isArray(table)) return [];
  return table
    .map((screen) => (Array.isArray(screen) ? screen.filter((line) => typeof line === 'string' && line.trim() !== '') : []))
    .filter((lines) => lines.length > 0);
}

/**
 * When each part of one screen happens, in ms from the moment the screen starts. Lines fade in one
 * after another, the screen holds, then everything fades out. With reduced motion the fades are cut
 * to reducedMs and the lines arrive together; the hold stays, so there is still time to read.
 * @param {number} lineCount
 * @param {{fadeMs:number, lineGapMs:number, holdMs:number, reduced?:boolean, reducedMs?:number}} opts
 * @returns {{lineStarts:number[], fadeMs:number, holdEnd:number, outEnd:number}}
 */
export function loreTimeline(lineCount, { fadeMs, lineGapMs, holdMs, reduced = false, reducedMs = 90 }) {
  const fade = Math.max(0, reduced ? Math.min(fadeMs, reducedMs) : fadeMs);
  const gap = Math.max(0, reduced ? 0 : lineGapMs);
  const n = Math.max(1, lineCount);
  const lineStarts = Array.from({ length: n }, (_, i) => i * gap);
  const allIn = lineStarts[n - 1] + fade;
  const holdEnd = allIn + Math.max(0, holdMs);
  return { lineStarts, fadeMs: fade, holdEnd, outEnd: holdEnd + fade };
}

/**
 * The order of the intro as a small state machine. Each call returns what the scene should do next,
 * or null when the call must be ignored. 'finish' comes out at most once, so no mix of clicks, keys,
 * timers and Esc can start the run twice.
 *
 *   start()       after the menu has faded: { show: 0 } (or { finish } when there are no screens)
 *   advance(i)    a click, a key or the hold timer of screen i: { leave: i, next: i + 1 } or { leave: i, finish: true }
 *   arrive()      after the screen being left has faded out: { show: next }
 *   skip()        Esc: { finish: true }
 *
 * advance only acts on the screen that is fully showing, so a timer from an earlier screen, or a second
 * click while a screen fades out, does nothing.
 * @param {number} count number of screens
 */
export function createLoreSequence(count) {
  let index = -1;
  let phase = 'idle'; // idle -> showing <-> leaving -> done
  const finish = () => {
    phase = 'done';
    return { finish: true };
  };
  return {
    get index() { return index; },
    get phase() { return phase; },
    get done() { return phase === 'done'; },
    start() {
      if (phase !== 'idle') return null;
      if (count <= 0) return finish();
      index = 0;
      phase = 'showing';
      return { show: 0 };
    },
    advance(i = index) {
      if (phase !== 'showing' || i !== index) return null;
      if (index + 1 >= count) {
        phase = 'done';
        return { leave: index, finish: true };
      }
      phase = 'leaving';
      return { leave: index, next: index + 1 };
    },
    arrive() {
      if (phase !== 'leaving') return null;
      index += 1;
      phase = 'showing';
      return { show: index };
    },
    skip() {
      if (phase === 'done') return null;
      return finish();
    },
  };
}
