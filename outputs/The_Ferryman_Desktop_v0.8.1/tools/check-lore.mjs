// Checks the lore intro after New game (src/scenes/lore-layout.js, lore.* in scene-text.json). No Phaser needed.
// Run from the desktop folder: node tools/check-lore.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { advancesLore, createLoreSequence, entryPlan, loreScreens, loreTimeline, showsLore } from '../src/scenes/lore-layout.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(path.join(root, p), 'utf8');
const text = JSON.parse(read('src/data/scene-text.json'));
const EM_DASH = String.fromCharCode(0x2014);

let bad = 0;
const check = (ok, label, detail = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};

// 1. The screens come from scene-text.json and are usable text.
const raw = text.lore?.screens;
const screens = loreScreens(raw);
check(Array.isArray(raw) && screens.length === raw.length, 'every lore screen in scene-text.json is kept', `${screens.length} of ${raw?.length}`);
check(screens.length >= 3 && screens.length <= 6, 'three to six lore screens', `${screens.length}`);
const lines = screens.flat();
check(screens.every((s, i) => s.length === raw[i].length), 'no blank lore line is dropped', `${lines.length} lines`);
check(lines.every((l) => typeof l === 'string' && l.trim() !== '' && l.length <= 80), 'each lore line is non-empty and fits one row (80 characters)');
for (const key of ['hint', 'skip']) check(typeof text.lore?.[key] === 'string' && text.lore[key].trim() !== '', `lore.${key} is text`);
const allText = [...lines, text.lore?.hint ?? '', text.lore?.skip ?? ''];
check(!allText.some((l) => l.includes(EM_DASH)), 'no em dash in the lore text');
for (const file of ['src/scenes/lore-layout.js', 'tools/check-lore.mjs', 'src/scenes/TitleScene.js']) {
  check(!read(file).includes(EM_DASH), `no em dash in ${file}`);
}
check(loreScreens(undefined).length === 0 && loreScreens([[], [' '], 'x']).length === 0, 'a missing or empty table gives no screens');

// 2. Timing: lines in order, then the hold, then the fade out; reduced motion cuts only the fades.
const opts = { fadeMs: 900, lineGapMs: 1100, holdMs: 3200 };
const full = loreTimeline(3, opts);
const fast = loreTimeline(3, { ...opts, reduced: true, reducedMs: 90 });
const rising = (a) => a.every((v, i) => i === 0 || v > a[i - 1]);
check(full.lineStarts[0] === 0 && rising(full.lineStarts), 'lines start one after another', full.lineStarts.join(', '));
check(full.holdEnd > full.lineStarts.at(-1) + full.fadeMs && full.outEnd > full.holdEnd, 'hold comes after the last line is in, then the fade out', `${full.holdEnd}, ${full.outEnd}`);
check(fast.fadeMs === 90 && fast.fadeMs < full.fadeMs, 'reduced motion shortens the fades', `${full.fadeMs} -> ${fast.fadeMs}`);
check(fast.lineStarts.every((s) => s === 0), 'reduced motion brings the lines in together');
check(fast.holdEnd - fast.fadeMs === opts.holdMs, 'reduced motion keeps the full hold for reading', `${fast.holdEnd - fast.fadeMs} ms`);
const total = screens.reduce((sum, s) => sum + loreTimeline(s.length, opts).outEnd, 0);
check(total > 0 && total <= 60000, 'the whole intro at the defaults is at most 60 s', `${(total / 1000).toFixed(1)} s`);

// 3. The sequence: advancing walks every screen once, and the run starts exactly once.
const walk = (count) => {
  const seq = createLoreSequence(count);
  const shown = [];
  let finishes = 0;
  let step = seq.start();
  while (step) {
    if (step.show !== undefined) { shown.push(step.show); step = seq.advance(step.show); }
    else if (step.next !== undefined) step = seq.arrive();
    else { if (step.finish) finishes++; step = null; }
  }
  return { shown, finishes, seq };
};
const all = walk(screens.length);
check(all.shown.join() === screens.map((_, i) => i).join() && all.finishes === 1, 'advancing shows each screen in order, then starts the run once', all.shown.join(' '));
check(walk(0).finishes === 1, 'with no screens the run starts at once');
check(all.seq.skip() === null && all.seq.advance() === null && all.seq.arrive() === null, 'nothing acts after the run has started');

