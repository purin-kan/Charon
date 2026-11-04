import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { playSound, queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { defineTuning, tune } from '../tuning.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { routeModel } from '../components/route-layout.js';
import { statusLine } from './boarding-layout.js';
import { BANK, DOCK, RIVER, stopScenery } from './delivery-layout.js';
import {
  abilities, approachOutcome, approachWarning, attempt, boatEntries, branchSigns, buttonDetail, crossingOutcome, crossingPath,
  crossingStep, homeView, placeName, purifyAction, soulDetail, worldLayout,
} from './crossing-layout.js';
import { HoverTip } from './hover-tip.js';
import { addSoulToken, setTokenLabels } from './soul-token.js';

// CrossingScene (T-19): the outward window, phase 'window' or 'review' with window.kind 'outward'.
// One river world that the view pans and zooms over (a container, so clicks stay exact), with a HUD
// on top. The boat is the same boat throughout:
//   prepare: the boat at its stop, exactly where BoardingScene and DeliveryScene draw it. Memory strip,
//            the shared meal and the Priest's purify, then "Approach the fork".
//   approach: a Long due at the fork fades in, the boat sails to the fork and the view pulls back to
//            show both branches with their signs; then START_CROSSING is dispatched.
//   fork / review: click a branch's sign (PLAN), then Back or Confirm in the review panel.
//   cross:   the next state is computed first, because the router opens Odysseus's choice or GameOver
//            at once. The boat sails down the branch with bob, ripples and fog, the Light drops, the
//            view comes back to zoom 1 so the boat ends where DeliveryScene draws it, the dock appears,
//            arrival events play, and only then CONFIRM is dispatched. DeliveryScene opens with no cut.
// Everything shows its details on hover. The memory strip shows only what the engine allows, so it
// follows #27 ("any time during the stop") when that lands.

const FONT = 'sans-serif';
const GOLD = 0xedc47f;
const STROKE = 0x7fa6c0;
const RED = 0xff9f8a;
const CLICK = 'sfx-ui-click';
const HUD = { depth: 10, side: { x: 880, w: 360 }, strip: { x: 40, y: 556, s: 0.5 }, review: { x: 880, y: 110, w: 360, h: 430 } };
const SIGN = { w: 500, h: 190 }; // world size; about 240 x 90 on screen at the fork view

defineTuning({
  'crossing.enterMs': { type: 'number', default: 700, min: 0, max: 3000, step: 50, help: 'The boat comes in from the Starting Shore' },
  'crossing.approachMs': { type: 'number', default: 1600, min: 200, max: 6000, step: 50, help: 'The boat sails to the fork' },
  'crossing.boardMs': { type: 'number', default: 500, min: 0, max: 3000, step: 50, help: 'A Long fades onto the boat at the fork' },
  'crossing.bobPx': { type: 'number', default: 5, min: 0, max: 20, step: 1, help: 'How far the boat bobs while sailing' },
  'crossing.bobMs': { type: 'number', default: 1400, min: 200, max: 5000, step: 50, help: 'One bob, up and down' },
  'crossing.rippleMs': { type: 'number', default: 220, min: 60, max: 2000, step: 10, help: 'Time between ripples behind the boat' },
  'crossing.rippleLifeMs': { type: 'number', default: 1000, min: 100, max: 4000, step: 50, help: 'How long a ripple lasts' },
  'crossing.fogAlphaPerLight': { type: 'number', default: 0.12, min: 0, max: 0.5, step: 0.01, help: 'Fog thickness for each Light paid' },
  'crossing.eventMs': { type: 'number', default: 600, min: 0, max: 3000, step: 50, help: 'A soul leaves or boards on arrival' },
  'crossing.arrivalHoldMs': { type: 'number', default: 1400, min: 0, max: 6000, step: 100, help: 'Pause on the arrival before the delivery' },
});

const lerp = (a, b, k) => a + (b - a) * k;

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
    const step = crossingStep(state);
    console.log(`[ferry] CrossingScene shown (phase ${state.phase}, step ${step}, light ${state.light})`);
    this.busy = false; // the approach or the crossing is playing
    this.leaving = false;
    this.targetMode = null; // { kind: 'memory' | 'purify', ids, priestId? }
    this.tokens = new Map();
    this.hudParts = [];
    this.signParts = [];
    this.layout = worldLayout(state, Ferry);

    this.world = this.add.container(0, 0);
    this.drawRiver(state);
    this.boat = this.add.container(this.layout.home.x, this.layout.home.y);
    this.world.add(this.boat);
    this.hullParts = [];

    this.status = this.hud(this.add.text(40, 24, '', { fontFamily: FONT, fontSize: '24px', color: '#e8f1f7' }));
    this.title = this.hud(this.add.text(40, 64, '', { fontFamily: FONT, fontSize: '24px', color: '#edc47f', fontStyle: 'bold' }));
    this.sub = this.hud(this.add.text(40, 96, '', { fontFamily: FONT, fontSize: '16px', color: '#c9d6df', wordWrap: { width: 780 } }));
    this.message = this.hud(this.add.text(640, 626, '', {
      fontFamily: FONT, fontSize: '18px', color: '#e8c27f', align: 'center', wordWrap: { width: 440 },
    }).setOrigin(0.5, 0));
    this.fog = this.hud(this.add.rectangle(640, 360, 1280, 720, 0xcfd8dc, 0), HUD.depth - 1);
    this.tip = new HoverTip(this, HUD.depth + 5);

    this.hand = new MemoryHand(this, {
      x: 0, y: 0,
      onTargets: (ids) => { this.targetMode = ids ? { kind: 'memory', ids } : null; this.render(this.registry.get('state')); },
      onHover: (card) => this.previewCard(card),
    });
    this.hand.root.setDepth(HUD.depth).setPosition(HUD.strip.x, HUD.strip.y).setScale(HUD.strip.s);

    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) return this.startExit(s);
      if (this.busy) return;
      this.hand.render(s);
      this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => {
      this.game.events.off('ferry-state', this.onState);
      this.rippleTimer?.remove();
    });

    this.setView(step === 'fork' || step === 'review' ? this.layout.forkView : homeView());
    this.placeBoat(step);
    this.hand.render(state);
    this.render(state);
    // From the Starting Shore the boat comes in from the left, after BoardingScene sailed it out.
    if (step === 'prepare' && !state.destination) {
      this.boat.x -= 900;
      this.tweens.add({ targets: this.boat, x: this.layout.home.x, duration: tune('crossing.enterMs'), ease: 'Cubic.Out' });
    }
  }

  hud(obj, depth = HUD.depth) { return obj.setDepth(depth); }

  // ---- the view ------------------------------------------------------------------------------

  setView(v) {
    this.view = { ...v };
    this.world.setScale(v.zoom).setPosition(640 - v.x * v.zoom, 360 - v.y * v.zoom);
  }

  /** Moves the view to `to` over ms; onUpdate(k) runs each frame with k from 0 to 1 (eased). */
  moveView(to, ms, ease, onUpdate, onComplete) {
    const from = { ...this.view };
    const p = { k: 0 };
    this.tweens.add({
      targets: p, k: 1, duration: ms, ease,
      onUpdate: () => {
        this.setView({ x: lerp(from.x, to.x, p.k), y: lerp(from.y, to.y, p.k), zoom: lerp(from.zoom, to.zoom, p.k) });
        onUpdate?.(p.k);
      },
      onComplete,
    });
  }

  placeBoat(step) {
    const at = step === 'fork' || step === 'review' ? this.layout.approach : this.layout.home;
    this.boat.setPosition(at.x, at.y);
  }

  // ---- the world -----------------------------------------------------------------------------

  /** The river from the stop to the fork, both branches, and the stop itself (a dock, or the shore). */
  drawRiver(state) {
    const { home, fork, branches } = this.layout;
    const g = this.add.graphics();
    this.world.add(g);
    // The river leaves the stop at the bank's edge, as in DeliveryScene.
    g.fillStyle(RIVER.color, 1).fillRect(BANK.right, home.y - RIVER.h / 2, fork.x - BANK.right, RIVER.h);
    g.fillCircle(fork.x, fork.y, RIVER.h / 2);
    for (const b of branches) {
      g.lineStyle(RIVER.h, RIVER.color, 1);
      new Phaser.Curves.Spline(b.points.map((p) => new Phaser.Math.Vector2(p.x, p.y))).draw(g, 80);
      // Level water past the branch end, where the curve has levelled off.
      g.fillRect(b.end.x - 200, b.end.y - RIVER.h / 2, 2200, RIVER.h);
    }
    const label = { fontFamily: FONT, fontSize: '22px', color: '#9fb6c6' };
    const { bank } = stopScenery();
    this.world.add(this.add.rectangle(bank.x - 1000, bank.y, bank.w + 2000, bank.h + 600, bank.color)); // reaches past the screen edges
    if (state.destination) {
      this.world.add(this.add.rectangle(DOCK.x, DOCK.y, DOCK.w, DOCK.h, 0x3a3226).setStrokeStyle(2, 0x6b5a3f));
      this.world.add(this.add.text(DOCK.x - DOCK.w / 2 + 12, DOCK.y - DOCK.h / 2 + 8, t('delivery.dock'), { ...label, fontSize: '20px' }));
    }
    this.world.add(this.add.text(DOCK.x - DOCK.w / 2 + 12, DOCK.y - DOCK.h / 2 + 40, placeName(state, Ferry, t), label));
  }

  /** The two signs at the fork. Clickable at the fork and in review; hover shows the fog. */
  drawSigns(state, step) {
    for (const p of this.signParts) p.destroy();
    this.signParts = [];
    for (const sign of branchSigns(state, Ferry, t)) {
      const at = this.layout.branches[sign.option].sign;
      const stroke = sign.picked ? GOLD : sign.lethal ? RED : STROKE;
      const box = this.add.rectangle(at.x, at.y, SIGN.w, SIGN.h, sign.picked ? 0x2c4a51 : 0x1d2c38).setStrokeStyle(sign.picked ? 5 : 3, stroke);
      const big = { fontFamily: FONT, color: '#e8f1f7' };
      const left = at.x - SIGN.w / 2 + 24;
      const top = at.y - SIGN.h / 2;
      const parts = [
        box,
        this.add.text(left, top + 16, `Option ${sign.number}`, { ...big, fontSize: '26px', color: sign.picked ? '#edc47f' : '#9fb6c6' }),
        this.add.text(left, top + 50, sign.name, { ...big, fontSize: '44px' }),
        this.add.text(left, top + 110, sign.fog, { ...big, fontSize: '28px', color: sign.lethal ? '#ff9f8a' : '#cfe3f0' }),
      ];
      if (sign.wishes) parts.push(this.add.text(left, top + 150, sign.wishes, { ...big, fontSize: '22px', color: '#9fb6c6' }));
      this.world.add(parts);
      this.signParts.push(...parts);
      box.setInteractive({ useHandCursor: !!sign.action });
      box.on('pointerover', (pointer) => this.showTip(pointer, sign.name, sign.detail));
      box.on('pointerout', () => this.hideTip());
      if (sign.action && (step === 'fork' || step === 'review')) box.on('pointerdown', () => this.pickBranch(state, sign));
    }
  }

  /** The hull, its seats and one token per passenger, inside the boat container. */
  drawBoat(state) {
    const { entries, slots } = boatEntries(state, Ferry);
    const { home } = this.layout;
    for (const r of this.hullParts) r.destroy();
    const hullW = slots[slots.length - 1].x - slots[0].x + slots[0].w + 32;
    this.hullParts = [
      this.add.rectangle(0, 0, hullW, slots[0].h + 32, 0x2a3b49),
      ...slots.map((slot) => this.add.rectangle(slot.x - home.x, slot.y - home.y, slot.w, slot.h, 0x16232e).setStrokeStyle(2, 0x3d5566)),
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
      this.tweens.add({ targets: token, x: entry.x - home.x, y: entry.y - home.y, duration: tune('boarding.snapMs'), ease: tune('boarding.snapEase') });
    }
  }

  addToken(entry) {
    const { home } = this.layout;
    const token = addSoulToken(this, { ...entry, x: entry.x - home.x, y: entry.y - home.y });
    setTokenLabels(token, entry.labels);
    token.on('pointerdown', () => this.pickSoul(entry.id));
    token.on('pointerover', (pointer) => {
      const state = this.registry.get('state');
      const actor = state.boat.find((x) => x.id === entry.id) ?? entry.actor;
      const d = soulDetail(state, actor, Ferry, t);
      this.showTip(pointer, d.title, d.lines);
    });
    token.on('pointerout', () => this.hideTip());
    this.boat.add(token);
    this.tokens.set(entry.id, token);
    return token;
  }

  // ---- the HUD -------------------------------------------------------------------------------

  render(state) {
    if (this.leaving || this.busy || !state) return;
    const step = crossingStep(state);
    if (step === 'away') return; // a choice over this scene, or the state is moving on
    if (this.targetMode?.kind === 'purify' && step !== 'prepare') this.targetMode = null;
    this.status.setText(statusLine(state, Ferry));
    this.title.setText(step === 'prepare' ? t('crossing.prepHeading') : t('crossing.routeHeading'));
    this.sub.setText(step === 'prepare' ? t('crossing.prepIntro') : t('crossing.pickBranch'));
    this.drawBoat(state);
    this.drawSigns(state, step);
    for (const p of this.hudParts) p.destroy();
    this.hudParts = [];
    this.drawForesight(state);
    if (step === 'prepare') this.drawPrepare(state);
    if (step === 'review') this.drawReview(state);
    if (step !== 'prepare' && this.targetMode?.kind !== 'purify') this.message.setText('');
  }

  addHud(obj) {
    this.hud(obj);
    this.hudParts.push(obj);
    return obj;
  }

  button(x, y, w, label, fill, color, onClick, detail = '') {
    const b = this.addHud(this.add.text(x, y, label, {
      fontFamily: FONT, fontSize: '20px', color, backgroundColor: fill, padding: { x: 14, y: 8 }, fixedWidth: w, align: 'center',
    }).setInteractive({ useHandCursor: true }));
    b.on('pointerdown', () => { if (!this.busy) onClick(); });
    if (detail) {
      b.on('pointerover', (pointer) => this.showTip(pointer, label, [detail]));
      b.on('pointerout', () => this.hideTip());
    }
    return b;
  }

  /** The prepare step's right-hand column: the meal, purify, the warning and "Approach the fork". */
  drawPrepare(state) {
    const { x, w } = HUD.side;
    let y = 470;
    for (const ability of abilities(state, Ferry, t)) {
      const picking = this.targetMode?.kind === 'purify' && this.targetMode.priestId === ability.priestId;
      this.button(x, y, w, picking ? t('common.cancel') : ability.label, '#1d363c', '#f3ecd9', () => this.useAbility(ability), buttonDetail(ability.kind, state, Ferry, t));
      y += 50;
    }
    const warning = approachWarning(state, Ferry, t);
    if (warning) this.addHud(this.add.text(x, 624, warning, { fontFamily: FONT, fontSize: '15px', color: '#ff9f8a', wordWrap: { width: w } }).setOrigin(0, 1));
    this.button(x, 634, w, t('crossing.approachFork'), '#edc47f', '#18140a', () => this.approach(), buttonDetail('approach', state, Ferry, t));
    if (this.targetMode?.kind === 'purify') this.message.setText(t('crossing.purifyPick'));
  }

  /** Forks revealed by Foresight, top right: one row per fork, both destinations. */
  drawForesight(state) {
    const model = routeModel(state, Ferry, t);
    const rows = model.upcoming ?? [];
    if (!rows.length) return;
    let y = 64;
    this.addHud(this.add.text(HUD.side.x, y, 'Foresight', { fontFamily: FONT, fontSize: '18px', color: '#9fb6c6' }));
    for (const row of rows) {
      y += 28;
      this.addHud(this.add.text(HUD.side.x, y, `${row.label}: ${row.options.map((o) => o.name).join(' / ')}`, { fontFamily: FONT, fontSize: '15px', color: '#cfe3f0', wordWrap: { width: HUD.side.w } }));
    }
  }

  /** The review panel: the engine's fog numbers for the picked branch, then Back and Confirm. */
  drawReview(state) {
    const r = routeModel(state, Ferry, t).review;
    if (!r) return;
    const { x, y, w, h } = HUD.review;
    this.addHud(this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x10202c, 0.95).setStrokeStyle(2, GOLD));
    let cy = y + 18;
    const line = (text, size, color) => {
      if (!text) return;
      const o = this.addHud(this.add.text(x + 20, cy, text, { fontFamily: FONT, fontSize: `${size}px`, color, wordWrap: { width: w - 40 } }));
      cy += o.height + 10;
    };
    line(r.heading, 26, '#edc47f');
    line(r.intro, 15, '#c9d6df');
    line(r.name, 24, '#e8f1f7');
    line(r.breakdown, 17, '#cfe3f0');
    line(r.modifiers, 17, '#cfe3f0');
    line(r.cost, 20, '#e8f1f7');
    line(r.warning, 16, '#ff9f8a');
    this.button(x + 20, y + h - 60, 110, r.back.label, '#1d363c', '#f3ecd9', () => this.routeAction(r.back.action));
    this.button(x + 146, y + h - 60, w - 166, r.confirm.label, '#edc47f', '#18140a', () => this.cross());
  }

  showTip(pointer, title, lines) { this.tip.show(pointer, title, lines); }

  hideTip() { this.tip.hide(); }

  /** A memory's full text in the hover box: the strip draws cards small, and a card cuts its text at four lines. */
  previewCard(card) {
    if (!card) return this.hideTip();
    this.showTip(this.input.activePointer, card.name, [card.text, t('memory.from', { source: card.source }), card.playable ? '' : card.reason]);
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

  routeAction(action) {
    playSound(this, CLICK);
    this.dispatch(action);
  }

  /** At the fork: PLAN this branch. In review a different branch goes Back first, then PLANs it. */
  pickBranch(state, sign) {
    if (this.busy) return;
    if (state.phase === 'review') {
      if (sign.picked) return;
      playSound(this, CLICK);
      if (this.dispatch({ type: 'BACK' })) this.dispatch(sign.action);
      return;
    }
    this.routeAction(sign.action);
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

  // ---- approach and crossing -----------------------------------------------------------------

  /** Sails to the fork (a due Long fades in first) and pulls the view back, then START_CROSSING. */
  approach() {
    playSound(this, CLICK);
    const state = this.registry.get('state');
    const action = { type: 'START_CROSSING' };
    const next = attempt(state, action, Ferry);
    if (!next) return this.dispatch(action); // shows the engine's reason
    const outcome = approachOutcome(state, next, Ferry, t);
    this.busy = true;
    this.hideTip();
    this.hand.cancel();
    this.targetMode = null;
    for (const p of this.hudParts) p.destroy();
    this.hudParts = [];
    this.message.setText(outcome.lines.join('\n'));
    this.title.setText(t('crossing.routeHeading'));
    this.sub.setText('');
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    const sail = () => {
      this.startRipples();
      this.sail(this.layout.home, this.layout.approach, this.layout.forkView, tune('crossing.approachMs'), () => {
        this.stopRipples();
        this.busy = false;
        this.message.setText('');
        this.dispatch(action);
      });
    };
    if (!arriving.length) return sail();
    this.tweens.add({ targets: arriving, alpha: 1, duration: tune('crossing.boardMs'), onComplete: () => this.time.delayedCall(tune('crossing.eventMs'), sail) });
  }

  /** The boat goes from `from` to `to` (a point or a path) while the view moves to `view`. */
  sail(from, to, view, ms, done) {
    const path = Array.isArray(to)
      ? new Phaser.Curves.Spline(to.map((p) => new Phaser.Math.Vector2(p.x, p.y)))
      : new Phaser.Curves.Line(new Phaser.Math.Vector2(from.x, from.y), new Phaser.Math.Vector2(to.x, to.y));
    const bobPx = tune('crossing.bobPx');
    const bobMs = tune('crossing.bobMs');
    const startedAt = this.time.now;
    this.moveView(view, ms, tune('crossing.travelEase'), (k) => {
      const p = path.getPoint(k);
      const bob = k < 1 ? bobPx * Math.sin(((this.time.now - startedAt) / bobMs) * Math.PI * 2) : 0;
      this.boat.setPosition(p.x, p.y + bob);
    }, done);
  }

  startRipples() {
    this.rippleTimer?.remove();
    this.rippleTimer = this.time.addEvent({ delay: tune('crossing.rippleMs'), loop: true, callback: () => this.ripple() });
  }

  stopRipples() { this.rippleTimer?.remove(); }

  ripple() {
    const r = this.add.ellipse(this.boat.x - 250, this.boat.y + 70, 80, 22).setStrokeStyle(3, STROKE, 0.8);
    this.world.addAt(r, 1);
    this.tweens.add({ targets: r, scaleX: 3, scaleY: 2, alpha: 0, duration: tune('crossing.rippleLifeMs'), onComplete: () => r.destroy() });
  }

  /** Confirm: compute the crossing, play it, then dispatch CONFIRM (see the note at the top). */
  cross() {
    playSound(this, CLICK);
    const state = this.registry.get('state');
    const action = { type: 'CONFIRM' };
    const next = attempt(state, action, Ferry);
    if (!next) return this.dispatch(action);
    const outcome = crossingOutcome(state, next, Ferry, t);
    const branch = this.layout.branches[state.pending.option];
    console.log(`[ferry] CrossingScene: crossing to ${outcome.to}, ${outcome.paid} Light${outcome.ended ? ', the lantern goes out' : ''}`);
    this.busy = true;
    this.hideTip();
    this.hand.cancel();
    this.targetMode = null;
    for (const p of this.hudParts) p.destroy();
    this.hudParts = [];
    this.title.setText(outcome.from);
    this.sub.setText(outcome.concealed ? '?' : outcome.to);
    this.tweens.add({ targets: this.signParts, alpha: 0, duration: 300 });

    const travelMs = tune('crossing.travelMs');
    const fogMs = tune('crossing.fogFadeMs');
    this.tweens.add({ targets: this.fog, fillAlpha: Math.min(0.6, outcome.paid * tune('crossing.fogAlphaPerLight')), duration: fogMs, yoyo: true, hold: Math.max(0, travelMs - 2 * fogMs) });
    this.time.delayedCall(travelMs / 2, () => this.loseLight(state, outcome));
    this.startRipples();
    this.sail(this.layout.approach, crossingPath(this.layout, branch.option), branch.view, travelMs, () => {
      this.stopRipples();
      this.arrive(next, outcome, branch, () => this.dispatch(action));
    });
  }

  /** The Light counter drops to its new value, with a "-N Light" line that floats up and fades. */
  loseLight(state, outcome) {
    const counter = { light: outcome.lightBefore };
    this.tweens.add({
      targets: counter, light: outcome.lightAfter, duration: tune('crossing.lightLossMs'),
      onUpdate: () => this.status.setText(statusLine({ ...state, light: Math.round(counter.light) }, Ferry)),
    });
    const line = this.hud(this.add.text(40, 132, outcome.lightLine, { fontFamily: FONT, fontSize: '28px', color: outcome.paid ? '#ff9f8a' : '#cfe3f0' }));
    this.tweens.add({ targets: line, y: 112, alpha: 0, delay: tune('crossing.lightLossMs'), duration: 1200, onComplete: () => line.destroy() });
  }

  /** The dock appears, "Arrived at X", who leaves and who boards; then the boat settles and we dispatch. */
  arrive(next, outcome, branch, done) {
    this.status.setText(statusLine(next, Ferry));
    this.title.setText(outcome.arrived);
    this.sub.setText('');
    // Right of the dock (which ends at x 560), above the boat.
    const lines = this.hud(this.add.text(910, 64, (outcome.ended ? [outcome.endLine] : outcome.lines).join('\n'), {
      fontFamily: FONT, fontSize: '20px', color: outcome.ended ? '#ff9f8a' : '#e8f1f7', align: 'center', lineSpacing: 6, wordWrap: { width: 640 },
    }).setOrigin(0.5, 0));
    const hold = (after) => this.time.delayedCall(tune('crossing.arrivalHoldMs'), () => {
      this.tweens.add({ targets: [lines, this.title], alpha: 0, duration: 200, onComplete: () => { this.busy = false; after(); } });
    });
    if (outcome.ended) {
      const dark = this.hud(this.add.rectangle(640, 360, 1280, 720, 0x000000, 0), HUD.depth - 1);
      this.tweens.add({ targets: dark, fillAlpha: 0.6, duration: tune('crossing.eventMs') });
      return hold(done);
    }
    // The view settles on exactly what DeliveryScene draws: plain water band, dock, boat. A cover in the
    // background colour hides the branch curves, then the band and the dock fade in over it.
    const scenery = stopScenery({ x: branch.view.x - 640, y: branch.view.y - 360 });
    const cover = this.add.rectangle(branch.view.x, branch.view.y, 1280, 720, 0x0b1117).setAlpha(0);
    const [bank, band] = [scenery.bank, scenery.river].map((r) => this.add.rectangle(r.x, r.y, r.w, r.h, r.color).setAlpha(0));
    this.world.addAt([cover, bank, band], this.world.getIndex(this.boat));
    this.tweens.add({ targets: [cover, bank, band], alpha: 1, duration: tune('crossing.eventMs') });
    // The dock at the destination, where DeliveryScene draws it.
    const dock = this.add.rectangle(branch.dock.x, branch.dock.y, DOCK.w, DOCK.h, 0x3a3226).setStrokeStyle(2, 0x6b5a3f).setAlpha(0);
    const dockLabel = this.add.text(branch.dock.x - DOCK.w / 2 + 12, branch.dock.y - DOCK.h / 2 + 8, t('delivery.dock'), { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' }).setAlpha(0);
    this.world.add([dock, dockLabel]);
    this.tweens.add({ targets: [dock, dockLabel], alpha: 1, duration: tune('crossing.eventMs') });

    const eventMs = tune('crossing.eventMs');
    const leaving = outcome.departed.map((id) => this.tokens.get(id)).filter(Boolean);
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    for (const e of entries) setTokenLabels(this.tokens.get(e.id), e.labels); // a wish can change on arrival
    if (leaving.length) this.tweens.add({ targets: leaving, alpha: 0, y: '-=40', duration: eventMs });
    // The boat settles into DeliveryScene's seat order, so the scene change shows no jump.
    const settle = () => {
      for (const e of entries) {
        this.tweens.add({ targets: this.tokens.get(e.id), x: e.x - this.layout.home.x, y: e.y - this.layout.home.y, duration: tune('boarding.snapMs') });
      }
      hold(done);
    };
    if (arriving.length) this.tweens.add({ targets: arriving, alpha: 1, duration: eventMs, delay: leaving.length ? eventMs : 0, onComplete: settle });
    else this.time.delayedCall(leaving.length ? eventMs : 0, settle);
  }

  /** DeliveryScene follows with no cut; anything else (the return, the end) fades out first. */
  startExit(state) {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    if (state.phase === 'delivery') return this.router.exitDone();
    this.cameras.main.fadeOut(tune('scenes.fadeMs'), 11, 17, 23);
    this.cameras.main.once('camerafadeoutcomplete', () => this.router.exitDone());
  }
}
