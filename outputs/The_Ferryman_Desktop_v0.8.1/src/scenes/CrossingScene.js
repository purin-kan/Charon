import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { playSound, queueAssets, soulArtIds } from '../preloader.js';
import { fileIdFor } from '../asset-names.js';
import { t } from '../text.js';
import { bodyText, COLOR, CSS, DecisionPanel, makeButton, drawPanel, EASE, edgeFlash, enterScene, headText, leaveScene, lossShake, MS } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { Hud } from '../components/Hud.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { previewOption, routeModel } from '../components/route-layout.js';
import { shipBadge, TOKEN } from './boarding-layout.js';
import {
  abilities, approachOutcome, approachWarning, attempt, boatEntries, branchSigns, buttonDetail, crossingOutcome,
  crossingStep, placeName, purifyAction, soulDetail, worldLayout,
} from './crossing-layout.js';
import { HoverTip } from './hover-tip.js';
import { DEPTH, NightStage } from './night-fx.js';
import { PIER_ART, RiverBoat, Water, addPier } from './river-boat.js';
import { addBoardingSoul, fadeAway, setBoardingBadge, setLabelTier } from './soul-token.js';

// CrossingScene (T-19): the outward window, phase 'window' or 'review' with window.kind 'outward'.
// The boat is full size and on the water. The ferryman rows slowly: the boat hardly moves, and the water, fog and painting
// slide left past it in strokes, so it goes right. Fog rolls in and takes it in the middle of a crossing.
//   prepare: the boat at its stop. Memory hand, the shared meal and the Priest's purify, then "Approach the fork".
//   approach: a Long due at the fork fades in, the stop slides away and the boat rows to the fork, where the signs stand
//            in the water ahead of it; then START_CROSSING is dispatched.
//   fork / review: click a signpost in the water (PLAN), then Back or Confirm in the bottom panel.
//   cross:   the next state is computed first, because the router opens Odysseus's choice or GameOver at once. The boat
//            rows into thickening fog and the flames go out one by one. The new place and its pier come up inside the
//            fog, it thins, the boat pulls up to its stop, the title card and arrival events play, and only then CONFIRM
//            is dispatched. DeliveryScene opens with no cut.
// Everything shows its details on hover. The hand shows only what the engine allows.

const CLICK = 'sfx-ui-click';
const FOG = 'sfx-fog'; // once on confirming a route with fog 1 or more, before the Light loss shows
const AMBIENCE = 'amb-crossing'; // a very quiet still-water loop, for as long as the crossing screen is open (queued by BootScene)
const FEET = TOKEN.h / 2; // a seat's centre to the deck floor
const FORK_ART = 'bg-fork-choice';
const SUBTITLE = { y: 680, size: 24 }; // the line under the left and right choice: words only, nothing to click
// The view from the bow at a fork.
const FORK = { signX: 230, signY: 330, w: 320, h: 110, bobPx: 6, bobMs: 1600, hoverScale: 1.05, overscan: 1.12, fadeMs: 500, drift: 22, lean: 34, rock: 3, roll: 0.0035, turnPx: 170, pushIn: 1.45, turnRoll: 0.03 };
// The bow in FORK_ART, as a share of the image: the two gunwales run from the stem post down to the bottom edge.
const BOW_OUTLINE = [[0.493, 0.47], [0.497, 0.465], [0.5, 0.468], [0.512, 0.468], [0.518, 0.56], [0.925, 1], [0.09, 1], [0.49, 0.56]];

const BOW_DRESS = { apexX: 0.505, apexY: 0.53, railEnds: [0.06, 0.95], railPx: 66, bandTop: 0.625, bandH: 0.115, prow: [0.84, 0.14, 0.16, 0.48], prowH: 0.37, postAt: 0.72 };

