import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { BODY_FONT, HEAD_FONT, whenFontsReady } from '../fonts.js';
import { addBackdrop, playSound, queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { defineTuning, onTune, tune } from '../tuning.js';
import { soulTitle, typeDetail } from './crossing-layout.js';
import { HoverTip } from './hover-tip.js';
import {
  STAGE, aboardChips, clearActions, flames, heroPrompt, lastBoarded, layoutStage, nextLongName, panelButtons,
  seatBar, soulBadge, soulFacts,
} from './boarding-layout.js';
import { addBoardingSoul, setBoardingBadge } from './soul-token.js';

defineTuning({
  'boarding.walkMs': { type: 'number', default: 550, min: 100, max: 1500, step: 10, help: 'Soul walks between shore and boat' },
  'boarding.walkEase': { type: 'ease', default: 'Sine.InOut' },
  'boarding.selectLift': { type: 'number', default: 6, min: 0, max: 30, step: 1, help: 'Selected soul rises in its seat' },
  'boarding.bobPx': { type: 'number', default: 4, min: 0, max: 16, step: 1, help: 'Breathing bob height (new souls)' },
  'boarding.bobMs': { type: 'number', default: 2600, min: 500, max: 6000, step: 100, help: 'Breathing bob, one way (new souls)' },
  'boarding.shakePx': { type: 'number', default: 6, min: 0, max: 24, step: 1, help: 'Refused soul shake' },
  'boarding.shakeMs': { type: 'number', default: 60, min: 20, max: 200, step: 5, help: 'One swing of the shake' },
  'boarding.glowMs': { type: 'number', default: 220, min: 0, max: 1000, step: 10, help: 'Hover and rim fade' },
  'boarding.hoverGlow': { type: 'number', default: 0.42, min: 0, max: 1, step: 0.02 },
  'boarding.rimAlpha': { type: 'number', default: 0.85, min: 0, max: 1, step: 0.05, help: 'Gold rim on selected souls' },
  'boarding.lockedAlpha': { type: 'number', default: 0.9, min: 0.2, max: 1, step: 0.02, help: 'Dimming of locked souls' },
  'boarding.pulseMs': { type: 'number', default: 700, min: 200, max: 2000, step: 50, help: 'Red Anger pip pulse' },
  'boarding.veil': { type: 'number', default: 0.6, min: 0, max: 1, step: 0.02, help: 'Dark teal veil over the painting' },
  'boarding.vignette': { type: 'number', default: 0.85, min: 0, max: 1, step: 0.02 },
  'boarding.backdropShift': { type: 'number', default: 110, min: 0, max: 200, step: 2, help: 'Painting moved up, clear of the panel' },
  'boarding.fogSpeed': { type: 'number', default: 7, min: 0, max: 60, step: 1, help: 'Fog drift, pixels per second' },
  'boarding.fogAlpha': { type: 'number', default: 0.1, min: 0, max: 0.5, step: 0.01 },
  'boarding.lanternGlow': { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02, help: 'Warm light on the boat' },
  'boarding.boatScale': { type: 'number', default: 0.32, min: 0.15, max: 0.6, step: 0.01 },
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

const COLOR = { deep: 0x020607, panel: 0x08161b, panelHi: 0x12262c, veil: 0x06141a, gold: 0xedc47f, goldHi: 0xf7dcae, unlit: 0x5b6a6a, fog: 0xa9c0c6, lantern: 0xf0a860 };
const CSS = { bone: '#f5efdf', muted: '#b9c3bd', gold: '#edc47f', danger: '#ff9f8a', ink: '#08161b', deep: '#020607' };
const DEPTH = { fog: -2, seated: 4, boat: 5, shore: 6, ui: 8, hero: 9 };
const PANEL = { w: 760, h: 164, r: 18, chipX: -282, chipStep: 108, chipW: 100, chipH: 26 };
// The boat image is 2400 x 900: its deck is centred on the image, the floor sits near y 620 and the lantern near (621, 346).
const BOAT_ART = { centreY: 450, floorY: 620, lanternX: 621, lanternY: 346, centreX: 1200 };
const FOG = [[120, 300, 7, 1.5, 0.8], [520, 372, 9, 1.8, 1.2], [930, 330, 8, 1.4, 1], [1240, 412, 10, 2, 0.7], [320, 462, 8, 1.6, 1.1]]; // x, y, scaleX, scaleY, speed factor

const stageView = () => Object.fromEntries(Object.keys(STAGE).map((key) => [key, tune(`boarding.${key}`)]));
const bodyText = (size, color = CSS.bone, extra = {}) => ({ fontFamily: BODY_FONT, fontSize: `${size}px`, color, resolution: 2, ...extra });
const headText = (size, color = CSS.bone, extra = {}) => ({ fontFamily: HEAD_FONT, fontSize: `${size}px`, color, resolution: 2, ...extra });

function softTexture(scene, key, w, h, paint) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, w, h);
  paint(texture.getContext());
  texture.refresh();
}

function flameShape(x, y, w, h) {
  const points = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const lean = w * 0.4 * ((Math.cos(a) + 1) / 2) ** 2; // the tip curls, or it reads as a water drop
    points.push({ x: x + w * Math.sin(a) * Math.sin(a / 2) ** 2 + lean, y: y - h * Math.cos(a) });
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
    this.boatParts = [];
    this.chips = [];
    this.fogBanks = [];
    this.tollMode = false;
    this.leaving = false;
    this.ready = false;

    this.drawStage();
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
      stopTuning();
      this.game.events.off('ferry-state', this.onState);
    });

    whenFontsReady().then(() => {
      if (this.run !== run) return;
      this.drawHud();
      this.drawPanel();
      this.drawHeroBox();
      this.tip = new HoverTip(this);
      this.tip.title.setFontFamily(BODY_FONT).setFontSize(20).setColor(CSS.gold);
      this.tip.body.setFontFamily(BODY_FONT).setFontSize(17).setColor(CSS.bone);
      this.tip.bg.setFillStyle(COLOR.panel, 0.96).setStrokeStyle(1, COLOR.gold, 0.25);
      this.ready = true;
      this.render(this.registry.get('state'));
    });
  }

  /** The night scene: everything here has no text, so it can show before the fonts arrive. */
  drawStage() {
    const { width, height } = this.scale;
    softTexture(this, 'board-soft', 256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.42)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
    softTexture(this, 'board-vignette', width, height, (ctx) => {
      const g = ctx.createRadialGradient(width / 2, height * 0.42, height * 0.3, width / 2, height * 0.42, width * 0.72);
      g.addColorStop(0, 'rgba(2,6,7,0)');
      g.addColorStop(1, 'rgba(2,6,7,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    });
    softTexture(this, 'board-fade', 4, 256, (ctx) => {
      const g = ctx.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0, 'rgba(2,6,7,0)');
      g.addColorStop(1, 'rgba(2,6,7,1)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 4, 256);
    });

    this.add.rectangle(width / 2, height / 2, width, height, COLOR.deep).setDepth(-20);
    this.backdrop = addBackdrop(this, 'bg-starting-shore', 0);
    this.veil = this.add.rectangle(width / 2, height / 2, width, height, COLOR.veil).setDepth(-8);
    this.floorFade = this.add.image(width / 2, 0, 'board-fade').setOrigin(0.5, 0).setDepth(-7).setDisplaySize(width, 170);
    this.floorFill = this.add.rectangle(width / 2, 0, width, height, COLOR.deep).setOrigin(0.5, 0).setDepth(-7);
    this.vignette = this.add.image(width / 2, height / 2, 'board-vignette').setDepth(-6);
    for (const [x, y, scaleX, scaleY, speed] of FOG) {
      const bank = this.add.image(x, y, 'board-soft').setScale(scaleX, scaleY).setTint(COLOR.fog).setDepth(DEPTH.fog);
      bank.setData('speed', speed);
      this.fogBanks.push(bank);
    }

    if (this.textures.exists('sprite-boat-horizontal')) {
      this.boat = this.add.image(0, 0, 'sprite-boat-horizontal').setDepth(DEPTH.boat);
    } else {
      this.boat = this.add.rectangle(0, 0, 1320, 300, 0x2a2118).setDepth(DEPTH.boat);
    }
    this.lantern = this.add.image(0, 0, 'board-soft').setTint(COLOR.lantern).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.boat + 1);
    this.boatParts.push(this.boat, this.lantern);
    this.placeStage();
    this.tweens.add({ targets: this.lantern, scale: { from: 1.05, to: 1.2 }, duration: 2400, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
  }

  /** Puts everything that follows a tuning value in place. */
  placeStage() {
    const { width, height } = this.scale;
    const shift = tune('boarding.backdropShift');
    if (this.backdrop) {
      this.backdrop.setY(height / 2 - shift);
      this.floorFade.setY(height - shift - 170);
      this.floorFill.setY(height - shift);
    } else {
      this.floorFade.setVisible(false);
      this.floorFill.setVisible(false);
    }
    this.veil.setAlpha(tune('boarding.veil'));
    this.vignette.setAlpha(tune('boarding.vignette')).setPosition(width / 2, height / 2);
    for (const bank of this.fogBanks) bank.setAlpha(tune('boarding.fogAlpha'));
    const scale = tune('boarding.boatScale');
    const x = tune('boarding.deckX');
    const y = tune('boarding.deckY') - (BOAT_ART.floorY - BOAT_ART.centreY) * scale;
    this.boat.setScale(scale).setPosition(x, y);
    this.lantern.setPosition(x + (BOAT_ART.lanternX - BOAT_ART.centreX) * scale, y + (BOAT_ART.lanternY - BOAT_ART.centreY) * scale);
    this.lantern.setAlpha(tune('boarding.lanternGlow'));
  }

  applyTuning() {
    if (this.leaving) return;
    this.placeStage();
    if (!this.ready) return;
    this.panel.setY(tune('boarding.panelY'));
    this.render(this.registry.get('state'));
  }

  update(_time, delta) {
    const speed = tune('boarding.fogSpeed') * (delta / 1000);
    for (const bank of this.fogBanks) {
      bank.x += speed * bank.getData('speed');
      if (bank.x - bank.displayWidth / 2 > this.scale.width) bank.x = -bank.displayWidth / 2;
    }
  }

  drawHud() {
    const plate = this.add.graphics().setDepth(DEPTH.ui);
    this.drawPlate(plate, 24, 20, 300, 80);
    this.flames = this.add.graphics().setDepth(DEPTH.ui);
    this.cycle = this.add.text(304, 44, '', bodyText(20, CSS.gold)).setOrigin(1, 0.5).setDepth(DEPTH.ui); // Cinzel's 1 reads as a Roman I
    this.nextLong = this.add.text(42, 76, '', bodyText(17, CSS.muted)).setOrigin(0, 0.5).setDepth(DEPTH.ui);
  }

  drawPlate(graphics, x, y, w, h) {
    graphics.fillStyle(COLOR.panel, 0.94).fillRoundedRect(x, y, w, h, PANEL.r);
    graphics.lineStyle(1, COLOR.gold, 0.25).strokeRoundedRect(x, y, w, h, PANEL.r);
  }

  drawFlames(lit) {
    this.flames.clear();
    lit.forEach((on, i) => {
      const x = 52 + i * 26;
      if (on) {
        this.flames.fillStyle(COLOR.gold, 1).fillPoints(flameShape(x, 44, 10, 13), true);
        this.flames.fillStyle(0xf5efdf, 0.9).fillPoints(flameShape(x, 47, 5, 7), true);
      } else {
        this.flames.lineStyle(1, COLOR.unlit, 1).strokePoints(flameShape(x, 44, 10, 13), true);
      }
    });
  }

  drawPanel() {
    const { w, h } = PANEL;
    const left = -w / 2 + 24;
    const back = this.add.graphics();
    this.drawPlate(back, -w / 2, 0, w, h);
    const heading = this.add.text(left, 24, t('boarding.heading'), headText(21)).setOrigin(0, 0.5);
    this.seatsLine = this.add.text(176, 24, '', bodyText(19)).setOrigin(1, 0.5);
    this.seatBoxes = this.add.graphics();
    const aboard = this.add.text(left, 60, t('boarding.aboard'), bodyText(18, CSS.muted)).setOrigin(0, 0.5);
    this.message = this.add.text(left, 102, '', bodyText(18, CSS.danger, { wordWrap: { width: 290 }, lineSpacing: -2 })).setOrigin(0, 0.5);
    this.undoBtn = this.button(0, 102, 96, 36, t('boarding.undo'), false, () => this.undo());
    this.clearBtn = this.button(128, 102, 136, 36, t('boarding.clearBoat'), false, () => this.clearBoat());
    this.castBtn = this.button(282, 102, 148, 36, t('boarding.castOff'), true, () => this.act({ type: 'DEPART' }));
    const note = t('boarding.shoreNote', { limit: Ferry.data.config.shoreAngerLimit });
    const noteText = this.add.text(0, 143, note, bodyText(16, CSS.muted)).setOrigin(0.5);
    this.panel = this.add.container(this.scale.width / 2, tune('boarding.panelY'), [
      back, heading, this.seatsLine, this.seatBoxes, aboard, this.message, this.undoBtn, this.clearBtn, this.castBtn, noteText,
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
      if (hero && !this.tollMode) this.tip.show(pointer, soulTitle(hero.type, Ferry), typeDetail(hero.type, Ferry, t));
    });
    hover.on('pointerout', () => this.tip.hide());
    this.heroBox = this.add.container(640, 170, [
      back, hover, this.heroTitle, this.heroLine, this.acceptBtn, this.declineBtn, this.cancelBtn,
    ]).setDepth(DEPTH.hero).setVisible(false);
  }

  /** A pill button. Gold for the main action, dark with a thin gold outline otherwise. */
  button(x, y, w, h, label, gold, onPress) {
    const face = this.add.graphics();
    const paint = (hover) => {
      face.clear();
      face.fillStyle(gold ? (hover ? COLOR.goldHi : COLOR.gold) : (hover ? COLOR.panelHi : COLOR.panel), 1).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
      if (!gold) face.lineStyle(1, COLOR.gold, hover ? 0.9 : 0.6).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
    };
    const text = this.add.text(0, 0, label, headText(15, gold ? CSS.ink : CSS.gold, { fontStyle: 'bold' })).setOrigin(0.5);
    const btn = this.add.container(x, y, [face, text]);
    btn.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    btn.enabled = true;
    btn.on('pointerover', () => { if (btn.enabled) paint(true); });
    btn.on('pointerout', () => paint(false));
    btn.on('pointerdown', () => { if (btn.enabled) onPress(); });
    btn.setEnabled = (on) => {
      btn.enabled = on;
      btn.setAlpha(on ? 1 : 0.45);
      btn.input.cursor = on ? 'pointer' : 'default';
      if (!on) paint(false);
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
    this.fade(this.tokens.get(id).parts.glow, 0);
    if (this.tollMode) this.act({ type: 'ACCEPT_HERO', target: id }); // the engine also takes a selected soul as the toll
    else this.board(id);
  }

  say(text) {
    this.message.setText(text);
    this.messageTimer?.remove();
    this.messageTimer = this.time.delayedCall(tune('boarding.messageMs'), () => this.message.setText(''));
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
    this.heroBox.setVisible(!!hero);
    if (!hero) return;
    this.heroTitle.setText(this.tollMode ? t('boarding.chooseToll') : t('boarding.heroAsks', { name: hero.name }));
    this.heroLine.setText(this.tollMode ? t('boarding.tollPrompt') : t(hero.needsToll ? 'boarding.heroHeracles' : 'boarding.heroOdysseus'));
    this.acceptBtn.setVisible(!this.tollMode);
    this.declineBtn.setVisible(!this.tollMode);
    this.cancelBtn.setVisible(this.tollMode);
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

  /** The boat sails off with its passengers. Heracles' toll can end the run, which has no boat to sail. */
  startExit(state) {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    this.tip.hide();
    if (state.phase !== 'window') {
      this.router.exitDone();
      return;
    }
    const seated = [...this.entries.values()].filter((e) => e.area === 'seat');
    const tokens = seated.map((e) => this.tokens.get(e.id));
    // A soul can still be walking to its seat, and that tween would fight this one.
    this.tweens.killTweensOf(tokens);
    seated.forEach((e, i) => tokens[i].setPosition(e.x, e.y));
    this.tweens.add({
      targets: [...this.boatParts, ...tokens],
      x: `+=${tune('boarding.exitDistance')}`,
      duration: tune('boarding.exitMs'),
      ease: tune('boarding.exitEase'),
      onComplete: () => this.router.exitDone(),
    });
  }

  /** Brings the screen in line with the state. Tokens are keyed by actor id, so they walk rather than jump. */
  render(state) {
    const { entries } = layoutStage(state, Ferry, stageView());
    this.entries = new Map(entries.map((e) => [e.id, e]));
    for (const [id, token] of this.tokens) {
      if (this.entries.has(id)) continue;
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) this.updateToken(this.tokens.get(entry.id) ?? this.addToken(entry), entry);
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
    this.seatBoxes.clear();
    bar.boxes.forEach((filled, i) => {
      const x = 190 + i * 32;
      if (filled) this.seatBoxes.fillStyle(COLOR.gold, 1).fillRoundedRect(x, 17, 26, 14, 3);
      this.seatBoxes.lineStyle(1, COLOR.gold, filled ? 1 : 0.45).strokeRoundedRect(x, 17, 26, 14, 3);
    });
    for (const chip of this.chips) chip.destroy();
    this.chips = aboardChips(state, Ferry, PANEL.chipX, PANEL.chipStep).map((chip) => this.addChip(chip));
    this.panel.add(this.chips);
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

  addToken(entry) {
    const token = addBoardingSoul(this, entry, STAGE.soulHeight);
    token.on('pointerover', (pointer) => {
      const current = this.entries.get(entry.id);
      if (!current) return;
      if (!current.locked) this.fade(token.parts.glow, tune('boarding.hoverGlow'));
      this.tip.show(pointer, soulTitle(current.actor.type, Ferry), [...soulFacts(current.actor, Ferry, t), ...typeDetail(current.actor.type, Ferry, t)]);
    });
    token.on('pointerout', () => {
      this.fade(token.parts.glow, 0);
      this.tip.hide();
    });
    token.on('pointerdown', () => this.onSoulClick(entry.id));
    token.once('destroy', () => this.tip.hide());
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
    this.tokens.set(entry.id, token);
    return token;
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
    token.setDepth(seated ? DEPTH.seated : DEPTH.shore); // seated souls sit behind the hull, which hides their tails
    token.parts.body.setAlpha(entry.locked ? tune('boarding.lockedAlpha') : 1);
    token.input.cursor = entry.locked ? 'default' : 'pointer';
    this.fade(token.parts.rim, entry.selected ? tune('boarding.rimAlpha') : 0);
    const height = tune(seated ? 'boarding.seatHeight' : 'boarding.soulHeight');
    token.input.hitArea.setTo(-36, -height, 72, height);
    this.pose(token, height, entry.selected ? tune('boarding.selectLift') : 0);
    this.walkTo(token, entry.x, entry.y);
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
    this.tweens.add({ targets: body, y: -lift, scale, ...motion });
    this.tweens.add({ targets: labels, y: -height - 2, ...motion });
  }

  /**
   * Sends a soul to its spot from wherever it is now. A new target replaces any walk under way, and a walk
   * to the same target is left to finish, so a soul can never stop between the shore and the boat.
   */
  walkTo(token, x, y) {
    if (token.goal.x === x && token.goal.y === y) return;
    token.goal = { x, y };
    this.tweens.killTweensOf(token);
    this.tweens.add({ targets: token, x, y, duration: tune('boarding.walkMs'), ease: tune('boarding.walkEase') });
  }
}
