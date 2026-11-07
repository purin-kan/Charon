// The hover box the scenes show over souls, signs, buttons and memories (T-19): a title and a few lines next to the
// pointer, kept on screen. It waits a moment, then fades in, so passing over things does not flash it.
import { BODY_FONT, COLOR, CSS, EASE, MS, PANEL } from '../theme.js';
import { tune } from '../tuning.js';

const W = 360;

// A line "Wish: Tartarus" shows as a short label with a coloured value; any other "Name: text" line puts the name in
// gold over its text; a line with no label is plain.
const FACTS = { Wish: CSS.gold, Memory: CSS.calm, Level: CSS.danger, Anger: null };
const LABEL_W = 74;
const GAP = 6;

/** The colour of an Anger value: calm at 0, gold on the way, red one step from the limit. */
function angerColor(value) {
  const [now, limit] = value.split('/').map(Number);
  if (!now) return CSS.calm;
  return limit && now >= limit - 1 ? CSS.danger : CSS.gold;
}

export class HoverTip {
  constructor(scene, depth = 15) {
    this.scene = scene;
    this.bg = scene.add.rectangle(0, 0, 10, 10, COLOR.panel, 0.97).setOrigin(0).setStrokeStyle(1, COLOR.gold, PANEL.borderAlpha);
    this.title = scene.add.text(14, 12, '', { fontFamily: BODY_FONT, fontSize: '21px', color: CSS.gold, fontStyle: 'bold', resolution: 2, wordWrap: { width: W - 28 } });
    this.rule = scene.add.rectangle(14, 0, W - 28, 1, COLOR.gold, 0.3).setOrigin(0);
    this.rows = [];
    this.root = scene.add.container(0, 0, [this.bg, this.title, this.rule]).setDepth(depth).setVisible(false);
  }

  text(x, y, value, size, color, width, bold = false) {
    const style = { fontFamily: BODY_FONT, fontSize: `${size}px`, color, resolution: 2, wordWrap: { width }, lineSpacing: 1 };
    if (bold) style.fontStyle = 'bold';
    const made = this.scene.add.text(x, y, value, style);
    this.rows.push(made);
    this.root.add(made);
    return made;
  }

  /** Lays the lines out from y down and returns the bottom. */
  layout(lines, y) {
    for (const row of this.rows) row.destroy();
    this.rows = [];
    const left = 14;
    const width = W - 28;
    for (const line of lines.filter(Boolean)) {
      const match = /^([^:]{1,48}): (.+)$/s.exec(line);
      const label = match?.[1];
      if (label && label in FACTS) {
        const value = match[2];
        this.text(left, y + 1, label.toUpperCase(), 13, CSS.muted, LABEL_W, true);
        const shown = this.text(left + LABEL_W, y, value, 17, FACTS[label] ?? angerColor(value), width - LABEL_W, true);
        y += shown.height + GAP;
      } else if (label) {
        const name = this.text(left, y, label, 16, CSS.gold, width, true);
        const body = this.text(left, y + name.height, match[2], 16, CSS.bone, width);
        y += name.height + body.height + GAP;
      } else {
        const plain = this.text(left, y, line, 16, CSS.muted, width);
        y += plain.height + GAP;
      }
    }
    return y;
  }

  /** Shows title and lines (empty lines are skipped) below and right of the pointer, or above it near the bottom. */
  show(pointer, title, lines = []) {
    this.title.setText(title ?? '');
    const top = this.title.text ? this.title.y + this.title.height + 6 : 12;
    this.rule.setY(top).setVisible(!!this.title.text);
    const h = this.layout(lines, top + (this.title.text ? 8 : 0)) + 8;
    this.bg.setSize(W, h);
    const x = Math.min(pointer.x + 16, 1280 - W - 8);
    const y = pointer.y + 16 + h > 712 ? pointer.y - h - 12 : pointer.y + 16;
    this.root.setPosition(x, Math.max(8, y));
    this.wanted = true;
    if (this.root.visible) {
      this.scene.tweens.killTweensOf(this.root); // a tip fading out comes straight back, so moving between items never flickers
      this.root.setAlpha(1);
      return;
    }
    if (this.waiting) return;
    this.waiting = this.scene.time.delayedCall(tune('ui.tipDelayMs'), () => {
      this.waiting = null;
      if (!this.wanted) return;
      this.root.setAlpha(0).setVisible(true);
      this.scene.tweens.add({ targets: this.root, alpha: 1, duration: MS.fast, ease: EASE.enter });
    });
  }

  hide() {
    this.wanted = false;
    if (!this.root.visible) return;
    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.add({ targets: this.root, alpha: 0, duration: MS.fast, ease: EASE.exit, onComplete: () => this.root.setVisible(false) });
  }
}
