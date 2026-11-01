import Phaser from 'phaser';
import { addArt } from '../preloader.js';
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
