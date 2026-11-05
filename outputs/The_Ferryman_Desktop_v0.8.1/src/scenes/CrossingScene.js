import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { playSound, queueAssets, soulArtIds } from '../preloader.js';
import { t } from '../text.js';
import { COLOR, CSS, DecisionPanel, bodyText, drawPanel, edgeFlash, fadeIn, fadeOut, headText, lossShake } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { Hud } from '../components/Hud.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { previewOption, routeModel } from '../components/route-layout.js';
import { shipBadge, TOKEN } from './boarding-layout.js';
import { DOCK, RIVER } from './delivery-layout.js';
import {
  abilities, approachOutcome, approachWarning, attempt, boatEntries, branchSigns, buttonDetail, crossingOutcome, crossingPath,
  crossingStep, homeView, placeName, purifyAction, soulDetail, worldLayout,
} from './crossing-layout.js';
import { HoverTip } from './hover-tip.js';
import { DEPTH, NightStage, roundThumb } from './night-fx.js';
import { RiverBoat, WOOD, addDock } from './river-boat.js';
import { addBoardingSoul, setBoardingBadge, startBreathing, swayTail } from './soul-token.js';

// CrossingScene (T-19): the outward window, phase 'window' or 'review' with window.kind 'outward'.
// One river world that the view pans and zooms over (a container, so clicks stay exact), with the HUD
// on top. The boat is the same boat throughout:
//   prepare: the boat at its stop, exactly where DeliveryScene draws it. Memory hand, the shared meal
//            and the Priest's purify, then "Approach the fork".
//   approach: a Long due at the fork fades in, the boat sails to the fork and the view pulls back to
//            show both branches with their signposts; then START_CROSSING is dispatched.
//   fork / review: click a branch's signpost (PLAN), then Back or Confirm in the bottom panel.
//   cross:   the next state is computed first, because the router opens Odysseus's choice or GameOver
//            at once. The boat sails down the branch through thickening fog, the flames go out one by
//            one, the view comes back to zoom 1 so the boat ends where DeliveryScene draws it, the title
//            card and arrival events play, and only then CONFIRM is dispatched. DeliveryScene opens with no cut.
// Everything shows its details on hover. The hand shows only what the engine allows.

const CLICK = 'sfx-ui-click';
const FOG = 'sfx-fog'; // once on confirming a route with fog 1 or more, before the Light loss shows
const AMBIENCE = 'amb-crossing'; // a very quiet still-water loop, for as long as the crossing screen is open (queued by BootScene)
const RIVER_LAYERS = [1, 0.9, 0.8, 0.7, 0.6, 0.5];
const SIGN = { w: 740, h: 270, thumb: 190 }; // world size; about 355 x 130 on screen at the fork view
const FEET = TOKEN.h / 2; // a seat's centre to the deck floor
const FORESIGHT = { x: 1256, y: 190, w: 300 };

defineTuning({
  'crossing.enterMs': { type: 'number', default: 700, min: 0, max: 3000, step: 50, help: 'The boat comes in from the Starting Shore' },
  'crossing.approachMs': { type: 'number', default: 1600, min: 200, max: 6000, step: 50, help: 'The boat sails to the fork' },
  'crossing.boardMs': { type: 'number', default: 500, min: 0, max: 3000, step: 50, help: 'A Long fades onto the boat at the fork' },
  'crossing.bobPx': { type: 'number', default: 5, min: 0, max: 20, step: 1, help: 'How far the boat bobs while sailing' },
  'crossing.bobMs': { type: 'number', default: 1400, min: 200, max: 5000, step: 50, help: 'One bob, up and down' },
  'crossing.rippleMs': { type: 'number', default: 220, min: 60, max: 2000, step: 10, help: 'Time between ripples behind the boat' },
  'crossing.fogAlphaPerLight': { type: 'number', default: 0.12, min: 0, max: 0.5, step: 0.01, help: 'Fog thickness for each Light paid' },
  'crossing.fogAlphaBase': { type: 'number', default: 0.1, min: 0, max: 0.5, step: 0.01, help: 'Fog on any crossing, even a free one' },
  'crossing.eventMs': { type: 'number', default: 600, min: 0, max: 3000, step: 50, help: 'A soul leaves or boards on arrival' },
  'crossing.arrivalHoldMs': { type: 'number', default: 1400, min: 0, max: 6000, step: 100, help: 'Pause on the arrival before the delivery' },
  'crossing.titleMs': { type: 'number', default: 600, min: 0, max: 3000, step: 50, help: 'The destination title fades in and out' },
  'crossing.riverAlpha': { type: 'number', default: 0.42, min: 0, max: 1, step: 0.02, help: 'The river drawn over the painting (next scene)' },
  'crossing.soulHeight': { type: 'number', default: 130, min: 80, max: 220, step: 2, help: 'Soul on the boat (next scene)' },
});

