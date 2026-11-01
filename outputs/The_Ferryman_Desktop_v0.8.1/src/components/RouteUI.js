import { Ferry } from '../ferry.js';
import { routeModel } from './route-layout.js';

// Route UI (T-22): a component for SupaOhm's CrossingScene, not a scene.
//   fork mode:      the current fork's two options as cards; clicking one dispatches PLAN CROSS.
//   review mode:    a gold panel with the fog calculation, Back and Confirm (CONFIRM runs CROSS).
//   foresight mode: before the fork, the forks revealed by Foresight as small rows.
// The host keeps START_CROSSING ("Approach the fork"), the memory window and the boat animation.
// Style follows TitleScene (T-11), BoardingScene (T-12) and the memory hand (T-16).
//
//   this.routes = new RouteUI(this, { x: 40, y: 72 });
//   this.routes.render(state);                // in create() and in the 'ferry-state' handler
//   this.routes.root.setPosition(x, y);       // move it; this.routes.mode tells what it shows

const FONT = 'sans-serif';
const GOLD = '#edc47f';
export const ROUTE = { cardW: 370, cardH: 230, gap: 20, panelX: 800, panelW: 400, panelH: 560 };

export class RouteUI {
  constructor(scene, { x = 40, y = 72 } = {}) {
    this.scene = scene;
    this.mode = 'hidden';
    this.root = scene.add.container(x, y).setDepth(4);
    this.parts = [];
    scene.events.once('shutdown', () => this.destroy());
  }

  get router() { return this.scene.game.router; }

  render(state) {
    if (!this.root) return;
    for (const p of this.parts) p.destroy();
    this.parts = [];
    const model = routeModel(state, Ferry);
    this.mode = model.mode;
    this.root.setVisible(model.mode !== 'hidden');
    if (model.mode === 'foresight') return this.drawRows(model.upcoming, 0, 'Foresight');
    if (model.mode === 'hidden') return;

    this.text(0, 0, model.heading, 30, GOLD, { fontStyle: 'bold' });
    this.text(0, 42, model.intro, 17, '#c9d6df', { wordWrap: { width: 760 } });
    this.text(0, 80, model.forkLabel, 20, '#9fb6c6');
    model.current.forEach((card, i) => this.drawCard(card, i * (ROUTE.cardW + ROUTE.gap), 114, model.mode === 'fork'));
    if (model.upcoming.length) this.drawRows(model.upcoming, 372);
    if (model.review) this.drawReview(model.review);
    this.message = this.text(0, 580, '', 18, '#ff9f8a');
  }

  text(x, y, value, size, color, extra = {}) {
    const t = this.scene.add.text(x, y, value, { fontFamily: FONT, fontSize: `${size}px`, color, ...extra });
    this.root.add(t);
    this.parts.push(t);
    return t;
  }

  rect(x, y, w, h, fill, strokeW, stroke) {
    const r = this.scene.add.rectangle(x + w / 2, y + h / 2, w, h, fill).setStrokeStyle(strokeW, stroke);
    this.root.add(r);
    this.parts.push(r);
    return r;
  }