/** The picture a destination is painted in, drawn to cover a canvas of width w and height h, centred on x. */
function paintDestination(scene, context, id, w, h, x) {
  if (!id || !scene.textures.exists(fileIdFor('backgrounds', id, scene.textures.getTextureKeys()))) {
    const mist = context.createLinearGradient(0, 0, 0, h); // a route the player can't see: only fog
    mist.addColorStop(0, '#1c2530');
    mist.addColorStop(0.6, '#4a5866');
    mist.addColorStop(1, '#141b22');
    context.fillStyle = mist;
    context.fillRect(0, 0, w, h);
    return;
  }
  const source = scene.textures.get(fileIdFor('backgrounds', id, scene.textures.getTextureKeys())).getSourceImage();
  const scale = Math.max((w * 1.15) / source.width, h / source.height);
  const dw = source.width * scale;
  const dh = source.height * scale;
  context.drawImage(source, x - dw / 2, (h - dh) / 2, dw, dh);
}

/** The same boat as every other scene: its gold and key-pattern rail along both sides. */
function dressBow(context, boat, w, h) {
  const apex = { x: w * BOW_DRESS.apexX, y: h * BOW_DRESS.apexY };
  const bandTop = boat.height * BOW_DRESS.bandTop;
  const bandH = boat.height * BOW_DRESS.bandH;
  for (const end of BOW_DRESS.railEnds) {
    const tip = { x: w * end, y: h * 1.04 };
    const angle = Math.atan2(tip.y - apex.y, tip.x - apex.x);
    const length = Math.hypot(tip.x - apex.x, tip.y - apex.y);
    const steps = 80;
    for (let i = 0; i < steps; i++) {
      const k = i / steps;
      const far = k * k * 0.6 + k * 0.4; // the pattern tightens toward the prow
      const near = ((i + 1) / steps) ** 2 * 0.6 + ((i + 1) / steps) * 0.4;
      const thick = 8 + (k ** 1.3) * BOW_DRESS.railPx;
      context.save();
      context.translate(apex.x + Math.cos(angle) * length * k, apex.y + Math.sin(angle) * length * k);
      context.rotate(angle);
      if (Math.cos(angle) < 0) context.scale(1, -1); // keeps the rail's top edge facing up on the left side
      const from = boat.width * (0.26 + far * 0.5);
      context.drawImage(boat, from, bandTop, Math.max(1, boat.width * 0.5 * (near - far)), bandH, 0, -thick / 2, length / steps + 1.5, thick);
      context.restore();
    }
  }
}

/** The curled prow and its lantern, standing behind the bow so the deck hides where it was cut from the side view. */
function drawProw(context, boat, w, h) {
  const [sx, sy, sw, sh] = BOW_DRESS.prow.map((v, i) => v * (i % 2 ? boat.height : boat.width));
  const prowH = h * BOW_DRESS.prowH;
  const prowW = prowH * (sw / sh);
  const left = w * BOW_DRESS.apexX - prowW * BOW_DRESS.postAt;
  const top = h * (BOW_DRESS.apexY + 0.07) - prowH;
  context.save();
  context.beginPath();
  context.moveTo(left, top);
  context.lineTo(left + prowW, top);
  context.lineTo(left + prowW, top + prowH);
  context.lineTo(left + prowW * 0.56, top + prowH);
  context.lineTo(left + prowW * 0.44, top + prowH * 0.76);
  context.lineTo(left, top + prowH * 0.76);
  context.closePath();
  context.clip();
  context.drawImage(boat, sx, sy, sw, sh, left, top, prowW, prowH);
  context.restore();
}

