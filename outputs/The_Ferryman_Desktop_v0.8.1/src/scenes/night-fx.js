// The night every scene plays in: a darkened painting, a vignette, drifting fog, light rays, motes, water glints, ripples
// and the mist souls leave behind. Nothing here reads the game state; the scene says where things happen.
import Phaser from 'phaser';
import { addBackdrop } from '../preloader.js';
import { COLOR } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';

defineTuning({
  'night.parallaxPx': { type: 'number', default: 9, min: 0, max: 30, step: 1, help: 'Painting shifts with the pointer' },
  'night.fogSpeed': { type: 'number', default: 7, min: 0, max: 60, step: 1, help: 'Fog drift, pixels per second' },
  'night.fogAlpha': { type: 'number', default: 0.1, min: 0, max: 0.5, step: 0.01 },
  'night.rayAlpha': { type: 'number', default: 0.08, min: 0, max: 0.4, step: 0.01, help: 'Moonlight rays' },
  'night.moteAlpha': { type: 'number', default: 0.65, min: 0, max: 1, step: 0.05, help: 'Drifting motes of light' },
  'night.glintAlpha': { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02, help: 'Moonlight on the water' },
  'night.rippleAlpha': { type: 'number', default: 0.3, min: 0, max: 1, step: 0.02 },
  'night.rippleMs': { type: 'number', default: 1400, min: 200, max: 4000, step: 50, help: 'Ring on the water' },
  'night.trailAlpha': { type: 'number', default: 0.2, min: 0, max: 1, step: 0.02, help: 'Mist left behind a moving soul' },
});

/** A seated soul's depth: souls overlap on a crowded deck, each one a layer in front of the soul to its left, all behind the hull. */
export const seatedDepth = (x) => DEPTH.seated + x / 10000;

export const DEPTH = { sky: -20, backdrop: -10, veil: -8, floor: -7, vignette: -6, glints: -5, rays: -4, fogBack: -3, reflection: -2, seated: 4, boat: 5, lantern: 6, shore: 7, motes: 8, fogFront: 9, ui: 12, hero: 13 };

const MOON = 0xc8d4ea;
const WARM = 0xf0c987;
const FOG_TINT = 0xa9c0c6;
const TRAIL = 0xb7c4f0;
const FLOOR_FADE = 170;
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

/** The soft shapes every effect and the gold buttons are made from. Drawn once per run of the game. */
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
  // The boat when its image is missing: a hull drawn in the panel style, open above the deck so passengers still show.
  softTexture(scene, 'board-hull', 1200, 450, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(40, 230);
    ctx.quadraticCurveTo(600, 300, 1160, 230);
    ctx.quadraticCurveTo(1080, 370, 940, 370);
    ctx.lineTo(260, 370);
    ctx.quadraticCurveTo(120, 370, 40, 230);
    ctx.closePath();
    ctx.fillStyle = '#08161b';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(237,196,127,0.6)';
    ctx.stroke();
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
  softTexture(scene, 'board-edge', 640, 360, (ctx) => {
    const g = ctx.createRadialGradient(320, 180, 170, 320, 180, 380);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 640, 360);
  });
  softTexture(scene, 'board-fade', 4, 256, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, 'rgba(2,6,7,0)');
    g.addColorStop(1, 'rgba(2,6,7,1)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
  });
}

/**
 * A destination's painting as a round thumbnail with a thin gold ring, made once from whatever image is loaded, whatever its
 * size. Returns the texture key, or null if the image is missing.
 */
