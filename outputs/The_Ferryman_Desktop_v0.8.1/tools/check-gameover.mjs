// Checks the GameOverScene view model (T-17). No Phaser needed.
// Run from the desktop folder: node tools/check-gameover.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gameOverView } from '../src/scenes/gameover-layout.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const ended = JSON.parse(readFileSync(path.join(dir, 'ended.json'), 'utf8'));

let bad = 0;
const check = (ok, label, detail = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};

// 1. The saved ended fixture: a real end of run from the engine.
check(ended.phase === 'ended', 'fixture is an ended run', ended.phase);
let v = gameOverView(ended, Ferry);
check(v.ending === ended.ending && v.ending.length > 0, 'ending reason shown', JSON.stringify(v.ending));
const word = (n, one, many) => `${n} ${n === '1' ? one : many}`;
check(v.summary === `${word(ended.completed, 'cycle', 'cycles')} survived · ${word(ended.deliveries, 'ordinary soul', 'ordinary souls')} delivered · 0 quests completed`, 'summary from state', v.summary);
check(ended.quests.length > 0 || v.questNote.length > 0, 'no quests: note shown', v.questNote);

// 2. Quest rows: names from content, labels per status, failure reason kept, completed counted.
const ids = Ferry.data.quests.map((q) => q.id);
const quest = (i, status, reason = null) => ({ id: 'QUEST-' + (i + 1), definitionId: ids[i % ids.length], status, reason, cycle: '1' });
const withQuests = { ...ended, quests: [quest(0, 'completed'), quest(1, 'failed', 'trip ended before completion'), quest(2, 'active')] };
v = gameOverView(withQuests, Ferry);
check(v.quests.length === 3 && v.quests[0].name === Ferry.data.quests[0].name, 'quest names from content.json', v.quests.map((q) => q.name).join(', '));
check(v.quests.map((q) => q.label).join(',') === 'Done,Failed,Unfinished', 'status labels', v.quests.map((q) => q.label).join(','));
check(v.quests[1].reason === 'trip ended before completion' && v.quests[0].reason === '', 'failure reason only on failed quests');
check(/· 1 quest completed$/.test(v.summary), 'completed quests counted, singular for one', v.summary);
check(v.questNote === '', 'no note with 3 quests');

// 3. Many quests: every one is shown, and repeats of the same quest and result share a row with a count.
const many = { ...ended, quests: Array.from({ length: ids.length + 3 }, (_, i) => quest(i % ids.length, 'failed', 'x')) };
v = gameOverView(many, Ferry);
const listed = v.quests.reduce((n, q) => n + q.count, 0);
check(listed === many.quests.length && v.quests.length === ids.length, 'every quest listed, repeats grouped', `${v.quests.length} rows for ${listed}`);
check(v.quests.filter((q) => q.count === 2).every((q) => q.label === 'Failed ×2') && v.quests.some((q) => q.count === 2), 'a repeat shows its count', v.quests.map((q) => q.label).join(','));

// 4. QA-04 (#56): a count of one is singular, any other count plural. The engine keeps counters as decimal strings.
v = gameOverView({ ...ended, completed: '1', deliveries: '1', quests: [quest(0, 'completed')] }, Ferry);
check(v.summary === '1 cycle survived · 1 ordinary soul delivered · 1 quest completed', 'singular for a count of one', v.summary);
v = gameOverView({ ...ended, completed: '0', deliveries: '2', quests: [quest(0, 'completed'), quest(1, 'completed')] }, Ferry);
check(v.summary === '0 cycles survived · 2 ordinary souls delivered · 2 quests completed', 'plural for zero and for more than one', v.summary);
v = gameOverView({ ...ended, completed: '11', deliveries: '21', quests: [] }, Ferry);
check(v.summary === '11 cycles survived · 21 ordinary souls delivered · 0 quests completed', 'plural for 11 and 21', v.summary);

console.log(bad ? `\n${bad} check(s) failed` : '\nAll game-over checks passed');
process.exit(bad ? 1 : 0);
