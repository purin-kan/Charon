// Checks BoardingScene's pure layout against the real engine (no Phaser needed).
// Run: node tools/check-boarding.mjs
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { dropAction, heroPrompt, layoutBoarding, soulName, statusLine, tokenLabels } from '../src/scenes/boarding-layout.js';

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

// Selected souls sit on the boat and can still be dragged off.
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

// Drop outcomes.
const onShore = { id: 'A', area: 'shore', draggable: true };
const inSeat = { id: 'B', area: 'seat', draggable: true };
check('shore soul dropped on the boat boards', dropAction(onShore, true)?.type === 'BOARD');
check('shore soul dropped elsewhere does nothing', dropAction(onShore, false) === null);
check('selected soul dropped off the boat unboards', dropAction(inSeat, false)?.id === 'B');
check('selected soul dropped on the boat does nothing', dropAction(inSeat, true) === null);

// Labels.
const labels = tokenLabels(spot(layoutBoarding(base, Ferry), firstId), Ferry);
check('labels read the name and wish', labels.name === 'Mother' && labels.wish === 'Tartarus');
check('shore soul shows the shore limit', labels.anger === 'Anger 0/2');
const seatedLabels = tokenLabels(wideEntry, Ferry);
check('boat soul shows the ship limit', seatedLabels.anger.endsWith('/4'));
check('unknown type falls back to its id', soulName('SOUL-NOPE', Ferry) === 'SOUL-NOPE');

// Status line.
const status = statusLine(one, Ferry);
check('status shows Light and seats', status.includes('Light 6/6') && status.includes('Seats 1/4'));
check('status shows the next Polong', status.includes('Next Polong: Po Luem'));

// Hero offers.
const odysseus = heroPrompt(base, Ferry);
check('Odysseus needs no toll', odysseus.name === 'Odysseus the traveler' && odysseus.needsToll === false);
check('Odysseus resolves', Ferry.transition(base, { type: 'ACCEPT_HERO' }).boat.length === 1);
const heracles = fixture('boarding-heracles');
check('Heracles needs a toll', heroPrompt(heracles, Ferry).needsToll === true);
check('Heracles without a toll is rejected', rejects(heracles, { type: 'ACCEPT_HERO' }));
const paid = Ferry.transition(heracles, { type: 'ACCEPT_HERO', target: heracles.shore[0].id });
check('Heracles resolves with a toll', paid.boat.length === 1 && paid.shore.length === heracles.shore.length - 1);
check('resolved offer hides the prompt', heroPrompt(paid, Ferry) === null);
check('declined offer hides the prompt', heroPrompt(Ferry.transition(base, { type: 'DECLINE_HERO' }), Ferry) === null);

process.exit(bad ? 1 : 0);
