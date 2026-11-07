// The boat as scenes other than BoardingScene draw it: the image (or the drawn hull) with its lantern glow, in a container
// whose (0, 0) is the middle of the deck floor. Put seated souls in the container before the hull, so its side hides their
// tails: boat.seat(token). Positions come from the art.boat.* frame values, never from the file's pixels.
import Phaser from 'phaser';
import { COLOR, EASE, MS, reducedMotion } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { boatSway } from './boarding-layout.js';
import { DEPTH } from './night-fx.js';

const LANTERN_SCALE = 1.1;
const WATER = { top: 446, bottom: 720, glints: 96 }; // the band of water; it fades in from the top, over any painting

defineTuning({
  'water.restFlow': { type: 'number', default: 16, min: 0, max: 120, step: 1, help: 'Water drifting past a boat at rest, pixels per second' },
  'water.sailFlow': { type: 'number', default: 170, min: 40, max: 900, step: 10, help: 'Water going past on the pull of a stroke' },
  'water.strokeSeconds': { type: 'number', default: 2.4, min: 1, max: 6, step: 0.1, help: 'One stroke of the oar' },
  'water.surgePx': { type: 'number', default: 12, min: 0, max: 40, step: 1, help: 'How far a stroke pushes the boat forward' },
  'water.glintAlpha': { type: 'number', default: 0.5, min: 0, max: 1, step: 0.02, help: 'Light moving on the water' },
  'water.bodyAlpha': { type: 'number', default: 0.82, min: 0, max: 1, step: 0.02, help: 'How much the water covers the painting' },
  'water.reflectAlpha': { type: 'number', default: 0.36, min: 0, max: 1, step: 0.02, help: 'The boat reflected in the water' },
  'water.swell': { type: 'number', default: 1.7, min: 1, max: 4, step: 0.1, help: 'How much more the boat rocks under way' },
});

function waterTextures(scene) {
  if (scene.textures.exists('water-body')) return;
  const h = WATER.bottom - WATER.top;
  const body = scene.textures.createCanvas('water-body', 8, h);
  const ctx = body.getContext();
  const fall = ctx.createLinearGradient(0, 0, 0, h);
  fall.addColorStop(0, 'rgba(10,24,34,0)');
  fall.addColorStop(0.2, 'rgba(10,24,34,0.72)');
  fall.addColorStop(0.42, 'rgba(8,20,30,0.95)');
  fall.addColorStop(1, 'rgba(3,9,14,1)');
  ctx.fillStyle = fall;
  ctx.fillRect(0, 0, 8, h);
  body.refresh();

  // Soft streaks of moonlight that repeat across the width, so the sheet can slide for ever.
  const glints = scene.textures.createCanvas('water-glints', 512, WATER.glints);
  const g = glints.getContext();
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 46; i++) {
    const [x, y] = [rand() * 512, 6 + rand() * (WATER.glints - 12)];
    const [rx, ry] = [18 + rand() * 62, 0.8 + rand() * 1.5];
    const a = 0.16 + rand() * 0.5;
    for (const dx of [-512, 0, 512]) {
      const glow = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      glow.addColorStop(0, `rgba(205,218,245,${a})`);
      glow.addColorStop(1, 'rgba(205,218,245,0)');
      g.save();
      g.translate(x + dx, y);
      g.scale(rx, ry);
      g.fillStyle = glow;
      g.beginPath();
      g.arc(0, 0, 1, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  }
  glints.refresh();
}

/** The surface under the boat, the same at every place: dark water with light sliding across it. */
export class Water {
  constructor(scene) {
    this.scene = scene;
    waterTextures(scene);
    this.effort = { k: 0 }; // how hard the ferryman is rowing, 0 to 1
    this.stroke = 1;
    const h = WATER.bottom - WATER.top;
    scene.add.image(640, WATER.top + h / 2, 'water-body').setDisplaySize(1280, h).setDepth(DEPTH.reflection - 0.6).setAlpha(tune('water.bodyAlpha'));
    const sheet = (y, scale, alpha) => scene.add.tileSprite(640, y, 1280, WATER.glints * scale, 'water-glints')
      .setTileScale(scale, scale).setBlendMode(Phaser.BlendModes.ADD).setAlpha(alpha * tune('water.glintAlpha')).setDepth(DEPTH.reflection - 0.5);
    this.sheets = [{ tile: sheet(WATER.top + 74, 1, 0.62), rate: 0.55 }, { tile: sheet(WATER.top + 150, 1.6, 0.85), rate: 1 }];
  }

  /**
   * The ferryman rows for ms: he eases into it, keeps the stroke, and eases off. Each pull pushes the boat a little and
   * sends the water past faster, then it glides. onStroke runs as each pull begins.
   */
  row(boat, ms, onStroke, done) {
    Object.assign(this, { boat, onStroke, stroke: 1 });
    this.scene.tweens.add({
      targets: this.effort,
      k: 1,
      duration: ms * 0.18,
      hold: ms * 0.64,
      yoyo: true,
      ease: EASE.move,
      onComplete: () => {
        this.boat = null;
        done();
      },
    });
  }

  /** A streak of foam left on the water. It stays with the water, so it slides off behind the boat, to the left. */
  wake(x, y, size = 1) {
    const { scene } = this;
    const foam = scene.add.image(x, y, 'board-soft').setScale(0.34 * size, 0.035 * size).setTint(COLOR.bone).setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.reflection);
    scene.tweens.add({ targets: foam, x: x - 240, scaleX: 0.9 * size, scaleY: 0.05 * size, alpha: 0, duration: MS.slow * 1.4, ease: EASE.enter, onComplete: () => foam.destroy() });
  }

  update(dt, seconds) {
    const { k } = this.effort;
    const stroke = (seconds / tune('water.strokeSeconds')) % 1;
    const pull = stroke < 0.42 ? Math.sin((stroke / 0.42) * Math.PI) : 0;
    if (stroke < this.stroke && k > 0.3) this.onStroke?.();
    this.stroke = stroke;
    const flow = tune('water.restFlow') + k * tune('water.sailFlow') * (0.45 + 0.55 * pull);
    if (this.boat) {
      this.boat.swell = 1 + k * ((reducedMotion() ? 1 : tune('water.swell')) - 1);
      this.boat.surge = reducedMotion() ? 0 : k * tune('water.surgePx') * pull;
    }
    for (const { tile, rate } of this.sheets) tile.tilePositionX += flow * rate * dt; // the boat goes right, so the water goes left
  }
}
export const PIER_ART = 'sprite-dock';
export const WOOD = { plank: 0x2b1e14, edge: 0x6b5233, post: 0x1f1610 };

