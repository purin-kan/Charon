import Phaser from 'phaser';
import { addArt, soulArtId } from '../preloader.js';
import { angerPips, BODY_FONT, COLOR, EASE, MS, reducedMotion } from '../theme.js';
import HEIGHTS from '../data/soul-heights.json';

export const LABEL_TIER_PX = 34;

// The full-figure soul every scene draws. The frame is the height on screen of a person ADULT_CM tall. Each soul's own height
// (src/data/soul-heights.json) sets its figure against that frame, measured from the painted pixels of its image, so the
// padding in a file does not change how tall a soul looks.
const ADULT_CM = 170;
const GOLD = COLOR.gold;
const SHADOW = COLOR.deep;
const TAIL_POINTS = 14;

const painted = new Map();

/** The painted part of an image, as fractions of its height. Measured once per image. */
function paintedRows(scene, key) {
  if (painted.has(key)) return painted.get(key);
  const source = scene.textures.get(key).getSourceImage();
  const w = 64;
  const h = Math.max(1, Math.round((source.height / source.width) * w));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(source, 0, 0, w, h);
  const { data } = context.getImageData(0, 0, w, h);
  let top = h;
  let bottom = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] < 96) continue;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + 1);
    }
  }
  const rows = bottom > top ? { top: top / h, bottom: bottom / h } : { top: 0, bottom: 1 };
  painted.set(key, rows);
  return rows;
}

function diamond(x, y, r) {
  return [{ x, y: y - r }, { x: x + r, y }, { x, y: y + r }, { x: x - r, y }];
}

/** The painted sprite as a vertical rope, so one still image can bend along its length. */
function bendableArt(scene, art, y) {
  const { width, height, scaleX } = art;
  const key = art.texture.key;
  art.destroy();
  const points = Array.from({ length: TAIL_POINTS }, (_, i) => new Phaser.Math.Vector2(0, -height / 2 + (height * i) / (TAIL_POINTS - 1)));
  return { rope: scene.add.rope(0, y, key, undefined, points, false).setScale(scaleX), key, scaleX, width };
}

/**
 * One soul standing at (entry.x, entry.y), which is the ground under it. Layers, so motions never fight: the container
 * walks; ride follows the boat rocking; body takes the lift and size; figure takes the shake and lean; labels stay
 * still over the head.
 */
export function addBoardingSoul(scene, entry, height) {
  const artId = soulArtId(scene, entry.actor.type);
  const tall = (HEIGHTS[entry.actor.type] ?? ADULT_CM) / ADULT_CM;
  const rows = scene.textures.exists(artId) ? paintedRows(scene, artId) : { top: 0, bottom: 1 };
  const size = (height * tall) / (rows.bottom - rows.top);
  const centreY = -(rows.bottom - 0.5) * size; // the image's middle, with its painted base on the ground
  const glow = scene.add.image(0, -height / 2, 'board-soft').setScale((height * 1.5) / 256).setTint(GOLD).setAlpha(0);
  const shadow = scene.add.image(0, -2, 'board-soft').setScale(0.62, 0.11).setTint(SHADOW);
  const art = addArt(scene, 0, centreY, artId, size, { w: height * 0.5, h: height * 0.92, y: -height * 0.46 });
  const figureParts = [];
  let rim = null;
  let rope = null;
  if (art.texture) { // a letter emblem has no outline to light and nothing to bend
    const bent = bendableArt(scene, art, centreY);
    rope = bent.rope;
    rim = scene.add.image(0, centreY, bent.key).setScale(bent.scaleX * 1.035).setTint(GOLD).setTintMode(Phaser.TintModes.FILL).setAlpha(0);
    figureParts.push(rim, rope);
  } else {
    figureParts.push(art);
  }
  const figure = scene.add.container(0, 0, figureParts);
  const body = scene.add.container(0, 0, [glow, figure]);

  const style = { fontFamily: BODY_FONT, fontSize: '18px', fontStyle: '600', color: '#f5efdf', align: 'center', resolution: 2, stroke: '#020607', strokeThickness: 3, wordWrap: { width: 96 }, lineSpacing: -4 };
  const name = scene.add.text(0, -12, '', style).setOrigin(0.5, 1);
  const marks = scene.add.graphics();
  const pips = scene.add.graphics();
  const labels = scene.add.container(0, -height * tall - 2, [name, marks, pips]);

  // A soft shaft of gold, for a soul at its wish (DeliveryScene).
  const beam = scene.add.image(0, -height * 0.9, 'board-soft').setScale(0.42, 2.1).setTint(GOLD).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  const ride = scene.add.container(0, 0, [shadow, beam, body, labels]);
  const token = scene.add.container(entry.x, entry.y, [ride]);
  token.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-36, -height * tall, 72, height * tall), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  token.parts = { ride, shadow, beam, body, figure, glow, rim, rope, name, marks, pips, labels };
  return token;
}

/** Lifts a soul's name one step above its neighbours in a tight row (tier 1), or puts it back (tier 0). */
export function setLabelTier(token, tier) {
  const { labels } = token.parts;
  labels.restY ??= labels.y;
  labels.y = labels.restY - tier * LABEL_TIER_PX;
}

/** A soul taken off the boat at once (Moly, Sword, a fare): it fades as it lifts away, then is gone. */
export function fadeAway(token) {
  const { scene } = token;
  if (token.input) token.disableInteractive();
  scene.tweens.add({ targets: token, alpha: 0, y: token.y - 24, duration: MS.base, ease: EASE.exit, onComplete: () => token.destroy() });
}

/** Name, destination diamond, Anger pips or a lock, centred in a row under the name. */
export function setBoardingBadge(token, badge) {
  const { name, marks, pips } = token.parts;
  name.setText(badge.name);
  const rowW = 12 + (badge.locked ? 16 : (badge.pips?.total ?? 0) * 11);
  const left = -rowW / 2;
  marks.clear();
  marks.fillStyle(SHADOW, 1).fillPoints(diamond(left + 6, 0, 8), true);
  marks.fillStyle(badge.color, 1).fillPoints(diamond(left + 6, 0, 6), true);
  if (badge.locked) {
    const x = left + 24;
    marks.lineStyle(1.5, GOLD, 1).strokeCircle(x, -2, 3);
    marks.fillStyle(GOLD, 1).fillRect(x - 4.5, -1, 9, 7);
  }
  pips.clear();
  if (badge.pips) angerPips(pips, left + 22, badge.pips);
  const filled = badge.pips?.filled;
  if (filled !== undefined && token.pipsFilled !== undefined && filled !== token.pipsFilled && !reducedMotion()) {
    token.scene.tweens.killTweensOf(pips);
    pips.setScale(1);
    token.scene.tweens.add({ targets: pips, scale: 1.18, duration: MS.fast, ease: EASE.move, yoyo: true });
  }
  token.pipsFilled = filled;
}
