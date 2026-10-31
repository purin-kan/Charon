import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { addArt, queueAssets } from '../preloader.js';
import { SLOT, TOKEN, layoutBoarding, statusLine, tokenLabels } from './boarding-layout.js';

const SNAP_MS = 160;
const FONT = 'sans-serif';

export class BoardingScene extends Phaser.Scene {
  constructor() {
    super('BoardingScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { art: Ferry.data.souls.map((s) => s.id) });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'})`);
    this.tokens = new Map();
    this.entries = new Map();
    this.boatParts = [];

    this.drawBoat(layoutBoarding(state, Ferry).slots);
    this.drawHud();
    this.render(state);

    this.onState = (s) => this.render(s);
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  drawBoat(slots) {
    const left = slots[0].x - SLOT.w / 2 - 16;
    const right = slots[slots.length - 1].x + SLOT.w / 2 + 16;
    const { y } = slots[0];
    this.boatParts.push(this.add.rectangle((left + right) / 2, y, right - left, SLOT.h + 32, 0x2a3b49));
    for (const slot of slots) {
      const seat = this.add.rectangle(slot.x, slot.y, slot.w, slot.h, 0x16232e).setStrokeStyle(2, 0x3d5566);
      this.boatParts.push(seat);
    }
  }

  drawHud() {
    this.status = this.add.text(40, 24, '', { fontFamily: FONT, fontSize: '24px', color: '#e8f1f7' });
    this.add.text(40, 68, 'Shore', { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' });
    this.add.text(640, 160, 'Boat', { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' });
    this.message = this.add.text(640, 610, '', { fontFamily: FONT, fontSize: '20px', color: '#e8c27f' }).setOrigin(0.5);
  }

  button(x, y, label, onPress) {
    const style = { fontFamily: FONT, fontSize: '24px', color: '#0b1117', backgroundColor: '#7fa6c0', padding: { x: 12, y: 6 } };
    const btn = this.add.text(x, y, label, style).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', onPress);
    return btn;
  }

  /** Brings the screen in line with the state. Tokens are keyed by actor id, so they glide. */
  render(state) {
    const { entries } = layoutBoarding(state, Ferry);
    this.status.setText(statusLine(state, Ferry));
    this.entries = new Map(entries.map((e) => [e.id, e]));
    for (const [id, token] of this.tokens) {
      if (this.entries.has(id)) continue;
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      this.updateToken(token, entry);
    }
  }

  addToken(entry) {
    const { w, h } = TOKEN;
    const panel = this.add.rectangle(0, 0, w, h, 0x1d2c38).setStrokeStyle(1, 0x7fa6c0);
    const art = addArt(this, 0, -34, entry.actor.type, 64);
    const small = { fontFamily: FONT, fontSize: '13px', color: '#cfe3f0', align: 'center', wordWrap: { width: w - 6 } };
    const name = this.add.text(0, 12, '', small).setOrigin(0.5);
    const wish = this.add.text(0, 40, '', small).setOrigin(0.5);
    const anger = this.add.text(0, 58, '', small).setOrigin(0.5);
    const token = this.add.container(entry.x, entry.y, [panel, art, name, wish, anger]);
    token.setDepth(1);
    token.setData({ id: entry.id, name, wish, anger });
    this.tokens.set(entry.id, token);
    return token;
  }

  updateToken(token, entry) {
    const labels = tokenLabels(entry, Ferry);
    token.getData('name').setText(labels.name);
    token.getData('wish').setText(labels.wish);
    token.getData('anger').setText(labels.anger);
    this.tweens.killTweensOf(token);
    this.tweens.add({ targets: token, x: entry.x, y: entry.y, duration: SNAP_MS, ease: 'Cubic.Out' });
  }
}
