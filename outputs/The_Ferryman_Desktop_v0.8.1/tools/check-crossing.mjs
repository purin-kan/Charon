// Checks CrossingScene's pure logic (src/scenes/crossing-layout.js) against the real engine and the
// crossing fixtures (no Phaser needed). Run: node tools/check-crossing.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { boatZone } from '../src/scenes/boarding-layout.js';
import { boatSpots } from '../src/scenes/delivery-layout.js';
import {
  CREW, crewXs, abilities, approachOutcome, approachWarning, attempt, boatEntries, branchSigns, buttonDetail, crossingOutcome, crossingStep,
  SIGNS, placeName, purifyAction, soulDetail, typeDetail, worldLayout,
} from '../src/scenes/crossing-layout.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const fixture = (name) => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));
// src/text.js imports JSON, which plain Node refuses, so this reads the same file directly.
const sceneText = JSON.parse(readFileSync(path.join(dir, '..', '..', 'data', 'scene-text.json'), 'utf8'));
const t = (key, values = {}) => key.split('.').reduce((node, part) => node[part], sceneText).replace(/\{(\w+)\}/g, (_, name) => values[name]);

let bad = 0;
function check(name, ok) {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);
}
const name = (type) => Ferry.data.souls.find((s) => s.id === type).name;
const dest = (id) => Ferry.data.destinations.find((d) => d.id === id).name;
/** PLAN then CONFIRM for one option; returns the review state and the state after. */
function cross(state, option) {
  const review = Ferry.transition(state, { type: 'PLAN', action: { type: 'CROSS', option } });
  return { review, next: Ferry.transition(review, { type: 'CONFIRM' }) };
}

// Steps.
const windowState = fixture('window');
const fork = fixture('fork');
const review = fixture('review');
check('window is the prepare step', crossingStep(windowState) === 'prepare');
check('fork is the fork step', crossingStep(fork) === 'fork');
check('review is the review step', crossingStep(review) === 'review');
check('a delivery is away', crossingStep(fixture('delivery')) === 'away');
check('a choice over the scene is away', crossingStep(fixture('choice-odysseus')) === 'away');

// Boat.
const prep = fixture('crossing-prep');
const { entries } = boatEntries(prep, Ferry);
check('every passenger has one spot', entries.length === prep.boat.length && new Set(entries.map((e) => `${e.x},${e.y}`)).size === entries.length);
check('labels use the ship Anger limit', entries[0].labels.anger.endsWith(`/${Ferry.data.config.shipAngerLimit}`));
const withLong = Ferry.transition(prep, { type: 'START_CROSSING' });
const rider = boatEntries(withLong, Ferry).entries.find((e) => e.span === 0);
check('a Long with no seat rides level with the souls, on their left', rider && rider.y === entries[0].y && boatEntries(withLong, Ferry).entries.every((e) => e.span === 0 || e.x > rider.x));

// Where the boat is.
check('the first crossing of a cycle starts at the Starting Shore', placeName(windowState, Ferry, t) === t('common.startingShore'));
check('a later crossing starts at the last stop', placeName(fixture('crossing-lethal'), Ferry, t) === dest(fixture('crossing-lethal').destination));

// Abilities: the engine's answer, before the fork only.
const ab = abilities(prep, Ferry, t);
const meal = ab.find((a) => a.kind === 'meal');
const purify = ab.find((a) => a.kind === 'purify');
check('the shared meal is offered', meal && meal.label === t('crossing.meal') && attempt(prep, meal.action, Ferry));
check('the Priest can purify, never himself', purify && purify.targets.length === prep.boat.length - 1 && !purify.targets.includes(purify.priestId));
check('every purify target is legal', purify.targets.every((id) => attempt(prep, purifyAction(purify.priestId, id), Ferry)));
const purified = Ferry.transition(prep, purifyAction(purify.priestId, purify.targets[0]));
check('an exhausted Priest is no longer offered', !abilities(purified, Ferry, t).some((a) => a.kind === 'purify'));
const ate = Ferry.transition(prep, meal.action);
check('the meal is offered once', !abilities(ate, Ferry, t).some((a) => a.kind === 'meal'));
check('no abilities after the fork', abilities(withLong, Ferry, t).length === 0);
check('no abilities with nobody able', abilities(windowState, Ferry, t).length === 0);

// The warning above "Approach the fork".
check('warned that the meal and purify end at the fork (memories stay playable)', approachWarning(prep, Ferry, t) === t('crossing.approachWarningAbilities'));
const handOnly = structuredClone(windowState);
handOnly.hand = prep.hand.slice(0, 1);
check('no warning when only memories are held, since they stay playable at the fork', approachWarning(handOnly, Ferry, t) === '');
check('no warning with nothing usable', approachWarning(windowState, Ferry, t) === '');
check('no warning at the fork', approachWarning(fork, Ferry, t) === '');

