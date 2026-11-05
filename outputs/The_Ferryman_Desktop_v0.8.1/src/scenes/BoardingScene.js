import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { BODY_FONT, HEAD_FONT, whenFontsReady } from '../fonts.js';
import { addBackdrop, playSound, queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { defineTuning, onTune, tune } from '../tuning.js';
import { soulTitle, typeDetail } from './crossing-layout.js';
import { Atmosphere, DEPTH, makeTextures } from './boarding-fx.js';
import { HoverTip } from './hover-tip.js';
import {
  STAGE, aboardChips, arcPoint, boatSway, clearActions, flames, heroPrompt, lastBoarded, layoutStage, nextLongName, panelButtons,
  ridePoint, seatBar, soulBadge, soulFacts, springStep,
} from './boarding-layout.js';
import { addBoardingSoul, setBoardingBadge, swayTail } from './soul-token.js';

defineTuning({
  'boarding.walkMs': { type: 'number', default: 680, min: 100, max: 1500, step: 10, help: 'Soul travels between shore and boat' },
  'boarding.walkEase': { type: 'ease', default: 'Sine.InOut' },
  'boarding.arcPx': { type: 'number', default: 34, min: 0, max: 120, step: 1, help: 'Height of the arc over the gunwale' },
  'boarding.leanDeg': { type: 'number', default: 7, min: 0, max: 25, step: 0.5, help: 'Soul leans as it travels' },
  'boarding.trailAlpha': { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02, help: 'Mist left behind a moving soul' },
  'boarding.selectLift': { type: 'number', default: 6, min: 0, max: 30, step: 1, help: 'Selected soul rises in its seat' },
  'boarding.bobPx': { type: 'number', default: 4, min: 0, max: 16, step: 1, help: 'Breathing bob height (new souls)' },
  'boarding.bobMs': { type: 'number', default: 2600, min: 500, max: 6000, step: 100, help: 'Breathing bob, one way (new souls)' },
  'boarding.tailPx': { type: 'number', default: 9, min: 0, max: 30, step: 0.5, help: 'Tail sway at the tip' },
  'boarding.tailSpeed': { type: 'number', default: 1.5, min: 0, max: 6, step: 0.1, help: 'Tail sway speed' },
  'boarding.shakePx': { type: 'number', default: 6, min: 0, max: 24, step: 1, help: 'Refused soul shake' },
  'boarding.shakeMs': { type: 'number', default: 60, min: 20, max: 200, step: 5, help: 'One swing of the shake' },
  'boarding.glowMs': { type: 'number', default: 220, min: 0, max: 1000, step: 10, help: 'Hover and rim fade' },
  'boarding.hoverGlow': { type: 'number', default: 0.42, min: 0, max: 1, step: 0.02 },
  'boarding.hoverScale': { type: 'number', default: 1.04, min: 1, max: 1.2, step: 0.01, help: 'Soul grows under the pointer' },
  'boarding.rimAlpha': { type: 'number', default: 0.85, min: 0, max: 1, step: 0.05, help: 'Gold rim on selected souls' },
  'boarding.lockedAlpha': { type: 'number', default: 0.9, min: 0.2, max: 1, step: 0.02, help: 'Dimming of locked souls' },
  'boarding.shadowAlpha': { type: 'number', default: 0.55, min: 0, max: 1, step: 0.05, help: 'Shadow under shore souls' },
  'boarding.pulseMs': { type: 'number', default: 700, min: 200, max: 2000, step: 50, help: 'Red Anger pip pulse' },
  'boarding.introMs': { type: 'number', default: 1300, min: 0, max: 4000, step: 50, help: 'Fade in and the boat gliding in' },
  'boarding.introBoat': { type: 'number', default: 420, min: 0, max: 900, step: 10, help: 'How far the boat glides in from' },
  'boarding.introStagger': { type: 'number', default: 130, min: 0, max: 500, step: 10, help: 'Between each soul appearing' },
  'boarding.appearMs': { type: 'number', default: 800, min: 0, max: 2500, step: 50, help: 'A soul rises out of the mist' },
  'boarding.appearRise': { type: 'number', default: 18, min: 0, max: 60, step: 1 },
  'boarding.uiMs': { type: 'number', default: 520, min: 0, max: 1500, step: 10, help: 'Panels slide in and out' },
  'boarding.veil': { type: 'number', default: 0.6, min: 0, max: 1, step: 0.02, help: 'Dark teal veil over the painting' },
  'boarding.vignette': { type: 'number', default: 0.85, min: 0, max: 1, step: 0.02 },
  'boarding.backdropShift': { type: 'number', default: 110, min: 0, max: 200, step: 2, help: 'Painting moved up, clear of the panel' },
  'boarding.parallaxPx': { type: 'number', default: 9, min: 0, max: 30, step: 1, help: 'Painting shifts with the pointer' },
  'boarding.fogSpeed': { type: 'number', default: 7, min: 0, max: 60, step: 1, help: 'Fog drift, pixels per second' },
  'boarding.fogAlpha': { type: 'number', default: 0.1, min: 0, max: 0.5, step: 0.01 },
  'boarding.rayAlpha': { type: 'number', default: 0.08, min: 0, max: 0.4, step: 0.01, help: 'Moonlight rays' },
  'boarding.moteAlpha': { type: 'number', default: 0.65, min: 0, max: 1, step: 0.05, help: 'Drifting motes of light' },
  'boarding.glintAlpha': { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02, help: 'Moonlight on the water' },
  'boarding.rippleAlpha': { type: 'number', default: 0.3, min: 0, max: 1, step: 0.02 },
  'boarding.rippleMs': { type: 'number', default: 1400, min: 200, max: 4000, step: 50, help: 'Ring on the water' },
  'boarding.lanternGlow': { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02, help: 'Warm light on the boat' },
  'boarding.lanternFlicker': { type: 'number', default: 0.22, min: 0, max: 0.6, step: 0.02 },
  'boarding.boatScale': { type: 'number', default: 0.32, min: 0.15, max: 0.6, step: 0.01 },
  'boarding.heavePx': { type: 'number', default: 2.5, min: 0, max: 12, step: 0.5, help: 'Boat rises and falls' },
  'boarding.rollDeg': { type: 'number', default: 0.7, min: 0, max: 4, step: 0.1, help: 'Boat rocks' },
  'boarding.dipPx': { type: 'number', default: 26, min: 0, max: 120, step: 1, help: 'Kick when a soul steps aboard or off' },
  'boarding.dipStiffness': { type: 'number', default: 26, min: 4, max: 120, step: 1 },
  'boarding.dipDamping': { type: 'number', default: 3.4, min: 0.5, max: 20, step: 0.1 },
  'boarding.reflectionAlpha': { type: 'number', default: 0.34, min: 0, max: 1, step: 0.02, help: 'Boat on the water (on reload)' },
  'boarding.reflectionWobble': { type: 'number', default: 3, min: 0, max: 16, step: 0.5, help: 'Water bends the reflection' },
  'boarding.panelY': { type: 'number', default: 545, min: 400, max: 560, step: 1, help: 'Top of the bottom panel' },
  'boarding.soulHeight': { type: 'number', default: STAGE.soulHeight, min: 100, max: 300, step: 2, help: 'Soul on the shore' },
  'boarding.seatHeight': { type: 'number', default: STAGE.seatHeight, min: 80, max: 260, step: 2, help: 'Soul in the boat' },
  'boarding.groundY': { type: 'number', default: STAGE.groundY, min: 300, max: 720, step: 1, help: 'Ground line of the shore' },
  'boarding.shoreLeft': { type: 'number', default: STAGE.shoreLeft, min: 0, max: 400, step: 1, help: 'First shore spot' },
  'boarding.shoreStep': { type: 'number', default: STAGE.shoreStep, min: 40, max: 200, step: 1, help: 'Between shore spots' },
  'boarding.deckX': { type: 'number', default: STAGE.deckX, min: 500, max: 1100, step: 1, help: 'Middle of the deck' },
  'boarding.deckY': { type: 'number', default: STAGE.deckY, min: 300, max: 600, step: 1, help: 'Deck floor under the souls' },
  'boarding.seatStep': { type: 'number', default: STAGE.seatStep, min: 40, max: 160, step: 1, help: 'Between seats' },
});

const COLOR = { deep: 0x020607, panel: 0x08161b, panelHi: 0x12262c, veil: 0x06141a, gold: 0xedc47f, goldHi: 0xf7dcae, unlit: 0x5b6a6a, lantern: 0xf0a860, reflection: 0x9fb0cc };
const CSS = { bone: '#f5efdf', muted: '#b9c3bd', gold: '#edc47f', danger: '#ff9f8a', ink: '#08161b' };
const PANEL = { w: 760, h: 164, r: 18, left: -356, chipX: -282, chipStep: 108, chipW: 100, chipH: 26, seatX: 190, seatStep: 32, seatW: 26, seatH: 14 };
// The boat image is 2400 x 900: its deck is centred on the image, the floor sits near y 620, the keel near y 750 and the
// lantern near (621, 346). The soul sprites keep their tails out of sight behind the hull.
const BOAT_ART = { h: 900, centreX: 1200, centreY: 450, floorY: 620, keelY: 740, lanternX: 621, lanternY: 346, fadeY: 430 };
const REFLECTION_POINTS = 16;
const REFLECTION_SQUASH = 0.5; // looked at from above the water, a reflection is shorter than the boat
const LANTERN_SCALE = 1.1;

const stageView = () => Object.fromEntries(Object.keys(STAGE).map((key) => [key, tune(`boarding.${key}`)]));
const bodyText = (size, color = CSS.bone, extra = {}) => ({ fontFamily: BODY_FONT, fontSize: `${size}px`, color, resolution: 2, ...extra });
const headText = (size, color = CSS.bone, extra = {}) => ({ fontFamily: HEAD_FONT, fontSize: `${size}px`, color, resolution: 2, ...extra });

function flameShape(w, h) {
  const points = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const lean = w * 0.4 * ((Math.cos(a) + 1) / 2) ** 2; // the tip curls, or it reads as a water drop
    points.push({ x: w * Math.sin(a) * Math.sin(a / 2) ** 2 + lean, y: -h * Math.cos(a) - h });
  }
  return points;
}

