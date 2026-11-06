import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { addArt, queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { CSS, COLOR, bodyText, drawPanel, headText, makeButton, modalShade } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { CHOICE_ART, arrivalOutcome, choiceView, memoryRowSpots } from './delivery-layout.js';
import { showOutcome } from './outcome-panel.js';

// Choice prompt (T-20): a modal over the running scene in phase 'choice'. That is DeliveryScene for
// Po Luem, but Odysseus's choice fires on arrival, over CrossingScene. The router closes this
// overlay once the engine leaves 'choice'. The art shows on each card; a missing image shows its name plate.

const PANEL = { w: 1200, h: 590 };
const CARD = { w: 540, h: 360, artW: 150, artH: 250 };

defineTuning({
  'choice.inputDelayMs': { type: 'number', default: 300, min: 0, max: 1500, step: 50, help: 'Clicks ignored after a choice appears, so a double-click cannot lose a memory' },
});

export class ChoiceOverlay extends Phaser.Scene {
  constructor() {
    super('ChoiceOverlay');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { art: [...Object.values(CHOICE_ART), ...Ferry.data.memories.map((m) => m.id)] });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'}, choice ${state?.choice?.kind ?? 'none'})`);
    modalShade(this);
    this.parts = [];
    this.render(state);

    this.onState = (s) => { if (s.phase === 'choice') this.render(s); };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  render(state) {
    for (const p of this.parts) p.destroy();
    this.choosing = false;
    this.readyAt = this.game.loop.time + tune('choice.inputDelayMs');
    const { width, height } = this.scale;
    const view = choiceView(state, Ferry, t);
    const top = height / 2 - PANEL.h / 2;
    const back = drawPanel(this.add.graphics(), width / 2 - PANEL.w / 2, top, PANEL.w, PANEL.h);
    const title = this.add.text(width / 2, top + 40, view.heading, headText(27, CSS.gold)).setOrigin(0.5);
    const intro = this.add.text(width / 2, top + 80, view.intro, bodyText(20, CSS.bone, { align: 'center', wordWrap: { width: PANEL.w - 80 } })).setOrigin(0.5);
    this.message = this.add.text(width / 2, top + PANEL.h - 22, '', bodyText(19, CSS.danger)).setOrigin(0.5);
    this.parts = [back, title, intro, this.message];
    if (view.kind === 'odysseus') view.options.forEach((option, i) => this.drawOption(option, i));
    else this.drawRows(view.rows);
  }

  /** One of Odysseus's two paths, as a card: the art on the left, what it costs and gives on the right. */
  drawOption(option, i) {
    const x = 340 + i * 600;
    const y = 380;
    const { w, h, artW, artH } = CARD;
    const face = this.add.graphics();
    face.fillStyle(COLOR.panelHi, 0.9).fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    face.lineStyle(1, COLOR.gold, 0.45).strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
    const artX = x - w / 2 + artW / 2 + 16;
    const artY = y - 26;
    const art = addArt(this, artX, artY, option.art, artH, { w: artW, h: artH });
    const left = artX + artW / 2 + 18;
    const room = w - (left - (x - w / 2)) - 20;
    const name = this.add.text(left, y - h / 2 + 22, option.name, headText(23, CSS.gold));
    const cost = this.add.text(left, y - h / 2 + 66, option.cost, bodyText(19, CSS.danger, { wordWrap: { width: room }, lineSpacing: -1 }));
    const reward = this.add.text(left, cost.y + cost.height + 14, option.reward, bodyText(19, CSS.bone, { wordWrap: { width: room }, lineSpacing: -1 }));
    const pick = makeButton(this, x, y + h / 2 - 34, 300, 40, option.label, () => this.choose(option.action), { gold: true });
    this.parts.push(face, art, name, cost, reward, pick);
  }

  /** Texts are made first so each row can be as tall as its text, then placed. */
  drawRows(rows) {
    const { w } = memoryRowSpots(rows.length)[0];
    const textW = w - 310;
    const bodies = rows.map((row) => this.add.text(0, 0, row.text, bodyText(16, CSS.bone, { wordWrap: { width: textW }, lineSpacing: -1 })));
    const spots = memoryRowSpots(rows.length, bodies.map((body) => 26 + body.height));
    rows.forEach((row, i) => {
      const { x, y } = spots[i];
      const art = addArt(this, x + 28, y + 26, row.type, 52);
      const name = this.add.text(x + 66, y, row.name, headText(16, CSS.gold));
      bodies[i].setPosition(x + 66, y + 24);
      const pick = makeButton(this, x + w - 120, y + 26, 210, 34, row.label, () => this.choose(row.action), { size: 12 });
      this.parts.push(art, name, bodies[i], pick);
    });
  }

  /** A choice can't be undone, so a click from the screen before it must not land here. Shows what it cost, then dispatches. */
  choose(action) {
    if (this.choosing || this.game.loop.time < this.readyAt) return;
    const state = this.registry.get('state');
    let next;
    try {
      next = Ferry.transition(state, action);
    } catch (err) {
      this.message.setText(err.message);
      return;
    }
    this.choosing = true;
    // Outside the try: dispatch emits ferry-state, and a render bug must not look like a rule error.
    showOutcome(this, arrivalOutcome(state, next, action, Ferry), () => this.router.dispatch(action));
  }
}
