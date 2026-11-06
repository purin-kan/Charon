import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { CSS, bodyText, drawPanel, headText, makeButton, modalShade } from '../theme.js';
import { CARD, drawCard } from '../components/MemoryHand.js';
import { trimView } from '../components/memory-layout.js';
import { HoverTip } from './hover-tip.js';

// Trim prompt (T-16, discard part): a modal over the current scene when the hand is over config.handLimit
// (phase 'trim'). A click marks a card to discard; the confirm button works once exactly the excess is
// marked, then DISCARD_MEMORY goes to the engine once per card. The router closes this overlay once the
// engine leaves 'trim'.

const PANEL_H = 480;

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
    modalShade(this);
    this.parts = [];
    this.marked = new Set();
    this.confirming = false;
    this.render(state);
    this.tip = new HoverTip(this);

    this.onState = (s) => { if (s.phase === 'trim' && !this.confirming) this.render(s); };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  render(state) {
    for (const p of this.parts) p.destroy();
    const { width, height } = this.scale;
    const view = trimView(state, Ferry);
    this.marked = new Set([...this.marked].filter((id) => view.cards.some((card) => card.id === id)));
    const n = view.cards.length;
    const rowW = n * CARD.w + (n - 1) * CARD.gap;
    const scale = Math.min(1, (width - 120) / rowW); // an overfull hand shrinks to fit; hovering a card shows its full text
    const panelW = Math.min(width - 60, Math.max(620, rowW * scale + 80));
    const top = height / 2 - PANEL_H / 2;

    const back = drawPanel(this.add.graphics(), width / 2 - panelW / 2, top, panelW, PANEL_H);
    const title = this.add.text(width / 2, top + 36, view.heading, headText(27, CSS.gold)).setOrigin(0.5);
    const intro = this.add.text(width / 2, top + 74, view.intro, bodyText(20)).setOrigin(0.5);
    const counter = this.add.text(width / 2, top + 102, view.counter, bodyText(18, CSS.muted)).setOrigin(0.5);
    this.message = this.add.text(width / 2 - panelW / 2 + 28, top + PANEL_H - 42, '', bodyText(18, CSS.danger)).setOrigin(0, 0.5);
    this.parts = [back, title, intro, counter, this.message];

    const step = (CARD.w + CARD.gap) * scale;
    const left = width / 2 - (rowW * scale) / 2 + (CARD.w * scale) / 2;
    const cy = top + 124 + (CARD.h * scale) / 2;
    view.cards.forEach((card, i) => {
      const marked = this.marked.has(card.id);
      const box = drawCard(this, left + i * step, cy, card, { picked: marked, dim: marked, footer: marked ? t('trim.marked') : undefined }).setScale(scale);
      box.setInteractive({ useHandCursor: true });
      box.on('pointerdown', () => this.toggle(card.id));
      box.on('pointerover', (pointer) => this.tip?.show(pointer, card.name, [card.text, t('memory.from', { source: card.source })]));
      box.on('pointerout', () => this.tip?.hide());
      this.parts.push(box);
    });
    const keep = makeButton(this, width / 2 + panelW / 2 - 130, top + PANEL_H - 42, 210, 42, t('trim.confirm', { limit: view.limit }), () => this.confirm(), { gold: true })
      .setEnabled(view.excess > 0 && this.marked.size === view.excess);
    this.parts.push(keep);
  }

  toggle(id) {
    if (this.confirming) return;
    if (this.marked.has(id)) this.marked.delete(id);
    else this.marked.add(id);
    this.tip?.hide();
    this.render(this.registry.get('state'));
  }

  /** Each card goes through the engine. The router closes this overlay after the last one. */
  confirm() {
    if (this.confirming) return;
    this.confirming = true;
    try {
      for (const id of this.marked) this.router.dispatch({ type: 'DISCARD_MEMORY', id });
    } catch (err) {
      this.confirming = false;
      this.message.setText(err.message);
    }
  }
}