export class BoardingScene extends Phaser.Scene {
  constructor() {
    super('BoardingScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, {
      art: [...Ferry.data.souls.map((s) => s.id), 'sprite-boat-horizontal'],
      backgrounds: ['bg-starting-shore'],
      audio: ['sfx-board', 'sfx-unboard'],
    });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'})`);
    this.tokens = new Map();
    this.entries = new Map();
    this.chipBoxes = new Map();
    this.seatCells = [];
    this.flameMarks = [];
    this.tollMode = false;
    this.leaving = false;
    this.ready = false;
    this.heroShown = false;
    this.lean = 0;
    this.backdropScale = undefined;
    this.wakeClock = 0;
    this.boatMotion = { shift: tune('boarding.introBoat'), dip: { value: 0, velocity: 0 }, roll: { value: 0, velocity: 0 }, pivot: { x: 0, y: 0 }, angle: 0, offset: { x: 0, y: 0 } };

    this.drawStage();
    this.cameras.main.fadeIn(tune('boarding.introMs'), 2, 6, 7);
    this.tweens.add({ targets: this.boatMotion, shift: 0, duration: tune('boarding.introMs') * 1.5, ease: 'Cubic.Out' });

    const run = (this.run = {}); // a scene restarted while the fonts load must not build twice
    this.onState = (s) => {
      if (!this.ready) { if (this.router.willLeave(this.scene.key)) this.router.exitDone(); return; }
      if (this.router.willLeave(this.scene.key)) this.startExit(s);
      else this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    const stopTuning = onTune((key) => { if (key.startsWith('boarding.')) this.applyTuning(); });
    this.events.once('shutdown', () => {
      this.run = null;
      this.boat = null; // update() can fire once more, after the rope has gone
      stopTuning();
      this.game.events.off('ferry-state', this.onState);
    });

    whenFontsReady().then(() => {
      if (this.run !== run) return;
      this.drawHud();
      this.drawPanel();
      this.drawHeroBox();
      this.tip = new HoverTip(this, DEPTH.hero + 1);
      this.tip.title.setFontFamily(BODY_FONT).setFontSize(20).setColor(CSS.gold);
      this.tip.body.setFontFamily(BODY_FONT).setFontSize(17).setColor(CSS.bone);
      this.tip.bg.setFillStyle(COLOR.panel, 0.96).setStrokeStyle(1, COLOR.gold, 0.25);
      this.ready = true;
      this.render(this.registry.get('state'));
      this.slideUiIn();
    });
  }

