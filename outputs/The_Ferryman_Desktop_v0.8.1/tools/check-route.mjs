// Checks the route UI view model (T-22) against the real engine. No Phaser needed.
// Run from the desktop folder: node tools/check-route.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { routeModel } from '../src/components/route-layout.js';
import { sceneFor } from '../src/phase-map.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const fixture = (name) => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));
const dest = (id) => Ferry.data.destinations.find((d) => d.id === id).name;

let bad = 0;
const check = (ok, label, detail = '') => {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`);
};

// 1. Before the fork, with no Foresight: nothing to show yet.
const win = fixture('window');
check(routeModel(win, Ferry).mode === 'hidden', 'window before the fork: hidden');

// 2. Foresight played before the fork: the revealed forks appear as a preview, names from the engine.
const withForesight = structuredClone(win);
withForesight.hand = [{ id: 'MEMORY-' + win.nextMemory, type: 'MEM-FORESIGHT', sourceRef: { kind: 'character', definitionId: 'SOUL-POET', instanceId: 'ACTOR-1' } }];
withForesight.nextMemory = String(Number(win.nextMemory) + 1);
const seen = Ferry.transition(withForesight, { type: 'PLAY_MEMORY', id: withForesight.hand[0].id });
let m = routeModel(seen, Ferry);
const view = Ferry.routeView(seen);
check(m.mode === 'foresight' && m.upcoming.length === view.length && view.length === Ferry.data.config.foresightForks, 'Foresight: revealed forks listed', `${m.upcoming.length} forks`);
check(m.upcoming[0].label === 'The first fork' && m.upcoming[1].label === 'Foresight: fork 2', 'Foresight row labels');
check(m.upcoming[1].options[0].name === dest(view[1][0].destination), 'Foresight names from routeView', m.upcoming[1].options.map((o) => o.name).join(' / '));

// 3. At the fork: two options, fog and Light from Ferry.preview, PLAN CROSS actions.
const fork = fixture('fork');
m = routeModel(fork, Ferry);
check(m.mode === 'fork' && m.current.length === 2 && !m.review, 'fork: two options, no review');
const p1 = Ferry.preview(fork, 1);
check(m.current[1].name === dest(fork.routes.offers[0][1]) && m.current[1].fog === `Base fog ${p1.base} · ${p1.payment} Light · ${p1.remaining} remaining`, 'option text from Ferry.preview', m.current[1].fog);
check(JSON.stringify(m.current[0].action) === '{"type":"PLAN","action":{"type":"CROSS","option":0}}', 'option click is PLAN CROSS');
const wishers = fork.boat.filter((x) => Ferry.wish(x) === fork.routes.offers[0][0]).length;
check(wishers ? m.current[0].wishes.startsWith('Wish of') : m.current[0].wishes === '', 'wish hint only when a passenger wishes there', JSON.stringify(m.current[0].wishes));

// 4. PLAN moves to review, still CrossingScene: picked option, cost line, Back and Confirm.
const rev = Ferry.transition(fork, m.current[1].action);
check(rev.phase === 'review' && sceneFor(rev) === 'CrossingScene', 'PLAN CROSS -> review in CrossingScene');
m = routeModel(rev, Ferry);
check(m.mode === 'review' && m.current[1].picked && !m.current[0].picked, 'review: picked option marked');
check(m.review.cost === `${p1.payment} Light to cross; ${p1.remaining} remains.` && m.review.breakdown === `Base ${p1.base} + tainted ${p1.tainted} + overload ${p1.overload}`, 'review numbers match Ferry.preview', m.review.cost);
const back = Ferry.transition(rev, m.review.back.action);
check(back.phase === 'window' && back.travelPrepared && JSON.stringify(back.routes.offers[0]) === JSON.stringify(fork.routes.offers[0]), 'Back returns to the same fork (not rerolled)');
const crossed = Ferry.transition(rev, m.review.confirm.action);
check(['delivery', 'ended'].includes(crossed.phase) && crossed.light === Math.max(0, fork.light - p1.payment), 'Confirm crosses and pays the previewed Light', `phase ${crossed.phase}, light ${fork.light} -> ${crossed.light}`);

// 5. The saved review fixture renders too.
m = routeModel(fixture('review'), Ferry);
check(m.mode === 'review' && m.review.confirm.action.type === 'CONFIRM', 'review fixture: review mode');

// 6. Lethal option: Light 1 against a fog of 2 or more warns.
const low = structuredClone(fork);
low.light = 1;
Ferry.validate(low);
m = routeModel(low, Ferry);
const lethalCard = m.current.find((c) => Ferry.preview(low, c.option).lethal);
check(!!lethalCard && lethalCard.lethal, 'lethal option flagged on its card', lethalCard?.name);

// 7. Po Mued at level 3 conceals every option (view model only; this state is not a valid save).
const shadow = structuredClone(rev);
shadow.boat[0] = { ...shadow.boat[0], type: 'SOUL-PO-MUED', level: 3 };
m = routeModel(shadow, Ferry);
check(m.current.every((c) => c.hidden && c.name === 'Concealed route') && m.review.name === 'Concealed destination' && /remain hidden/.test(m.review.warning), 'Po Mued: concealed options and warning');

// 8. Return windows are not the route UI's job.
check(routeModel(fixture('return'), Ferry).mode === 'hidden', 'return window: hidden');

console.log(bad ? `\n${bad} check(s) failed` : '\nAll route checks passed');
process.exit(bad ? 1 : 0);
