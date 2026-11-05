// The HUD every scene shares, in the same place: Light flames, the cycle and the next Long top left, the status line
// under them. The memory hand sits top right and is the host scene's own MemoryHand. Style comes from src/theme.js.
//
//   this.hud = new Hud(this);                 // after fonts are ready
//   this.hud.render(state);                   // in create() and on every 'ferry-state'
//   this.hud.update(seconds);                 // in update(), for the flames
//   this.hud.toast(text);                     // a short status line that fades
import { Ferry } from '../ferry.js';
import { CSS, LightFlames, bodyText, drawPanel } from '../theme.js';
import { t } from '../text.js';
import { defineTuning, tune } from '../tuning.js';
import { flames, nextLongName } from '../scenes/boarding-layout.js';

defineTuning({
  'hud.x': { type: 'number', default: 24, min: 0, max: 200, step: 1, help: 'Left edge of the HUD' },
  'hud.y': { type: 'number', default: 20, min: 0, max: 200, step: 1, help: 'Top edge of the HUD' },
  'hud.slideMs': { type: 'number', default: 520, min: 0, max: 1500, step: 10, help: 'HUD slides in and out' },
  'hud.flameMs': { type: 'number', default: 260, min: 0, max: 1000, step: 10, help: 'One flame going out or lighting' },
});

const SIZE = { w: 300, h: 80 };
const DEPTH = 12;

export class Hud {
  constructor(scene) {
    this.scene = scene;
    const plate = drawPanel(scene.add.graphics(), 0, 0, SIZE.w, SIZE.h);
    this.flames = new LightFlames(scene, 28, 36);
    this.cycle = scene.add.text(SIZE.w - 20, 24, '', bodyText(20, CSS.gold)).setOrigin(1, 0.5); // Cinzel's 1 reads as a Roman I
    this.nextLong = scene.add.text(18, 56, '', bodyText(17, CSS.muted)).setOrigin(0, 0.5);
    this.line = scene.add.text(4, SIZE.h + 16, '', bodyText(18, CSS.danger, { wordWrap: { width: SIZE.w + 60 } })).setOrigin(0, 0.5).setAlpha(0);
    this.root = scene.add.container(tune('hud.x'), tune('hud.y'), [plate, this.flames.root, this.cycle, this.nextLong, this.line]).setDepth(DEPTH);
  }

  render(state) {
    this.flames.set(flames(state, Ferry));
    this.cycle.setText(t('boarding.cycleLine', { cycle: state.cycle }));
    const long = nextLongName(state, Ferry);
    this.nextLong.setText(long ? t('boarding.nextLong', { name: long }) : '');
  }

  update(seconds) {
    this.flames.flicker(seconds);
  }

  /** Moves the flames from one Light value to another, one flame at a time. Returns how long that takes. */
  stepLight(from, to, max) {
    const step = tune('hud.flameMs');
    const count = Math.abs(to - from);
    const dir = Math.sign(to - from);
    for (let i = 1; i <= count; i++) {
      const light = from + dir * i;
      this.scene.time.delayedCall(i * step, () => this.flames.set(Array.from({ length: max }, (_, n) => n < light)));
    }
    return count * step;
  }

  /** A short line under the HUD. Danger red by default, for refusals; pass CSS.calm or CSS.gold for good news. */
  toast(text, color = CSS.danger) {
    const { line, scene } = this;
    this.toastTimer?.remove();
    scene.tweens.killTweensOf(line);
    if (!text) {
      scene.tweens.add({ targets: line, alpha: 0, duration: 180, ease: 'Sine.Out' });
      return;
    }
    line.setText(text).setColor(color).setX(-4).setAlpha(0);
    scene.tweens.add({ targets: line, alpha: 1, x: 4, duration: 200, ease: 'Sine.Out' });
    this.toastTimer = scene.time.delayedCall(tune('ui.toastMs'), () => this.toast(''));
  }

  slideIn(delay = 0) {
    const y = tune('hud.y');
    this.root.setAlpha(0).setY(y - 22);
    this.scene.tweens.add({ targets: this.root, y, alpha: 1, duration: tune('hud.slideMs'), delay, ease: 'Cubic.Out' });
  }

  slideOut() {
    this.scene.tweens.add({ targets: this.root, y: tune('hud.y') - 22, alpha: 0, duration: tune('hud.slideMs'), ease: 'Sine.In' });
  }
}