  /** The night scene: everything here has no text, so it can show before the fonts arrive. */
  drawStage() {
    const { width, height } = this.scale;
    makeTextures(this);
    this.add.rectangle(width / 2, height / 2, width, height, COLOR.deep).setDepth(DEPTH.sky);
    this.backdrop = addBackdrop(this, 'bg-starting-shore', 0);
    this.veil = this.add.rectangle(width / 2, height / 2, width, height, COLOR.veil).setDepth(DEPTH.veil);
    this.floorFade = this.add.image(width / 2, 0, 'board-fade').setOrigin(0.5, 0).setDepth(DEPTH.floor).setDisplaySize(width, 170);
    this.floorFill = this.add.rectangle(width / 2, 0, width, height, COLOR.deep).setOrigin(0.5, 0).setDepth(DEPTH.floor);
    this.vignette = this.add.image(width / 2, height / 2, 'board-vignette').setDepth(DEPTH.vignette);
    this.fx = new Atmosphere(this);

    if (this.textures.exists('sprite-boat-horizontal')) {
      this.boat = this.add.image(0, 0, 'sprite-boat-horizontal').setDepth(DEPTH.boat);
      this.reflection = this.addReflection();
    } else {
      this.boat = this.add.rectangle(0, 0, 1320, 300, 0x2a2118).setDepth(DEPTH.boat);
    }
    this.lantern = this.add.image(0, 0, 'board-soft').setTint(COLOR.lantern).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.lantern);
    this.lanternPool = this.add.image(0, 0, 'board-soft').setScale(1.1, 0.26).setTint(COLOR.lantern).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.reflection);
    this.placeStage();
  }

  /** The boat upside down on the water, as a rope, so the water can bend it. Faded to nothing away from the hull. */
  addReflection() {
    const { keelY, fadeY } = BOAT_ART;
    const points = [];
    const alphas = [];
    for (let i = 0; i < REFLECTION_POINTS; i++) {
      const artY = (BOAT_ART.h * i) / (REFLECTION_POINTS - 1);
      points.push(new Phaser.Math.Vector2(0, keelY - artY));
      const strength = Phaser.Math.Clamp((artY - fadeY) / (keelY - fadeY), 0, 1);
      alphas.push(artY < keelY ? tune('boarding.reflectionAlpha') * strength ** 2 : 0);
    }
    const colors = points.map(() => COLOR.reflection);
    return this.add.rope(0, 0, 'sprite-boat-horizontal', undefined, points, false, colors, alphas).setDepth(DEPTH.reflection);
  }

  /** Puts everything that follows a tuning value in place. The boat's own motion is in updateBoat. */
  placeStage() {
    const { width, height } = this.scale;
    const shift = tune('boarding.backdropShift');
    if (this.backdrop) {
      if (this.backdropScale === undefined) this.backdropScale = this.backdrop.scaleX;
      this.backdrop.setScale(this.backdropScale * (1 + (2 * tune('boarding.parallaxPx')) / width));
      this.backdrop.setY(height / 2 - shift);
      this.floorFade.setY(height - shift - 170);
      this.floorFill.setY(height - shift);
    } else {
      this.floorFade.setVisible(false);
      this.floorFill.setVisible(false);
    }
    this.veil.setAlpha(tune('boarding.veil'));
    this.vignette.setAlpha(tune('boarding.vignette'));
    this.boat.setScale(tune('boarding.boatScale'));
    this.reflection?.setScale(tune('boarding.boatScale'), tune('boarding.boatScale') * REFLECTION_SQUASH);
    this.fx.applyTuning();
  }

  applyTuning() {
    if (this.leaving) return;
    this.placeStage();
    if (!this.ready) return;
    this.panel.setY(tune('boarding.panelY'));
    this.render(this.registry.get('state'));
  }

  update(time, delta) {
    if (!this.boat) return;
    const seconds = time / 1000;
    const dt = delta / 1000;
    const pointer = this.input.activePointer;
    const target = this.ready ? (pointer.x / this.scale.width - 0.5) * 2 * tune('boarding.parallaxPx') : 0;
    this.lean += (target - this.lean) * Math.min(1, dt * 2.5); // eased, so the view drifts instead of tracking the mouse
    if (this.backdrop) this.backdrop.x = this.scale.width / 2 - this.lean;
    this.fx.update(seconds, dt, this.lean);
    this.updateBoat(seconds, dt);
    this.updateSouls(seconds, delta);
    this.updateFlames(seconds);
    this.updateWake(delta);
  }

  updateBoat(seconds, dt) {
    const motion = this.boatMotion;
    const stiffness = tune('boarding.dipStiffness');
    const damping = tune('boarding.dipDamping');
    motion.dip = springStep(motion.dip, dt, stiffness, damping);
    motion.roll = springStep(motion.roll, dt, stiffness, damping);
    const sway = boatSway(seconds, tune('boarding.heavePx'), Phaser.Math.DegToRad(tune('boarding.rollDeg')));
    const scale = tune('boarding.boatScale');
    const x = tune('boarding.deckX');
    const y = tune('boarding.deckY') - (BOAT_ART.floorY - BOAT_ART.centreY) * scale;
    motion.pivot = { x, y };
    motion.angle = sway.angle + motion.roll.value;
    motion.offset = { x: motion.shift, y: sway.y + motion.dip.value };
    this.boat.setPosition(x + motion.offset.x, y + motion.offset.y).setRotation(motion.angle);

    const home = { x: x + (BOAT_ART.lanternX - BOAT_ART.centreX) * scale, y: y + (BOAT_ART.lanternY - BOAT_ART.centreY) * scale };
    const light = ridePoint(home, motion.pivot, motion.angle, motion.offset);
    const flicker = 1 - tune('boarding.lanternFlicker') * (0.5 + 0.3 * Math.sin(seconds * 7.3) + 0.2 * Math.sin(seconds * 13.1 + 2));
    this.lantern.setPosition(light.x, light.y).setScale(LANTERN_SCALE * (0.96 + 0.1 * flicker)).setAlpha(tune('boarding.lanternGlow') * flicker);
    const waterY = y + (BOAT_ART.keelY - BOAT_ART.centreY) * scale;
    this.lanternPool.setPosition(light.x + 6, waterY + 8).setAlpha(tune('boarding.lanternGlow') * 0.55 * flicker);

    if (!this.reflection) return;
    const wobble = tune('boarding.reflectionWobble') / scale;
    this.reflection.setPosition(x + motion.offset.x, waterY - motion.offset.y * 0.4).setRotation(-motion.angle);
    this.reflection.points.forEach((point, i) => {
      const depth = 1 - i / (REFLECTION_POINTS - 1);
      point.x = wobble * depth * Math.sin(seconds * 1.7 + i * 0.75);
    });
    this.reflection.updateVertices();
  }

  /** Tails, trails and carrying the seated souls along with the boat. */
  updateSouls(seconds, delta) {
    const { pivot, angle, offset } = this.boatMotion;
    const tailPx = tune('boarding.tailPx');
    const tailSpeed = tune('boarding.tailSpeed');
    const rise = tune('boarding.appearRise');
    for (const token of this.tokens.values()) {
      const { ride } = token.parts;
      const carried = ridePoint({ x: token.x, y: token.y }, pivot, angle, offset);
      const amount = token.riding.amount;
      ride.setPosition((carried.x - token.x) * amount, (carried.y - token.y) * amount + token.appear.left * rise);
      ride.setRotation(angle * amount);
      swayTail(token, seconds, tailPx, tailSpeed * (token.walking ? 2 : 1));
      if (!token.walking) continue;
      token.puff = (token.puff ?? 0) + delta;
      if (token.puff < 45) continue;
      token.puff = 0;
      this.fx.trail(token.x, token.y - 50);
    }
  }

  updateFlames(seconds) {
    this.flameMarks.forEach((flame, i) => {
      if (!flame.lit) return;
      const beat = seconds * (5.1 + i * 0.7) + i * 1.9;
      flame.mark.setScale(1 + 0.05 * Math.sin(beat * 1.3), 1 + 0.08 * Math.sin(beat) + 0.04 * Math.sin(beat * 2.7));
    });
  }

  /** The boat leaves rings behind it while it moves. */
  updateWake(delta) {
    if (!this.leaving) return;
    this.wakeClock += delta;
    if (this.wakeClock < 230) return;
    this.wakeClock = 0;
    const scale = tune('boarding.boatScale');
    const { pivot, offset } = this.boatMotion;
    this.fx.ripple(pivot.x + offset.x - 300 * scale * 1.2, pivot.y + (BOAT_ART.keelY - BOAT_ART.centreY) * scale + 6, 1.5);
  }

  /** A soul stepping on or off rocks the boat towards its side. */
  kickBoat(x, weight) {
    const motion = this.boatMotion;
    const side = Phaser.Math.Clamp((x - tune('boarding.deckX')) / 200, -1, 1);
    motion.dip.velocity += tune('boarding.dipPx') * weight;
    motion.roll.velocity += side * 0.08 * Math.abs(weight);
  }

  drawHud() {
    const plate = this.add.graphics();
    this.drawPlate(plate, 24, 20, 300, 80);
    this.flameHolder = this.add.container(0, 0);
    this.cycle = this.add.text(304, 44, '', bodyText(20, CSS.gold)).setOrigin(1, 0.5); // Cinzel's 1 reads as a Roman I
    this.nextLong = this.add.text(42, 76, '', bodyText(17, CSS.muted)).setOrigin(0, 0.5);
    this.hud = this.add.container(0, 0, [plate, this.flameHolder, this.cycle, this.nextLong]).setDepth(DEPTH.ui);
  }

  drawPlate(graphics, x, y, w, h) {
    graphics.fillStyle(COLOR.panel, 0.94).fillRoundedRect(x, y, w, h, PANEL.r);
    graphics.lineStyle(1, COLOR.gold, 0.25).strokeRoundedRect(x, y, w, h, PANEL.r);
  }

  drawFlames(lit) {
    while (this.flameMarks.length < lit.length) {
      const i = this.flameMarks.length;
      const mark = this.add.graphics().setPosition(52 + i * 26, 56);
      this.flameHolder.add(mark);
      this.flameMarks.push({ mark, lit: null });
    }
    lit.forEach((on, i) => {
      const flame = this.flameMarks[i];
      if (flame.lit === on) return;
      flame.lit = on;
      flame.mark.clear().setScale(1);
      if (on) {
        flame.mark.fillStyle(COLOR.gold, 1).fillPoints(flameShape(10, 13), true);
        flame.mark.fillStyle(0xf5efdf, 0.9).fillPoints(flameShape(5, 7), true);
      } else {
        flame.mark.lineStyle(1, COLOR.unlit, 1).strokePoints(flameShape(10, 13), true);
      }
    });
  }

  drawPanel() {
    const { w, h, left } = PANEL;
    const back = this.add.graphics();
    this.drawPlate(back, -w / 2, 0, w, h);
    const heading = this.add.text(left, 24, t('boarding.heading'), headText(21)).setOrigin(0, 0.5);
    this.seatsLine = this.add.text(176, 24, '', bodyText(19)).setOrigin(1, 0.5);
    const aboard = this.add.text(left, 60, t('boarding.aboard'), bodyText(18, CSS.muted)).setOrigin(0, 0.5);
    this.message = this.add.text(left, 102, '', bodyText(18, CSS.danger, { wordWrap: { width: 290 }, lineSpacing: -2 })).setOrigin(0, 0.5);
    this.undoBtn = this.button(0, 102, 96, 36, t('boarding.undo'), false, () => this.undo());
    this.clearBtn = this.button(128, 102, 136, 36, t('boarding.clearBoat'), false, () => this.clearBoat());
    this.castBtn = this.button(282, 102, 148, 36, t('boarding.castOff'), true, () => this.act({ type: 'DEPART' }));
    const note = t('boarding.shoreNote', { limit: Ferry.data.config.shoreAngerLimit });
    const noteText = this.add.text(0, 143, note, bodyText(16, CSS.muted)).setOrigin(0.5);
    this.panel = this.add.container(this.scale.width / 2, tune('boarding.panelY'), [
      back, heading, this.seatsLine, aboard, this.message, this.undoBtn, this.clearBtn, this.castBtn, noteText,
    ]).setDepth(DEPTH.ui);
  }

  drawHeroBox() {
    const w = 480;
    const h = 136;
    const back = this.add.graphics();
    this.drawPlate(back, -w / 2, -h / 2, w, h);
    this.heroTitle = this.add.text(0, -46, '', headText(19, CSS.gold, { align: 'center', wordWrap: { width: w - 40 } })).setOrigin(0.5);
    this.heroLine = this.add.text(0, -10, '', bodyText(17, CSS.bone, { align: 'center', wordWrap: { width: w - 40 } })).setOrigin(0.5);
    this.acceptBtn = this.button(-70, 42, 120, 34, t('boarding.accept'), true, () => this.acceptHero());
    this.declineBtn = this.button(70, 42, 120, 34, t('boarding.decline'), false, () => this.act({ type: 'DECLINE_HERO' }));
    this.cancelBtn = this.button(0, 42, 120, 34, t('common.cancel'), false, () => this.setTollMode(false));
    const hover = this.add.zone(0, -24, w, 84).setInteractive();
    // Hovering the offer tells what the hero does, as hovering a soul does.
    hover.on('pointerover', (pointer) => {
      const hero = heroPrompt(this.registry.get('state'), Ferry);
      if (hero && !this.tollMode) this.showTip(pointer, soulTitle(hero.type, Ferry), typeDetail(hero.type, Ferry, t));
    });
    hover.on('pointerout', () => this.tip.hide());
    this.heroBox = this.add.container(640, 170, [
      back, hover, this.heroTitle, this.heroLine, this.acceptBtn, this.declineBtn, this.cancelBtn,
    ]).setDepth(DEPTH.hero).setVisible(false).setAlpha(0);
  }

  /** The panels arrive after the scene has started to show. */
  slideUiIn() {
    const duration = tune('boarding.uiMs');
    const delay = tune('boarding.introMs') * 0.45;
    const panelY = tune('boarding.panelY');
    this.panel.setAlpha(0).setY(panelY + 44);
    this.hud.setAlpha(0).setY(-22);
    this.tweens.add({ targets: this.panel, y: panelY, alpha: 1, duration, delay, ease: 'Cubic.Out' });
    this.tweens.add({ targets: this.hud, y: 0, alpha: 1, duration, delay: delay + 120, ease: 'Cubic.Out' });
  }

  /** A pill button. Gold for the main action, with a slow breath of light; dark with a thin gold outline otherwise. */
  button(x, y, w, h, label, gold, onPress) {
    const face = this.add.graphics();
    const paint = (hover) => {
      face.clear();
      face.fillStyle(gold ? (hover ? COLOR.goldHi : COLOR.gold) : (hover ? COLOR.panelHi : COLOR.panel), 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      if (!gold) face.lineStyle(1, COLOR.gold, hover ? 0.9 : 0.6).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    };
    const text = this.add.text(0, 0, label, headText(15, gold ? CSS.ink : CSS.gold, { fontStyle: 'bold' })).setOrigin(0.5);
    const parts = [face, text];
    let aura = null;
    if (gold) {
      aura = this.add.image(0, 0, 'board-soft').setDisplaySize(w * 1.7, h * 3).setTint(COLOR.gold).setAlpha(0);
      parts.unshift(aura);
      this.tweens.add({ targets: aura, alpha: 0.42, duration: 1500, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
    }
    const btn = this.add.container(x, y, parts);
    btn.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    const scaleTo = (scale, duration = 140) => {
      this.tweens.killTweensOf(btn);
      this.tweens.add({ targets: btn, scale, duration, ease: 'Sine.Out' });
    };
    btn.enabled = true;
    btn.styled = false;
    btn.on('pointerover', () => { if (btn.enabled) { paint(true); scaleTo(1.03); } });
    btn.on('pointerout', () => { paint(false); scaleTo(1); });
    btn.on('pointerdown', () => {
      if (!btn.enabled) return;
      this.tweens.killTweensOf(btn);
      this.tweens.add({ targets: btn, scale: 0.96, duration: 70, ease: 'Sine.Out', yoyo: true });
      onPress();
    });
    btn.setEnabled = (on) => {
      if (btn.styled && btn.enabled === on) return;
      const first = !btn.styled;
      btn.styled = true;
      btn.enabled = on;
      btn.input.cursor = on ? 'pointer' : 'default';
      aura?.setVisible(on);
      if (!on) paint(false);
      if (first) btn.setAlpha(on ? 1 : 0.45);
      else this.tweens.add({ targets: btn, alpha: on ? 1 : 0.45, duration: 200, ease: 'Sine.Out' });
    };
    paint(false);
    return btn;
  }

  /** Applies an action. A rejected one changes nothing: the engine's reason shows and the soul refuses. */
  act(action) {
    const state = this.registry.get('state');
    try {
      Ferry.transition(state, action);
    } catch (err) {
      this.say(err.message);
      this.refuse(action.id ?? action.target);
      return false;
    }
    this.tollMode = false;
    this.say('');
    // Outside the try: dispatch emits ferry-state, and a render bug must not look like a rule error.
    this.router.dispatch(action);
    return true;
  }

  /** BOARD toggles, so the same action boards a shore soul and sends a selected one back. */
  board(id) {
    const leaving = this.registry.get('state').selected.includes(id);
    if (this.act({ type: 'BOARD', id })) playSound(this, leaving ? 'sfx-unboard' : 'sfx-board');
  }

  undo() {
    const id = lastBoarded(this.registry.get('state'));
    if (id) this.board(id);
  }

  clearBoat() {
    const actions = clearActions(this.registry.get('state'));
    if (actions.length) playSound(this, 'sfx-unboard');
    for (const action of actions) this.act(action);
  }

  onSoulClick(id) {
    const entry = this.entries.get(id);
    if (!entry || entry.locked) return;
    // The soul walks out from under the pointer, and pointerout only fires when the pointer next moves.
    this.tip.hide();
    this.setHover(this.tokens.get(id), false);
    if (this.tollMode) this.act({ type: 'ACCEPT_HERO', target: id }); // the engine also takes a selected soul as the toll
    else this.board(id);
  }

  say(text) {
    const { message } = this;
    this.messageTimer?.remove();
    this.tweens.killTweensOf(message);
    if (!text) {
      if (message.text) this.tweens.add({ targets: message, alpha: 0, duration: 180, ease: 'Sine.Out', onComplete: () => message.setText('') });
      return;
    }
    message.setText(text).setAlpha(0).setX(PANEL.left - 8);
    this.tweens.add({ targets: message, alpha: 1, x: PANEL.left, duration: 200, ease: 'Sine.Out' });
    this.messageTimer = this.time.delayedCall(tune('boarding.messageMs'), () => this.say(''));
  }

  showTip(pointer, title, lines) {
    const fresh = !this.tip.root.visible;
    this.tip.show(pointer, title, lines);
    if (!fresh) return;
    this.tip.root.setAlpha(0);
    this.tweens.add({ targets: this.tip.root, alpha: 1, duration: 140, ease: 'Sine.Out' });
  }

  /** A short shake on the figure only, so it never fights a walk. */
  refuse(id) {
    const token = this.tokens.get(id);
    if (!token) return;
    const { figure } = token.parts;
    token.shake?.remove();
    figure.x = 0;
    token.shake = this.tweens.add({
      targets: figure,
      x: { from: -tune('boarding.shakePx'), to: tune('boarding.shakePx') },
      duration: tune('boarding.shakeMs'),
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => { figure.x = 0; },
    });
  }

  syncHero(state) {
    const hero = heroPrompt(state, Ferry);
    if (!hero) this.tollMode = false;
    if (hero) {
      this.heroTitle.setText(this.tollMode ? t('boarding.chooseToll') : t('boarding.heroAsks', { name: hero.name }));
      this.heroLine.setText(this.tollMode ? t('boarding.tollPrompt') : t(hero.needsToll ? 'boarding.heroHeracles' : 'boarding.heroOdysseus'));
      this.acceptBtn.setVisible(!this.tollMode);
      this.declineBtn.setVisible(!this.tollMode);
      this.cancelBtn.setVisible(this.tollMode);
    }
    if (!!hero === this.heroShown) return;
    this.heroShown = !!hero;
    const { heroBox } = this;
    this.tweens.killTweensOf(heroBox);
    const duration = tune('boarding.uiMs');
    if (hero) {
      heroBox.setVisible(true).setScale(0.97);
      this.tweens.add({ targets: heroBox, alpha: 1, scale: 1, duration, delay: tune('boarding.introMs') * 0.6, ease: 'Cubic.Out' });
    } else {
      this.tweens.add({ targets: heroBox, alpha: 0, scale: 0.97, duration: duration / 2, ease: 'Sine.In', onComplete: () => heroBox.setVisible(false) });
    }
  }

  setTollMode(on) {
    this.tollMode = on;
    this.render(this.registry.get('state'));
  }

  acceptHero() {
    const hero = heroPrompt(this.registry.get('state'), Ferry);
    if (hero?.needsToll) this.setTollMode(true);
    else this.act({ type: 'ACCEPT_HERO' });
  }

  /** The boat pulls away with its passengers. Heracles' toll can end the run, which has no boat to sail. */
  startExit(state) {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    this.tip.hide();
    if (state.phase !== 'window') {
      this.router.exitDone();
      return;
    }
    // Seated souls ride the boat: they are carried by boatMotion, so a soul still walking is set down in its seat.
    for (const entry of this.entries.values()) {
      if (entry.area !== 'seat') continue;
      const token = this.tokens.get(entry.id);
      token.walkTween?.remove();
      token.walking = false;
      token.setPosition(entry.x, entry.y).setDepth(DEPTH.seated);
      this.tweens.killTweensOf(token.riding);
      token.riding.amount = 1;
    }
    const duration = tune('boarding.exitMs');
    const ui = tune('boarding.uiMs');
    this.tweens.add({ targets: this.panel, y: this.panel.y + 44, alpha: 0, duration: ui, ease: 'Sine.In' });
    this.tweens.add({ targets: this.hud, y: -22, alpha: 0, duration: ui, ease: 'Sine.In' });
    if (this.heroShown) this.tweens.add({ targets: this.heroBox, alpha: 0, duration: ui, ease: 'Sine.In' });
    this.kickBoat(tune('boarding.deckX'), 0.5);
    this.tweens.add({
      targets: this.boatMotion,
      shift: tune('boarding.exitDistance'),
      duration,
      ease: tune('boarding.exitEase'),
      onComplete: () => this.router.exitDone(),
    });
    this.time.delayedCall(duration * 0.68, () => this.cameras.main.fadeOut(duration * 0.32, 2, 6, 7));
  }

  /** Brings the screen in line with the state. Tokens are keyed by actor id, so they travel rather than jump. */
  render(state) {
    const { entries } = layoutStage(state, Ferry, stageView());
    const first = this.entries.size === 0;
    this.entries = new Map(entries.map((e) => [e.id, e]));
    for (const [id, token] of this.tokens) {
      if (this.entries.has(id)) continue;
      this.tokens.delete(id);
      this.dissolve(token);
    }
    entries.forEach((entry, i) => {
      const delay = first ? tune('boarding.introMs') * 0.3 + i * tune('boarding.introStagger') : 0;
      this.updateToken(this.tokens.get(entry.id) ?? this.addToken(entry, delay), entry);
    });
    this.renderHud(state);
    this.renderPanel(state);
    this.syncHero(state);
    const buttons = panelButtons(state, this.tollMode);
    this.undoBtn.setEnabled(buttons.undo);
    this.clearBtn.setEnabled(buttons.clear);
    this.castBtn.setEnabled(buttons.castOff);
  }

  renderHud(state) {
    this.drawFlames(flames(state, Ferry));
    this.cycle.setText(t('boarding.cycleLine', { cycle: state.cycle }));
    const long = nextLongName(state, Ferry);
    this.nextLong.setText(long ? t('boarding.nextLong', { name: long }) : '');
  }

  renderPanel(state) {
    const bar = seatBar(state, Ferry);
    this.seatsLine.setText(t('boarding.seatsLine', { used: bar.used, capacity: bar.capacity }));
    this.renderSeats(bar.boxes);
    this.renderChips(aboardChips(state, Ferry, PANEL.chipX, PANEL.chipStep));
  }

  /** The gold in a seat box slides in and out rather than switching. */
  renderSeats(boxes) {
    const { seatX, seatStep, seatW: w, seatH: h } = PANEL;
    while (this.seatCells.length < boxes.length) {
      const x = seatX + this.seatCells.length * seatStep;
      const frame = this.add.graphics();
      const fill = this.add.graphics().setPosition(x, 17).setScale(0, 1);
      fill.fillStyle(COLOR.gold, 1).fillRoundedRect(0, 0, w, h, 3);
      this.panel.add([fill, frame]);
      this.seatCells.push({ frame, fill, x, on: false });
    }
    this.seatCells.forEach((cell, i) => {
      const on = boxes[i] ?? false;
      cell.fill.setVisible(i < boxes.length);
      cell.frame.clear();
      if (i < boxes.length) cell.frame.lineStyle(1, COLOR.gold, on ? 1 : 0.45).strokeRoundedRect(cell.x, 17, w, h, 3);
      if (cell.on === on) return;
      cell.on = on;
      this.tweens.killTweensOf(cell.fill);
      this.tweens.add({ targets: cell.fill, scaleX: on ? 1 : 0, duration: 240, ease: 'Sine.InOut' });
    });
  }

  renderChips(chips) {
    for (const [id, box] of this.chipBoxes) {
      if (chips.some((chip) => chip.id === id)) continue;
      this.chipBoxes.delete(id);
      box.disableInteractive();
      this.tweens.killTweensOf(box);
      this.tweens.add({ targets: box, alpha: 0, y: 66, duration: 180, ease: 'Sine.In', onComplete: () => box.destroy() });
    }
    for (const chip of chips) {
      let box = this.chipBoxes.get(chip.id);
      if (!box) {
        box = this.addChip(chip).setAlpha(0).setY(54);
        this.chipBoxes.set(chip.id, box);
        this.panel.add(box);
      }
      this.tweens.killTweensOf(box);
      this.tweens.add({ targets: box, x: chip.x, y: 60, alpha: 1, duration: 240, ease: 'Sine.Out' });
    }
  }

  addChip(chip) {
    const { chipW: w, chipH: h } = PANEL;
    const face = this.add.graphics();
    face.fillStyle(COLOR.panelHi, 1).fillRoundedRect(0, -h / 2, w, h, 6);
    face.lineStyle(1, COLOR.gold, 0.45).strokeRoundedRect(0, -h / 2, w, h, 6);
    const text = this.add.text(w / 2, 0, t('boarding.chip', { name: chip.name }), bodyText(16)).setOrigin(0.5);
    const box = this.add.container(chip.x, 60, [face, text]);
    box.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, -h / 2, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    box.on('pointerdown', () => this.board(chip.id));
    return box;
  }

  addToken(entry, delay) {
    const token = addBoardingSoul(this, entry, STAGE.soulHeight);
    token.on('pointerover', (pointer) => {
      const current = this.entries.get(entry.id);
      if (!current) return;
      if (!current.locked) this.setHover(token, true);
      this.showTip(pointer, soulTitle(current.actor.type, Ferry), [...soulFacts(current.actor, Ferry, t), ...typeDetail(current.actor.type, Ferry, t)]);
    });
    token.on('pointerout', () => {
      this.setHover(token, false);
      this.tip.hide();
    });
    token.on('pointerdown', () => this.onSoulClick(entry.id));
    token.once('destroy', () => this.tip?.hide());
    this.tweens.add({
      targets: token.parts.figure,
      y: -tune('boarding.bobPx'),
      duration: tune('boarding.bobMs'),
      delay: Math.random() * 1200, // so a row of souls does not breathe in step
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });
    token.goal = { x: entry.x, y: entry.y };
    token.riding = { amount: entry.area === 'seat' ? 1 : 0 };
    token.seated = entry.area === 'seat';
    token.appear = { left: 1 };
    token.parts.ride.setAlpha(0);
    this.tweens.add({
      targets: token.appear,
      left: 0,
      duration: tune('boarding.appearMs'),
      delay,
      ease: 'Sine.Out',
      onUpdate: () => token.parts.ride.setAlpha(1 - token.appear.left),
    });
    this.tokens.set(entry.id, token);
    return token;
  }

  /** A soul taken as the toll fades into the mist instead of vanishing. */
  dissolve(token) {
    token.disableInteractive();
    token.walkTween?.remove();
    const { ride } = token.parts;
    this.fx.trail(token.x, token.y - 90, 14);
    this.tweens.add({ targets: ride, alpha: 0, y: ride.y - 26, duration: tune('boarding.appearMs'), ease: 'Sine.In', onComplete: () => token.destroy() });
  }

  setHover(token, on) {
    if (!token) return;
    this.fade(token.parts.glow, on ? tune('boarding.hoverGlow') : 0);
    token.hoverTween?.remove();
    token.hoverTween = this.tweens.add({ targets: token.parts.figure, scale: on ? tune('boarding.hoverScale') : 1, duration: tune('boarding.glowMs'), ease: 'Sine.Out' });
  }

  fade(target, alpha) {
    if (!target) return;
    this.tweens.killTweensOf(target);
    this.tweens.add({ targets: target, alpha, duration: tune('boarding.glowMs'), ease: 'Sine.Out' });
  }

  updateToken(token, entry) {
    const seated = entry.area === 'seat';
    const badge = soulBadge(entry, Ferry);
    setBoardingBadge(token, badge);
    this.syncPulse(token, badge.pips?.danger ?? false);
    token.parts.body.setAlpha(entry.locked ? tune('boarding.lockedAlpha') : 1);
    token.input.cursor = entry.locked ? 'default' : 'pointer';
    this.fade(token.parts.rim, entry.selected ? tune('boarding.rimAlpha') : 0);
    this.fade(token.parts.shadow, seated ? 0 : tune('boarding.shadowAlpha'));
    const height = tune(seated ? 'boarding.seatHeight' : 'boarding.soulHeight');
    token.input.hitArea.setTo(-36, -height, 72, height);
    this.pose(token, height, entry.selected ? tune('boarding.selectLift') : 0);
    this.walkTo(token, entry.x, entry.y, seated);
    if (!token.walking) token.setDepth(seated ? DEPTH.seated : DEPTH.shore); // seated souls sit behind the hull, which hides their tails
  }

  /** Red pips pulse only while one more return would make a Wraith. */
  syncPulse(token, danger) {
    const { pips } = token.parts;
    if (danger && !token.pulse) {
      token.pulse = this.tweens.add({ targets: pips, alpha: 0.35, duration: tune('boarding.pulseMs'), ease: 'Sine.InOut', yoyo: true, repeat: -1 });
    } else if (!danger && token.pulse) {
      token.pulse.remove();
      token.pulse = null;
      pips.setAlpha(1);
    }
  }

  /** Size and lift change with the walk. Same pose, nothing to do. */
  pose(token, height, lift) {
    const key = `${height}/${lift}`;
    if (token.poseKey === key) return;
    const first = token.poseKey === undefined;
    token.poseKey = key;
    const { body, labels } = token.parts;
    this.tweens.killTweensOf([body, labels]);
    const scale = height / STAGE.soulHeight;
    if (first) {
      body.setScale(scale).setY(-lift);
      labels.setY(-height - 2);
      return;
    }
    const motion = { duration: tune('boarding.walkMs'), ease: tune('boarding.walkEase') };
    this.tweens.add({ targets: body, y: -lift, scaleX: scale, scaleY: scale, ...motion });
    this.tweens.add({ targets: labels, y: -height - 2, ...motion });
  }

  /**
   * Sends a soul to its spot from wherever it is now, in an arc over the gunwale. A new target replaces any walk under way,
   * and a walk to the same target is left to finish, so a soul can never stop between the shore and the boat.
   */
  walkTo(token, x, y, seated) {
    if (token.goal.x === x && token.goal.y === y) return;
    const staysAboard = token.seated && seated;
    const crossing = token.seated !== seated; // only the step between shore and boat needs the arc
    const boarding = !token.seated && seated;
    const leaving = token.seated && !seated;
    token.goal = { x, y };
    token.seated = seated;
    token.walkTween?.remove();
    const start = { x: token.x, y: token.y };
    const end = { x, y };
    const arc = crossing ? tune('boarding.arcPx') : 0;
    const duration = tune('boarding.walkMs');
    const ease = tune('boarding.walkEase');
    if (leaving) this.kickBoat(start.x, -0.45);
    if (!staysAboard) token.setDepth(DEPTH.shore); // over the gunwale, not through it
    token.walking = true;
    this.tweens.killTweensOf(token.riding);
    this.tweens.add({ targets: token.riding, amount: seated ? 1 : 0, duration, ease });
    this.leanInto(token, Math.sign(x - start.x) * (crossing ? 1 : 0.4), duration);
    const progress = { p: 0 };
    token.walkTween = this.tweens.add({
      targets: progress,
      p: 1,
      duration,
      ease,
      onUpdate: () => {
        const at = arcPoint(start, end, progress.p, arc);
        token.setPosition(at.x, at.y);
        if (seated && progress.p > 0.72) token.setDepth(DEPTH.seated); // past the gunwale: settle behind the hull
      },
      onComplete: () => {
        token.walking = false;
        token.setPosition(x, y);
        if (!boarding) return;
        this.kickBoat(x, 1);
        const { pivot } = this.boatMotion;
        this.fx.ripple(x, pivot.y + (BOAT_ART.keelY - BOAT_ART.centreY) * tune('boarding.boatScale') + 4);
      },
    });
  }

  leanInto(token, direction, duration) {
    const { figure } = token.parts;
    token.leanTween?.remove();
    token.leanTween = this.tweens.add({
      targets: figure,
      rotation: Phaser.Math.DegToRad(tune('boarding.leanDeg')) * direction,
      duration: duration / 2,
      ease: 'Sine.InOut',
      yoyo: true,
    });
  }
}
