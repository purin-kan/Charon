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
  'art.boat.width': { type: 'number', default: 768, min: 200, max: 1280, step: 2, help: 'Boat image width on screen' },
  'art.boat.floor': { type: 'number', default: 0.689, min: 0, max: 1, step: 0.005, help: 'Deck floor, fraction of the image height' },
  'art.boat.keel': { type: 'number', default: 0.822, min: 0, max: 1, step: 0.005, help: 'Waterline, fraction of the image height' },
  'art.boat.lanternX': { type: 'number', default: 0.259, min: 0, max: 1, step: 0.005 },
  'art.boat.lanternY': { type: 'number', default: 0.384, min: 0, max: 1, step: 0.005 },
  'art.memory.size': { type: 'number', default: 56, min: 16, max: 160, step: 1, help: 'Memory art inside a full card' },
  'art.background.veil': { type: 'number', default: 0.6, min: 0, max: 1, step: 0.02, help: 'Dark teal veil over a background' },
  'art.background.vignette': { type: 'number', default: 0.85, min: 0, max: 1, step: 0.02 },
  'ui.buttonMs': { type: 'number', default: 140, min: 0, max: 500, step: 10, help: 'Button hover' },
  'ui.buttonHover': { type: 'number', default: 1.03, min: 1, max: 1.15, step: 0.01 },
  'ui.buttonPress': { type: 'number', default: 0.96, min: 0.8, max: 1, step: 0.01 },
  'ui.disabledAlpha': { type: 'number', default: 0.45, min: 0.1, max: 1, step: 0.05 },
  'ui.auraMs': { type: 'number', default: 1500, min: 200, max: 5000, step: 50, help: 'Slow light behind a gold button' },
  'ui.toastMs': { type: 'number', default: 2600, min: 500, max: 8000, step: 100, help: 'Status line under the HUD' },
  'ui.fadeMs': { type: 'number', default: 500, min: 100, max: 2000, step: 10, help: 'Fade between scenes' },
  'ui.panelY': { type: 'number', default: 545, min: 400, max: 560, step: 1, help: 'Top of the bottom panel' },
  'ui.panelMs': { type: 'number', default: 420, min: 0, max: 1500, step: 10, help: 'Bottom panel slides in and out' },
  'ui.shadeAlpha': { type: 'number', default: 0.72, min: 0, max: 1, step: 0.02, help: 'Dimming behind a modal' },
  'ui.flashAlpha': { type: 'number', default: 0.55, min: 0, max: 1, step: 0.05, help: 'Glow at the screen edge' },
  'ui.flashMs': { type: 'number', default: 320, min: 50, max: 1500, step: 10 },
  'art.boat.deck': { type: 'number', default: 0.55, min: 0.2, max: 1, step: 0.01, help: 'Share of the boat image that is deck' },
});

export const COLOR = {
  deep: 0x020607, teal: 0x0c1d24, panel: 0x08161b, panelHi: 0x12262c, veil: 0x06141a,
  gold: 0xedc47f, goldHi: 0xf7dcae, bone: 0xf5efdf, muted: 0xb9c3bd, danger: 0xff9f8a, calm: 0xa9dcff, unlit: 0x5b6a6a, lantern: 0xf0a860,
};
export const CSS = {
  deep: '#020607', ink: '#08161b', bone: '#f5efdf', muted: '#b9c3bd', gold: '#edc47f', danger: '#ff9f8a', calm: '#a9dcff',
};
/** Camera fades go to this colour, as (r, g, b). */
export const FADE_RGB = [2, 6, 7];
export const PANEL = { alpha: 0.94, borderAlpha: 0.25, radius: 18 };

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
    scene.tweens.add({ targets: aura, alpha: 0.42, duration: tune('ui.auraMs'), ease: 'Sine.InOut', yoyo: true, repeat: -1 });
  }
  const btn = scene.add.container(x, y, parts);
  btn.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  const scaleTo = (scale) => {
    scene.tweens.killTweensOf(btn);
    scene.tweens.add({ targets: btn, scale, duration: tune('ui.buttonMs'), ease: 'Sine.Out' });
  };
  btn.enabled = true;
  btn.styled = false;
  btn.on('pointerover', () => { if (btn.enabled) { paint(true); scaleTo(tune('ui.buttonHover')); } });
  btn.on('pointerout', () => { paint(false); scaleTo(1); });
  btn.on('pointerdown', () => {
    if (!btn.enabled) return;
    scene.tweens.killTweensOf(btn);
    scene.tweens.add({ targets: btn, scale: tune('ui.buttonPress'), duration: 70, ease: 'Sine.Out', yoyo: true });
    onPress();
  });
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
    else scene.tweens.add({ targets: btn, alpha, duration: 200, ease: 'Sine.Out' });
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
      flame.lit = on;
      flame.mark.clear().setScale(1);
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
    this.heading.setText(heading);
    this.body.setText(lines.filter(Boolean).join('\n'));
    this.warning.setText(warning ?? '');
    for (const button of this.buttons) button.destroy();
    let right = this.w / 2 - 24;
    this.buttons = [...buttons].reverse().map((button) => {
      const w = Math.max(96, button.label.length * 9 + 40);
      const made = makeButton(this.scene, right - w / 2, this.h - 32, w, 36, button.label, button.onPress, { gold: button.gold }).setEnabled(button.enabled ?? true);
      if (button.onHover) {
        made.on('pointerover', (pointer) => button.onHover(pointer));
        made.on('pointerout', () => button.onHover(null));
      }
      right -= w + 12;
      this.root.add(made);
      return made;
    });
  }

  slideIn(delay = 0) {
    const y = tune('ui.panelY');
    const { root, scene } = this;
    scene.tweens.killTweensOf(root);
    root.setAlpha(0).setY(y + 44);
    scene.tweens.add({ targets: root, y, alpha: 1, duration: tune('ui.panelMs'), delay, ease: 'Cubic.Out' });
  }

  slideOut() {
    const { root, scene } = this;
    scene.tweens.killTweensOf(root);
    scene.tweens.add({ targets: root, y: tune('ui.panelY') + 44, alpha: 0, duration: tune('ui.panelMs'), ease: 'Sine.In' });
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
  scene.tweens.add({ targets: edge, alpha: tune('ui.flashAlpha'), duration: tune('ui.flashMs'), ease: 'Sine.Out', yoyo: true, onComplete: () => edge.destroy() });
}

/** A small shake of the view, for Light lost. */
export const lossShake = (scene) => scene.cameras.main.shake(tune('wraith.shakeMs'), tune('wraith.shakeIntensity'));

/** Fades the scene out, then calls done. The one way a scene leaves unless a boat carries it off. */
export function fadeOut(scene, done, ms = tune('ui.fadeMs')) {
  scene.cameras.main.fadeOut(ms, ...FADE_RGB);
  scene.cameras.main.once('camerafadeoutcomplete', done);
}

export const fadeIn = (scene, ms = tune('ui.fadeMs')) => scene.cameras.main.fadeIn(ms, ...FADE_RGB);
