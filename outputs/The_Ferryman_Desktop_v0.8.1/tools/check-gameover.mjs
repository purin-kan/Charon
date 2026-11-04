// Checks the GameOverScene view model (T-17). No Phaser needed.
// Run from the desktop folder: node tools/check-gameover.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gameOverView, MAX_QUEST_ROWS } from '../src/scenes/gameover-layout.js';

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
check(v.summary === `${ended.completed} cycles survived · ${ended.deliveries} ordinary souls delivered · 0 quests completed`, 'summary from state', v.summary);
check(ended.quests.length > 0 || v.questNote.length > 0, 'no quests: note shown', v.questNote);

// 2. Quest rows: names from content, labels per status, failure reason kept, completed counted.
const ids = Ferry.data.quests.map((q) => q.id);
const quest = (i, status, reason = null) => ({ id: 'QUEST-' + (i + 1), definitionId: ids[i % ids.length], status, reason, cycle: '1' });
const withQuests = { ...ended, quests: [quest(0, 'completed'), quest(1, 'failed', 'trip ended before completion'), quest(2, 'active')] };
v = gameOverView(withQuests, Ferry);
check(v.quests.length === 3 && v.quests[0].name === Ferry.data.quests[0].name, 'quest names from content.json', v.quests.map((q) => q.name).join(', '));
check(v.quests.map((q) => q.label).join(',') === 'Done,Failed,Unfinished', 'status labels', v.quests.map((q) => q.label).join(','));
check(v.quests[1].reason === 'trip ended before completion' && v.quests[0].reason === '', 'failure reason only on failed quests');
check(/· 1 quests completed$/.test(v.summary), 'completed quests counted', v.summary);
check(v.questNote === '' && v.more === '', 'no note or overflow with 3 quests');

// 3. Many quests: rows capped, the rest summarised.
const many = { ...ended, quests: Array.from({ length: MAX_QUEST_ROWS + 3 }, (_, i) => quest(i, 'failed', 'x')) };
v = gameOverView(many, Ferry);
check(v.quests.length === MAX_QUEST_ROWS && v.more === '+3 more', `rows capped at ${MAX_QUEST_ROWS}`, v.more);

console.log(bad ? `\n${bad} check(s) failed` : '\nAll game-over checks passed');
process.exit(bad ? 1 : 0);
