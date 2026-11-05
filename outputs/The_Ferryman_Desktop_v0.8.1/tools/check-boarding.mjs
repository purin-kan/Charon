// Checks BoardingScene's pure layout against the real engine (no Phaser needed).
// Run: node tools/check-boarding.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  DESTINATION_COLORS, STAGE, aboardChips, arcPoint, boatSway, boatZone, clearActions, flames, heroPrompt, lastBoarded, layoutBoarding,
  layoutStage, nextLongName, panelButtons, ridePoint, seatBar, shipBadge, soulBadge, soulFacts, soulName, springStep, statusLine, tailOffset, tokenLabels,
} from '../src/scenes/boarding-layout.js';

const Ferry = createRequire(import.meta.url)('../rules/engine.js');
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'dev', 'fixtures');
const fixture = (name) => JSON.parse(readFileSync(path.join(dir, `${name}.json`), 'utf8'));

let bad = 0;
function check(name, ok) {
  if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}`);
}
/** True when the engine refuses the action and the input state is unchanged. */
function rejects(state, action) {
  const before = JSON.stringify(state);
  try {
    Ferry.transition(state, action);
    return false;
  } catch {
    return JSON.stringify(state) === before;
  }
}
const spot = (layout, id) => layout.entries.find((e) => e.id === id);

// Every actor has exactly one spot.
const base = fixture('boarding');
const one = Ferry.transition(base, { type: 'BOARD', id: base.shore[0].id });
const ids = layoutBoarding(one, Ferry).entries.map((e) => e.id).sort();
check('every shore actor has one spot', JSON.stringify(ids) === JSON.stringify(one.shore.map((x) => x.id).sort()));

// Selected souls sit on the boat and can still be sent back.
const firstId = base.shore[0].id;
const boarded = spot(layoutBoarding(one, Ferry), firstId);
check('selected soul is in a seat', boarded.area === 'seat' && boarded.draggable === true);

// BOARD is a toggle, so a second BOARD restores the shore spot.
const two = Ferry.transition(one, { type: 'BOARD', id: firstId });
const home = spot(layoutBoarding(base, Ferry), firstId);
const back = spot(layoutBoarding(two, Ferry), firstId);
check('second BOARD returns to the shore spot', back.area === 'shore' && back.x === home.x && back.y === home.y);

// Slots follow capacity.
check('slot count matches capacity', layoutBoarding(base, Ferry).slots.length === Ferry.capacity(base));
const bigger = structuredClone(base);
bigger.effects.capacity = true;
check('capacity effect adds a slot', layoutBoarding(bigger, Ferry).slots.length === 5);

// A two-seat soul spans two slots and pushes the next soul along.
const wide = structuredClone(base);
wide.boat = [{ ...wide.shore[0], id: 'ACTOR-WIDE', type: 'SOUL-PO-NAK', level: 3 }];
wide.selected = [wide.shore[1].id];
const wideLayout = layoutBoarding(wide, Ferry);
const wideEntry = spot(wideLayout, 'ACTOR-WIDE');
const { slots } = wideLayout;
check('level 3 Po Nak spans two slots', wideEntry.span === 2 && wideEntry.x === (slots[0].x + slots[1].x) / 2);
check('boat soul is locked', wideEntry.draggable === false);
check('next soul takes the third slot', spot(wideLayout, wide.shore[1].id).x === slots[2].x);

// Rejections leave the state alone, which the scene's act() relies on.
let full = Ferry.create(1);
for (const x of full.shore.slice(0, 4)) full = Ferry.transition(full, { type: 'BOARD', id: x.id });
check('fifth seat is rejected', rejects(full, { type: 'BOARD', id: full.shore[4].id }));
check('empty Depart is rejected', rejects(base, { type: 'DEPART' }));

// The hull is shared with CrossingScene and DeliveryScene.
const zone = boatZone(slots);
const inZone = (x, y) => Math.abs(x - zone.x) <= zone.w / 2 && Math.abs(y - zone.y) <= zone.h / 2;
check('every seat is on the hull', slots.every((s) => inZone(s.x, s.y)));
check('hull grows with capacity', boatZone(layoutBoarding(bigger, Ferry).slots).w > zone.w);

// Labels.
const labels = tokenLabels(spot(layoutBoarding(base, Ferry), firstId), Ferry);
check('labels read the name and wish', labels.name === 'Mother' && labels.wish === 'Tartarus');
check('shore soul shows the shore limit', labels.anger === 'Anger 0/2');
const seatedLabels = tokenLabels(wideEntry, Ferry);
check('boat soul shows the ship limit', seatedLabels.anger.endsWith('/5'));
check('unknown type falls back to its id', soulName('SOUL-NOPE', Ferry) === 'SOUL-NOPE');

// Status line.
const status = statusLine(one, Ferry);
check('status shows Light and seats', status.includes('Light 6/6') && status.includes('Seats 1/4'));
check('status shows the next Long by its data name', status.includes(soulName(one.nextPolong, Ferry)) && soulName(one.nextPolong, Ferry) === 'Long Hollow');

// Hero offers. Cycle 1 has none (Odysseus from cycle 6, Heracles from cycle 9), so Odysseus's
// offer is put on a copy of the boarding fixture moved to cycle 6.
check('no hero offer in cycle 1', base.cycle === '1' && base.heroOffer === null && heroPrompt(base, Ferry) === null);
const atSix = structuredClone(base);
atSix.cycle = '6';
atSix.completed = '5';
atSix.heroOffer = { type: 'SOUL-ODYSSEUS', resolved: false };
Ferry.validate(atSix);
const odysseus = heroPrompt(atSix, Ferry);
check('Odysseus needs no toll', odysseus.name === 'Odysseus the traveler' && odysseus.needsToll === false);
check('Odysseus resolves', Ferry.transition(atSix, { type: 'ACCEPT_HERO' }).boat.length === 1);
const heracles = fixture('boarding-heracles');
check('Heracles needs a toll', heroPrompt(heracles, Ferry).needsToll === true);
check('Heracles without a toll is rejected', rejects(heracles, { type: 'ACCEPT_HERO' }));
const paid = Ferry.transition(heracles, { type: 'ACCEPT_HERO', target: heracles.shore[0].id });
check('Heracles resolves with a toll', paid.boat.length === 1 && paid.shore.length === heracles.shore.length - 1);
check('resolved offer hides the prompt', heroPrompt(paid, Ferry) === null);
check('declined offer hides the prompt', heroPrompt(Ferry.transition(atSix, { type: 'DECLINE_HERO' }), Ferry) === null);

// The click panel's stage.
const stage = (state) => layoutStage(state, Ferry);
const on = (state, id) => stage(state).entries.find((x) => x.id === id);
const seatedIds = (state) => stage(state).entries.filter((x) => x.area === 'seat').map((x) => x.id);
const boardAll = (state, ids) => ids.reduce((s, id) => Ferry.transition(s, { type: 'BOARD', id }), state);

const [a, b, c, d, e] = base.shore.map((x) => x.id);
const ab = boardAll(base, [a, b]);
const cab = boardAll(base, [c, a, b]);
check('every actor has one stage spot', stage(ab).entries.length === base.shore.length);
check('seats fill in boarding order', JSON.stringify(seatedIds(cab)) === JSON.stringify([c, a, b]));
const { seats } = stage(cab);
check('stage seat count matches capacity', seats.length === Ferry.capacity(base) && stage(bigger).seats.length === 5);
check('seats are taken from the first', on(cab, c).x === seats[0].x && on(cab, a).x === seats[1].x && on(cab, b).x === seats[2].x);
check('seats are centred on the deck', (seats[0].x + seats.at(-1).x) / 2 === STAGE.deckX);
check('seated souls stand on the deck, shore souls on the ground', on(cab, c).y === STAGE.deckY && on(cab, d).y === STAGE.groundY);
const shoreRow = stage(base).entries;
const shoreXs = shoreRow.map((x) => x.x);
check('shore spots do not overlap', new Set(shoreXs).size === base.shore.length);
check('the shore row stays clear of five seats', Math.max(...shoreXs) < stage(bigger).seats[0].x);

// A soul keeps its own spot: nobody shuffles along when another leaves or comes back.
const homeX = (id) => shoreRow.find((x) => x.id === id).x;
check('other souls hold their spots while one boards', on(ab, c).x === homeX(c) && on(ab, e).x === homeX(e));
const oneBack = Ferry.transition(ab, { type: 'BOARD', id: a });
check('a soul sent back returns to its own spot', on(oneBack, a).area === 'shore' && on(oneBack, a).x === homeX(a));
check('the soul behind it moves up a seat', on(oneBack, b).x === stage(oneBack).seats[0].x);

// Multi-seat span and locked souls. No ordinary soul has more than one seat today; a level 3 Long Burden has two.
const wideStage = stage(wide);
const wideSpot = wideStage.entries.find((x) => x.id === 'ACTOR-WIDE');
check('a two-seat soul sits between its two seats', wideSpot.span === 2 && wideSpot.x === (wideStage.seats[0].x + wideStage.seats[1].x) / 2);
check('the next soul sits past both seats', on(wide, wide.selected[0]).x === wideStage.seats[2].x);
check('state.boat souls are locked', wideSpot.locked === true && wideSpot.selected === false);
check('selected souls are not locked', on(wide, wide.selected[0]).locked === false && on(wide, wide.selected[0]).selected === true);

// Panel buttons.
check('nothing selected: Undo and Clear boat off', panelButtons(base).undo === false && panelButtons(base).clear === false);
check('nobody aboard: Cast off off', panelButtons(base).castOff === false);
check('one selected: all three on', Object.values(panelButtons(one)).every(Boolean));
const heroOnly = Ferry.transition(atSix, { type: 'ACCEPT_HERO' });
check('hero aboard, nothing selected: Cast off on, Undo off', panelButtons(heroOnly).castOff === true && panelButtons(heroOnly).undo === false);
check('the engine lets a lone hero depart', Ferry.transition(heroOnly, { type: 'DEPART' }).phase === 'window');
check('toll mode turns all three off', Object.values(panelButtons(one, true)).every((x) => x === false));

// Undo and Clear boat.
check('Undo takes the last soul boarded', lastBoarded(cab) === b && lastBoarded(base) === null);
const undone = Ferry.transition(cab, { type: 'BOARD', id: lastBoarded(cab) });
check('Undo leaves the others aboard', JSON.stringify(undone.selected) === JSON.stringify([c, a]));
const clearing = clearActions(cab);
check('Clear boat is one BOARD per selected soul', clearing.length === 3 && clearing.every((x) => x.type === 'BOARD'));
check('Clear boat empties the boat', clearing.reduce((s, x) => Ferry.transition(s, x), cab).selected.length === 0);

// Seat bar, Light and chips.
const bar = seatBar(cab, Ferry);
check('seat bar: one box per seat, filled for seats used', bar.boxes.length === 4 && bar.boxes.filter(Boolean).length === 3 && bar.used === 3);
check('seat bar follows capacity', seatBar(bigger, Ferry).boxes.length === 5);
const dim = { ...base, light: 2 };
check('flames: one per maximum Light, lit for Light', flames(dim, Ferry).length === Ferry.maxLight(base) && flames(dim, Ferry).filter(Boolean).length === 2);
const chips = aboardChips(cab, Ferry, 10, 100);
check('one chip per selected soul in boarding order', chips.length === 3 && chips[0].id === c && chips[1].x === 110);
check('chips use data names', chips[1].name === soulName(base.shore[0].type, Ferry));

// The badge over a soul.
const limit = Ferry.data.config.shoreAngerLimit;
const angry = structuredClone(base);
angry.shore[1].anger = limit - 1;
const calmBadge = soulBadge(on(angry, a), Ferry);
const angryBadge = soulBadge(on(angry, b), Ferry);
check('pips count to the shore limit', calmBadge.pips.total === limit && calmBadge.pips.filled === 0 && calmBadge.pips.danger === false);
check('pips warn one return before a Wraith', angryBadge.pips.danger === true && angryBadge.pips.filled === limit - 1);
const angryAboard = Ferry.transition(angry, { type: 'BOARD', id: b });
check('a selected soul does not warn', soulBadge(on(angryAboard, b), Ferry).pips.danger === false);
check('a locked soul has no pips', soulBadge(wideSpot, Ferry).pips === null && soulBadge(wideSpot, Ferry).locked === true);
check('every destination has a colour', Ferry.data.destinations.every((x) => typeof DESTINATION_COLORS[x.id] === 'number'));
check('destination colours differ', new Set(Object.values(DESTINATION_COLORS)).size === Ferry.data.destinations.length);
check('the diamond follows the wish', calmBadge.color === DESTINATION_COLORS[Ferry.wish(angry.shore[0])]);

// The badge under way counts to the ship's limit, not the shore's.
const shipLimit = Ferry.data.config.shipAngerLimit;
const sailing = { ...base.shore[0], anger: shipLimit - 1 };
const sailingBadge = shipBadge(sailing, Ferry);
check('ship pips count to the ship limit', sailingBadge.pips.total === shipLimit && sailingBadge.pips.filled === shipLimit - 1);
check('ship pips warn one step before a Wraith', sailingBadge.pips.danger === true && shipBadge(base.shore[0], Ferry).pips.danger === false);
check('the ship badge keeps the name and the wish colour', sailingBadge.name === soulName(sailing.type, Ferry) && sailingBadge.color === DESTINATION_COLORS[Ferry.wish(sailing)]);

// Hover facts and the next Long.
const fakeT = (key, values = {}) => `${key} ${Object.values(values).join(' ')}`;
const facts = soulFacts(base.shore[0], Ferry, fakeT);
check('hover facts give destination and seats', facts.length === 2 && facts[0].includes('Tartarus') && facts[1].endsWith(' 1'));
check('next Long uses its data name', nextLongName(one, Ferry) === 'Long Hollow' && nextLongName({ ...one, nextPolong: null }, Ferry) === null);

// Heracles' toll: a selected soul is a legal toll, and it frees its seat.
const fullBoat = boardAll(heracles, heracles.shore.slice(0, 4).map((x) => x.id));
check('a full boat refuses Heracles with an outside toll', rejects(fullBoat, { type: 'ACCEPT_HERO', target: heracles.shore[4].id }));
const paidSelected = Ferry.transition(fullBoat, { type: 'ACCEPT_HERO', target: heracles.shore[0].id });
check('a selected soul can pay the toll', paidSelected.boat.length === 1 && paidSelected.selected.length === 3);

// Motion maths.
const near = (x, y, tolerance = 1e-9) => Math.abs(x - y) <= tolerance;
const from = { x: 100, y: 500 };
const to = { x: 700, y: 440 };
const atEnd = arcPoint(from, to, 1, 40);
check('a walk starts where the soul is', near(arcPoint(from, to, 0, 40).x, 100) && near(arcPoint(from, to, 0, 40).y, 500));
check('a walk ends exactly on its target', near(atEnd.x, 700) && near(atEnd.y, 440));
check('the arc lifts the middle of the walk', near(arcPoint(from, to, 0.5, 40).y, 470 - 40));
let highest = 0;
for (let t = 0; t < 60; t += 0.05) highest = Math.max(highest, Math.abs(boatSway(t, 3, 0.02).y) / 3, Math.abs(boatSway(t, 3, 0.02).angle) / 0.02);
check('the boat sway stays within its tuned size', highest <= 1.0001 && highest > 0.5);
const pivot = { x: 800, y: 400 };
const still = ridePoint({ x: 900, y: 450 }, pivot, 0, { x: 0, y: 0 });
check('no boat motion moves no rider', near(still.x, 900) && near(still.y, 450));
const lifted = ridePoint({ x: 900, y: 450 }, pivot, 0, { x: 30, y: -5 });
check('riders move with the boat', near(lifted.x, 930) && near(lifted.y, 445));
const turned = ridePoint({ x: 900, y: 400 }, pivot, Math.PI / 2, { x: 0, y: 0 });
check('riders turn around the boat', near(turned.x, 800) && near(turned.y, 500));
let spring = { value: 8, velocity: 0 };
for (let i = 0; i < 600; i++) spring = springStep(spring, 1 / 60, 40, 5);
check('the boat settles after a dip', near(spring.value, 0, 0.01) && near(spring.velocity, 0, 0.05));
let hitch = springStep({ value: 8, velocity: 0 }, 5, 40, 5);
check('a long frame does not throw the boat', Math.abs(hitch.value) <= 8);
check('the head and chest of a soul hold still', tailOffset(0, 3, 1, 10, 2) === 0 && tailOffset(0.45, 3, 1, 10, 2) === 0);
let reach = 0;
for (let t = 0; t < 20; t += 0.05) reach = Math.max(reach, Math.abs(tailOffset(1, t, 1, 10, 2)));
check('the tail tip sways up to its tuned size', reach <= 10 && reach > 9);

process.exit(bad ? 1 : 0);