// Approaching the fork.
const appr = approachOutcome(prep, withLong, Ferry, t);
const longAboard = withLong.boat.find((x) => !prep.boat.some((y) => y.id === x.id));
check('a scheduled Long boards at the fork', appr.boarded.length === 1 && appr.boarded[0] === longAboard.id);
check('its line names it and its level', appr.lines[0] === `${name(longAboard.type)} boards at level ${longAboard.level}.`);
check('an approach with no Long changes nothing', approachOutcome(windowState, Ferry.transition(windowState, { type: 'START_CROSSING' }), Ferry, t).lines.length === 0);

// An ordinary crossing.
const plain = crossingOutcome(review, Ferry.transition(review, { type: 'CONFIRM' }), Ferry, t);
const p = Ferry.preview({ ...review, phase: 'window' }, review.pending.option);
check('Light paid is the engine preview', plain.paid === p.payment && plain.lightAfter === review.light - p.payment);
check('the Light line shows the amount', plain.lightLine === (p.payment ? `−${p.payment} Light` : t('crossing.noLightLost')));
check('from the Starting Shore', plain.from === `From: ${t('common.startingShore')}`);
check('arrives at the chosen destination', plain.to === dest(review.routes.offers[0][review.pending.option]) && plain.arrived === `Arrived at ${plain.to}`);
check('nobody boards or leaves on an ordinary crossing', !plain.departed.length && !plain.boarded.length && !plain.lines.length && !plain.ended);

// A crossing that puts out the lantern.
const lethalFork = fixture('crossing-lethal');
const lethalOption = [0, 1].find((o) => Ferry.preview(lethalFork, o).lethal);
const lethal = cross(lethalFork, lethalOption);
const dead = crossingOutcome(lethal.review, lethal.next, Ferry, t);
check('a lethal crossing ends the run', dead.ended && dead.lightAfter === 0 && dead.endLine === t('crossing.lanternOut'));
check('a lethal crossing still names where it went', dead.to === dest(lethalFork.routes.offers[0][lethalOption]));

// A concealed route is named only on arrival.
const veiled = fixture('crossing-concealed');
const hidden = Ferry.routeView(veiled)[0].find((o) => o.hidden).option;
const reveal = cross(veiled, hidden);
const revealed = crossingOutcome(reveal.review, reveal.next, Ferry, t);
check('the concealed destination is revealed on arrival', revealed.concealed && revealed.to === dest(veiled.routes.offers[0][hidden]));
check('a visible route is not concealed', !plain.concealed);

// Odysseus at his wish leaves for Tiresias.
const ody = fixture('crossing-odysseus');
const odyHero = ody.boat.find((x) => x.type === 'SOUL-ODYSSEUS');
const odyRun = cross(ody, ody.routes.offers[0].indexOf(Ferry.wish(odyHero)));
const odyOut = crossingOutcome(odyRun.review, odyRun.next, Ferry, t);
check('Odysseus leaves on arrival and the choice opens', odyRun.next.phase === 'choice' && odyOut.departed.includes(odyHero.id));
check('his line says he leaves the boat', odyOut.lines.includes(`${name('SOUL-ODYSSEUS')} leaves the boat.`));

// Heracles at his wish: Cerberus boards, two souls flee, both now wish elsewhere.
const her = fixture('crossing-heracles');
const herHero = her.boat.find((x) => x.type === 'SOUL-HERACLES');
const herRun = cross(her, her.routes.offers[0].indexOf(Ferry.wish(herHero)));
const herOut = crossingOutcome(herRun.review, herRun.next, Ferry, t);
const cerberus = herRun.next.boat.find((x) => x.type === 'CHAR-CERBERUS');
check('Cerberus boards', herOut.boarded.includes(cerberus.id) && herOut.lines.includes(`${name('CHAR-CERBERUS')} boards.`));
check('two souls are frightened off the boat', herOut.departed.length === 2 && herOut.departed.every((id) => !herRun.next.boat.some((x) => x.id === id)));
check('Heracles now wishes elsewhere', herOut.lines.includes(`${name('SOUL-HERACLES')} now wishes for ${dest(Ferry.wish(herRun.next.boat.find((x) => x.id === herHero.id)))}.`));

// The river world: a stop looks the same in BoardingScene, CrossingScene and DeliveryScene.
const world = worldLayout(prep, Ferry);
const hull = boatZone(boatSpots(prep, Ferry).slots);
check('home is the hull centre BoardingScene and DeliveryScene use', world.home.x === hull.x && world.home.y === hull.y);
const signW = 740 * SIGNS.scale;
const signH = 270 * SIGNS.scale;
const boatEnd = world.fork.x + 768 / 2;
check('at the fork the signs stand ahead of the boat, on its right', world.signs.every((s) => s.x - signW / 2 >= boatEnd));
check('the boat rows in from off the left of the screen', world.back + 768 / 2 < 0);
check('the signs clear the status line and stop above the panel', world.signs.every((s) => s.y - signH / 2 > 120 && s.y + signH / 2 < 545));
check('the signs do not overlap', world.signs[1].y - world.signs[0].y > signH);
check('the signs stay on screen', world.signs.every((s) => s.x + signW / 2 <= 1280));