const lerp = (a, b, k) => a + (b - a) * k;

export class CrossingScene extends Phaser.Scene {
  constructor() {
    super('CrossingScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, {
      art: [...soulArtIds(), 'sprite-boat-horizontal', ...MemoryHand.artIds()],
      backgrounds: ['bg-starting-shore', ...Ferry.data.destinations.map((d) => d.id)],
      audio: [FOG], // sfx-fog is not in BootScene's list
    });
  }

  create() {
    const state = this.registry.get('state');
    const step = crossingStep(state);
    console.log(`[ferry] CrossingScene shown (phase ${state.phase}, step ${step}, light ${state.light})`);
    this.busy = false; // the approach or the crossing is playing
    this.leaving = false;
    this.targetMode = null; // { kind: 'memory' | 'purify', ids, priestId? }
    this.tokens = new Map();
    this.overlayParts = [];
    this.signParts = [];
    this.layout = worldLayout(state, Ferry);

    this.night = new NightStage(this, state.destination ?? 'bg-starting-shore');
    this.world = this.add.container(0, 0);
    this.drawRiver(state);
    this.boat = this.add.container(this.layout.home.x, this.layout.home.y);
    this.world.add(this.boat);
    const { slots } = boatEntries(state, Ferry);
    const deckWidth = slots[slots.length - 1].x - slots[0].x + slots[0].w + 32;
    this.deck = new RiverBoat(this, 0, FEET, deckWidth);
    this.boat.add(this.deck.root);

    this.fog = this.add.rectangle(640, 360, 1280, 720, COLOR.muted, 0).setDepth(DEPTH.fogFront + 1);
    this.bar = new Hud(this);
    this.tip = new HoverTip(this, DEPTH.hero + 1);
    this.panel = new DecisionPanel(this);
    this.hand = new MemoryHand(this, {
      compact: true,
      onTargets: (ids) => { this.targetMode = ids ? { kind: 'memory', ids } : null; this.render(this.registry.get('state')); },
      onHover: (card) => this.previewCard(card),
    });

    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) return this.startExit(s);
      if (this.busy) return;
      this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.ambience = playSound(this, AMBIENCE, { loop: true });
    this.events.once('shutdown', () => {
      this.game.events.off('ferry-state', this.onState);
      this.ambience?.stop();
      this.rippleTimer?.remove();
      this.deck = null; // update() can fire once more, after the boat has gone
    });

    this.setView(step === 'fork' || step === 'review' ? this.layout.forkView : homeView());
    this.placeBoat(step);
    this.render(state);
    // From the Starting Shore the boat comes in from the left, after BoardingScene sailed it out.
    if (step === 'prepare' && !state.destination) {
      fadeIn(this);
      this.boat.x -= 900;
      this.tweens.add({ targets: this.boat, x: this.layout.home.x, duration: tune('crossing.enterMs'), ease: 'Cubic.Out' });
    }
  }

  update(time, delta) {
    if (!this.deck) return;
    const seconds = time / 1000;
    this.night.update(time, delta);
    this.deck.update(seconds);
    this.bar.update(seconds);
    for (const token of this.tokens.values()) swayTail(token, seconds, tune('boarding.tailPx'), tune('boarding.tailSpeed'));
  }

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
    this.river = [g];
    // Layers of narrowing water, so the river has soft banks over the painting instead of a hard edge.
    const alpha = tune('crossing.riverAlpha') / RIVER_LAYERS.length;
    for (const width of RIVER_LAYERS) {
      g.lineStyle(RIVER.h * width, COLOR.deep, alpha);
      g.lineBetween(home.x - 1400, home.y, fork.x, fork.y);
      for (const b of branches) {
        new Phaser.Curves.Spline(b.points.map((p) => new Phaser.Math.Vector2(p.x, p.y))).draw(g, 80);
        // Level water past the branch end, where the curve has levelled off.
        g.lineBetween(b.end.x + 900, b.end.y, b.end.x + 2400, b.end.y);
      }
    }
    if (state.destination) this.world.add(addDock(this, DOCK.x, DOCK.y));
    this.world.add(this.add.text(DOCK.x - DOCK.w / 2 + 16, DOCK.y - DOCK.h / 2 + 44, placeName(state, Ferry, t), bodyText(22, CSS.muted)));
  }

  /** A signpost at the fork: the destination's painting in a round frame, its name, fog cost and who wishes for it. */
  drawSigns(state, step) {
    for (const p of this.signParts) p.destroy();
    this.signParts = [];
    for (const sign of branchSigns(state, Ferry, t)) {
      const at = this.layout.branches[sign.option].sign;
      const edge = sign.picked ? COLOR.gold : sign.lethal ? COLOR.danger : WOOD.edge;
      const board = this.add.graphics();
      board.fillStyle(WOOD.post, 1).fillRect(at.x + SIGN.w / 2 - 80, at.y - SIGN.h / 2 - 30, 26, SIGN.h + 90);
      board.fillStyle(sign.picked ? 0x3a2a1a : WOOD.plank, 0.97).fillRoundedRect(at.x - SIGN.w / 2, at.y - SIGN.h / 2, SIGN.w, SIGN.h, 14);
      board.lineStyle(sign.picked ? 6 : 4, edge, 1).strokeRoundedRect(at.x - SIGN.w / 2, at.y - SIGN.h / 2, SIGN.w, SIGN.h, 14);
      const cx = at.x - SIGN.w / 2 + SIGN.thumb / 2 + 26;
      const key = sign.hidden || !sign.destination ? null : roundThumb(this, sign.destination);
      const thumb = key
        ? this.add.image(cx, at.y, key).setDisplaySize(SIGN.thumb, SIGN.thumb)
        : this.add.circle(cx, at.y, SIGN.thumb / 2, COLOR.panel).setStrokeStyle(4, COLOR.gold, 0.6);
      const left = cx + SIGN.thumb / 2 + 26;
      const top = at.y - SIGN.h / 2;
      const room = SIGN.w - (left - (at.x - SIGN.w / 2)) - 24;
      const parts = [
        board,
        thumb,
        this.add.text(left, top + 22, t('crossing.signOption', { number: sign.number }), bodyText(32, sign.picked ? CSS.gold : CSS.muted)),
        this.add.text(left, top + 62, sign.name, headText(46, sign.lethal ? CSS.danger : CSS.bone, { wordWrap: { width: room } })),
        this.add.text(left, top + 132, sign.fog, bodyText(40, sign.lethal ? CSS.danger : CSS.bone)),
      ];
      if (!key) parts.push(this.add.text(cx, at.y, '?', headText(80, CSS.gold)).setOrigin(0.5));
      if (sign.wishes) parts.push(this.add.text(left, top + 190, sign.wishes, bodyText(34, CSS.gold, { wordWrap: { width: room }, lineSpacing: -8 })));
      this.world.add(parts);
      this.signParts.push(...parts);
      const hit = this.add.zone(at.x, at.y, SIGN.w, SIGN.h).setInteractive({ useHandCursor: !!sign.action });
      this.world.add(hit);
      this.signParts.push(hit);
      hit.on('pointerover', (pointer) => this.showTip(pointer, sign.name, sign.detail));
      hit.on('pointerout', () => this.hideTip());
      if (sign.action && (step === 'fork' || step === 'review')) hit.on('pointerdown', () => this.pickBranch(state, sign));
    }
  }

  /** One soul per passenger, on the boat. A soul with no seat rides on the rail, in front of the hull. */
  drawBoat(state) {
    const { entries } = boatEntries(state, Ferry);
    const ids = new Set(entries.map((e) => e.id));
    for (const [id, token] of this.tokens) {
      if (ids.has(id)) continue;
      this.hideTip();
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      setBoardingBadge(token, shipBadge(entry.actor, Ferry));
      const target = this.targetMode?.ids.includes(entry.id);
      token.parts.rim?.setAlpha(target ? tune('boarding.rimAlpha') : 0);
      token.parts.glow.setAlpha(target ? tune('boarding.hoverGlow') : 0);
      this.moveToken(token, entry);
    }
  }

  /** A token's place in the deck container: (0, 0) there is the middle of the floor. */
  seatOf(entry) {
    const { home } = this.layout;
    return { x: entry.x - home.x, y: entry.y - home.y };
  }

  moveToken(token, entry, duration = tune('boarding.snapMs')) {
    const at = this.seatOf(entry);
    if (token.x === at.x && token.y === at.y) return;
    this.tweens.killTweensOf(token);
    this.tweens.add({ targets: token, ...at, duration, ease: tune('boarding.snapEase') });
  }

  addToken(entry) {
    const at = this.seatOf(entry);
    const token = addBoardingSoul(this, { ...entry, ...at }, tune('crossing.soulHeight'));
    token.parts.shadow.setAlpha(0);
    startBreathing(this, token);
    if (entry.span) this.deck.seat(token);
    else this.deck.rail(token);
    setBoardingBadge(token, shipBadge(entry.actor, Ferry));
    token.on('pointerdown', () => this.pickSoul(entry.id));
    token.on('pointerover', (pointer) => {
      const state = this.registry.get('state');
      const actor = state.boat.find((x) => x.id === entry.id) ?? entry.actor;
      const d = soulDetail(state, actor, Ferry, t);
      this.showTip(pointer, d.title, d.lines);
    });
    token.on('pointerout', () => this.hideTip());
    this.tokens.set(entry.id, token);
    return token;
  }

  // ---- the HUD -------------------------------------------------------------------------------

  render(state) {
    if (this.leaving || this.busy || !state) return;
    const step = crossingStep(state);
    if (step === 'away') return; // a choice over this scene, or the state is moving on
    if (this.targetMode?.kind === 'purify' && step !== 'prepare') this.targetMode = null;
    this.bar.render(state);
    this.hand.render(state);
    this.drawBoat(state);
    this.drawSigns(state, step);
    this.clearOverlay();
    this.drawForesight(state);
    if (step === 'prepare') this.showPrepare(state);
    else if (step === 'review') this.showReview(state);
    else this.showFork();
  }

  clearOverlay() {
    for (const p of this.overlayParts) p.destroy();
    this.overlayParts = [];
  }

  /** The prepare step: the meal, purify, the warning and "Approach the fork". */
  showPrepare(state) {
    const buttons = abilities(state, Ferry, t).map((ability) => {
      const picking = this.targetMode?.kind === 'purify' && this.targetMode.priestId === ability.priestId;
      const label = picking ? t('common.cancel') : ability.label;
      return { label, onPress: () => this.guarded(() => this.useAbility(ability)), onHover: this.hoverDetail(label, buttonDetail(ability.kind, state, Ferry, t)) };
    });
    const approach = t('crossing.approachFork');
    buttons.push({ label: approach, gold: true, onPress: () => this.guarded(() => this.approach()), onHover: this.hoverDetail(approach, buttonDetail('approach', state, Ferry, t)) });
    this.panel.show({
      heading: t('crossing.prepHeading'),
      lines: [this.targetMode?.kind === 'purify' ? t('crossing.purifyPick') : t('crossing.prepIntro')],
      warning: approachWarning(state, Ferry, t),
      buttons,
    });
  }

  showFork() {
    this.panel.show({ heading: t('crossing.routeHeading'), lines: [t('crossing.pickBranch')] });
  }

  /** The review panel: the engine's fog numbers for the picked branch, then Back and Confirm. */
  showReview(state) {
    const r = routeModel(state, Ferry, t).review;
    if (!r) return;
    this.panel.show({
      heading: `${r.heading}: ${r.name}`,
      lines: [[r.breakdown, r.modifiers].filter(Boolean).join(' · '), r.cost],
      warning: r.warning,
      buttons: [
        { label: r.back.label, onPress: () => this.guarded(() => this.routeAction(r.back.action)) },
        { label: r.confirm.label, gold: true, onPress: () => this.guarded(() => this.cross()) },
      ],
    });
  }

  guarded(fn) {
    if (!this.busy) fn();
  }

  hoverDetail(title, detail) {
    if (!detail) return undefined;
    return (pointer) => (pointer ? this.showTip(pointer, title, [detail]) : this.hideTip());
  }

  /** Forks revealed by Foresight, under the hand: one row per fork, both destinations. */
  drawForesight(state) {
    const rows = routeModel(state, Ferry, t).upcoming ?? [];
    if (!rows.length) return;
    const { x, y, w } = FORESIGHT;
    const left = x - w + 16;
    const texts = rows.map((row) => t('crossing.foresightRow', { label: row.label, options: row.options.map((o) => o.name).join(' / ') }));
    const body = this.add.text(left, y + 42, texts.join('\n'), bodyText(16, CSS.bone, { wordWrap: { width: w - 32 } })).setDepth(DEPTH.ui);
    const back = drawPanel(this.add.graphics(), x - w, y, w, body.height + 56).setDepth(DEPTH.ui - 1);
    const title = this.add.text(left, y + 12, t('crossing.foresight'), headText(16, CSS.gold)).setDepth(DEPTH.ui);
    this.overlayParts.push(back, title, body);
  }

  showTip(pointer, title, lines) { this.tip.show(pointer, title, lines); }

  hideTip() { this.tip.hide(); }

  /** A small card shows its full text on hover. */
  previewCard(card) {
    if (!card) return this.hideTip();
    this.showTip(this.input.activePointer, card.name, [card.text, t('memory.from', { source: card.source }), card.playable ? '' : card.reason]);
  }

  say(text) {
    this.bar.toast(text);
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
    this.hideTip();
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
    this.render(this.registry.get('state'));
  }

  pickSoul(id) {
    if (this.busy || !this.targetMode?.ids.includes(id)) return;
    if (this.targetMode.kind === 'memory') return this.hand.pickTarget(id);
    const { priestId } = this.targetMode;
    this.targetMode = null;
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
    this.clearOverlay();
    this.panel.slideOut();
    if (outcome.lines.length) this.bar.toast(outcome.lines.join(' '), CSS.gold);
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    const sail = () => {
      this.startRipples();
      this.sail(this.layout.home, this.layout.approach, this.layout.forkView, tune('crossing.approachMs'), () => {
        this.stopRipples();
        this.busy = false;
        this.panel.slideIn();
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

  /** A ring on the water behind the boat, in screen space so it stays the right size at any zoom. */
  ripple() {
    const { zoom } = this.view;
    const x = this.world.x + (this.boat.x - 250) * zoom;
    const y = this.world.y + (this.boat.y + FEET + 30) * zoom;
    this.night.fx.ripple(x, y, 1.4 * zoom);
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
    if (previewOption(state, Ferry, state.pending.option)?.fog >= 1) playSound(this, FOG);
    console.log(`[ferry] CrossingScene: crossing to ${outcome.to}, ${outcome.paid} Light${outcome.ended ? ', the lantern goes out' : ''}`);
    this.busy = true;
    this.hand.root.setVisible(false); // no memory once the boat sails: the state must not change after the crossing was computed
    this.hideTip();
    this.hand.cancel();
    this.targetMode = null;
    this.clearOverlay();
    this.panel.slideOut();
    this.caption = this.add.text(640, 60, `${outcome.from}  ·  ${outcome.concealed ? '?' : outcome.to}`, headText(20, CSS.muted)).setOrigin(0.5).setDepth(DEPTH.ui);
    this.tweens.add({ targets: this.signParts, alpha: 0, duration: 300 });

    const travelMs = tune('crossing.travelMs');
    const fogMs = tune('crossing.fogFadeMs');
    const thickness = Math.min(0.6, tune('crossing.fogAlphaBase') + outcome.paid * tune('crossing.fogAlphaPerLight'));
    this.tweens.add({ targets: this.fog, fillAlpha: thickness, duration: fogMs, ease: 'Sine.InOut', yoyo: true, hold: Math.max(0, travelMs - 2 * fogMs) });
    this.time.delayedCall(travelMs / 2, () => this.loseLight(state, outcome));
    this.startRipples();
    this.sail(this.layout.approach, crossingPath(this.layout, branch.option), branch.view, travelMs, () => {
      this.stopRipples();
      this.arrive(next, outcome, branch, () => this.dispatch(action));
    });
  }

  /** The flames go out one by one, with a red edge and a small shake, and a "-N Light" line that floats up and fades. */
  loseLight(state, outcome) {
    this.bar.stepLight(outcome.lightBefore, outcome.lightAfter, Ferry.maxLight(state));
    const line = this.add.text(32, 118, outcome.lightLine, headText(22, outcome.paid ? CSS.danger : CSS.calm)).setDepth(DEPTH.ui);
    this.tweens.add({ targets: line, y: 104, alpha: 0, delay: tune('crossing.lightLossMs'), duration: 1200, ease: 'Sine.In', onComplete: () => line.destroy() });
    if (!outcome.paid) return;
    edgeFlash(this);
    lossShake(this);
  }

  /** The title card, who leaves and who boards; then the boat settles where DeliveryScene draws it and we dispatch. */
  arrive(next, outcome, branch, done) {
    this.bar.render(next);
    this.caption.destroy();
    const titleMs = tune('crossing.titleMs');
    const card = [
      this.add.text(640, 104, outcome.ended ? outcome.endLine : outcome.arrived, headText(40, outcome.ended ? CSS.danger : CSS.gold, { align: 'center', stroke: CSS.deep, strokeThickness: 5, wordWrap: { width: 1000 } })).setOrigin(0.5).setDepth(DEPTH.ui).setAlpha(0),
    ];
    const lines = outcome.ended ? [] : outcome.lines;
    if (lines.length) card.push(this.add.text(640, 142, lines.join('\n'), bodyText(21, CSS.bone, { align: 'center', stroke: CSS.deep, strokeThickness: 4, wordWrap: { width: 900 } })).setOrigin(0.5, 0).setDepth(DEPTH.ui).setAlpha(0));
    this.tweens.add({ targets: card, alpha: 1, duration: titleMs, ease: 'Sine.Out' });
    const hold = (after) => this.time.delayedCall(tune('crossing.arrivalHoldMs'), () => {
      this.tweens.add({ targets: card, alpha: 0, duration: titleMs, ease: 'Sine.In', onComplete: () => { this.busy = false; after(); } });
    });
    if (outcome.ended) {
      const dark = this.add.rectangle(640, 360, 1280, 720, COLOR.deep, 0).setDepth(DEPTH.fogFront + 2);
      this.tweens.add({ targets: dark, fillAlpha: 0.7, duration: tune('crossing.eventMs') });
      return hold(done);
    }
    const eventMs = tune('crossing.eventMs');
    // The view settles on exactly what DeliveryScene draws: the destination's painting, the dock, the boat.
    this.tweens.add({ targets: this.river, alpha: 0, duration: eventMs });
    if (this.textures.exists(next.destination)) {
      const painting = this.add.image(640, 360, next.destination).setDepth(DEPTH.backdrop + 0.5).setAlpha(0);
      painting.setScale(Math.max(1280 / painting.width, 720 / painting.height) * (1 + (2 * tune('night.parallaxPx')) / 1280));
      this.tweens.add({ targets: painting, alpha: 1, duration: eventMs, ease: 'Sine.InOut' });
    }
    const dock = addDock(this, branch.dock.x, branch.dock.y);
    for (const part of dock) part.setAlpha(0);
    this.world.add(dock);
    this.tweens.add({ targets: dock, alpha: 1, duration: eventMs });

    const leaving = outcome.departed.map((id) => this.tokens.get(id)).filter(Boolean);
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    for (const e of entries) setBoardingBadge(this.tokens.get(e.id), shipBadge(e.actor, Ferry)); // a wish can change on arrival
    if (leaving.length) this.tweens.add({ targets: leaving, alpha: 0, y: '-=40', duration: eventMs });
    // The boat settles into DeliveryScene's seat order, so the scene change shows no jump.
    const settle = () => {
      for (const e of entries) this.moveToken(this.tokens.get(e.id), e);
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
    fadeOut(this, () => this.router.exitDone());
  }
}
