// The night around BoardingScene: textures, fog, light rays, motes, water glints, ripples and the soul trail.
// Nothing here reads the game state; the scene says where things happen.
import Phaser from 'phaser';
import { tune } from '../tuning.js';

export const DEPTH = { sky: -20, backdrop: -10, veil: -8, floor: -7, vignette: -6, glints: -5, rays: -4, fogBack: -3, reflection: -2, seated: 4, boat: 5, lantern: 6, shore: 7, motes: 8, fogFront: 9, ui: 12, hero: 13 };

const MOON = 0xc8d4ea;
const WARM = 0xf0c987;
const FOG_TINT = 0xa9c0c6;
const TRAIL = 0xb7c4f0;
// x, y, scaleX, scaleY, speed factor, how much it follows the pointer
const FOG_BACK = [[120, 300, 7, 1.5, 0.8, 1.4], [520, 372, 9, 1.8, 1.2, 1.2], [930, 330, 8, 1.4, 1, 1.5], [1240, 412, 10, 2, 0.7, 1.3]];
const FOG_FRONT = [[220, 505, 8, 0.9, 1.6, 2.6], [760, 530, 10, 0.8, 1.9, 2.4], [1180, 500, 7, 0.8, 1.4, 2.8]];
const RAYS = [[830, 90, 0.55, 2.6, 15, 0.26], [1010, 70, 0.4, 2.2, 13.5, 0.3]]; // x, y, width, length, turn in degrees, breath speed

function softTexture(scene, key, w, h, paint) {
  if (scene.textures.exists(key)) return;
  const texture = scene.textures.createCanvas(key, w, h);
  paint(texture.getContext());
  texture.refresh();
}

/** The soft shapes every effect is made from. Drawn once per run of the game. */
export function makeTextures(scene) {
  const { width, height } = scene.scale;
  softTexture(scene, 'board-soft', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.42)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  softTexture(scene, 'board-ring', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 84, 128, 128, 126);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.72, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });
  softTexture(scene, 'board-vignette', width, height, (ctx) => {
    const g = ctx.createRadialGradient(width / 2, height * 0.42, height * 0.3, width / 2, height * 0.42, width * 0.72);
    g.addColorStop(0, 'rgba(2,6,7,0)');
    g.addColorStop(1, 'rgba(2,6,7,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  });
  softTexture(scene, 'board-fade', 4, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(2,6,7,0)');
    g.addColorStop(1, 'rgba(2,6,7,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  });
}

/** Fades a particle in and out over its life. */
const breathe = (key) => ({ onUpdate: (_particle, _key, t) => Math.sin(Math.PI * t) * tune(key) });

export class Atmosphere {
  constructor(scene) {
    this.scene = scene;
    const fog = (spec, depth) => spec.map(([x, y, scaleX, scaleY, speed, follow]) => ({
      image: scene.add.image(x, y, 'board-soft').setScale(scaleX, scaleY).setTint(FOG_TINT).setDepth(depth),
      x,
      speed,
      follow,
    }));
    this.fogBack = fog(FOG_BACK, DEPTH.fogBack);
    this.fogFront = fog(FOG_FRONT, DEPTH.fogFront);
    this.rays = RAYS.map(([x, y, scaleX, scaleY, turn, speed]) => ({
      image: scene.add.image(x, y, 'board-soft').setScale(scaleX, scaleY).setAngle(turn).setTint(MOON).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.rays),
      speed,
    }));

    this.motes = scene.add.particles(0, 0, 'board-soft', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(0, 220, 1280, 320) },
      lifespan: { min: 5000, max: 9000 },
      frequency: 380,
      speedX: { min: -8, max: 11 },
      speedY: { min: -15, max: -4 },
      scale: { min: 0.012, max: 0.032 },
      tint: [WARM, WARM, MOON],
      alpha: breathe('boarding.moteAlpha'),
      blendMode: 'ADD',
    }).setDepth(DEPTH.motes);
    this.motes.fastForward(7000);

    this.glints = scene.add.particles(0, 0, 'board-soft', {
      emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(560, 322, 720, 206) },
      lifespan: { min: 1200, max: 3000 },
      frequency: 70,
      speedX: { min: -5, max: 7 },
      scaleX: { min: 0.07, max: 0.22 },
      scaleY: { min: 0.008, max: 0.016 },
      tint: [MOON, MOON, WARM],
      alpha: breathe('boarding.glintAlpha'),
      blendMode: 'ADD',
    }).setDepth(DEPTH.glints);
    this.glints.fastForward(3000);

    this.mist = scene.add.particles(0, 0, 'board-soft', {
      frequency: -1,
      lifespan: { min: 700, max: 1200 },
      speedX: { min: -14, max: 14 },
      speedY: { min: -24, max: -6 },
      scale: { start: 0.2, end: 0.03 },
      tint: TRAIL,
      alpha: { onUpdate: (_particle, _key, t) => (1 - t) * tune('boarding.trailAlpha') },
      blendMode: 'ADD',
    }).setDepth(DEPTH.shore);

    this.applyTuning();
  }

  applyTuning() {
    const alpha = tune('boarding.fogAlpha');
    for (const bank of this.fogBack) bank.image.setAlpha(alpha);
    for (const bank of this.fogFront) bank.image.setAlpha(alpha * 0.7);
  }

  /** Drifts the fog, and shifts it against the pointer so the nearer fog moves more. */
  update(t, dt, lean) {
    const drift = tune('boarding.fogSpeed') * dt;
    const width = this.scene.scale.width;
    for (const bank of [...this.fogBack, ...this.fogFront]) {
      bank.x += drift * bank.speed;
      const half = bank.image.displayWidth / 2;
      if (bank.x - half > width) bank.x = -half;
      bank.image.x = bank.x - lean * bank.follow;
    }
    const peak = tune('boarding.rayAlpha');
    for (const ray of this.rays) ray.image.setAlpha(peak * (0.6 + 0.4 * Math.sin(t * ray.speed)));
  }

  /** A ring spreading on the water. */
  ripple(x, y, size = 1) {
    const ring = this.scene.add.image(x, y, 'board-ring').setScale(0.1 * size, 0.03 * size).setTint(MOON)
      .setAlpha(tune('boarding.rippleAlpha')).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.reflection);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 0.8 * size,
      scaleY: 0.2 * size,
      alpha: 0,
      duration: tune('boarding.rippleMs'),
      ease: 'Sine.Out',
      onComplete: () => ring.destroy(),
    });
  }

  /** A puff of the soul's own mist. */
  trail(x, y, count = 1) {
    this.mist.emitParticleAt(x, y, count);
  }
}