/** The view from the bow at this fork: the left route's place on the left, the right route's on the right, the boat in front. */
function forkTexture(scene, leftId, rightId) {
  const key = `fork-${leftId ?? 'fog'}-${rightId ?? 'fog'}`;
  if (scene.textures.exists(key)) return key;
  const bow = scene.textures.get(FORK_ART).getSourceImage();
  const w = bow.width;
  const h = bow.height;
  const layer = () => { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; };
  const texture = scene.textures.createCanvas(key, w, h);
  const context = texture.getContext();
  paintDestination(scene, context, leftId, w, h, w * 0.3);

  // The right place fades in across the middle, so the two meet behind the bow in mist.
  const right = layer();
  const rightContext = right.getContext('2d');
  paintDestination(scene, rightContext, rightId, w, h, w * 0.7);
  const fade = rightContext.createLinearGradient(w * 0.4, 0, w * 0.6, 0);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  rightContext.globalCompositeOperation = 'destination-in';
  rightContext.fillStyle = fade;
  rightContext.fillRect(0, 0, w, h);
  context.drawImage(right, 0, 0);
  const mist = context.createLinearGradient(w * 0.36, 0, w * 0.64, 0);
  mist.addColorStop(0, 'rgba(150,165,180,0)');
  mist.addColorStop(0.5, 'rgba(150,165,180,0.8)');
  mist.addColorStop(1, 'rgba(150,165,180,0)');
  context.fillStyle = mist;
  context.fillRect(0, 0, w, h);

  // The inside of the boat, cut from the painting with a soft edge and warmed to the gold boat's wood.
  const boat = layer();
  const boatContext = boat.getContext('2d');
  boatContext.filter = 'blur(2px)';
  boatContext.beginPath();
  BOW_OUTLINE.forEach(([x, y], i) => (i ? boatContext.lineTo(x * w, y * h) : boatContext.moveTo(x * w, y * h)));
  boatContext.closePath();
  boatContext.fill();
  boatContext.filter = 'none';
  boatContext.globalCompositeOperation = 'source-in';
  boatContext.drawImage(bow, 0, 0);
  boatContext.globalCompositeOperation = 'source-atop';
  boatContext.fillStyle = 'rgba(150,84,30,0.3)';
  boatContext.fillRect(0, 0, w, h);
  const goldBoat = scene.textures.get('sprite-boat-horizontal').getSourceImage();
  drawProw(context, goldBoat, w, h);
  context.drawImage(boat, 0, 0);
  dressBow(context, goldBoat, w, h);
  texture.refresh();
  return key;
}

const PLACE_LABEL = { x: 56, y: 174 }; // the name of the stop the boat is leaving
const FORESIGHT = { x: 760, y: 130, w: 300 }; // above the boat at the fork, clear of the signs

defineTuning({
  'crossing.prepareX': { type: 'number', default: 640, min: 300, max: 1000, step: 10, help: 'Where the boat waits, centred, while memories and passenger abilities are chosen after the Starting Shore' },
  'crossing.enterMs': { type: 'number', default: 2600, min: 0, max: 6000, step: 50, help: 'The boat rows in from the Starting Shore' },
  'crossing.approachMs': { type: 'number', default: 4200, min: 200, max: 10000, step: 50, help: 'The boat rows to the fork' },
  'crossing.boardMs': { type: 'number', default: 500, min: 0, max: 3000, step: 50, help: 'A Long fades onto the boat at the fork' },
  'crossing.rippleMs': { type: 'number', default: 340, min: 60, max: 2000, step: 10, help: 'Time between streaks of foam behind the boat' },
  'crossing.fogAlphaPerLight': { type: 'number', default: 0.2, min: 0, max: 0.5, step: 0.01, help: 'Fog thickness for each Light paid' },
  'crossing.fogBanks': { type: 'number', default: 5, min: 1, max: 10, step: 0.5, help: 'How much the drifting fog thickens on a crossing' },
  'crossing.fogAlphaBase': { type: 'number', default: 0.3, min: 0, max: 0.5, step: 0.01, help: 'Fog on any crossing, even a free one' },
  'crossing.eventMs': { type: 'number', default: 600, min: 0, max: 3000, step: 50, help: 'A soul leaves or boards on arrival' },
  'crossing.arrivalHoldMs': { type: 'number', default: 1400, min: 0, max: 6000, step: 100, help: 'Pause on the arrival before the delivery' },
  'crossing.titleMs': { type: 'number', default: 600, min: 0, max: 3000, step: 50, help: 'The destination title fades in and out' },
  'crossing.soulHeight': { type: 'number', default: 150, min: 80, max: 220, step: 2, help: 'Soul on the boat (next scene)' },
});

