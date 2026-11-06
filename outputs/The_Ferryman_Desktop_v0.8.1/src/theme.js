// The one place for how the game looks: colours, fonts, panels, buttons, chips, pips and flames.
// Scenes use these helpers instead of their own styles, so every screen reads as one game.
import Phaser from 'phaser';
import { BODY_FONT, HEAD_FONT, whenFontsReady } from './fonts.js';
import { defineTuning, tune } from './tuning.js';

export { BODY_FONT, HEAD_FONT, whenFontsReady };

// Frames for each kind of art. The files are placeholders the artists will replace, so nothing in a scene may depend on
// a file's pixel size or padding: an image is fitted into its frame ("contain"), then these values place it. A new file
// should need only a change here, in the F2 panel. foot, floor, keel and lantern are fractions of the image's height or
// width, and fill is how much of its frame the image's content takes up.
defineTuning({
  'art.useFigures': { type: 'bool', default: false, help: 'Painted figures in place of the 2D sprites (next scene)' },
  'art.soul.fill': { type: 'number', default: 1.24, min: 0.5, max: 2, step: 0.01, help: 'Soul image against its frame height' },
  'art.soul.foot': { type: 'number', default: 0.885, min: 0.5, max: 1, step: 0.005, help: 'Where the base of a soul sits in its image' },
  'art.long.fill': { type: 'number', default: 1.24, min: 0.5, max: 2, step: 0.01, help: 'Long image against its frame height' },
  'art.long.foot': { type: 'number', default: 0.885, min: 0.5, max: 1, step: 0.005 },
  'art.hero.fill': { type: 'number', default: 1.24, min: 0.5, max: 2, step: 0.01, help: 'Hero image against its frame height' },
  'art.hero.foot': { type: 'number', default: 0.885, min: 0.5, max: 1, step: 0.005 },
  'art.pier.x': { type: 'number', default: 245, min: 0, max: 640, step: 1, help: 'Middle of the pier at a stop' },
  'art.pier.y': { type: 'number', default: 511, min: 300, max: 720, step: 1, help: 'Height of the pier at a stop' },
  'art.pier.width': { type: 'number', default: 600, min: 200, max: 1000, step: 2, help: 'Pier image width on screen' },
  'art.boat.width': { type: 'number', default: 768, min: 200, max: 1280, step: 2, help: 'Boat image width on screen' },
  'art.boat.floor': { type: 'number', default: 0.689, min: 0, max: 1, step: 0.005, help: 'Deck floor, fraction of the image height' },
  'art.boat.keel': { type: 'number', default: 0.822, min: 0, max: 1, step: 0.005, help: 'Waterline, fraction of the image height' },
  'art.boat.lanternX': { type: 'number', default: 0.259, min: 0, max: 1, step: 0.005 },
  'art.boat.lanternY': { type: 'number', default: 0.384, min: 0, max: 1, step: 0.005 },
  'art.memory.size': { type: 'number', default: 56, min: 16, max: 160, step: 1, help: 'Memory art inside a full card' },
  'art.background.veil': { type: 'number', default: 0.6, min: 0, max: 1, step: 0.02, help: 'Dark teal veil over a background' },
  'art.background.vignette': { type: 'number', default: 0.85, min: 0, max: 1, step: 0.02 },
  'ui.buttonHover': { type: 'number', default: 1.03, min: 1, max: 1.15, step: 0.01 },
  'ui.buttonPress': { type: 'number', default: 0.97, min: 0.8, max: 1, step: 0.01 },
  'ui.disabledAlpha': { type: 'number', default: 0.45, min: 0.1, max: 1, step: 0.05 },
  'ui.auraMs': { type: 'number', default: 1500, min: 200, max: 5000, step: 50, help: 'Slow light behind a gold button' },
  'ui.tipDelayMs': { type: 'number', default: 120, min: 0, max: 600, step: 10, help: 'Wait before a tooltip appears' },
  'ui.toastMs': { type: 'number', default: 2600, min: 500, max: 8000, step: 100, help: 'Status line under the HUD' },
  'ui.panelY': { type: 'number', default: 545, min: 400, max: 560, step: 1, help: 'Top of the bottom panel' },
  'ui.shadeAlpha': { type: 'number', default: 0.72, min: 0, max: 1, step: 0.02, help: 'Dimming behind a modal' },
  'ui.flashAlpha': { type: 'number', default: 0.55, min: 0, max: 1, step: 0.05, help: 'Glow at the screen edge' },
  'art.boat.deck': { type: 'number', default: 0.55, min: 0.2, max: 1, step: 0.01, help: 'Share of the boat image that is deck' },
  // One rhythm for the interface. Journeys (the boat, a soul walking) keep their own, longer lengths.
  'motion.fastMs': { type: 'number', default: 180, min: 0, max: 1000, step: 10, help: 'Small things: hover, tooltip, a line of text' },
  'motion.baseMs': { type: 'number', default: 350, min: 0, max: 1500, step: 10, help: 'Panels, overlays, cards' },
  'motion.slowMs': { type: 'number', default: 700, min: 0, max: 2500, step: 10, help: 'Scene changes' },
  'motion.enterEase': { type: 'ease', default: 'Cubic.Out', help: 'Things arriving' },
  'motion.exitEase': { type: 'ease', default: 'Cubic.In', help: 'Things leaving' },
  'motion.moveEase': { type: 'ease', default: 'Sine.InOut', help: 'Things moving' },
  'motion.settleZoom': { type: 'number', default: 1.03, min: 1, max: 1.1, step: 0.005, help: 'Painting settles from this size on entering a scene' },
  'motion.pushIn': { type: 'number', default: 0.018, min: 0, max: 0.06, step: 0.002, help: 'Slow breath of the painting' },
  'motion.pushInSeconds': { type: 'number', default: 44, min: 10, max: 120, step: 1, help: 'One breath of the painting' },
  'motion.snapshotWaitMs': { type: 'number', default: 300, min: 50, max: 1000, step: 10, help: 'Longest wait for the last frame before fading instead' },
  'motion.reduced': { type: 'bool', default: false, help: 'Reduced motion: no shake or zoom, quick fades. Also follows the Windows setting' },
  'motion.reducedMs': { type: 'number', default: 90, min: 0, max: 300, step: 10, help: 'Longest animation with reduced motion' },
});

