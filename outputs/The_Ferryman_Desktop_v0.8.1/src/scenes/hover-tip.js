// The hover box the scenes show over souls, signs, buttons and memories (T-19): a title and a few lines next to the
// pointer, kept on screen. It waits a moment, then fades in, so passing over things does not flash it.
import { BODY_FONT, COLOR, CSS, EASE, MS, PANEL } from '../theme.js';
import { tune } from '../tuning.js';

const W = 360;

export class HoverTip {
  constructor(scene, depth = 15) {
    this.scene = scene;
    this.bg = scene.add.rectangle(0, 0, 10, 10, COLOR.panel, 0.96).setOrigin(0).setStrokeStyle(1, COLOR.gold, PANEL.borderAlpha);
    this.title = scene.add.text(12, 10, '', { fontFamily: BODY_FONT, fontSize: '20px', color: CSS.gold, fontStyle: 'bold', resolution: 2, wordWrap: { width: W - 24 } });
    this.body = scene.add.text(12, 36, '', { fontFamily: BODY_FONT, fontSize: '17px', color: CSS.bone, resolution: 2, wordWrap: { width: W - 24 }, lineSpacing: 2 });
    this.root = scene.add.container(0, 0, [this.bg, this.title, this.body]).setDepth(depth).setVisible(false);
  }

  /** Shows title and lines (empty lines are skipped) below and right of the pointer, or above it near the bottom. */
  show(pointer, title, lines = []) {
    this.title.setText(title ?? '');
    this.body.setText(lines.filter(Boolean).join('\n')).setY(this.title.text ? 36 : 10);
    const h = this.body.y + this.body.height + 12;
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
