// Checks the title screen logic (T-11, QA-05 on #56). No Phaser needed.
// Run from the desktop folder: node tools/check-title.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { asksBeforeNewGame } from '../src/scenes/title-layout.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const ended = JSON.parse(readFileSync(path.join(dir, 'ended.json'), 'utf8'));

let bad = 0;
const check = (ok, label, detail = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};

const running = Ferry.create(7);
check(running.phase !== 'ended' && ended.phase === 'ended', 'fixtures: a new run and an ended run', `${running.phase}, ${ended.phase}`);
check(asksBeforeNewGame({ state: null, broken: false }) === false, 'no save: starts without asking');
check(asksBeforeNewGame({ state: running, broken: false }) === true, 'a run in progress: asks before replacing it');
check(asksBeforeNewGame({ state: ended, broken: false }) === false, 'a run that has ended: starts without asking (QA-05)');
check(asksBeforeNewGame({ state: null, broken: true }) === true, 'an unreadable save: asks before replacing it');

console.log(bad ? `\n${bad} check(s) failed` : '\nAll title checks passed');
process.exit(bad ? 1 : 0);
