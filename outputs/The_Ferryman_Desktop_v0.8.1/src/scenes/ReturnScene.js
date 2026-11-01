import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { addArt, queueAssets } from '../preloader.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { returnView, statusLine } from './return-layout.js';

// Return to the Starting Shore (T-21): phase 'window' or 'review' with window.kind 'return'.
// Prepare: the shore souls with their Anger now and after the return, the memory hand (T-16), and a
// panel with what the engine will do. "Review return" dispatches PLAN RETURN; the panel then offers
// Back or Confirm, and CONFIRM runs RETURN. When the engine moves on (boarding of the next cycle, or
// ended), the scene fades out and calls router.exitDone().
// Style follows TitleScene (T-11) and BoardingScene (T-12).

const FONT = 'sans-serif';
const GOLD = '#edc47f';
const FADE_MS = 300;
const SOUL = { w: 140, h: 190, gap: 12, x: 40, y: 186 };
const PANEL = { x: 840, y: 72, w: 400, h: 560 };

export class ReturnScene extends Phaser.Scene {
  constructor() {
    super('ReturnScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { art: MemoryHand.artIds() });
  }

  create() {
    const state = this.registry.get('state');
    const view = returnView(state, Ferry);
    console.log(`[ferry] ReturnScene shown (phase ${state.phase}, shore ${state.shore.length}, light ${state.light}, after: ${view.light || view.reason})`);
    this.leaving = false;
    this.targets = null; // soul ids a picked memory can target
    this.parts = [];

    this.status = this.add.text(40, 24, '', { fontFamily: FONT, fontSize: '24px', color: '#e8f1f7' });
    this.add.text(40, 72, view.heading, { fontFamily: FONT, fontSize: '30px', color: GOLD, fontStyle: 'bold' });
    this.add.text(40, 114, view.intro, { fontFamily: FONT, fontSize: '17px', color: '#c9d6df', wordWrap: { width: 760 } });
    this.add.text(40, 152, 'Shore', { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' });
    this.message = this.add.text(PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h + 30, '', {
      fontFamily: FONT, fontSize: '18px', color: '#ff9f8a', align: 'center', wordWrap: { width: PANEL.w },
    }).setOrigin(0.5, 0);

    this.hand = new MemoryHand(this, {
      x: 40, y: 400,
      onTargets: (ids) => { this.targets = ids; this.render(this.registry.get('state')); },
    });

    this.render(state);
    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) return this.startExit();
      this.hand.render(s);
      this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
    this.hand.render(state);
    this.cameras.main.fadeIn(FADE_MS, 11, 17, 23);
  }

  render(state) {
    if (this.leaving || !state) return;
    for (const p of this.parts) p.destroy();
    this.parts = [];
    const view = returnView(state, Ferry);
    this.status.setText(statusLine(state, Ferry));
    this.drawShore(view);
    this.drawPanel(view);
  }

  drawShore(view) {
    const n = Math.max(1, view.souls.length);
    const w = Math.min(SOUL.w, Math.floor((760 - SOUL.gap * (n - 1)) / n));
    view.souls.forEach((soul, i) => {
      const x = SOUL.x + w / 2 + i * (w + SOUL.gap);
      const y = SOUL.y + SOUL.h / 2;
      const target = this.targets?.includes(soul.id);
      // A soul about to turn keeps its red fill; when it is also a memory target (Calm can save it),
      // the gold target outline wins so the player sees it can be clicked.
      const fill = soul.wraith ? 0x2a1d1a : target ? 0x2c4a51 : 0x1d2c38;
      const stroke = target ? 0xedc47f : soul.wraith ? 0xff9f8a : 0x7fa6c0;
      const panel = this.add.rectangle(0, 0, w, SOUL.h, fill).setStrokeStyle(target || soul.wraith ? 2 : 1, stroke);
      const art = addArt(this, 0, -SOUL.h / 2 + 50, soul.type, 72);
      const text = { fontFamily: FONT, fontSize: '15px', color: soul.wraith ? '#ffd2c7' : '#cfe3f0', align: 'center', wordWrap: { width: w - 12 } };
      const name = this.add.text(0, 2, soul.name, { ...text, fontSize: '17px', color: soul.wraith ? '#ff9f8a' : '#e8f1f7' }).setOrigin(0.5, 0);
      const wish = this.add.text(0, 26, soul.wish, text).setOrigin(0.5, 0);
      const anger = this.add.text(0, 48, soul.wraith ? `${soul.label}\nBecomes a Wraith` : soul.label, text).setOrigin(0.5, 0);
      const card = this.add.container(x, y, [panel, art, name, wish, anger]).setSize(w, SOUL.h);
      if (target) {
        card.setInteractive({ useHandCursor: true });
        card.on('pointerdown', () => this.hand.pickTarget(soul.id));
      }
      this.parts.push(card);
    });
  }

  drawPanel(view) {
    const { x, y, w, h } = PANEL;
    const add = (obj) => { this.parts.push(obj); return obj; };
    add(this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x10202c).setStrokeStyle(2, 0xedc47f));
    add(this.add.text(x + 22, y + 20, view.panelHeading, { fontFamily: FONT, fontSize: '28px', color: GOLD }));

    let cy = y + 70;
    const line = (text, color = '#cfe3f0', size = 17) => {
      const t = add(this.add.text(x + 22, cy, text, { fontFamily: FONT, fontSize: `${size}px`, color, wordWrap: { width: w - 44 }, lineSpacing: 2 }));
      cy += t.height + 10;
    };
    if (view.reason) line(view.reason, '#ff9f8a');
    // Keep room for the Light line, the warning and the buttons; a long list ends with "+N more".
    const room = y + h - 190;
    view.lines.forEach((text, i) => {
      if (cy > room) return;
      if (cy > room - 30 && i < view.lines.length - 1) { line(`+${view.lines.length - i} more`, '#9fb6c6'); cy = room + 1; return; }
      line(text);
    });
    if (view.arrivals) line(view.arrivals, '#9fb6c6');
    if (view.light) {
      add(this.add.rectangle(x + w / 2, cy + 4, w - 44, 1, 0x3d5566));
      cy += 16;
      line(view.light, '#e8f1f7', 22);
    }
    if (view.warning) line(view.warning, '#ff9f8a');

    const by = y + h - 44;
    const button = (bx, bw, label, fill, color, action) => {
      const b = add(this.add.text(bx, by, label, {
        fontFamily: FONT, fontSize: '22px', color, backgroundColor: fill, padding: { x: 14, y: 8 }, fixedWidth: bw, align: 'center',
      }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }));
      b.on('pointerdown', () => this.act(action));
    };
    if (view.secondary) {
      button(x + 22, 120, view.secondary.label, '#1d363c', '#f3ecd9', view.secondary.action);
      button(x + 162, w - 184, view.primary.label, '#edc47f', '#18140a', view.primary.action);
    } else {
      button(x + 22, w - 44, view.primary.label, '#7fa6c0', '#0b1117', view.primary.action);
    }
  }

  act(action) {
    if (this.leaving) return;
    try {
      this.message.setText('');
      this.router.dispatch(action);
    } catch (err) {
      this.message.setText(err.message);
    }
  }

  /** The return is done (next cycle, or the run ended): fade out, then let the router switch scenes. */
  startExit() {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    console.log('[ferry] ReturnScene: rowing back to the Starting Shore');
    this.cameras.main.fadeOut(FADE_MS, 11, 17, 23);
    this.cameras.main.once('camerafadeoutcomplete', () => this.router.exitDone());
  }
}