// Branch signs come from the route model.
const forkSigns = branchSigns(fork, Ferry, t);
check('two signs at the fork, with names and fog', forkSigns.length === 2 && forkSigns.every((s) => s.name && s.fog && s.action?.type === 'PLAN'));
check('a sign hover shows the fog breakdown', forkSigns.every((s) => s.detail.some((l) => l.startsWith('Base '))));
check('before the fork the branches are unseen', branchSigns(windowState, Ferry, t).every((s) => s.name === '?' && !s.action));
check('the picked branch is marked in review', branchSigns(review, Ferry, t).filter((s) => s.picked).length === 1);
const veiledSigns = branchSigns(fixture('crossing-concealed'), Ferry, t);
check('a concealed branch says so', veiledSigns.some((s) => s.hidden && s.name === t('crossing.concealed') && s.fog === '?'));

// Hover details.
const cook = prep.boat.find((x) => x.type === 'SOUL-COOK');
const cookDetail = soulDetail(prep, cook, Ferry, t);
check('a soul hover names it with its personal name', cookDetail.title.startsWith('Cook ('));
check('a soul hover shows its wish, Anger, memory and quest', ['Wish:', 'Anger:', 'Memory:', 'A shared meal:'].every((k) => cookDetail.lines.some((l) => l.startsWith(k))));
const longDetail = soulDetail(withLong, longAboard, Ferry, t);
check('a Long hover shows its level and its text', longDetail.lines.includes(`Level: ${longAboard.level}`) && longDetail.lines.includes(Ferry.data.souls.find((s) => s.id === longAboard.type).text));
// Shore hovers (BoardingScene): what each kind of soul does, before it boards.
const questLine = (id) => Ferry.data.quests.find((q) => q.id === id);
const motherLines = typeDetail('SOUL-MOTHER', Ferry, t);
check('a shore hover names a quest and its partner', motherLines.includes(t('crossing.detailQuestWith', { name: questLine('QUEST-FAMILY').name, partners: 'Child', description: questLine('QUEST-FAMILY').description })));
check('the Merchant hover lists both of its quests and the depart rule', ['QUEST-SWORD', 'QUEST-BOAT'].every((id) => typeDetail('SOUL-MERCHANT', Ferry, t).some((l) => l.startsWith(questLine(id).name + ' (with'))) && typeDetail('SOUL-MERCHANT', Ferry, t).includes(t('crossing.detailTrio')));
check('the Priest hover says he can purify', typeDetail('SOUL-PRIEST', Ferry, t).includes(t('crossing.detailPurify')));
check('a hero hover shows its quest without partners', typeDetail('SOUL-HERACLES', Ferry, t).includes(t('crossing.detailQuest', { name: questLine('QUEST-HERACLES').name, description: questLine('QUEST-HERACLES').description })));
check('an active quest is listed once, not again as a possible one', cookDetail.lines.filter((l) => l.startsWith(questLine('QUEST-MEAL').name)).length === 1);
check('every soul type has some detail beyond its memory line', Ferry.data.souls.every((d) => typeDetail(d.id, Ferry, t).length >= 1));
check('the meal hover is the quest description from the data', buttonDetail('meal', prep, Ferry, t) === Ferry.data.quests.find((q) => q.id === 'QUEST-MEAL').description);
check('the approach hover warns while something would be lost', buttonDetail('approach', prep, Ferry, t) === t('crossing.approachWarningAbilities'));
check('otherwise the approach hover explains it', buttonDetail('approach', windowState, Ferry, t) === t('crossing.approachDetail'));

// QA-03 (#56): in the bow view each soul's name label (wrapped at a width set in soul-token.js) clears its neighbours',
// and a full boat still fits on the 1280 px screen.
const nameWrap = Number(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'scenes', 'soul-token.js'), 'utf8').match(/wordWrap: \{ width: (\d+) \}/)?.[1]);
check(`bow view souls stand farther apart than a name is wide (${CREW.step} > ${nameWrap} px)`, nameWrap > 0 && CREW.step >= nameWrap + 16);
const crewFits = [1, 2, 4, 8].every((n) => { const xs = crewXs(n); return xs.length === n && xs[0] - nameWrap / 2 >= 0 && xs[n - 1] + nameWrap / 2 <= 1280 && Math.abs((xs[0] + xs[n - 1]) / 2 - 640) < 1e-9; });
check('bow view souls are centred and up to 8 fit on the screen', crewFits);

process.exit(bad ? 1 : 0);
