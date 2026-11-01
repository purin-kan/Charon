// Checks DeliveryScene's and ChoiceOverlay's pure logic against the real engine (no Phaser needed).
// Run: node tools/check-delivery.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { boatZone } from '../src/scenes/boarding-layout.js';
import {
  DOCK, applyDrop, arrivalOutcome, choiceView, confirmLabel, deliverAction, dropArea, headingText,
  introText, layoutDelivery, lossLines, memoryRowSpots, refusal, rewardSpots,
} from '../src/scenes/delivery-layout.js';

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
const entryOf = (layout, id) => layout.entries.find((e) => e.id === id);

// Layout.
const none = fixture('delivery');
const match = fixture('delivery-match');
const leaver = match.boat.find((x) => !Ferry.deliveryReason(match, x) && Ferry.data.souls.find((d) => d.id === x.type).memory);
const stayer = match.boat.find((x) => Ferry.wish(x) !== match.destination);
const open = layoutDelivery(match, [], Ferry);
check('every passenger has one spot', open.entries.length === match.boat.length);
check('nobody starts on the dock', open.entries.every((e) => e.area === 'seat'));
check('a matching wish is flagged', entryOf(open, leaver.id).matches === true);
check('a different wish is not flagged', entryOf(open, stayer.id).matches === false);
check('no soul matches in the delivery fixture', layoutDelivery(none, [], Ferry).entries.every((e) => !e.matches));
check('labels use the ship Anger limit', entryOf(open, leaver.id).labels.anger.endsWith('/4'));

const marked = layoutDelivery(match, [leaver.id], Ferry);
const spot = entryOf(marked, leaver.id);
const inDock = (e) => Math.abs(e.x - DOCK.x) <= DOCK.w / 2 && Math.abs(e.y - DOCK.y) <= DOCK.h / 2;
check('a marked soul moves to the dock', spot.area === 'dock' && inDock(spot));
check('the others keep their seats', entryOf(marked, stayer.id).x === entryOf(open, stayer.id).x);

// Souls with no seat ride on the deck and must not stack on anyone.
const riders = structuredClone(none);
riders.boat[1].type = 'SOUL-POLONG';
riders.boat.push({ ...riders.boat[1], id: 'ACTOR-99' });
const riderSpots = layoutDelivery(riders, [], Ferry).entries;
check('no two souls share a spot', new Set(riderSpots.map((e) => `${e.x},${e.y}`)).size === riderSpots.length);
const hull = boatZone(open.slots);
check('deck riders sit below the hull', riderSpots.filter((e) => e.span === 0).every((e) => e.y > hull.y + hull.h / 2));

// A two-seat soul spans its seats and an overfull boat still lays out.
const wide = structuredClone(none);
wide.boat[0] = { ...wide.boat[0], type: 'SOUL-PO-NAK', level: 3 };
const wideEntries = layoutDelivery(wide, [], Ferry).entries;
check('a two-seat soul centres on its seats', wideEntries[0].x === (open.slots[0].x + open.slots[1].x) / 2);
check('the next soul takes the third seat', wideEntries[1].x === open.slots[2].x);

// Drop areas.
const { slots } = open;
check('the dock centre is the dock', dropArea(DOCK.x, DOCK.y, slots) === 'dock');
check('a seat is the boat', dropArea(slots[0].x, slots[0].y, slots) === 'boat');
check('open water is nothing', dropArea(600, 650, slots) === null);
const deckSpot = riderSpots.find((e) => e.span === 0);
check('a deck spot is the boat', dropArea(deckSpot.x, deckSpot.y, slots) === 'boat');
check('the gap between hull and deck is the boat', dropArea(slots[0].x, hull.y + hull.h / 2 + 4, slots) === 'boat');
check('water past the deck is nothing', dropArea(slots[0].x, 620, slots) === null);

// Marking.
const before = JSON.stringify(match);
const seatEntry = entryOf(open, leaver.id);
const accepted = applyDrop(match, [], seatEntry, 'dock', Ferry);
check('an eligible soul is marked', accepted.marked.includes(leaver.id) && accepted.reason === null);
const refused = applyDrop(match, [], entryOf(open, stayer.id), 'dock', Ferry);
check('an ineligible soul is refused with the engine reason', refused.marked.length === 0 && refused.reason === Ferry.deliveryReason(match, stayer));
check('a seat soul dropped on the boat changes nothing', applyDrop(match, [], seatEntry, 'boat', Ferry).marked.length === 0);
check('a seat soul dropped on water changes nothing', applyDrop(match, [], seatEntry, null, Ferry).marked.length === 0);
const dockEntry = entryOf(marked, leaver.id);
check('a dock soul dragged to the boat is unmarked', applyDrop(match, [leaver.id], dockEntry, 'boat', Ferry).marked.length === 0);
check('a dock soul dropped on water stays marked', applyDrop(match, [leaver.id], dockEntry, null, Ferry).marked.length === 1);
check('a dock soul dropped on the dock stays marked', applyDrop(match, [leaver.id], dockEntry, 'dock', Ferry).marked.length === 1);
check('test-runs leave the state alone', JSON.stringify(match) === before);

