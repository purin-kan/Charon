// The boat as scenes other than BoardingScene draw it: the image (or the drawn hull) with its lantern glow, in a container
// whose (0, 0) is the middle of the deck floor. Put seated souls in the container before the hull, so its side hides their
// tails: boat.seat(token). Positions come from the art.boat.* frame values, never from the file's pixels.
import Phaser from 'phaser';
import { t } from '../text.js';
import { COLOR, CSS, headText } from '../theme.js';
import { tune } from '../tuning.js';
import { boatSway } from './boarding-layout.js';
import { DOCK } from './delivery-layout.js';

const LANTERN_SCALE = 1.1;
export const WOOD = { plank: 0x2b1e14, edge: 0x6b5233, post: 0x1f1610 };

/** The dock of a stop, as CrossingScene and DeliveryScene both draw it. Returns its parts, for a scene to place or fade. */
export function addDock(scene, x, y) {
  const dock = scene.add.graphics();
  dock.fillStyle(WOOD.plank, 0.86).fillRoundedRect(x - DOCK.w / 2, y - DOCK.h / 2, DOCK.w, DOCK.h, 6);
  dock.lineStyle(1, COLOR.gold, 0.25).strokeRoundedRect(x - DOCK.w / 2, y - DOCK.h / 2, DOCK.w, DOCK.h, 6);
  const label = scene.add.text(x - DOCK.w / 2 + 16, y - DOCK.h / 2 + 12, t('delivery.dock'), headText(18, CSS.muted));
  return [dock, label];
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
    this.root = scene.add.container(x, y, [this.hull, this.lantern]);
  }

  /** Puts a soul behind the hull. */
  seat(token) {
    this.root.addAt(token, 0);
    return token;
  }

  /** Rocks the boat and flickers its lantern. Call from the scene's update. */
  update(seconds) {
    const sway = boatSway(seconds, tune('boarding.heavePx'), Phaser.Math.DegToRad(tune('boarding.rollDeg')));
    this.root.setY(this.y + sway.y).setRotation(sway.angle);
    const flicker = 1 - tune('boarding.lanternFlicker') * (0.5 + 0.3 * Math.sin(seconds * 7.3) + 0.2 * Math.sin(seconds * 13.1 + 2));
    this.lantern.setScale(LANTERN_SCALE * (0.96 + 0.1 * flicker)).setAlpha(tune('boarding.lanternGlow') * flicker);
  }
}
