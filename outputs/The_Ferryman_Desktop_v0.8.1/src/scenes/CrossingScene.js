import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { playSound, queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { defineTuning, tune } from '../tuning.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { RouteUI } from '../components/RouteUI.js';
import { boatZone } from './boarding-layout.js';
import {
  abilities, approachOutcome, approachWarning, attempt, boatEntries, crossingOutcome, crossingStep, purifyAction, statusText,
} from './crossing-layout.js';
import { addSoulToken, setTokenLabels } from './soul-token.js';

// CrossingScene (T-19): the outward window, phase 'window' or 'review' with window.kind 'outward'.
//   prepare: the boat, the memory hand (T-16), the shared meal and the Priest's purify, Foresight rows
//            and "Approach the fork" (START_CROSSING). A Long that boards at the fork fades in first.
//   fork:    RouteUI's fork cards (T-22); the hand shrinks to a row beside the boat.
//   review:  RouteUI's review panel, Back or Confirm; the hand stays as a small row.
//   cross:   on Confirm the next state is computed first, because the router opens Odysseus's choice
//            or GameOver the moment the state changes. The boat crosses, the fog and the Light loss
//            show, then arrival (a hero leaves, Cerberus boards); only then CONFIRM is dispatched.
// The hand stays on every step and shows only what the engine allows, so it follows #27 when that lands.

const FONT = 'sans-serif';
const GOLD = 0xedc47f;
const STROKE = 0x7fa6c0;
const CLICK = 'sfx-ui-click';
// Where the boat and the hand sit on each step (the boat's centre and scale; the hand's top-left and scale).
const PLACE = {
  prepare: { boat: { x: 1030, y: 200, s: 0.7 }, hand: { x: 40, y: 400, s: 1 }, routes: { x: 40, y: 160 } },
  fork: { boat: { x: 1060, y: 150, s: 0.6 }, hand: { x: 870, y: 330, s: 0.55 }, routes: { x: 40, y: 72 } },
  review: { boat: null, hand: { x: 40, y: 570, s: 0.45 }, routes: { x: 40, y: 72 } },
  cross: { s: 0.4 },
};
const SIDE = { x: 880, w: 360 }; // the right-hand column on the prepare step

defineTuning({
  'crossing.boardMs': { type: 'number', default: 500, min: 0, max: 3000, step: 50, help: 'A Long fades onto the boat at the fork' },
  'crossing.bobPx': { type: 'number', default: 4, min: 0, max: 20, step: 1, help: 'How far the boat bobs while crossing' },
  'crossing.bobMs': { type: 'number', default: 1400, min: 200, max: 5000, step: 50, help: 'One bob, up and down' },
  'crossing.rippleMs': { type: 'number', default: 260, min: 60, max: 2000, step: 10, help: 'Time between ripples behind the boat' },
  'crossing.rippleLifeMs': { type: 'number', default: 900, min: 100, max: 4000, step: 50, help: 'How long a ripple lasts' },
  'crossing.fogAlphaPerLight': { type: 'number', default: 0.12, min: 0, max: 0.5, step: 0.01, help: 'Fog thickness for each Light paid' },
  'crossing.eventMs': { type: 'number', default: 600, min: 0, max: 3000, step: 50, help: 'A soul leaves or boards on arrival' },
  'crossing.arrivalHoldMs': { type: 'number', default: 1400, min: 0, max: 6000, step: 100, help: 'Pause on the arrival before moving on' },
});

export class CrossingScene extends Phaser.Scene {
  constructor() {
    super('CrossingScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { art: [...Ferry.data.souls.map((s) => s.id), ...MemoryHand.artIds()] });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] CrossingScene shown (phase ${state.phase}, step ${crossingStep(state)}, light ${state.light})`);
    this.busy = false; // an approach or a crossing is playing
    this.leaving = false;
    this.targetMode = null; // { kind: 'memory' | 'purify', ids, priestId? }
    this.tokens = new Map();
    this.sideParts = [];

    this.status = this.add.text(40, 24, '', { fontFamily: FONT, fontSize: '24px', color: '#e8f1f7' }).setDepth(6);
    this.heading = this.add.text(40, 72, t('crossing.prepHeading'), { fontFamily: FONT, fontSize: '30px', color: '#edc47f', fontStyle: 'bold' });
    this.intro = this.add.text(40, 114, t('crossing.prepIntro'), { fontFamily: FONT, fontSize: '17px', color: '#c9d6df', wordWrap: { width: 800 } });
    this.message = this.add.text(SIDE.x + SIDE.w / 2, 548, '', {
      fontFamily: FONT, fontSize: '18px', color: '#e8c27f', align: 'center', wordWrap: { width: SIDE.w },
    }).setOrigin(0.5, 0).setDepth(6);

    this.boat = this.add.container(0, 0).setDepth(2);
    this.hullParts = []; // the hull and its seats, redrawn when the seat count changes

    this.routes = new RouteUI(this, { x: 40, y: 72, onAction: (action) => this.onRouteAction(action) });
    this.hand = new MemoryHand(this, {
      x: 0, y: 0,
      onTargets: (ids) => { this.targetMode = ids ? { kind: 'memory', ids } : null; this.render(this.registry.get('state')); },
    });

    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) return this.startExit();
      if (this.busy) return;
      this.hand.render(s);
      this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => {
      this.game.events.off('ferry-state', this.onState);
      this.rippleTimer?.remove();
    });

    this.hand.render(state);
    this.render(state);
    this.cameras.main.fadeIn(tune('scenes.fadeMs'), 11, 17, 23);
  }

  // ---- drawing -------------------------------------------------------------------------------

  render(state) {
    if (this.leaving || this.busy || !state) return;
    const step = crossingStep(state);
    if (step === 'away') return; // a choice over this scene, or the state is moving on
    const place = PLACE[step];
    this.status.setText(statusText(state, Ferry, t));
    this.heading.setVisible(step === 'prepare');
    this.intro.setVisible(step === 'prepare');

    this.routes.root?.setPosition(place.routes.x, place.routes.y);
    this.routes.render(state);
    // In review the hand sits bottom left, where RouteUI puts its error line; move that line aside.
    if (step === 'review') this.routes.message?.setPosition(380, 580);

    this.hand.root?.setPosition(place.hand.x, place.hand.y).setScale(place.hand.s);
    if (this.targetMode?.kind === 'purify' && step !== 'prepare') this.targetMode = null;

    this.drawBoat(state, place.boat);
    this.drawSide(state, step);
  }

  /** The hull, its seats and one token per passenger, inside one container that moves and scales. */
  drawBoat(state, at) {
    this.boat.setVisible(!!at);
    if (!at) return;
    const { entries, slots } = boatEntries(state, Ferry);
    const hull = boatZone(slots);
    this.boatOrigin = { x: hull.x, y: hull.y };
    this.boat.setPosition(at.x, at.y).setScale(at.s);
    for (const r of this.hullParts) r.destroy();
    this.hullParts = [
      this.add.rectangle(0, 0, hull.w, hull.h, 0x2a3b49),
      ...slots.map((slot) => this.add.rectangle(slot.x - hull.x, slot.y - hull.y, slot.w, slot.h, 0x16232e).setStrokeStyle(2, 0x3d5566)),
    ];
    this.hullParts.forEach((r, i) => this.boat.addAt(r, i));
    const ids = new Set(entries.map((e) => e.id));
    for (const [id, token] of this.tokens) {
      if (ids.has(id)) continue;
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      setTokenLabels(token, entry.labels);
      const target = this.targetMode?.ids.includes(entry.id);
      token.getData('panel').setStrokeStyle(target ? 3 : 1, target ? GOLD : STROKE);
      this.tweens.killTweensOf(token);
      this.tweens.add({ targets: token, x: entry.x - hull.x, y: entry.y - hull.y, duration: tune('boarding.snapMs'), ease: tune('boarding.snapEase') });
    }
  }

  addToken(entry) {
    const token = addSoulToken(this, { ...entry, x: entry.x - this.boatOrigin.x, y: entry.y - this.boatOrigin.y });
    setTokenLabels(token, entry.labels);
    token.on('pointerdown', () => this.pickSoul(entry.id));
    this.boat.add(token);
    this.tokens.set(entry.id, token);
    return token;
  }

  /** The prepare step's right-hand column: the meal, purify, the warning and "Approach the fork". */
  drawSide(state, step) {
    for (const p of this.sideParts) p.destroy();
    this.sideParts = [];
    if (step !== 'prepare') {
      this.message.setText('');
      return;
    }
    let y = 420;
    for (const ability of abilities(state, Ferry, t)) {
      const picking = this.targetMode?.kind === 'purify' && this.targetMode.priestId === ability.priestId;
      const label = picking ? t('common.cancel') : ability.label;
      this.button(SIDE.x, y, SIDE.w, label, '#1d363c', '#f3ecd9', () => this.useAbility(ability), ability.kind === 'purify' ? t('crossing.purifyTitle') : '');
      y += 52;
    }
    const warning = approachWarning(state, Ferry, t);
    if (warning) {
      this.sideParts.push(this.add.text(SIDE.x, 596, warning, { fontFamily: FONT, fontSize: '15px', color: '#ff9f8a', wordWrap: { width: SIDE.w } }).setOrigin(0, 1));
    }
    this.button(SIDE.x, 628, SIDE.w, t('crossing.approachFork'), '#edc47f', '#18140a', () => this.approach());
    if (this.targetMode?.kind === 'purify') this.message.setText(t('crossing.purifyPick'));
  }

  button(x, y, w, label, fill, color, onClick, hint = '') {
    const b = this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '20px', color, backgroundColor: fill, padding: { x: 14, y: 8 }, fixedWidth: w, align: 'center',
    }).setInteractive({ useHandCursor: true });
    b.on('pointerdown', () => { if (!this.busy) onClick(); });
    if (hint) {
      b.on('pointerover', () => this.message.setText(hint));
      b.on('pointerout', () => this.message.setText(this.targetMode?.kind === 'purify' ? t('crossing.purifyPick') : ''));
    }
    this.sideParts.push(b);
    return b;
  }

  say(text) {
    this.message.setText(text);
    this.messageTimer?.remove();
    this.messageTimer = this.time.delayedCall(tune('boarding.messageMs'), () => this.message.setText(''));
  }

  // ---- input ---------------------------------------------------------------------------------

  dispatch(action) {
    try {
      this.router.dispatch(action);
      return true;
    } catch (err) {
      this.say(err.message);
      return false;
    }
  }

  useAbility(ability) {
    playSound(this, CLICK);
    if (ability.kind === 'meal') return this.dispatch(ability.action);
    const picking = this.targetMode?.kind === 'purify' && this.targetMode.priestId === ability.priestId;
    this.hand.cancel(); // a memory waiting for a target gives way
    this.targetMode = picking ? null : { kind: 'purify', priestId: ability.priestId, ids: ability.targets };
    if (picking) this.message.setText('');
    this.render(this.registry.get('state'));
  }

  pickSoul(id) {
    if (this.busy || !this.targetMode?.ids.includes(id)) return;
    if (this.targetMode.kind === 'memory') return this.hand.pickTarget(id);
    const { priestId } = this.targetMode;
    this.targetMode = null;
    this.message.setText('');
    this.dispatch(purifyAction(priestId, id));
  }

  /** RouteUI asks first: Confirm plays the crossing; every route button clicks. */
  onRouteAction(action) {
    if (this.busy) return true;
    playSound(this, CLICK);
    if (action.type !== 'CONFIRM') return false;
    this.cross();
    return true;
  }

  // ---- approach and crossing -----------------------------------------------------------------

  /** START_CROSSING. A Long that boards at the fork fades in with its line before the fork shows. */
  approach() {
    playSound(this, CLICK);
    const state = this.registry.get('state');
    const action = { type: 'START_CROSSING' };
    const next = attempt(state, action, Ferry);
    if (!next) return this.dispatch(action); // shows the engine's reason
    const outcome = approachOutcome(state, next, Ferry, t);
    if (!outcome.boarded.length) return this.dispatch(action);
    this.busy = true;
    this.hand.cancel();
    this.targetMode = null;
    for (const p of this.sideParts) p.destroy();
    this.sideParts = [];
    this.message.setText(outcome.lines.join('\n'));
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    this.tweens.add({
      targets: arriving,
      alpha: 1,
      duration: tune('crossing.boardMs'),
      onComplete: () => this.time.delayedCall(tune('crossing.eventMs'), () => {
        this.busy = false;
        this.message.setText('');
        this.dispatch(action);
      }),
    });
  }

  /** Confirm: compute the crossing, play it, then dispatch CONFIRM (see the note at the top). */
  cross() {
    const state = this.registry.get('state');
    const action = { type: 'CONFIRM' };
    const next = attempt(state, action, Ferry);
    if (!next) return this.dispatch(action);
    const outcome = crossingOutcome(state, next, Ferry, t);
    console.log(`[ferry] CrossingScene: crossing to ${outcome.to}, ${outcome.paid} Light${outcome.ended ? ', the lantern goes out' : ''}`);
    this.busy = true;
    this.hand.cancel();
    this.targetMode = null;
    this.showRiver(state, outcome);
    this.travel(outcome, () => this.arrive(state, next, outcome, () => this.dispatch(action)));
  }

  /** Clears the steps and draws the river, both ends and the fog layer. */
  showRiver(state, outcome) {
    this.routes.root?.setVisible(false);
    this.hand.root?.setVisible(false);
    this.heading.setVisible(false);
    this.intro.setVisible(false);
    for (const p of this.sideParts) p.destroy();
    this.sideParts = [];
    this.message.setText('');

    const points = tune('crossing.riverPath').map(([x, y]) => new Phaser.Math.Vector2(x, y));
    this.path = new Phaser.Curves.Spline(points);
    const river = this.add.graphics().setDepth(0);
    river.lineStyle(150, 0x15303c, 1);
    this.path.draw(river, 64);
    const start = points[0];
    const end = points[points.length - 1];
    const label = { fontFamily: FONT, fontSize: '20px', color: '#cfe3f0', align: 'center' };
    this.add.text(start.x, start.y + 110, outcome.from, label).setOrigin(0.5).setDepth(6);
    this.toLabel = this.add.text(end.x, end.y + 110, outcome.concealed ? '?' : outcome.to, label).setOrigin(0.5).setDepth(6);
    this.fog = this.add.rectangle(640, 360, 1280, 720, 0xcfd8dc, 0).setDepth(4);

    this.boat.setVisible(true).setScale(PLACE.cross.s).setPosition(start.x, start.y);
    this.status.setText(statusText(state, Ferry, t));
  }

  /** The boat follows the river path with a bob and ripples; the fog thickens and the Light drops. */
  travel(outcome, done) {
    const travelMs = tune('crossing.travelMs');
    const fogAlpha = Math.min(0.6, outcome.paid * tune('crossing.fogAlphaPerLight'));
    const along = { t: 0 };
    const bobPx = tune('crossing.bobPx');
    const bobMs = tune('crossing.bobMs');
    const startedAt = this.time.now;
    this.tweens.add({
      targets: along,
      t: 1,
      duration: travelMs,
      ease: tune('crossing.travelEase'),
      onUpdate: () => {
        const p = this.path.getPoint(along.t);
        const bob = bobPx * Math.sin(((this.time.now - startedAt) / bobMs) * Math.PI * 2);
        this.boat.setPosition(p.x, p.y + bob);
      },
      onComplete: () => {
        this.rippleTimer?.remove();
        done();
      },
    });
    this.rippleTimer = this.time.addEvent({ delay: tune('crossing.rippleMs'), loop: true, callback: () => this.ripple() });
    // The fog rises over the first part of the crossing and clears on arrival.
    this.tweens.add({ targets: this.fog, fillAlpha: fogAlpha, duration: tune('crossing.fogFadeMs'), yoyo: true, hold: Math.max(0, travelMs - 2 * tune('crossing.fogFadeMs')) });
    this.time.delayedCall(travelMs / 2, () => this.loseLight(outcome));
  }

  ripple() {
    const r = this.add.ellipse(this.boat.x - 90 * PLACE.cross.s, this.boat.y + 60 * PLACE.cross.s, 40, 12).setStrokeStyle(2, 0x7fa6c0, 0.8).setDepth(1);
    this.tweens.add({ targets: r, scaleX: 3, scaleY: 2, alpha: 0, duration: tune('crossing.rippleLifeMs'), onComplete: () => r.destroy() });
  }

  /** The Light counter drops to its new value, with a "-N Light" line that floats up and fades. */
  loseLight(outcome) {
    const state = this.registry.get('state');
    const counter = { light: outcome.lightBefore };
    this.tweens.add({
      targets: counter,
      light: outcome.lightAfter,
      duration: tune('crossing.lightLossMs'),
      onUpdate: () => this.status.setText(statusText({ ...state, light: Math.round(counter.light) }, Ferry, t)),
    });
    const line = this.add.text(40, 60, outcome.lightLine, { fontFamily: FONT, fontSize: '26px', color: outcome.paid ? '#ff9f8a' : '#cfe3f0' }).setDepth(6);
    this.tweens.add({ targets: line, y: 40, alpha: 0, delay: tune('crossing.lightLossMs'), duration: 1200, onComplete: () => line.destroy() });
  }

  /** "Arrived at X", then who leaves and who boards, or the lantern going out; then dispatch. */
  arrive(state, next, outcome, done) {
    this.toLabel.setText(outcome.to);
    this.status.setText(statusText(next, Ferry, t));
    const title = this.add.text(640, 170, outcome.arrived, { fontFamily: FONT, fontSize: '34px', color: '#edc47f' }).setOrigin(0.5).setDepth(6);
    const lines = outcome.ended ? [outcome.endLine] : outcome.lines;
    this.add.text(640, 220, lines.join('\n'), {
      fontFamily: FONT, fontSize: '20px', color: outcome.ended ? '#ff9f8a' : '#e8f1f7', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5, 0).setDepth(6);
    title.setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 300 });

    const finish = () => this.time.delayedCall(tune('crossing.arrivalHoldMs'), () => {
      this.busy = false;
      done();
    });
    if (outcome.ended) {
      // The lantern goes out: the boat and the river darken; the text stays above the dark.
      const dark = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0).setDepth(5);
      this.tweens.add({ targets: dark, fillAlpha: 0.6, duration: tune('crossing.eventMs') });
      return finish();
    }
    const eventMs = tune('crossing.eventMs');
    const leaving = outcome.departed.map((id) => this.tokens.get(id)).filter(Boolean);
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    for (const e of entries) setTokenLabels(this.tokens.get(e.id), e.labels); // a wish can change on arrival
    if (leaving.length) this.tweens.add({ targets: leaving, alpha: 0, y: '-=40', duration: eventMs });
    if (arriving.length) this.tweens.add({ targets: arriving, alpha: 1, duration: eventMs, delay: leaving.length ? eventMs : 0, onComplete: finish });
    else this.time.delayedCall(leaving.length ? eventMs : 0, finish);
  }

  /** The state moved to another scene (delivery, return, or the end): fade out, then let the router switch. */
  startExit() {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    this.cameras.main.fadeOut(tune('scenes.fadeMs'), 11, 17, 23);
    this.cameras.main.once('camerafadeoutcomplete', () => this.router.exitDone());
  }
}
