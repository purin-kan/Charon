// The hover box CrossingScene and DeliveryScene show over souls, signs, buttons and memories (T-19):
// a title and a few lines next to the pointer, kept on screen.

const FONT = 'sans-serif';
const W = 360;

export class HoverTip {
  constructor(scene, depth = 15) {
    this.bg = scene.add.rectangle(0, 0, 10, 10, 0x0b1117, 0.96).setOrigin(0).setStrokeStyle(1, 0x7fa6c0);
    this.title = scene.add.text(12, 10, '', { fontFamily: FONT, fontSize: '17px', color: '#edc47f', fontStyle: 'bold', wordWrap: { width: W - 24 } });
    this.body = scene.add.text(12, 36, '', { fontFamily: FONT, fontSize: '15px', color: '#e8f1f7', wordWrap: { width: W - 24 }, lineSpacing: 4 });
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
    this.root.setPosition(x, Math.max(8, y)).setVisible(true);
  }

  hide() { this.root.setVisible(false); }
}
