import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { t } from '../text.js';
import { choiceView, memoryRowSpots } from './delivery-layout.js';

// Choice prompt (T-20): opens over the running scene in phase 'choice'. That is DeliveryScene for
// Po Luem, but Odysseus's choice fires on arrival, over CrossingScene. The router closes this
// overlay once the engine leaves 'choice'. Panel style matches TrimOverlay.

const FONT = 'sans-serif';
const GOLD = '#edc47f';
const PANEL = { w: 1200, h: 590 };

export class ChoiceOverlay extends Phaser.Scene {
  constructor() {
    super('ChoiceOverlay');
  }

  get router() { return this.game.router; }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'}, choice ${state?.choice?.kind ?? 'none'})`);
    const { width, height } = this.scale;
    // The shade takes every click so the scene underneath cannot be used while choosing.
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setInteractive();
    this.parts = [];
    this.render(state);

    this.onState = (s) => { if (s.phase === 'choice') this.render(s); };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  render(state) {
    for (const p of this.parts) p.destroy();
    const { width, height } = this.scale;
    const view = choiceView(state, Ferry, t);
    const top = height / 2 - PANEL.h / 2;
    const panel = this.add.rectangle(width / 2, height / 2, PANEL.w, PANEL.h, 0x10202c).setStrokeStyle(2, 0xedc47f);
    const title = this.add.text(width / 2, top + 40, view.heading, { fontFamily: FONT, fontSize: '30px', color: GOLD }).setOrigin(0.5);
    const intro = this.add.text(width / 2, top + 80, view.intro, {
      fontFamily: FONT, fontSize: '18px', color: '#e2ded1', align: 'center', wordWrap: { width: PANEL.w - 80 },
    }).setOrigin(0.5);
    this.message = this.add.text(width / 2, top + PANEL.h - 22, '', { fontFamily: FONT, fontSize: '18px', color: '#ff9f8a' }).setOrigin(0.5);
    this.parts = [panel, title, intro, this.message];
    if (view.kind === 'odysseus') view.options.forEach((option, i) => this.drawOption(option, i));
    else this.drawRows(view.rows);
  }

  drawOption(option, i) {
    const x = 340 + i * 600;
    const y = 370;
    const box = this.add.rectangle(x, y, 540, 340, 0x1d2c38).setStrokeStyle(1, 0x7fa6c0);
    const name = this.add.text(x, y - 135, option.name, { fontFamily: FONT, fontSize: '26px', color: GOLD }).setOrigin(0.5);
    const body = { fontFamily: FONT, fontSize: '18px', color: '#cfe3f0', align: 'center', wordWrap: { width: 490 } };
    const cost = this.add.text(x, y - 60, option.cost, body).setOrigin(0.5);
    const reward = this.add.text(x, y + 40, option.reward, body).setOrigin(0.5);
    this.parts.push(box, name, cost, reward, this.button(x, y + 130, option.label, option.action));
  }

  drawRows(rows) {
    const spots = memoryRowSpots(rows.length);
    rows.forEach((row, i) => {
      const { x, y, w } = spots[i];
      const name = this.add.text(x, y, row.name, { fontFamily: FONT, fontSize: '20px', color: '#e8f1f7' });
      const body = this.add.text(x, y + 26, row.text, {
        fontFamily: FONT, fontSize: '14px', color: '#cfe3f0', wordWrap: { width: w - 270 },
      });
      this.parts.push(name, body, this.button(x + w - 130, y + 26, row.label, row.action));
    });
  }

  button(x, y, label, action) {
    const style = { fontFamily: FONT, fontSize: '18px', color: '#0b1117', backgroundColor: '#7fa6c0', padding: { x: 12, y: 6 } };
    const btn = this.add.text(x, y, label, style).setOrigin(0.5).setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.choose(action));
    return btn;
  }

  choose(action) {
    try {
      this.router.dispatch(action);
    } catch (err) {
      this.message.setText(err.message);
    }
  }
}