export function roundThumb(scene, id, size = 180) {
  const key = `thumb-${id}`;
  if (scene.textures.exists(key)) return key;
  if (!scene.textures.exists(id)) return null;
  const source = scene.textures.get(id).getSourceImage();
  const texture = scene.textures.createCanvas(key, size, size);
  const ctx = texture.getContext();
  const r = size / 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 3, 0, Math.PI * 2);
  ctx.clip();
  const scale = Math.max(size / source.width, size / source.height); // cover: a thumbnail has no bars
  ctx.drawImage(source, (size - source.width * scale) / 2, (size - source.height * scale) / 2, source.width * scale, source.height * scale);
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(237,196,127,0.8)';
  ctx.beginPath();
  ctx.arc(r, r, r - 3, 0, Math.PI * 2);
  ctx.stroke();
  texture.refresh();
  return key;
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
      alpha: breathe('night.moteAlpha'),
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
      alpha: breathe('night.glintAlpha'),
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
      alpha: { onUpdate: (_particle, _key, t) => (1 - t) * tune('night.trailAlpha') },
      blendMode: 'ADD',
    }).setDepth(DEPTH.shore);

    this.applyTuning();
  }

  applyTuning() {
    const alpha = tune('night.fogAlpha');
    for (const bank of this.fogBack) bank.image.setAlpha(alpha);
    for (const bank of this.fogFront) bank.image.setAlpha(alpha * 0.7);
  }

  /** Drifts the fog, and shifts it against the pointer so the nearer fog moves more. */
  update(t, dt, lean) {
    const drift = tune('night.fogSpeed') * dt;
    const width = this.scene.scale.width;
    for (const bank of [...this.fogBack, ...this.fogFront]) {
      bank.x += drift * bank.speed;
      const half = bank.image.displayWidth / 2;
      if (bank.x - half > width) bank.x = -half;
      bank.image.x = bank.x - lean * bank.follow;
    }
    const peak = tune('night.rayAlpha');
    for (const ray of this.rays) ray.image.setAlpha(peak * (0.6 + 0.4 * Math.sin(t * ray.speed)));
  }

  /** A ring spreading on the water. */
  ripple(x, y, size = 1) {
    const ring = this.scene.add.image(x, y, 'board-ring').setScale(0.1 * size, 0.03 * size).setTint(MOON)
      .setAlpha(tune('night.rippleAlpha')).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.reflection);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 0.8 * size,
      scaleY: 0.2 * size,
      alpha: 0,
      duration: tune('night.rippleMs'),
      ease: 'Sine.Out',
      onComplete: () => ring.destroy(),
    });
  }

  /** A puff of the soul's own mist. */
  trail(x, y, count = 1) {
    this.mist.emitParticleAt(x, y, count);
  }
}

/**
 * A whole night scene behind a screen: the painting by id (any id the preloader knows), veil, vignette, atmosphere and
 * parallax. Call update(time, delta) from the scene's update and place() after a tuning change. shift lifts the painting
 * by that many pixels and fades the gap below it to black, which leaves room for a bottom panel.
 */
export class NightStage {
  constructor(scene, id, shift = () => 0) {
    this.scene = scene;
    this.shift = shift;
    this.lean = 0;
    const { width, height } = scene.scale;
    makeTextures(scene);
    scene.add.rectangle(width / 2, height / 2, width, height, COLOR.deep).setDepth(DEPTH.sky);
    this.backdrop = addBackdrop(scene, id, 0);
    this.baseScale = this.backdrop?.scaleX;
    this.veil = scene.add.rectangle(width / 2, height / 2, width, height, COLOR.veil).setDepth(DEPTH.veil);
    this.floorFade = scene.add.image(width / 2, 0, 'board-fade').setOrigin(0.5, 0).setDepth(DEPTH.floor).setDisplaySize(width, FLOOR_FADE);
    this.floorFill = scene.add.rectangle(width / 2, 0, width, height, COLOR.deep).setOrigin(0.5, 0).setDepth(DEPTH.floor);
    this.vignette = scene.add.image(width / 2, height / 2, 'board-vignette').setDepth(DEPTH.vignette);
    this.fx = new Atmosphere(scene);
    this.place();
  }

  place() {
    const { width, height } = this.scene.scale;
    const shift = this.shift();
    if (this.backdrop) {
      this.backdrop.setScale(this.baseScale * (1 + (2 * tune('night.parallaxPx')) / width)).setY(height / 2 - shift);
      this.floorFade.setY(height - shift - FLOOR_FADE).setVisible(shift > 0);
      this.floorFill.setY(height - shift).setVisible(shift > 0);
    } else {
      this.floorFade.setVisible(false);
      this.floorFill.setVisible(false);
    }
    this.veil.setAlpha(tune('art.background.veil'));
    this.vignette.setAlpha(tune('art.background.vignette'));
    this.fx.applyTuning();
  }

  update(time, delta) {
    const { scene } = this;
    const dt = delta / 1000;
    const target = (scene.input.activePointer.x / scene.scale.width - 0.5) * 2 * tune('night.parallaxPx');
    this.lean += (target - this.lean) * Math.min(1, dt * 2.5); // eased, so the view drifts instead of tracking the mouse
    if (this.backdrop) this.backdrop.x = scene.scale.width / 2 - this.lean;
    this.fx.update(time / 1000, dt, this.lean);
  }
}