export const COLOR = {
  deep: 0x020607, teal: 0x0c1d24, panel: 0x08161b, panelHi: 0x12262c, veil: 0x06141a,
  gold: 0xedc47f, goldHi: 0xf7dcae, bone: 0xf5efdf, muted: 0xb9c3bd, danger: 0xff9f8a, calm: 0xa9dcff, unlit: 0x5b6a6a, lantern: 0xf0a860,
};
export const CSS = {
  deep: '#020607', ink: '#08161b', bone: '#f5efdf', muted: '#b9c3bd', gold: '#edc47f', danger: '#ff9f8a', calm: '#a9dcff',
};
/** Camera fades go to this colour, as (r, g, b): the dark teal of the panels, never pure black. */
export const FADE_RGB = [12, 29, 36];
export const PANEL = { alpha: 0.94, borderAlpha: 0.25, radius: 18 };

/** True when the player or the system asks for less motion. */
export function reducedMotion() {
  return tune('motion.reduced') || !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}
const timing = (name) => {
  const ms = tune(`motion.${name}Ms`);
  return reducedMotion() ? Math.min(ms, tune('motion.reducedMs')) : ms;
};
/** The shared rhythm. Read when used, so the F2 panel and reduced motion apply at once. */
export const MS = { get fast() { return timing('fast'); }, get base() { return timing('base'); }, get slow() { return timing('slow'); } };
export const EASE = {
  get enter() { return tune('motion.enterEase'); },
  get exit() { return tune('motion.exitEase'); },
  get move() { return tune('motion.moveEase'); },
};

/** Fades parts in from nothing to the alpha each already has. */
export function fadeInParts(scene, parts, ms = MS.fast) {
  for (const part of parts) {
    const { alpha } = part;
    part.setAlpha(0);
    scene.tweens.add({ targets: part, alpha, duration: ms, ease: EASE.enter });
  }
}

