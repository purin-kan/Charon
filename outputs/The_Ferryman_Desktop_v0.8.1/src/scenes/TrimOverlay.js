import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { queueAssets } from '../preloader.js';
import { CARD, drawCard } from '../components/MemoryHand.js';
import { TEXT, trimView } from '../components/memory-layout.js';

// Trim prompt (T-16, discard part): opens over the current scene when the hand is over
// config.handLimit (phase 'trim'). Each click dispatches DISCARD_MEMORY; the router closes this
// overlay once the engine leaves 'trim'. Panel style matches TitleScene's replace-save dialog.

const FONT = 'sans-serif';
const GOLD = '#edc47f';

export class TrimOverlay extends Phaser.Scene {
  constructor() {
    super('TrimOverlay');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { art: Ferry.data.memories.map((m) => m.id) });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'}, hand ${state?.hand?.length ?? 0})`);
    const { width, height } = this.scale;
    // The shade takes every click so the scene underneath cannot be used while trimming.
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setInteractive();
    this.parts = [];
    this.render(state);

    this.onState = (s) => { if (s.phase === 'trim') this.render(s); };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  render(state) {
    for (const p of this.parts) p.destroy();
    const { width, height } = this.scale;
    const view = trimView(state, Ferry);
    const n = view.cards.length;
    const rowW = n * CARD.w + (n - 1) * CARD.gap;
    const panelW = Math.min(width - 80, Math.max(620, rowW + 80));
    const panelH = 470;
    const top = height / 2 - panelH / 2;

    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x10202c).setStrokeStyle(2, 0xedc47f);
    const title = this.add.text(width / 2, top + 40, view.heading, { fontFamily: FONT, fontSize: '30px', color: GOLD }).setOrigin(0.5);
    const intro = this.add.text(width / 2, top + 80, view.intro, { fontFamily: FONT, fontSize: '18px', color: '#e2ded1' }).setOrigin(0.5);
    const counter = this.add.text(width / 2, top + 110, view.counter, { fontFamily: FONT, fontSize: '16px', color: '#9fb6c6' }).setOrigin(0.5);
    this.message = this.add.text(width / 2, top + panelH - 22, '', { fontFamily: FONT, fontSize: '18px', color: '#ff9f8a' }).setOrigin(0.5);
    this.parts = [panel, title, intro, counter, this.message];

    const left = width / 2 - rowW / 2;
    view.cards.forEach((card, i) => {
      const cx = left + CARD.w / 2 + i * (CARD.w + CARD.gap);
      const cy = top + 140 + CARD.h / 2;
      const box = drawCard(this, cx, cy, card);
      const btn = this.add.text(cx, cy + CARD.h / 2 + 30, TEXT.discard(card.name), {
        fontFamily: FONT, fontSize: '20px', color: '#0b1117', backgroundColor: '#7fa6c0', padding: { x: 12, y: 6 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      btn.on('pointerdown', () => this.discard(card.id));
      this.parts.push(box, btn);
    });
  }

  discard(id) {
    try {
      this.router.dispatch({ type: 'DISCARD_MEMORY', id });
    } catch (err) {
      this.message.setText(err.message);
    }
  }
}