export class CrossingScene extends Phaser.Scene {
  constructor() {
    super('CrossingScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, {
      art: [...soulArtIds(), 'sprite-boat-horizontal', PIER_ART, ...MemoryHand.artIds()],
      backgrounds: ['bg-starting-shore', FORK_ART, ...Ferry.data.destinations.map((d) => d.id)],
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
    this.forkView = null; // the view from the bow at the fork
    this.forkSailing = false;
    this.layout = worldLayout(state, Ferry);

    this.night = new NightStage(this, state.destination ?? 'bg-starting-shore', () => tune('boarding.backdropShift'));
    this.water = new Water(this);
    this.world = this.add.container(0, 0);
    this.drawStop(state, step);
    const atStop = state.destination && step === 'prepare'; // moored at a stop's pier, which is on the right
    this.boat = this.add.container(atStop ? this.layout.stop.x : this.layout.home.x, this.layout.home.y);
    this.world.add(this.boat);
    this.deck = new RiverBoat(this, 0, FEET, tune('art.boat.width') * tune('art.boat.deck'));
    this.boat.add(this.deck.root);

    this.fog = this.add.rectangle(640, 360, 1400, 840, COLOR.muted, 0).setDepth(DEPTH.fogFront + 1); // wider than the screen, for a shake
    this.bar = new Hud(this);
    this.tip = new HoverTip(this, DEPTH.hero + 1);
    this.panel = new DecisionPanel(this);
    // At the fork only a subtitle, so the view from the bow shows whole.
    this.subtitle = this.add.text(640, SUBTITLE.y, '', bodyText(SUBTITLE.size, CSS.bone, {
      align: 'center', stroke: '#05080c', strokeThickness: 4, shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 8, fill: true, stroke: true },
    })).setOrigin(0.5).setDepth(DEPTH.ui).setVisible(false);
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
    // The ambience (AMBIENCE) is the run's background loop now: the router starts it with the run.
    this.events.once('shutdown', () => {
      this.game.events.off('ferry-state', this.onState);
      this.rippleTimer?.remove();
      this.deck = null; // update() can fire once more, after the boat has gone
    });

    if (step === 'fork' || step === 'review') {
      this.night.roamTo(0.5);
      this.boat.x = this.offRight(); // it rowed off to the right; the bow view is the fork
    }
    this.render(state);
    // From the Starting Shore the boat comes in from the left: BoardingScene sailed it off to the right.
    if (step === 'prepare' && !state.destination) {
      enterScene(this, MS.base);
      this.boat.x = this.layout.back;
      this.tweens.add({ targets: this.boat, x: tune('crossing.prepareX'), duration: tune('crossing.enterMs'), ease: 'Sine.Out' });
    }
  }

  update(time, delta) {
    if (!this.deck) return;
    const seconds = time / 1000;
    this.night.update(time, delta);
    this.water.update(delta / 1000, seconds);
    this.deck.update(seconds);
    this.bar.update(seconds);
    this.updateForkView(seconds);
  }

  // ---- the stop ------------------------------------------------------------------------------

  /** The pier and the name of the stop the boat is leaving. Under way there is only water. */
  drawStop(state, step) {
    this.stopParts = [];
    if (step !== 'prepare') return;
    const pier = state.destination ? addPier(this) : null;
    if (pier) this.stopParts.push(pier);
    this.stopParts.push(this.add.text(PLACE_LABEL.x, PLACE_LABEL.y, placeName(state, Ferry, t), bodyText(22, CSS.muted)));
    this.world.add(this.stopParts);
  }