/** Fades parts out, destroys them, then calls done. They stop taking clicks at once. */
export function fadeOutParts(scene, parts, done = () => {}, ms = MS.fast) {
  for (const part of parts) if (part.input) part.disableInteractive();
  scene.tweens.add({
    targets: parts,
    alpha: 0,
    duration: ms,
    ease: EASE.exit,
    onComplete: () => {
      for (const part of parts) part.destroy();
      done();
    },
  });
}

/** Sets a number or short line, with a small swell when it really changes. */
export function pulseText(scene, text, value) {
  if (text.text === value) return;
  const first = !text.text;
  text.setText(value);
  if (first || reducedMotion()) return;
  scene.tweens.killTweensOf(text);
  text.setScale(1);
  scene.tweens.add({ targets: text, scale: 1.12, duration: MS.fast / 2, ease: EASE.move, yoyo: true });
}

/** Shows or hides a part, fading it in when it appears. */
export function showIf(scene, part, on) {
  if (on === part.visible) return;
  part.setVisible(on);
  if (on) fadeInParts(scene, [part]);
}

export const bodyText = (size, color = CSS.bone, extra = {}) => ({ fontFamily: BODY_FONT, fontSize: `${size}px`, color, resolution: 2, ...extra });
export const headText = (size, color = CSS.bone, extra = {}) => ({ fontFamily: HEAD_FONT, fontSize: `${size}px`, color, resolution: 2, ...extra });

/** The standard panel on a Graphics object. x and y are its top left. */
export function drawPanel(graphics, x, y, w, h, radius = PANEL.radius) {
  graphics.fillStyle(COLOR.panel, PANEL.alpha).fillRoundedRect(x, y, w, h, radius);
  graphics.lineStyle(1, COLOR.gold, PANEL.borderAlpha).strokeRoundedRect(x, y, w, h, radius);
  return graphics;
}

/**
 * A pill button, a Container with setEnabled(on) and setLabel(text). Gold is the main action on a panel and carries a
 * slow breath of light; the others are dark with a thin gold outline. detail adds a smaller second line.
 * @param {{gold?:boolean, detail?:string, size?:number}} options
 */
export function makeButton(scene, x, y, w, h, label, onPress, { gold = false, detail = '', size = 15 } = {}) {
  const face = scene.add.graphics();
  const radius = h / 2;
  const paint = (hover) => {
    face.clear();
    face.fillStyle(gold ? (hover ? COLOR.goldHi : COLOR.gold) : (hover ? COLOR.panelHi : COLOR.panel), 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);
    if (!gold) face.lineStyle(1, COLOR.gold, hover ? 0.9 : 0.6).strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  };
  const ink = gold ? CSS.ink : CSS.gold;
  const text = scene.add.text(0, detail ? -size * 0.45 : 0, label, headText(size, ink, { fontStyle: 'bold' })).setOrigin(0.5);
  const parts = [face, text];
  if (detail) parts.push(scene.add.text(0, size * 0.75, detail, bodyText(size * 0.8, gold ? CSS.ink : CSS.muted)).setOrigin(0.5));
  let aura = null;
  if (gold) {
    aura = scene.add.image(0, 0, 'board-soft').setDisplaySize(w * 1.7, h * 3).setTint(COLOR.gold).setAlpha(0);
    parts.unshift(aura);
    scene.tweens.add({ targets: aura, alpha: 0.42, duration: tune('ui.auraMs'), ease: EASE.move, yoyo: true, repeat: -1 });
  }
  const btn = scene.add.container(x, y, parts);
  btn.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  const scaleTo = (scale) => {
    scene.tweens.killTweensOf(btn);
    scene.tweens.add({ targets: btn, scale, duration: MS.fast, ease: EASE.enter });
  };
  btn.enabled = true;
  btn.styled = false;
  btn.on('pointerover', () => { if (btn.enabled) { paint(true); scaleTo(tune('ui.buttonHover')); } });
  btn.on('pointerout', () => { paint(false); scaleTo(1); });
  btn.on('pointerdown', () => {
    if (!btn.enabled) return;
    scene.tweens.killTweensOf(btn);
    scene.tweens.add({ targets: btn, scale: tune('ui.buttonPress'), duration: MS.fast / 2, ease: EASE.enter, yoyo: true });
    btn.press();
  });
  btn.press = onPress; // a panel swaps this when only the state behind a button has changed
  btn.setEnabled = (on) => {
    if (btn.styled && btn.enabled === on) return btn;
    const first = !btn.styled;
    btn.styled = true;
    btn.enabled = on;
    btn.input.cursor = on ? 'pointer' : 'default';
    aura?.setVisible(on);
    if (!on) paint(false);
    const alpha = on ? 1 : tune('ui.disabledAlpha');
    if (first) btn.setAlpha(alpha);
    else scene.tweens.add({ targets: btn, alpha, duration: MS.fast, ease: EASE.enter });
    return btn;
  };
  btn.setLabel = (value) => { text.setText(value); return btn; };
  paint(false);
  return btn;
}