/**
 * The pier at a stop, for the souls who leave. (x, y) is the view's top left in the scene's space. Without its image
 * there is no pier: they stand on the painting, and the caller gets null.
 */
export function addPier(scene, x = 0, y = 0) {
  if (!scene.textures.exists(PIER_ART)) return null;
  const pier = scene.add.image(x + tune('art.pier.x'), y + tune('art.pier.y'), PIER_ART);
  return pier.setScale(tune('art.pier.width') / pier.width);
}

export class RiverBoat {
  constructor(scene, x, y, deckWidth) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    const key = scene.textures.exists('sprite-boat-horizontal') ? 'sprite-boat-horizontal' : 'board-hull';
    this.hull = scene.add.image(0, 0, key);
    const scale = deckWidth / tune('art.boat.deck') / this.hull.width;
    const { width, height } = this.hull;
    this.hull.setScale(scale).setY(-(tune('art.boat.floor') - 0.5) * height * scale);
    this.lantern = scene.add.image(
      (tune('art.boat.lanternX') - 0.5) * width * scale,
      this.hull.y + (tune('art.boat.lanternY') - 0.5) * height * scale,
      'board-soft',
    ).setTint(COLOR.lantern).setBlendMode(Phaser.BlendModes.ADD);
    this.keel = this.hull.y + (tune('art.boat.keel') - 0.5) * height * scale;
    this.reflection = scene.add.image(0, 2 * this.keel - this.hull.y, key).setScale(scale).setFlipY(true).setTint(0x8fa6c4);
    const mirror = tune('water.reflectAlpha');
    this.reflection.setAlpha(mirror, mirror, 0, 0);
    this.swell = 1; // the rocking under way, against the rocking at rest
    this.surge = 0; // how far the current stroke has pushed the boat
    this.root = scene.add.container(x, y, [this.reflection, this.hull, this.lantern]);
  }

  /** Puts a soul behind the hull. */
  seat(token) {
    this.root.addAt(token, 0);
    return token;
  }

  /** Rocks the boat and flickers its lantern. Call from the scene's update. */
  update(seconds) {
    const sway = boatSway(seconds, tune('boarding.heavePx') * this.swell, Phaser.Math.DegToRad(tune('boarding.rollDeg')) * this.swell);
    this.root.setPosition(this.x + this.surge, this.y + sway.y).setRotation(sway.angle);
    const flicker = 1 - tune('boarding.lanternFlicker') * (0.5 + 0.3 * Math.sin(seconds * 7.3) + 0.2 * Math.sin(seconds * 13.1 + 2));
    this.lantern.setScale(LANTERN_SCALE * (0.96 + 0.1 * flicker)).setAlpha(tune('boarding.lanternGlow') * flicker);
  }
}