  /** The route choice is only the view from the bow, at the fork; before it there are no signs. */
  drawSigns(state, step) {
    for (const p of this.signParts) p.destroy();
    this.signParts = [];
    if (step === 'fork' || step === 'review') this.drawForkChoice(state);
    else this.hideForkView();
  }

  /** The choice from the bow: the painting fills the screen, option 1 is the left branch and option 2 the right. */
  drawForkChoice(state) {
    const signs = branchSigns(state, Ferry, t);
    const shown = (option) => { const sign = signs.find((s) => s.option === option); return sign?.hidden ? null : sign?.destination ?? null; };
    this.showForkView(forkTexture(this, shown(0), shown(1)));
    for (const sign of signs) {
      const left = sign.option === 0;
      const x = left ? FORK.signX : 1280 - FORK.signX;
      const y = FORK.signY;
      const color = sign.picked ? CSS.gold : sign.lethal ? CSS.danger : CSS.bone;
      // Floating text over its side, no box: the place, its Light cost and who wishes for it. Shadowed to read on any painting.
      const ink = (style) => ({ ...style, align: 'center', stroke: '#05080c', strokeThickness: 4, shadow: { offsetX: 0, offsetY: 2, color: '#000', blur: 8, fill: true, stroke: true } });
      const parts = [
        this.add.text(0, -24, sign.name, headText(28, color, ink({ wordWrap: { width: FORK.w } }))).setOrigin(0.5),
        this.add.text(0, 10, sign.cost, bodyText(22, color, ink({}))).setOrigin(0.5),
      ];
      if (sign.wishes) parts.push(this.add.text(0, 36, sign.wishes, bodyText(16, CSS.gold, ink({ wordWrap: { width: FORK.w }, lineSpacing: -4 }))).setOrigin(0.5, 0));
      const review = sign.picked ? routeModel(state, Ferry, t).review : null;
      if (review) { // Confirm floats under the picked route, not in the panel
        const below = sign.wishes ? 82 : 56;
        parts.push(makeButton(this, 0, below, 120, 30, review.confirm.label, () => this.guarded(() => this.cross()), { gold: true, size: 14 }));
      }
      const button = this.add.container(x, y, parts).setDepth(DEPTH.fogFront + 0.6).setSize(FORK.w, FORK.h);
      this.tweens.add({ targets: button, y: y - FORK.bobPx, duration: FORK.bobMs, yoyo: true, repeat: -1, ease: 'Sine.InOut', delay: left ? 0 : FORK.bobMs / 2 });
      if (sign.action && !review) {
        button.setInteractive({ useHandCursor: true }); // only the button itself, not its half of the screen
        button.on('pointerover', () => { this.forkLean = left ? -1 : 1; button.setScale(FORK.hoverScale); });
        button.on('pointerout', () => { this.forkLean = sign.picked ? (left ? -1 : 1) : 0; button.setScale(1); });
        button.on('pointerdown', () => this.pickBranch(state, sign));
      }
      this.signParts.push(button);
      if (sign.picked) this.forkLean = left ? -1 : 1;
    }
  }

  showForkView(key) {
    if (this.forkView && this.forkView.texture.key !== key) this.forkView.setTexture(key);
    if (!this.forkView) {
      this.forkView = this.add.image(640, 360, key).setDepth(DEPTH.fogFront + 0.5);
      this.forkCover = Math.max(1280 / this.forkView.width, 720 / this.forkView.height) * FORK.overscan;
      this.forkView.setScale(this.forkCover).setAlpha(0);
      this.forkPan = 0;
      this.forkLean = 0;
    }
    if (this.forkView.visible && this.forkView.alpha > 0) return;
    this.forkView.setVisible(true);
    this.tweens.add({ targets: this.forkView, alpha: 1, duration: FORK.fadeMs, ease: 'Sine.Out' });
  }

  hideForkView() {
    this.forkView?.setVisible(false).setAlpha(0);
  }