// Order matters: Mason must be the last passenger, so he can follow the soul ahead of him but not lead.
const boatQuest = structuredClone(none);
const mason = boatQuest.boat.find((x) => x.type === 'SOUL-MASON');
const other = boatQuest.boat.find((x) => x.type !== 'SOUL-MASON');
other.wish = 'DEST-ACHERON';
boatQuest.destination = 'DEST-ACHERON';
boatQuest.quests.push({
  id: `QUEST-${boatQuest.nextQuest}`, definitionId: 'QUEST-BOAT', participants: [mason.id, 'ACTOR-3'], status: 'active',
  stage: 'merchant-delivered', sharedRoutes: 0, delivered: ['ACTOR-3'], rewardClaimed: false, rewardType: null,
  reason: null, cycle: boatQuest.cycle, data: { merchantRound: '0' },
});
boatQuest.nextQuest = String(Number(boatQuest.nextQuest) + 1);
check('Mason alone is refused', refusal(boatQuest, [mason.id], Ferry) !== null);
check('Mason behind the other soul is accepted', refusal(boatQuest, [other.id, mason.id], Ferry) === null);
const quest = layoutDelivery(boatQuest, [other.id, mason.id], Ferry);
const afterUndo = applyDrop(boatQuest, [other.id, mason.id], entryOf(quest, other.id), 'boat', Ferry);
check('undoing the soul ahead also sends Mason back', afterUndo.marked.length === 0);
check('the player is told why Mason went back', afterUndo.reason === refusal(boatQuest, [mason.id], Ferry));

// Button and heading.
check('confirm reads Keep everyone with nobody marked', confirmLabel(match, [], t) === 'Keep everyone / finish round');
check('confirm reads Deliver once someone is marked', confirmLabel(match, [leaver.id], t) === 'Deliver selected passengers');
check('deliverAction sends the marked ids', JSON.stringify(deliverAction(['A', 'B'])) === JSON.stringify({ type: 'DELIVER', ids: ['A', 'B'] }));
check('heading names the stop', headingText(match, Ferry, t).includes(Ferry.data.destinations.find((d) => d.id === match.destination).name));
const empty = { ...match, boat: [] };
check('empty boat has a finish button', confirmLabel(empty, [], t) === 'Finish round');
check('empty boat explains itself', introText(empty, t).includes('left the boat empty'));

// Outcomes.
const next = Ferry.transition(match, deliverAction([leaver.id]));
const outcome = arrivalOutcome(match, next, [leaver.id], Ferry);
check('the delivered soul departs', outcome.departed.length === 1 && outcome.departed[0] === leaver.id);
check('the new memory is the reward', outcome.rewards.length >= 1 && outcome.rewards.every((m) => m.name && m.text));
const kept = Ferry.transition(match, deliverAction([]));
check('keeping everyone has no departure', arrivalOutcome(match, kept, [], Ferry).departed.length === 0);
const stopped = { ...match, boat: [leaver], hand: match.hand };
check('a run that stops partway only departs who left', arrivalOutcome(match, stopped, [stayer.id, leaver.id], Ferry).departed[0] === stayer.id
  && arrivalOutcome(match, stopped, [stayer.id, leaver.id], Ferry).departed.length === 1);
check('an ordinary delivery loses nothing', outcome.lost.length === 0 && outcome.stolenRewards === 0);
check('an ordinary delivery has no loss lines', lossLines(outcome, t).length === 0);
const held = [{ id: 'MEMORY-1', type: 'MEM-LIGHT' }, { id: 'MEMORY-2', type: 'MEM-FOG' }];
const robbed = arrivalOutcome({ hand: held, nextMemory: '3' }, { boat: [], hand: [held[0], { id: 'MEMORY-3', type: 'MEM-CALM' }], nextMemory: '4' }, [], Ferry);
check('a theft of a held memory is reported', robbed.lost.length === 1 && robbed.lost[0].id === 'MEMORY-2' && robbed.stolenRewards === 0 && robbed.rewards.length === 1);
check('the theft names the memory', lossLines(robbed, t)[0] === 'Po Luem took Fog Shield.');
const snatched = arrivalOutcome({ hand: held, nextMemory: '3' }, { boat: [], hand: held, nextMemory: '4' }, [], Ferry);
check('a theft of the new reward is reported', snatched.rewards.length === 0 && snatched.stolenRewards === 1 && lossLines(snatched, t).length === 1);
const rowOfFive = rewardSpots(5);
check('five rewards fit the screen', rowOfFive[0].x > 0 && rowOfFive[4].x < 1280);

// Choice views.
const theft = fixture('choice');
const theftView = choiceView(theft, Ferry, t);
check('Po Luem lists every held memory', theftView.kind === 'memory-loss' && theftView.rows.length === theft.hand.length);
check('Po Luem rows choose by id', JSON.stringify(theftView.rows[0].action) === JSON.stringify({ type: 'CHOOSE', id: theft.hand[0].id }));
check('Po Luem rows read Lose', theftView.rows[0].label.startsWith('Lose '));
const tiresias = fixture('choice-odysseus');
const heroView = choiceView(tiresias, Ferry, t);
check('Odysseus offers two branches', heroView.options.map((o) => o.action.branch).join() === 'charybdis,zilla');
const charybdis = Ferry.transition(tiresias, heroView.options[0].action);
check('the Charybdis action resolves', charybdis.phase === 'delivery' && charybdis.boat.length === 0);
check('the Zilla action resolves', Ferry.transition(tiresias, heroView.options[1].action).phase === 'delivery');
check('an empty boat finishes the round', Ferry.transition(charybdis, deliverAction([])).phase === 'window');
const twelve = memoryRowSpots(12);
check('twelve rows stay on screen', twelve.every((r) => r.x + r.w <= 1240 && r.y < 620));
check('rows never share a spot', new Set(twelve.map((r) => `${r.x},${r.y}`)).size === 12);

process.exit(bad ? 1 : 0);