/** A small tag with its left edge at x, a Container. onPress makes it clickable. */
export function makeChip(scene, x, y, w, h, label, onPress) {
  const face = scene.add.graphics();
  face.fillStyle(COLOR.panelHi, 1).fillRoundedRect(0, -h / 2, w, h, 6);
  face.lineStyle(1, COLOR.gold, 0.45).strokeRoundedRect(0, -h / 2, w, h, 6);
  const text = scene.add.text(w / 2, 0, label, bodyText(16)).setOrigin(0.5);
  const chip = scene.add.container(x, y, [face, text]);
  if (onPress) {
    chip.setInteractive({ hitArea: new Phaser.Geom.Rectangle(0, -h / 2, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    chip.on('pointerdown', onPress);
  }
  return chip;
}

/** Anger pips in a row from x on a Graphics object. pips: { filled, total, danger }. */
export function angerPips(graphics, x, pips) {
  graphics.clear();
  const colour = pips.danger ? COLOR.danger : COLOR.gold;
  for (let i = 0; i < pips.total; i++) {
    const px = x + i * 11;
    graphics.fillStyle(COLOR.deep, 1).fillCircle(px, 0, 5);
    if (i < pips.filled) graphics.fillStyle(colour, 1).fillCircle(px, 0, 3.5);
    else graphics.lineStyle(1, colour, 0.8).strokeCircle(px, 0, 3.5);
  }
  return graphics;
}

function flameShape(w, h) {
  const points = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const lean = w * 0.4 * ((Math.cos(a) + 1) / 2) ** 2; // the tip curls, or it reads as a water drop
    points.push({ x: w * Math.sin(a) * Math.sin(a / 2) ** 2 + lean, y: -h * Math.cos(a) - h });
  }
  return points;
}

/** A row of Light flames. set(lit) takes one flag per flame; flicker(seconds) moves the lit ones. */
export class LightFlames {
  constructor(scene, x, y, step = 26) {
    Object.assign(this, { scene, x, y, step, marks: [] });
    this.root = scene.add.container(0, 0);
  }

  set(lit) {
    while (this.marks.length < lit.length) {
      const mark = this.scene.add.graphics().setPosition(this.x + this.marks.length * this.step, this.y);
      this.root.add(mark);
      this.marks.push({ mark, lit: null });
    }
    lit.forEach((on, i) => {
      const flame = this.marks[i];
      if (flame.lit === on) return;
      const first = flame.lit === null;
      flame.lit = on;
      flame.mark.clear().setScale(1);
      if (!first) {
        this.scene.tweens.killTweensOf(flame.mark);
        flame.mark.setAlpha(0.2);
        this.scene.tweens.add({ targets: flame.mark, alpha: 1, duration: MS.base, ease: EASE.enter });
      }
      if (on) {
        flame.mark.fillStyle(COLOR.gold, 1).fillPoints(flameShape(10, 13), true);
        flame.mark.fillStyle(COLOR.bone, 0.9).fillPoints(flameShape(5, 7), true);
      } else {
        flame.mark.lineStyle(1, COLOR.unlit, 1).strokePoints(flameShape(10, 13), true);
      }
    });
  }

  flicker(seconds) {
    this.marks.forEach((flame, i) => {
      if (!flame.lit) return;
      const beat = seconds * (5.1 + i * 0.7) + i * 1.9;
      flame.mark.setScale(1 + 0.05 * Math.sin(beat * 1.3), 1 + 0.08 * Math.sin(beat) + 0.04 * Math.sin(beat * 2.7));
    });
  }
}

/**
 * The look of any image that is missing: a dark plate with a thin gold border and the name, a Container centred on (x, y).
 * It stands in at the same size, so a layout never shifts, and reads as meant rather than broken.
 */
export function soulPlate(scene, x, y, w, h, name) {
  const face = scene.add.graphics();
  const radius = Math.min(12, Math.min(w, h) * 0.12);
  face.fillStyle(COLOR.panel, 1).fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  face.lineStyle(1, COLOR.gold, 0.6).strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  face.fillStyle(COLOR.teal, 1).fillEllipse(0, -h * 0.2, w * 0.4, h * 0.26);
  face.fillStyle(COLOR.teal, 1).fillEllipse(0, h * 0.14, w * 0.62, h * 0.38);
  const size = Math.max(9, Math.min(w, h) * 0.13);
  const label = scene.add.text(0, h * 0.4, name, headText(size, CSS.gold, { align: 'center', wordWrap: { width: w - 10 } })).setOrigin(0.5);
  return scene.add.container(x, y, [face, label]);
}

/**
 * The bottom decision panel every scene shares: a heading, a line or two of explanation, then buttons, gold for the main
 * action. show() redraws it; slideIn and slideOut move it. A button is { label, onPress, gold, enabled, onHover }.
 */
export class DecisionPanel {
  constructor(scene, { w = 820, h = 164, depth = 12 } = {}) {
    Object.assign(this, { scene, w, h, buttons: [] });
    const left = -w / 2 + 24;
    this.left = left;
    const back = drawPanel(scene.add.graphics(), -w / 2, 0, w, h);
    this.heading = scene.add.text(left, 24, '', headText(21)).setOrigin(0, 0.5);
    this.body = scene.add.text(left, 44, '', bodyText(18, CSS.bone, { wordWrap: { width: w - 48 }, lineSpacing: -2 }));
    this.warning = scene.add.text(left, h - 32, '', bodyText(17, CSS.danger, { wordWrap: { width: w / 2 - 40 }, lineSpacing: -2 })).setOrigin(0, 0.5);
    this.root = scene.add.container(scene.scale.width / 2, tune('ui.panelY'), [back, this.heading, this.body, this.warning]).setDepth(depth);
  }

  show({ heading = '', lines = [], warning = '', buttons = [] }) {
    const look = JSON.stringify([heading, lines, warning, buttons.map((b) => [b.label, b.gold, b.enabled])]);
    if (look === this.look) {
      // The same panel: keep its buttons, so a hover is not lost, and take the newest handlers.
      [...buttons].reverse().forEach((button, i) => {
        this.buttons[i].press = button.onPress;
        this.buttons[i].hover = button.onHover;
      });
      return;
    }
    const changed = this.look !== undefined;
    this.look = look;
    this.heading.setText(heading);
    this.body.setText(lines.filter(Boolean).join('\n'));
    for (const button of this.buttons) button.destroy();
    let right = this.w / 2 - 24;
    this.buttons = [...buttons].reverse().map((button) => {
      const w = Math.max(96, button.label.length * 9 + 40);
      const made = makeButton(this.scene, right - w / 2, this.h - 32, w, 36, button.label, button.onPress, { gold: button.gold }).setEnabled(button.enabled ?? true);
      made.hover = button.onHover;
      made.on('pointerover', (pointer) => made.hover?.(pointer));
      made.on('pointerout', () => made.hover?.(null));
      right -= w + 12;
      this.root.add(made);
      return made;
    });
    // Beside the buttons when they leave room for it, otherwise on its own line above them.
    const beside = right - this.left >= 300;
    this.warning.setWordWrapWidth(beside ? right - this.left : this.w - 48).setY(beside ? this.h - 32 : this.h - 66).setText(warning ?? '');
    if (changed) fadeInParts(this.scene, [this.heading, this.body, this.warning, ...this.buttons]);
  }

  slideIn(delay = 0) {
    const y = tune('ui.panelY');
    const { root, scene } = this;
    scene.tweens.killTweensOf(root);
    root.setAlpha(0).setY(y + 44);
    scene.tweens.add({ targets: root, y, alpha: 1, duration: MS.base, delay, ease: EASE.enter });
  }

  slideOut() {
    const { root, scene } = this;
    scene.tweens.killTweensOf(root);
    scene.tweens.add({ targets: root, y: tune('ui.panelY') + 44, alpha: 0, duration: MS.base, ease: EASE.exit });
  }
}

/** A dimmed screen behind a modal. It takes every click, so the scene underneath cannot be used. */
export function modalShade(scene) {
  const { width, height } = scene.scale;
  return scene.add.rectangle(width / 2, height / 2, width, height, COLOR.deep, tune('ui.shadeAlpha')).setInteractive();
}

/** A brief glow around the edge of the screen: danger for a loss, lantern for warm news. */
export function edgeFlash(scene, color = COLOR.danger, depth = 11) {
  const { width, height } = scene.scale;
  const edge = scene.add.image(width / 2, height / 2, 'board-edge').setDisplaySize(width, height).setTint(color).setAlpha(0).setDepth(depth);
  scene.tweens.add({ targets: edge, alpha: tune('ui.flashAlpha'), duration: MS.base, ease: EASE.enter, yoyo: true, onComplete: () => edge.destroy() });
}

/** A small shake of the view, for Light lost. */
export const lossShake = (scene) => { if (!reducedMotion()) scene.cameras.main.shake(tune('wraith.shakeMs'), tune('wraith.shakeIntensity')); };

/** Fades the scene out, then calls done. The one way a scene leaves unless a boat carries it off. */
export function fadeOut(scene, done, ms = MS.base) {
  scene.cameras.main.fadeOut(ms, ...FADE_RGB);
  scene.cameras.main.once('camerafadeoutcomplete', done);
}

export const fadeIn = (scene, ms = MS.base) => scene.cameras.main.fadeIn(ms, ...FADE_RGB);

const CARRY = 'scene-carry'; // the last frame of the scene before, while the next one fades in over it

/**
 * Leaves a scene with no dark gap: keeps its last frame for enterScene, then calls done. If the frame does not come in
 * time, or with reduced motion, the scene fades to teal instead. Either way done runs once.
 */
export function leaveScene(scene, done) {
  const { renderer, textures } = scene.game;
  if (reducedMotion() || !renderer.snapshot) return fadeOut(scene, done);
  let settled = false;
  const timer = setTimeout(() => {
    settled = true;
    fadeOut(scene, done);
  }, tune('motion.snapshotWaitMs'));
  renderer.snapshot((image) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (image instanceof HTMLImageElement) {
      if (textures.exists(CARRY)) textures.remove(CARRY);
      textures.addImage(CARRY, image);
    }
    done();
  }, 'image/jpeg', 0.92);
  return undefined;
}

/** Brings a scene in: the last frame dissolves over it, or the camera fades up from teal. Clicks wait until it is done. */
export function enterScene(scene, ms = MS.slow) {
  const { textures } = scene;
  scene.input.enabled = false;
  const unlock = () => { if (!scene.leaving) scene.input.enabled = true; };
  if (!textures.exists(CARRY)) {
    const fade = Math.min(ms, MS.base);
    fadeIn(scene, fade);
    scene.time.delayedCall(fade, unlock);
    return;
  }
  const { width, height } = scene.scale;
  const last = scene.add.image(width / 2, height / 2, CARRY).setDisplaySize(width, height).setDepth(1000).setScrollFactor(0);
  scene.tweens.add({
    targets: last,
    alpha: 0,
    duration: ms,
    ease: EASE.move,
    onComplete: () => {
      last.destroy();
      if (textures.exists(CARRY)) textures.remove(CARRY);
      unlock();
    },
  });
}

/** Fades a whole overlay scene in, the shade behind it with it. */
export function overlayIn(scene) {
  const camera = scene.cameras.main.setAlpha(0);
  scene.tweens.add({ targets: camera, alpha: 1, duration: MS.base, ease: EASE.enter });
}

/** Fades a whole overlay scene out, then calls done. */
export function overlayOut(scene, done) {
  scene.tweens.add({ targets: scene.cameras.main, alpha: 0, duration: MS.fast, ease: EASE.exit, onComplete: done });
}
