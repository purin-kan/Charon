import Phaser from 'phaser';
import { addArt } from '../preloader.js';
import { BODY_FONT } from '../fonts.js';
import { TOKEN } from './boarding-layout.js';

const FONT = 'sans-serif';

/** One soul as a draggable-ready Container centred on (entry.x, entry.y). */
export function addSoulToken(scene, entry) {
  const { w, h } = TOKEN;
  const panel = scene.add.rectangle(0, 0, w, h, 0x1d2c38).setStrokeStyle(1, 0x7fa6c0);
  const art = addArt(scene, 0, -34, entry.actor.type, 64);
  const small = { fontFamily: FONT, fontSize: '13px', color: '#cfe3f0', align: 'center', wordWrap: { width: w - 6 } };
  const name = scene.add.text(0, 16, '', small).setOrigin(0.5);
  const wish = scene.add.text(0, 40, '', small).setOrigin(0.5);
  const anger = scene.add.text(0, 58, '', small).setOrigin(0.5);
  const token = scene.add.container(entry.x, entry.y, [panel, art, name, wish, anger]);
  // A container with no size is centred on (0, 0), so the hit area is too.
  token.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  token.setDepth(1);
  token.setData({ id: entry.id, panel, name, wish, anger });
  return token;
}

export function setTokenLabels(token, labels) {
  token.getData('name').setText(labels.name);
  token.getData('wish').setText(labels.wish);
  token.getData('anger').setText(labels.anger);
}

// BoardingScene's full-figure soul. The sprites are 512 x 768 with the figure about 620 tall and its tail ending near y 680.
const SPRITE = { h: 768, figure: 620, foot: 680 };
const GOLD = 0xedc47f;
const DANGER = 0xff9f8a;
const SHADOW = 0x020607;

function diamond(x, y, r) {
  return [{ x, y: y - r }, { x: x + r, y }, { x, y: y + r }, { x: x - r, y }];
}

/**
 * One soul standing at (entry.x, entry.y), which is the ground under it. Layers, so motions never fight:
 * the container walks, body takes the lift and size, figure takes the bob and shake, labels stay still over the head.
 */
export function addBoardingSoul(scene, entry, height) {
  const size = (height * SPRITE.h) / SPRITE.figure;
  const centreY = -((SPRITE.foot - SPRITE.h / 2) / SPRITE.h) * size; // the sprite's middle, with its tail on the ground
  const glow = scene.add.image(0, -height / 2, 'board-soft').setScale((height * 1.5) / 256).setTint(GOLD).setAlpha(0);
  const art = addArt(scene, 0, centreY, entry.actor.type, size);
  const figureParts = [art];
  let rim = null;
  if (art.texture) { // a letter emblem has no outline to light
    rim = scene.add.image(0, centreY, art.texture.key).setScale(art.scaleX * 1.035).setTint(GOLD).setTintMode(Phaser.TintModes.FILL).setAlpha(0);
    figureParts.unshift(rim);
  }
  const figure = scene.add.container(0, 0, figureParts);
  const body = scene.add.container(0, 0, [glow, figure]);

  const style = { fontFamily: BODY_FONT, fontSize: '18px', fontStyle: '600', color: '#f5efdf', align: 'center', resolution: 2, stroke: '#020607', strokeThickness: 3, wordWrap: { width: 96 }, lineSpacing: -4 };
  const name = scene.add.text(0, -12, '', style).setOrigin(0.5, 1);
  const marks = scene.add.graphics();
  const pips = scene.add.graphics();
  const labels = scene.add.container(0, -height - 2, [name, marks, pips]);

  const token = scene.add.container(entry.x, entry.y, [body, labels]);
  token.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-36, -height, 72, height), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  token.parts = { body, figure, glow, rim, name, marks, pips, labels };
  return token;
}

/** Name, destination diamond, Anger pips or a lock, centred in a row under the name. */
export function setBoardingBadge(token, badge) {
  const { name, marks, pips } = token.parts;
  name.setText(badge.name);
  const rowW = 12 + (badge.locked ? 16 : (badge.pips?.total ?? 0) * 11);
  const left = -rowW / 2;
  marks.clear();
  marks.fillStyle(SHADOW, 1).fillPoints(diamond(left + 6, 0, 8), true);
  marks.fillStyle(badge.color, 1).fillPoints(diamond(left + 6, 0, 6), true);
  if (badge.locked) {
    const x = left + 24;
    marks.lineStyle(1.5, GOLD, 1).strokeCircle(x, -2, 3);
    marks.fillStyle(GOLD, 1).fillRect(x - 4.5, -1, 9, 7);
  }
  pips.clear();
  if (!badge.pips) return;
  const { filled, total, danger } = badge.pips;
  const colour = danger ? DANGER : GOLD;
  for (let i = 0; i < total; i++) {
    const x = left + 22 + i * 11;
    pips.fillStyle(SHADOW, 1).fillCircle(x, 0, 5);
    if (i < filled) pips.fillStyle(colour, 1).fillCircle(x, 0, 3.5);
    else pips.lineStyle(1, colour, 0.8).strokeCircle(x, 0, 3.5);
  }
}
