// Checks the ReturnScene view model (T-21) against the real engine. No Phaser needed.
// Run from the desktop folder: node tools/check-return.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { returnView, newLogLines } from '../src/scenes/return-layout.js';
import { sceneFor } from '../src/phase-map.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const fixture = (name) => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));

let bad = 0;
const check = (ok, label, detail = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};
const angry = (s, n) => {
  const t = structuredClone(s);
  t.shore.slice(0, n).forEach((x) => { x.anger = Ferry.data.config.shoreAngerLimit - 1; });
  Ferry.validate(t);
  return t;
};

// 1. Return window with calm souls: every soul gains 1 Anger, no Wraith, +1 Light up to the maximum.
const ret = fixture('return');
check(sceneFor(ret) === 'ReturnScene' && ret.boat.length === 0, 'return fixture: ReturnScene, boat empty');
let v = returnView(ret, Ferry);
check(v.mode === 'prepare' && v.panelHeading === 'Before you return', 'prepare mode and heading');
check(v.souls.every((s) => !s.wraith && s.angerAfter === s.anger + 1), 'all shore souls gain 1 Anger', v.souls.map((s) => s.label).join(' | '));
check(v.lines.some((t) => /Return survived/.test(t)), 'engine log line shown', JSON.stringify(v.lines));
check(v.arrivals.startsWith('New on the shore:'), 'new arrivals listed', v.arrivals);
check(JSON.stringify(v.primary.action) === '{"type":"PLAN","action":{"type":"RETURN"}}' && !v.secondary, 'button: PLAN RETURN');

// 2. A soul one short of the limit becomes a Wraith and costs Light (engine text).
const one = angry(ret, 1);
v = returnView(one, Ferry);
check(v.souls[0].wraith && !v.souls[1].wraith, 'soul at the limit becomes a Wraith', v.souls[0].label);
check(v.lines.some((t) => /shore expiry: 1 Light lost/.test(t)), 'Light loss from the engine log');
const after = Ferry.transition(one, { type: 'RETURN' });
check(v.light === `Light ${one.light}/${after.maxLight} → ${after.light}/${after.maxLight}`, 'Light before and after', v.light);

// 3. Lethal: Light 1 and a Wraith ends the run before healing.
const lethal = angry({ ...ret, light: 1 }, 1);
v = returnView(lethal, Ferry);
check(v.ends && v.warning === 'The lantern goes out before healing.' && v.arrivals === '', 'lethal return warns, no arrivals');

// 4. Review: CONFIRM and BACK, same preview as the window.
const rev = fixture('review-return');
v = returnView(rev, Ferry);
check(v.mode === 'review' && v.panelHeading === 'Review return', 'review mode');
check(v.primary.action.type === 'CONFIRM' && v.secondary.action.type === 'BACK', 'buttons: Confirm and Back');
const planned = Ferry.transition(ret, { type: 'PLAN', action: { type: 'RETURN' } });
check(planned.phase === 'review' && sceneFor(planned) === 'ReturnScene', 'PLAN RETURN stays in ReturnScene (review)');

// 5. Confirm starts the next cycle in BoardingScene; Back returns to the window.
const next = Ferry.transition(planned, { type: 'CONFIRM' });
check(next.phase === 'boarding' && next.cycle === String(Number(ret.cycle) + 1) && sceneFor(next) === 'BoardingScene', 'Confirm starts the next cycle', `cycle ${next.cycle}`);
const back = Ferry.transition(planned, { type: 'BACK' });
check(back.phase === 'window' && sceneFor(back) === 'ReturnScene', 'Back returns to the return window');

// 6. newLogLines finds the new entries even when the log is full (80, oldest dropped).
const full = { log: Array.from({ length: 80 }, (_, i) => ({ round: '1', cycle: '1', text: 'e' + i })) };
const fuller = { log: [...full.log.slice(2), { round: '1', cycle: '1', text: 'new1' }, { round: '1', cycle: '1', text: 'new2' }] };
check(JSON.stringify(newLogLines(full, fuller)) === '["new1","new2"]', 'log diff with a full log');

console.log(bad ? `\n${bad} check(s) failed` : '\nAll return checks passed');
process.exit(bad ? 1 : 0);