  /** One option of the current fork. Clickable only at the fork; in review the picked one is gold. */
  drawCard(card, x, y, clickable) {
    const { cardW: w, cardH: h } = ROUTE;
    const box = this.rect(x, y, w, h, card.picked ? 0x2c4a51 : card.hidden ? 0x16232e : 0x1d2c38, card.picked ? 2 : 1, card.picked ? 0xedc47f : card.lethal ? 0xff9f8a : 0x7fa6c0);
    this.text(x + 16, y + 14, `Option ${card.number}${card.picked ? ' · reviewing' : ''}`, 15, card.picked ? GOLD : '#9fb6c6');
    this.text(x + 16, y + 38, card.name, 28, card.hidden ? '#9fb6c6' : '#e8f1f7');
    // Destination art (DEST-* background ids) is not in assets/ yet; the box keeps its place.
    this.rect(x + 16, y + 82, w - 32, 70, 0x16232e, 0, 0x16232e);
    this.text(x + w / 2, y + 117, card.destination ? `[art: ${card.destination}]` : '?', 13, '#9fb6c6').setOrigin(0.5);
    this.text(x + 16, y + 164, card.fog, 17, card.lethal ? '#ff9f8a' : '#cfe3f0', { wordWrap: { width: w - 32 } });
    if (card.wishes) this.text(x + 16, y + h - 30, card.wishes, 15, '#9fb6c6', { wordWrap: { width: w - 32 } });
    if (!clickable) return;
    box.setInteractive({ useHandCursor: true });
    box.on('pointerover', () => box.setFillStyle(0x2c4a51));
    box.on('pointerout', () => box.setFillStyle(card.hidden ? 0x16232e : 0x1d2c38));
    box.on('pointerdown', () => this.act(card.action));
  }

  /** Forks revealed by Foresight: a label and the two destinations (or "Concealed route"). */
  drawRows(rows, y, heading) {
    let cy = y;
    if (heading) { this.text(0, cy, heading, 20, '#9fb6c6'); cy += 32; }
    for (const row of rows) {
      this.text(0, cy + 13, row.label, 18, '#9fb6c6');
      row.options.forEach((opt, i) => {
        const x = 180 + i * 300;
        this.rect(x, cy, 290, 48, opt.hidden ? 0x16232e : 0x1d2c38, opt.hidden ? 2 : 1, opt.hidden ? 0x3d5566 : 0x7fa6c0);
        this.text(x + 14, cy + 13, opt.name, 17, opt.hidden ? '#9fb6c6' : '#cfe3f0');
      });
      cy += 58;
    }
  }

  /** The review panel: the engine's fog numbers for the picked option, then Back and Confirm. */
  drawReview(r) {
    const { panelX: x, panelW: w, panelH: h } = ROUTE;
    this.rect(x, 0, w, h, 0x10202c, 2, 0xedc47f);
    this.text(x + 22, 20, r.heading, 28, GOLD);
    this.text(x + 22, 62, r.intro, 16, '#c9d6df', { wordWrap: { width: w - 44 } });
    this.text(x + 22, 112, r.name, 24, '#e8f1f7');
    let cy = 150;
    for (const line of [r.breakdown, r.modifiers]) {
      if (!line) continue;
      this.text(x + 22, cy, line, 18, '#cfe3f0');
      cy += 30;
    }
    if (r.cost) {
      this.rect(x + 22, cy + 6, w - 44, 1, 0x3d5566, 0, 0x3d5566);
      this.text(x + 22, cy + 20, r.cost, 22, '#e8f1f7', { wordWrap: { width: w - 44 } });
      cy += 70;
    }
    if (r.warning) this.text(x + 22, cy, r.warning, 16, '#ff9f8a', { wordWrap: { width: w - 44 } });

    const button = (bx, bw, label, fill, color, action) => {
      const b = this.text(bx, h - 44, label, 22, color, { backgroundColor: fill, padding: { x: 14, y: 8 }, fixedWidth: bw, align: 'center' }).setOrigin(0, 0.5);
      b.setInteractive({ useHandCursor: true });
      b.on('pointerdown', () => this.act(action));
    };
    button(x + 22, 120, r.back.label, '#1d363c', '#f3ecd9', r.back.action);
    button(x + 162, w - 184, r.confirm.label, '#edc47f', '#18140a', r.confirm.action);
  }

  /** Dispatches through the router; the host re-renders on 'ferry-state'. Engine refusals are shown. */
  act(action) {
    try {
      this.router.dispatch(action);
    } catch (err) {
      this.message?.setText(err.message);
    }
  }

  destroy() {
    if (this.root?.scene) this.root.destroy();
    this.root = null;
  }
}

export default RouteUI;