  /** The look from the bow: the view drifts with the pointer and rocks gently, as if the boat rode the water. */
  updateForkView(seconds) {
    const view = this.forkView;
    if (!view?.visible || this.forkSailing) return;
    const pointer = this.input.activePointer;
    const target = ((pointer.x - 640) / 640) * FORK.drift + this.forkLean * FORK.lean;
    this.forkPan += (target - this.forkPan) * 0.05;
    view.setPosition(640 - this.forkPan, 360 + Math.sin(seconds * 0.8) * FORK.rock);
    view.setRotation(Math.sin(seconds * 0.55) * FORK.roll);
  }

  /** The bow turns to the chosen branch and pushes in, then the view lets go to the river. */
  sailForkView(option, travelMs) {
    const view = this.forkView;
    if (!view?.visible) return;
    this.forkSailing = true;
    const side = option === 0 ? 1 : -1;
    this.tweens.add({
      targets: view,
      x: 640 + side * FORK.turnPx,
      scale: this.forkCover * FORK.pushIn,
      rotation: side * FORK.turnRoll,
      duration: travelMs * 0.6,
      ease: 'Sine.InOut',
    });
    this.tweens.add({ targets: view, alpha: 0, duration: travelMs * 0.25, delay: travelMs * 0.55, ease: 'Sine.In' });
  }

