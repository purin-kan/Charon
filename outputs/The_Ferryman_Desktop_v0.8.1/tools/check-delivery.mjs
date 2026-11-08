// Checks DeliveryScene's and ChoiceOverlay's pure logic against the real engine (no Phaser needed).
// Run: node tools/check-delivery.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { STAGE, boatZone, soulName } from '../src/scenes/boarding-layout.js';
import {
  SHORE_Y, arrivalOutcome, choiceView, confirmLabel, deliverAction, exitCost, exitCostLine, exitWarning, headingText,
  introText, keepValidMarks, layoutDelivery, lossLines, memoryRowSpots, refusal, rewardSpots, testRun, toggleMark,
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
// Any soul may leave at any stop; only a matching wish gives its memory. The fixture has one of each kind.
// A clean delivery fails no quest (the Mason at his wish still fails his quest while the Merchant is aboard).
const failsQuest = (x) => Ferry.transition(match, { type: 'DELIVER', ids: [x.id] }).quests.some((q, i) => q.status === 'failed' && match.quests[i]?.status !== 'failed');
const leaver = match.boat.find((x) => !Ferry.deliveryReason(match, x) && Ferry.wish(x) === match.destination && Ferry.data.souls.find((d) => d.id === x.type).memory && !failsQuest(x));
const wanderer = match.boat.find((x) => !Ferry.deliveryReason(match, x) && Ferry.wish(x) !== match.destination && Ferry.data.souls.find((d) => d.id === x.type).memory && !failsQuest(x));
const stayer = match.boat.find((x) => Ferry.deliveryReason(match, x));
if (!leaver || !wanderer || !stayer) {
  console.log('FAIL delivery-match needs a soul at its wish with a memory, one that can leave elsewhere and one the engine refuses; run npm run fixtures');
  process.exit(1);
}
// The same boat with no Anger, so a delivery is not followed by Wraiths.
const calm = structuredClone(match);
for (const x of calm.boat) x.anger = 0;
const open = layoutDelivery(match, [], Ferry);
check('every passenger has one spot', open.entries.length === match.boat.length);
check('nobody starts ashore', open.entries.every((e) => e.area === 'seat'));
check('a soul that can leave is flagged', entryOf(open, leaver.id).canLeave === true);
check('a soul the engine refuses is not flagged', entryOf(open, stayer.id).canLeave === false);
check('a different wish can still leave', entryOf(open, wanderer.id).canLeave === true);
check('a matching wish is marked gold', entryOf(open, leaver.id).wishMatches === true);
check('a different wish is not gold', entryOf(open, wanderer.id).wishMatches === false);
check('the delivery fixture flags exactly the souls the engine lets leave', layoutDelivery(none, [], Ferry).entries.every((e) => e.canLeave === !Ferry.deliveryReason(none, e.actor)));
check('labels use the ship Anger limit', entryOf(open, leaver.id).labels.anger.endsWith(`/${Ferry.data.config.shipAngerLimit}`));

const marked = layoutDelivery(match, [leaver.id], Ferry);
const spot = entryOf(marked, leaver.id);
// The pier is on the right, at the screen edge: a soul ashore stands right of everyone still aboard, inside the view.
const ashore = (e) => e.y === SHORE_Y && e.x <= 1280 && marked.entries.every((x) => x.area === 'shore' || x.x < e.x);
check('a marked soul stands on the pier, right of the boat', spot.area === 'shore' && ashore(spot));
check('the others keep their seats', entryOf(marked, stayer.id).x === entryOf(open, stayer.id).x);

// Souls with no seat ride on the deck and must not stack on anyone.
const riders = structuredClone(none);
riders.boat[1].type = 'SOUL-POLONG';
riders.boat.push({ ...riders.boat[1], id: 'ACTOR-99' });
const riderSpots = layoutDelivery(riders, [], Ferry).entries;
check('no two souls share a spot', new Set(riderSpots.map((e) => `${e.x},${e.y}`)).size === riderSpots.length);
const hull = boatZone(open.slots);
const onDeck = (e) => e.y === open.slots[0].y && e.x >= hull.x - hull.w / 2 && e.x <= hull.x + hull.w / 2;
const longsOnLeft = (spots) => {
  const longs = spots.filter((e) => e.span === 0).map((e) => e.x);
  return spots.filter((e) => e.span > 0).every((e) => longs.every((x) => x < e.x));
};
check('Longs ride level with the souls', riderSpots.every(onDeck));
check('Longs ride on the left', longsOnLeft(riderSpots));

// Long Burden takes a seat but is still a Long, so it rides on the left too.
const burden = structuredClone(none);
burden.boat[burden.boat.length - 1].type = 'SOUL-PO-NAK';
burden.boat[burden.boat.length - 1].level = 1;
const burdenSpots = layoutDelivery(burden, [], Ferry).entries;
const burdenX = burdenSpots[burdenSpots.length - 1].x;
check('Long Burden rides left of the souls, though it takes a seat', burdenSpots.slice(0, -1).every((e) => e.x > burdenX));

// A full boat with Longs stays in one row, apart and aboard, however many board.
const seated = (s) => s.boat.filter((a) => Ferry.actorSeats(a) > 0);
const crowded = structuredClone(riders);
const others = seated(crowded);
while (seated(crowded).length < open.slots.length) crowded.boat.push({ ...others[0], id: `ACTOR-${90 + crowded.boat.length}` });
const crowdedSpots = layoutDelivery(crowded, [], Ferry).entries;
check('a full boat keeps every soul aboard', crowdedSpots.every(onDeck));
check('a full boat keeps Longs on the left', longsOnLeft(crowdedSpots));
const row = crowdedSpots.map((e) => e.x).sort((a, b) => a - b);
check('a full boat leaves room between souls', row.every((x, i) => i === 0 || x - row[i - 1] >= 55));
check('a tight row lifts every other name', crowdedSpots.some((e) => e.tier === 1) && crowdedSpots.some((e) => e.tier === 0));
check('a roomy row keeps its names level', layoutDelivery(none, [], Ferry).entries.every((e) => e.tier === 0));
const manyLongs = structuredClone(crowded);
for (let i = 0; i < 6; i++) manyLongs.boat.push({ ...riders.boat[1], id: `ACTOR-${70 + i}` });
const manySpots = layoutDelivery(manyLongs, [], Ferry).entries;
check('a boat crowded with Longs keeps them apart and aboard', new Set(manySpots.map((e) => e.x)).size === manySpots.length && manySpots.every(onDeck));
const plain = structuredClone(none);
check('with no Long the seats stay where they were', layoutDelivery(plain, [], Ferry).entries.every((e, i) => e.span !== 1 || e.x === open.slots[i].x || e.area !== 'seat'));

// A two-seat soul spans its seats and an overfull boat still lays out.
const wide = structuredClone(none);
wide.boat[0] = { ...wide.boat[0], type: 'SOUL-PO-NAK', level: 3 };
const wideEntries = layoutDelivery(wide, [], Ferry).entries;
check('a two-seat soul centres on its seats', wideEntries[0].x === (open.slots[0].x + open.slots[1].x) / 2);
check('the next soul takes the third seat', wideEntries[1].x === open.slots[2].x);

// Marking.
const before = JSON.stringify(match);
const seatEntry = entryOf(open, leaver.id);
const accepted = toggleMark(match, [], seatEntry, Ferry, t);
check('an eligible soul is marked', accepted.marked.includes(leaver.id) && accepted.reason === null);
check('a soul at the wrong stop is marked', toggleMark(match, [], entryOf(open, wanderer.id), Ferry, t).marked.includes(wanderer.id));
const refused = toggleMark(match, [], entryOf(open, stayer.id), Ferry, t);
check('an ineligible soul is refused with the engine reason', refused.marked.length === 0 && refused.reason === Ferry.deliveryReason(match, stayer));
const dockEntry = entryOf(marked, leaver.id);
check('a click on a soul on the dock unmarks it', toggleMark(match, [leaver.id], dockEntry, Ferry, t).marked.length === 0);
check('test-runs leave the state alone', JSON.stringify(match) === before);

// Order matters: Mason may leave at any time, but his quest completes only when he is the last passenger.
const boatQuest = structuredClone(none);
const mason = boatQuest.boat.find((x) => x.type === 'SOUL-MASON');
const other = boatQuest.boat.find((x) => x.type !== 'SOUL-MASON');
// Exactly two aboard (the fixture's boat can hold more): any third soul goes back to the pool with its quests.
for (const x of boatQuest.boat.filter((a) => a !== mason && a !== other)) {
  boatQuest.discard.push(x.origin);
  boatQuest.quests = boatQuest.quests.filter((q) => !q.participants.includes(x.id));
}
boatQuest.boat = [other, mason];
other.wish = 'DEST-ACHERON';
boatQuest.destination = 'DEST-ACHERON';
boatQuest.quests.push({
  id: `QUEST-${boatQuest.nextQuest}`, definitionId: 'QUEST-BOAT', participants: [mason.id, 'ACTOR-3'], status: 'active',
  stage: 'merchant-delivered', sharedRoutes: 0, delivered: ['ACTOR-3'], rewardClaimed: false, rewardType: null,
  reason: null, cycle: boatQuest.cycle, data: { merchantRound: '0' },
});
boatQuest.nextQuest = String(Number(boatQuest.nextQuest) + 1);
const boatName = Ferry.data.quests.find((d) => d.id === 'QUEST-BOAT').name;
check('Mason alone may leave', refusal(boatQuest, [mason.id], Ferry, t) === null);
const alone = arrivalOutcome(boatQuest, Ferry.transition(boatQuest, deliverAction([mason.id])), deliverAction([mason.id]), Ferry);
check('Mason leaving ahead of a passenger fails the quest, with the engine reason', alone.failedQuests.length === 1
  && lossLines(alone, t, Ferry).includes(`${boatName} failed: Mason left before the last passenger.`));
check('Mason behind the other soul is accepted', refusal(boatQuest, [other.id, mason.id], Ferry, t) === null);
check('and completes the quest', Ferry.transition(boatQuest, deliverAction([other.id, mason.id])).quests.find((q) => q.definitionId === 'QUEST-BOAT').status === 'completed');
const quest = layoutDelivery(boatQuest, [other.id, mason.id], Ferry);
const afterUndo = toggleMark(boatQuest, [other.id, mason.id], entryOf(quest, other.id), Ferry, t);
check('undoing the soul ahead keeps Mason marked', afterUndo.marked.join() === mason.id);

// Button and heading.
check('confirm reads Keep everyone with nobody marked', confirmLabel(match, [], t) === 'Keep everyone / finish round');
check('confirm reads Deliver once someone is marked', confirmLabel(match, [leaver.id], t) === 'Deliver selected passengers');
check('deliverAction sends the marked ids', JSON.stringify(deliverAction(['A', 'B'])) === JSON.stringify({ type: 'DELIVER', ids: ['A', 'B'] }));
check('heading names the stop', headingText(match, Ferry, t).includes(Ferry.data.destinations.find((d) => d.id === match.destination).name));
const empty = { ...match, boat: [] };
check('empty boat has a finish button', confirmLabel(empty, [], t) === 'Finish round');
check('empty boat explains itself', introText(empty, t).includes('left the boat empty'));

// Outcomes.
const next = Ferry.transition(calm, deliverAction([leaver.id]));
const outcome = arrivalOutcome(calm, next, deliverAction([leaver.id]), Ferry);
check('the delivered soul departs', outcome.departed.length === 1 && outcome.departed[0] === leaver.id);
check('the new memory is the reward', outcome.rewards.length >= 1 && outcome.rewards.every((m) => m.name && m.text));
const kept = Ferry.transition(match, deliverAction([]));
check('keeping everyone has no departure', arrivalOutcome(match, kept, deliverAction([]), Ferry).departed.length === 0);
const stopped = { ...match, phase: 'ended', boat: [leaver], hand: match.hand };
check('a run that stops partway only departs who left', arrivalOutcome(match, stopped, deliverAction([stayer.id, leaver.id]), Ferry).departed[0] === stayer.id
  && arrivalOutcome(match, stopped, deliverAction([stayer.id, leaver.id]), Ferry).departed.length === 1);
check('an ordinary delivery loses nothing', outcome.lost.length === 0 && outcome.stolenRewards === 0);
check('an ordinary delivery has no loss lines', lossLines(outcome, t, Ferry).length === 0);
// Leaving away from a wish (QA-01, #56): a plain cost line whenever it costs Light, the red warning only when the lantern goes out.
check('no cost line or warning with nobody marked', exitCostLine(calm, [], Ferry, t) === '' && exitWarning(calm, [], Ferry, t) === '');
check('no cost line for a soul at its wish', exitCostLine(calm, [leaver.id], Ferry, t) === '');
check('a cost line, not a warning, while the Light can pay for the exits', exitWarning(calm, [wanderer.id], Ferry, t) === ''
  && exitCostLine(calm, [wanderer.id], Ferry, t) === `Leaving away from a wish costs 1 Light each: 1 marked, Light ${calm.light} → ${calm.light - 1}.`);
check('it warns before confirming when the exits would put the lantern out', exitWarning({ ...calm, light: 1 }, [wanderer.id], Ferry, t).includes('lantern goes out'));
check('and then shows no cost line beside the warning', exitCostLine({ ...calm, light: 1 }, [wanderer.id], Ferry, t) === '');
const strayIds = calm.boat.filter((x) => Ferry.wish(x) !== calm.destination && testRun(calm, [x.id], Ferry).ok).map((x) => x.id);
check('the warning counts every marked soul away from its wish, even past the one that ends the run',
  strayIds.length >= 2 && exitWarning({ ...calm, light: 1 }, strayIds, Ferry, t).includes(`${strayIds.length} marked`));
// exitCost mirrors the engine: on the calm boat nothing after the exits touches the Light, so the engine's Light after
// DELIVER is the cost. Every order of marks the engine accepts is compared, the Mason included.
const lightAfter = (state, ids) => Ferry.transition(state, deliverAction(ids)).light;
const subsets = calm.boat.reduce((all, x) => all.concat(all.map((ids) => [...ids, x.id])), [[]]).filter((ids) => testRun(calm, ids, Ferry).ok);
const drift = subsets.filter((ids) => exitCost(calm, ids, Ferry).after !== lightAfter(calm, ids));
check(`exitCost matches the engine for every accepted set of marks (${subsets.length})`, subsets.length > 2 && drift.length === 0);
// A Long Grasp at level 3 or more does 1 damage as it leaves, which Guard absorbs; leaving away from its wish still costs 1.
const grasp = structuredClone(calm);
const graspSoul = grasp.boat.find((x) => x.type === 'SOUL-PO-DUE');
if (graspSoul) {
  Object.assign(graspSoul, { level: 3, anger: 2 });
  const away = Ferry.wish(graspSoul) !== grasp.destination ? 1 : 0;
  const graspOk = testRun(grasp, [graspSoul.id], Ferry).ok;
  check('a level 3 Long Grasp leaving costs its damage too, as the engine does', graspOk && exitCost(grasp, [graspSoul.id], Ferry).after === grasp.light - 1 - away
    && exitCost(grasp, [graspSoul.id], Ferry).after === lightAfter(grasp, [graspSoul.id]));
  const guarded = { ...grasp, window: { ...grasp.window, guard: 1 } };
  check('Guard absorbs the Long Grasp damage, as the engine does', exitCost(guarded, [graspSoul.id], Ferry).after === grasp.light - away
    && exitCost(guarded, [graspSoul.id], Ferry).after === lightAfter(guarded, [graspSoul.id]));
} else check('delivery-match has a Long Grasp for the damage case; run npm run fixtures', false);
// A Long Mist at its wish, Tartarus, pays 1 Light as it leaves, up to the most the lantern holds.
const farePaid = polongFor({ ...calm, destination: 'DEST-TARTARUS', light: calm.maxLight - 2 }, { type: 'SOUL-POLONG', level: 1, anger: 0 });
check('a Long Mist paying its fare is counted, as the engine does', testRun(farePaid, [leaver.id], Ferry).ok && exitCost(farePaid, [leaver.id], Ferry).after === farePaid.light + 1
  && exitCost(farePaid, [leaver.id], Ferry).after === lightAfter(farePaid, [leaver.id]));
// The Mason leaves last. At full Light the fare is capped, so the order shows: fare first, then the Mason's 1 Light.
const masonId = farePaid.boat.find((x) => x.type === 'SOUL-MASON' && Ferry.wish(x) !== 'DEST-TARTARUS')?.id;
const fullFare = { ...farePaid, light: farePaid.maxLight };
const masonFirst = masonId ? [masonId, leaver.id] : [];
check('the Mason leaves last, as the engine does', masonId && testRun(fullFare, masonFirst, Ferry).ok
  && exitCost(fullFare, masonFirst, Ferry).after === fullFare.maxLight - 1 && exitCost(fullFare, masonFirst, Ferry).after === lightAfter(fullFare, masonFirst));
check('one invalid mark in the middle does not drop the valid marks after it', keepValidMarks(calm, [leaver.id, 'GONE', wanderer.id], Ferry).join() === [leaver.id, wanderer.id].join());
const strayAction = deliverAction([wanderer.id]);
const stray = arrivalOutcome(calm, Ferry.transition(calm, strayAction), strayAction, Ferry);
check('a soul at the wrong stop departs with no reward', stray.departed.join() === wanderer.id && stray.rewards.length === 0);
const wandererName = entryOf(open, wanderer.id).labels.name;
const wandererWish = Ferry.data.destinations.find((d) => d.id === Ferry.wish(wanderer)).name;
check('it says which memory was not given, and the 1 Light the early exit costs', lossLines(stray, t, Ferry).join('|') === `${wandererName} wished for ${wandererWish}. No memory.|Lost 1 Light.`);
// A Long may leave at any stop: the leaver becomes a Long Mist that wishes for somewhere other than this stop.
const elsewhere = Ferry.data.destinations.find((d) => d.id !== match.destination).id;
const misty = polongFor(match, { type: 'SOUL-POLONG', level: 1, anger: 0, wish: elsewhere });
const mist = misty.boat.find((x) => x.id === leaver.id);
const mistOpen = layoutDelivery(misty, [], Ferry);
check('a Long at the wrong stop may be marked', toggleMark(misty, [], entryOf(mistOpen, mist.id), Ferry, t).marked.join() === mist.id);
check('and is not dimmed', entryOf(mistOpen, mist.id).canLeave === true && entryOf(mistOpen, mist.id).wishMatches === false);
const held = [{ id: 'MEMORY-1', type: 'MEM-LIGHT' }, { id: 'MEMORY-2', type: 'MEM-FOG' }];
const robbed = arrivalOutcome({ boat: [], light: 1, hand: held, nextMemory: '3' }, { boat: [], light: 1, hand: [held[0], { id: 'MEMORY-3', type: 'MEM-CALM' }], nextMemory: '4' }, deliverAction([]), Ferry);
check('a theft of a held memory is reported', robbed.lost.length === 1 && robbed.lost[0].id === 'MEMORY-2' && robbed.stolenRewards === 0 && robbed.rewards.length === 1);
check('the theft names the memory', lossLines(robbed, t, Ferry)[0] === `${soulName('SOUL-PO-LUEM', Ferry)} took Fog Shield.`);
const snatched = arrivalOutcome({ boat: [], light: 1, hand: held, nextMemory: '3' }, { boat: [], light: 1, hand: held, nextMemory: '4' }, deliverAction([]), Ferry);
check('a theft of the new reward is reported', snatched.rewards.length === 0 && snatched.stolenRewards === 1 && lossLines(snatched, t, Ferry).length === 1);
const angry = structuredClone(none);
angry.boat[0].anger = Ferry.data.config.shipAngerLimit - 1; // one more Anger makes a Wraith
const wraithName = entryOf(layoutDelivery(angry, [], Ferry), angry.boat[0].id).labels.name;
const expired = arrivalOutcome(angry, Ferry.transition(angry, deliverAction([])), deliverAction([]), Ferry);
check('a Wraith is named', expired.wraiths.length === 1 && expired.wraiths[0] === wraithName);
check('the Light it cost is reported', expired.lightLost > 0 && expired.lightLost === angry.light - Ferry.transition(angry, deliverAction([])).light);
check('the Wraith reads as lines', lossLines(expired, t, Ferry).filter((l) => !l.includes(' failed')).join(' ') === `${wraithName} became a Wraith. Lost ${expired.lightLost} Light.`);
const lethal = structuredClone(angry);
lethal.light = 1;
const lethalNext = Ferry.transition(lethal, deliverAction([]));
const lethalOutcome = arrivalOutcome(lethal, lethalNext, deliverAction([]), Ferry);
check('a lethal Wraith is named too', lethalNext.phase === 'ended' && lethalOutcome.wraiths[0] === wraithName && lethalOutcome.lightLost === 1);
const doomed = structuredClone(match);
doomed.light = 1;
for (const x of doomed.boat) x.anger = Ferry.data.config.shipAngerLimit - 1;
const doomedNext = Ferry.transition(doomed, deliverAction([]));
const doomedOutcome = arrivalOutcome(doomed, doomedNext, deliverAction([]), Ferry);
check('a lethal Wraith names only itself', doomedNext.phase === 'ended' && doomedNext.boat.length === doomed.boat.length - 1
  && doomedOutcome.wraiths.length === 1);

// A Polong in Mother's seat: Polongs have no origin, so Mother's goes back to the discard.
function polongFor(state, fields) {
  const s = structuredClone(state);
  // The Long wishes for this stop unless fields say otherwise.
  Object.assign(s.boat.find((x) => x.id === leaver.id), { origin: null, wish: state.destination, ...fields });
  s.discard.push(leaver.type);
  return s;
}
const due = polongFor(match, { type: 'SOUL-PO-DUE', level: 3, anger: 2 });
due.light = 1;
check('a Po Due that ends the run may still be marked', refusal(due, [leaver.id], Ferry, t) === null);
check('a soul after it is refused with its own reason', refusal(due, [leaver.id, stayer.id], Ferry, t) === Ferry.deliveryReason(due, entryOf(open, stayer.id).actor));
check('and is not flagged', entryOf(layoutDelivery(due, [leaver.id], Ferry), stayer.id).canLeave === false);
const calmDue = polongFor(match, { type: 'SOUL-PO-DUE', level: 1, anger: 1 });
check('a matching wish the engine refuses is not flagged', Ferry.wish(entryOf(open, leaver.id).actor) === calmDue.destination
  && entryOf(layoutDelivery(calmDue, [], Ferry), leaver.id).canLeave === false);
const fare = polongFor(calm, { type: 'SOUL-POLONG', level: 1, anger: 0, wish: 'DEST-TARTARUS' });
fare.destination = 'DEST-TARTARUS'; // the fare is paid only at Tartarus
fare.boat.find((x) => x.id === stayer.id).anger = Ferry.data.config.shipAngerLimit - 1;
const fareNext = Ferry.transition(fare, deliverAction([leaver.id]));
const fareOutcome = arrivalOutcome(fare, fareNext, deliverAction([leaver.id]), Ferry);
check('a Po Long fare does not hide a Wraith', fareNext.light === fare.light && fareOutcome.lightLost === 1 && fareOutcome.lightGained === 1);
check('both show as lines', lossLines(fareOutcome, t, Ferry).join(' ').includes('Lost 1 Light. Gained 1 Light.'));
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
// Odysseus with a Farmer aboard and the Farmer's memory held, so both branches cost something.
const costly = structuredClone(tiresias);
costly.arrivals.splice(costly.arrivals.indexOf('SOUL-FARMER'), 1);
costly.boat.push({ id: `ACTOR-${costly.nextActor}`, type: 'SOUL-FARMER', origin: 'SOUL-FARMER', wish: 'DEST-ELYSIUM', anger: 0, boardingId: '1', bornRound: '0', level: 0, spread: false, exhausted: false });
costly.nextActor = String(Number(costly.nextActor) + 1);
const harvest = { id: `MEMORY-${costly.nextMemory}`, type: Ferry.data.souls.find((d) => d.id === 'SOUL-FARMER').memory, sourceRef: { kind: 'character', definitionId: 'SOUL-FARMER', instanceId: 'ACTOR-1' } };
costly.hand.push(harvest);
costly.nextMemory = String(Number(costly.nextMemory) + 1);
const outcomeOf = (state, action) => arrivalOutcome(state, Ferry.transition(state, action), action, Ferry);
const charybdisOutcome = outcomeOf(costly, heroView.options[0].action);
check('Charybdis shows the memory it took and Moly', lossLines(charybdisOutcome, t, Ferry).join() === `Charybdis took ${charybdisOutcome.lost[0]?.name}.`
  && charybdisOutcome.lost[0].id === harvest.id && charybdisOutcome.rewards.map((m) => m.type).join() === 'MEM-MOLY');
const zillaOutcome = outcomeOf(costly, heroView.options[1].action);
check('Zilla shows the Wraith, the Light and Nobody', lossLines(zillaOutcome, t, Ferry).join(' ') === 'Farmer became a Wraith. Lost 1 Light.'
  && zillaOutcome.rewards.map((m) => m.type).join() === 'MEM-NOBODY');
check('the memory picked for Po Luem is not listed as lost', outcomeOf(theft, theftView.rows[0].action).lost.every((m) => m.id !== theft.hand[0].id));
const twelve = memoryRowSpots(12);
check('twelve rows stay on screen', twelve.every((r) => r.x + r.w <= 1240 && r.y < 620));
check('rows never share a spot', new Set(twelve.map((r) => `${r.x},${r.y}`)).size === 12);
const tall = memoryRowSpots(3, [50, 120, 50]);
check('a tall row pushes the next one down', tall[1].y - tall[0].y === 84 && tall[2].y - tall[1].y === 130);
const tallCols = memoryRowSpots(6, [200, 50, 50, 50, 50, 50]);
check('the next column starts at the top again', tallCols[5].y === tallCols[0].y);

// A memory played at delivery can take a marked soul off the boat (Passenger, Sword); the marks follow.
const gone = structuredClone(match);
gone.boat = gone.boat.filter((x) => x.id !== leaver.id);
gone.discard.push(leaver.type); // as the engine does when a memory takes a soul
for (const q of gone.quests) if (q.status === 'active' && q.participants.includes(leaver.id)) Object.assign(q, { status: 'failed', reason: 'taken by a memory' });
const keptMarks = keepValidMarks(gone, [leaver.id, wanderer.id], Ferry);
check('a marked soul no longer aboard is unmarked', !keptMarks.includes(leaver.id) && keptMarks.includes(wanderer.id));
check('marks the engine still accepts are kept', keepValidMarks(match, [leaver.id], Ferry).join() === leaver.id);

// A quest soul that leaves before its wish fails its quest, and the outcome says so with the engine's reason:
// the soul that can leave elsewhere is given an active quest and leaves at this stop, before its wish.
const early = structuredClone(match);
early.quests.push({
  id: `QUEST-${early.nextQuest}`, definitionId: 'QUEST-BOAT', participants: [wanderer.id, 'ACTOR-3'], status: 'active',
  stage: 'merchant-delivered', sharedRoutes: 0, delivered: ['ACTOR-3'], rewardClaimed: false, rewardType: null, reason: null, cycle: early.cycle, data: { merchantRound: '0' },
});
early.nextQuest = String(Number(early.nextQuest) + 1);
const earlyQuest = early.quests.find((q) => q.status === 'active' && q.participants.includes(wanderer.id));
const earlyNext = Ferry.transition(early, deliverAction([wanderer.id]));
const earlyOut = arrivalOutcome(early, earlyNext, deliverAction([wanderer.id]), Ferry);
check('a quest that fails at the dock is listed with its reason', earlyQuest && earlyOut.failedQuests.length === 1
  && lossLines(earlyOut, t, Ferry).includes(`${Ferry.data.quests.find((d) => d.id === earlyQuest.definitionId).name} failed: ${earlyNext.quests.find((q) => q.id === earlyQuest.id).reason}.`));
check('and the soul that left early gave no memory', earlyOut.rewards.length === 0 && earlyOut.strays.length === 1);

process.exit(bad ? 1 : 0);