{
  const seq = createLoreSequence(5);
  check(seq.advance(0) === null && seq.skip()?.finish === true && seq.skip() === null && seq.start() === null, 'Esc while the menu fades: starts the run once');
}
{
  const seq = createLoreSequence(5);
  seq.start();
  const first = seq.advance(0);
  check(first?.next === 1 && seq.advance(0) === null && seq.advance(1) === null, 'a second click or the old timer while a screen fades out does nothing');
  seq.arrive();
  check(seq.advance(0) === null && seq.index === 1, 'the timer of an earlier screen does nothing');
}
{
  const seq = createLoreSequence(2);
  seq.start();
  seq.arrive();
  seq.advance(0); seq.arrive();
  const last = seq.advance(1);
  check(last?.finish === true && seq.skip() === null && seq.advance(1) === null, 'Esc while the last screen fades out does not start the run again');
}

// Random mixes of clicks, keys, timers and Esc never start the run more than once.
let seed = 12345;
const rand = (n) => { seed = (seed * 1103515245 + 12345) >>> 0; return seed % n; };
let worst = 0;
let stuck = 0;
for (let trial = 0; trial < 2000; trial++) {
  const seq = createLoreSequence(1 + rand(6));
  let finishes = 0;
  for (let i = 0; i < 40; i++) {
    const pick = rand(5);
    const step = pick === 0 ? seq.start() : pick === 1 ? seq.advance() : pick === 2 ? seq.advance(rand(7)) : pick === 3 ? seq.arrive() : (rand(8) === 0 ? seq.skip() : null);
    if (step?.finish) finishes++;
  }
  if (!seq.done) { seq.start(); finishes += seq.skip()?.finish ? 1 : 0; }
  if (finishes !== 1) stuck++;
  worst = Math.max(worst, finishes);
}
check(stuck === 0 && worst === 1, 'random input in 2000 trials: the run starts exactly once each time', `worst ${worst}`);

// 4. Which keys move the lore on: not repeats, lone modifiers, Ctrl/Alt/Meta chords or F-keys.
const key = (k, extra = {}) => advancesLore({ key: k, ...extra });
check(['a', ' ', 'Enter', 'ArrowRight'].every((k) => key(k)), 'letters, Space, Enter and arrows move the lore on');
check(!['Alt', 'Control', 'Shift', 'Meta', 'AltGraph', 'Tab'].some((k) => key(k)), 'a modifier key on its own (Alt+Tab, start of a shortcut) does not move the lore on');
check(!key('c', { ctrlKey: true }) && !key('Tab', { altKey: true }) && !key('a', { metaKey: true }), 'keys held with Ctrl, Alt or Meta do not move the lore on');
check(!['F2', 'F11', 'F12'].some((k) => key(k)) && !key('a', { repeat: true }), 'F-keys and held-key repeats do not move the lore on');
check(/else if \(advancesLore\(e\)\) this\.advanceLore\(\)/.test(read('src/scenes/TitleScene.js')), 'TitleScene.onKey asks advancesLore before moving the lore on');

// 5. Only New game shows the lore; Continue goes straight to the run.
check(showsLore('new') === true && showsLore('continue') === false, 'showsLore: new game yes, continue no');
check(entryPlan('new') === 'lore' && entryPlan('continue') === 'direct', 'entryPlan: new game plays the lore, continue starts at once');
const title = read('src/scenes/TitleScene.js');
const body = (name) => {
  const start = title.search(new RegExp(`^  ${name}\\(`, 'm'));
  const end = title.indexOf('\n  }\n', start);
  return start < 0 ? '' : title.slice(start, end);
};
const cont = body('continueRun');
const fresh = body('newGame');
check(/enterRun\('continue'/.test(cont) && !/playLore|begin\(/.test(cont), 'TitleScene.continueRun enters as continue, never through the lore');
check(/enterRun\('new'/.test(fresh) && /Ferry\.create\(seed\)/.test(fresh) && /deleteSave\(\)/.test(fresh), 'TitleScene.newGame enters as new with the chosen seed and replaces the save');
const enter = body('enterRun');
check(/if \(entryPlan\(kind\) === 'lore'\) this\.playLore\(/.test(enter) && /else this\.begin\(makeState\(\)\)/.test(enter) && !/!\s*entryPlan|!==\s*'lore'/.test(enter),
  'TitleScene.enterRun plays the lore only when entryPlan says lore, otherwise begins at once');
check(/lookup\('lore\.screens'\)/.test(title), 'TitleScene reads the screens from lore.screens');

console.log(bad ? `\n${bad} check(s) failed` : '\nAll lore checks passed');
process.exit(bad ? 1 : 0);