  /** One soul per passenger, on the deck behind the hull. */
  drawBoat(state) {
    const { entries } = boatEntries(state, Ferry);
    const ids = new Set(entries.map((e) => e.id));
    for (const [id, token] of this.tokens) {
      if (ids.has(id)) continue;
      this.hideTip();
      fadeAway(token);
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      setBoardingBadge(token, shipBadge(entry.actor, Ferry));
      setLabelTier(token, entry.tier);
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
    this.deck.seat(token);
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
    this.panel.root.setVisible(step === 'prepare');
    this.subtitle.setVisible(step !== 'prepare');
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
    this.subtitle.setText(t('crossing.pickBranch')).setColor(CSS.bone);
  }

  /** Review: the picked route waits for its floating Confirm; the subtitle asks, or warns. Picking the other side switches. */
  showReview(state) {
    const r = routeModel(state, Ferry, t).review;
    if (!r) return;
    // A warning (a crossing that would put the lantern out) takes the line, in red.
    this.subtitle.setText(r.warning || t('crossing.crossTo', { name: r.name })).setColor(r.warning ? CSS.danger : CSS.bone);
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
    this.hand.lock(true);
    this.hideTip();
    this.hand.cancel();
    this.targetMode = null;
    this.clearOverlay();
    this.panel.slideOut();
    if (outcome.lines.length) this.bar.toast(outcome.lines.join(' '), CSS.gold);
    const { entries } = boatEntries(next, Ferry);
    const arriving = entries.filter((e) => outcome.boarded.includes(e.id)).map((e) => this.addToken(e).setAlpha(0));
    for (const e of entries) { // the others make room as the Long comes aboard
      const token = this.tokens.get(e.id);
      setLabelTier(token, e.tier);
      this.moveToken(token, e);
    }
    const sail = () => {
      const ms = tune('crossing.approachMs');
      // The stop is left behind: it slides off the way the water goes.
      if (this.stopParts.length) this.tweens.add({ targets: this.stopParts, x: '-=760', alpha: 0, duration: ms * 0.8, ease: EASE.move });
      this.night.roamTo(0.5, ms);
      this.tweens.add({ targets: this.boat, x: this.offRight(), duration: ms, ease: 'Sine.In' }); // floats off to the right, then the bow view
      this.row(ms, () => {
        this.busy = false;
        this.hand.lock(false);
        this.subtitle.setAlpha(1);
        this.dispatch(action);
      });
    };
    if (!arriving.length) return sail();
    this.tweens.add({ targets: arriving, alpha: 1, duration: tune('crossing.boardMs'), onComplete: () => this.time.delayedCall(tune('crossing.eventMs'), sail) });
  }

  /** Just past the right edge of the screen, all of the boat out of view. */
  offRight() {
    return this.scale.width + tune('art.boat.width') / 2 + 60;
  }

  /** The ferryman rows for ms: the water, fog and foam go by. */
  row(ms, done) {
    const fx = this.night.fx;
    this.tweens.add({ targets: fx, wind: -4, duration: ms * 0.3, hold: ms * 0.4, yoyo: true, ease: EASE.move });
    this.foam = this.time.addEvent({ delay: tune('crossing.rippleMs'), loop: true, callback: () => this.leaveFoam() });
    this.water.row(this.deck, ms, () => this.oarRing(), () => {
      this.foam.remove();
      done();
    });
  }

  /** A ring where the oar bites, at the back of the boat, as each pull begins. */
  oarRing() {
    this.night.fx.ripple(this.boat.x + tune('art.boat.width') * 0.34, this.boat.y + FEET + this.deck.keel + 4, 1.5);
  }

  /** Foam along the waterline, thicker behind the boat, on its left. */
  leaveFoam() {
    const half = tune('art.boat.width') / 2;
    const y = this.boat.y + FEET + this.deck.keel;
    this.water.wake(this.boat.x - half * 0.72, y + Phaser.Math.Between(-3, 7), 1.1);
    if (Math.random() < 0.5) this.water.wake(this.boat.x + half * 0.72, y + 4, 0.6);
  }

  /** Confirm: compute the crossing, play it, then dispatch CONFIRM (see the note at the top). */
  cross() {
    playSound(this, CLICK);
    const state = this.registry.get('state');
    const action = { type: 'CONFIRM' };
    const next = attempt(state, action, Ferry);
    if (!next) return this.dispatch(action);
    const outcome = crossingOutcome(state, next, Ferry, t);
    if (previewOption(state, Ferry, state.pending.option)?.fog >= 1) playSound(this, FOG);
    console.log(`[ferry] CrossingScene: crossing to ${outcome.to}, ${outcome.paid} Light${outcome.ended ? ', the lantern goes out' : ''}`);
    this.busy = true;
    this.hand.hide(); // no memory once the boat sails: the state must not change after the crossing was computed
    this.hideTip();
    this.hand.cancel();
    this.targetMode = null;
    this.clearOverlay();
    this.tweens.add({ targets: this.subtitle, alpha: 0, duration: MS.base, ease: EASE.exit });
    this.caption = this.add.text(640, 60, `${outcome.from}  ·  ${outcome.concealed ? '?' : outcome.to}`, headText(20, CSS.muted)).setOrigin(0.5).setDepth(DEPTH.ui);
    this.tweens.add({ targets: this.signParts, alpha: 0, duration: MS.base, ease: EASE.exit }); // the bow view's boards
    this.sailForkView(state.pending.option, tune('crossing.travelMs'));

    const travelMs = tune('crossing.travelMs');
    const fogMs = tune('crossing.fogFadeMs');
    const thickness = Math.min(0.82, tune('crossing.fogAlphaBase') + outcome.paid * tune('crossing.fogAlphaPerLight'));
    this.tweens.add({ targets: this.fog, fillAlpha: thickness, duration: fogMs, ease: EASE.move, yoyo: true, hold: Math.max(0, travelMs * 0.72 - 2 * fogMs) });
    this.night.fx.rollFog(tune('crossing.fogBanks'), fogMs);
    this.time.delayedCall(travelMs * 0.72 - fogMs * 0.4, () => this.night.fx.rollFog(1, fogMs));
    this.time.delayedCall(travelMs / 2, () => this.loseLight(state, outcome));
    this.night.roamTo(1, travelMs);
    if (!outcome.ended) {
      this.time.delayedCall(travelMs * 0.52, () => this.showPlace(next)); // in the thick of the fog
      this.boat.x = this.layout.back; // behind the bow view: it comes back in from the left, still going right
      this.tweens.add({ targets: this.boat, x: this.layout.stop.x, delay: travelMs * 0.5, duration: travelMs * 0.5, ease: EASE.move });
    } else {
      this.boat.x = this.layout.fork.x; // the lantern goes out on the water, in view once the bow view lets go
    }
    this.row(travelMs, () => this.arrive(next, outcome, () => this.dispatch(action)));
  }

  /** The flames go out one by one, with a red edge and a small shake, and a "-N Light" line that floats up and fades. */
  loseLight(state, outcome) {
    this.bar.stepLight(outcome.lightBefore, outcome.lightAfter, Ferry.maxLight(state));
    const line = this.add.text(32, 118, outcome.lightLine, headText(22, outcome.paid ? CSS.danger : CSS.calm)).setDepth(DEPTH.ui);
    this.tweens.add({ targets: line, y: 104, alpha: 0, delay: tune('crossing.lightLossMs'), duration: MS.slow, ease: EASE.exit, onComplete: () => line.destroy() });
    if (!outcome.paid) return;
    edgeFlash(this);
    lossShake(this);
  }

  /** In the thick of the fog the view becomes exactly what DeliveryScene draws, the painting and the pier. */
  showPlace(next) {
    const ms = tune('crossing.fogFadeMs');
    if (this.textures.exists(next.destination)) {
      const painting = this.add.image(640, 360 - tune('boarding.backdropShift'), next.destination).setDepth(DEPTH.backdrop + 0.5).setAlpha(0);
      painting.setScale(Math.max(1280 / painting.width, 720 / painting.height) * (1 + (2 * tune('night.parallaxPx')) / 1280));
      this.tweens.add({ targets: painting, alpha: 1, duration: ms, ease: EASE.move });
    }
    const pier = addPier(this);
    if (pier) {
      this.world.addAt(pier.setAlpha(0), this.world.getIndex(this.boat)); // behind the boat, which pulls up alongside it
      this.tweens.add({ targets: pier, alpha: 1, duration: ms, ease: EASE.enter });
    }
  }

  /** The title card, who leaves and who boards; then the boat settles where DeliveryScene draws it and we dispatch. */
  arrive(next, outcome, done) {
    this.bar.render(next);
    this.caption.destroy();
    const titleMs = tune('crossing.titleMs');
    const card = [
      this.add.text(640, 104, outcome.ended ? outcome.endLine : outcome.arrived, headText(40, outcome.ended ? CSS.danger : CSS.gold, { align: 'center', stroke: CSS.deep, strokeThickness: 5, wordWrap: { width: 1000 } })).setOrigin(0.5).setDepth(DEPTH.ui).setAlpha(0),
    ];
    const lines = outcome.ended ? [] : outcome.lines;
    if (lines.length) card.push(this.add.text(640, 142, lines.join('\n'), bodyText(21, CSS.bone, { align: 'center', stroke: CSS.deep, strokeThickness: 4, wordWrap: { width: 900 } })).setOrigin(0.5, 0).setDepth(DEPTH.ui).setAlpha(0));
    this.tweens.add({ targets: card, alpha: 1, duration: titleMs, ease: EASE.enter });
    const hold = (after) => this.time.delayedCall(tune('crossing.arrivalHoldMs'), () => {
      this.tweens.add({ targets: card, alpha: 0, duration: titleMs, ease: EASE.exit, onComplete: () => { this.busy = false; after(); } });
    });
    if (outcome.ended) {
      const dark = this.add.rectangle(640, 360, 1400, 840, COLOR.deep, 0).setDepth(DEPTH.fogFront + 2);
      this.tweens.add({ targets: dark, fillAlpha: 0.7, duration: tune('crossing.eventMs') });
      return hold(done);
    }
    const eventMs = tune('crossing.eventMs');
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
    leaveScene(this, () => this.router.exitDone());
  }
}
