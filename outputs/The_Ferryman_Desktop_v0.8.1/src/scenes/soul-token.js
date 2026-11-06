import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { addArt, soulArtId } from '../preloader.js';
import { BODY_FONT, COLOR, angerPips } from '../theme.js';
import { tune } from '../tuning.js';
import { tailOffset } from './boarding-layout.js';
import { REAR_LIFT } from './delivery-layout.js';
import { WOOD } from './river-boat.js';

const BACK_SEAT = { w: 78, lid: 7, plank: 18, top: -14 }; // top: a soul's art ends a little above its feet

// The full-figure soul every scene draws. The frame is the soul's height on screen; art.*.fill and art.*.foot (theme.js) fit
// whatever image is there into it, so nothing here knows a file's pixel size or padding.
const GOLD = COLOR.gold;
const SHADOW = COLOR.deep;
const TAIL_POINTS = 14;

/** Which art frame a soul type uses: soul, long or hero. */
function artKind(type, Ferry) {
  if (type.startsWith('CHAR-') || type === 'SOUL-HERACLES' || type === 'SOUL-ODYSSEUS') return 'hero';
  return Ferry.data.souls.find((s) => s.id === type)?.tainted ? 'long' : 'soul';
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
 * walks; ride follows the boat rocking; body takes the lift and size; figure takes the bob, shake and lean; labels stay
 * still over the head.
 */
export function addBoardingSoul(scene, entry, height) {
  const kind = artKind(entry.actor.type, Ferry);
  const size = height * tune(`art.${kind}.fill`);
  const centreY = -(tune(`art.${kind}.foot`) - 0.5) * size; // the image's middle, with its base on the ground
  const glow = scene.add.image(0, -height / 2, 'board-soft').setScale((height * 1.5) / 256).setTint(GOLD).setAlpha(0);
  const shadow = scene.add.image(0, -2, 'board-soft').setScale(0.62, 0.11).setTint(SHADOW);
  const art = addArt(scene, 0, centreY, soulArtId(scene, entry.actor.type), size, { w: height * 0.5, h: height * 0.92, y: -height * 0.46 });
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
  const labels = scene.add.container(0, -height - 2, [name, marks, pips]);

  // A soft shaft of gold, for a soul at its wish (DeliveryScene).
  const beam = scene.add.image(0, -height * 0.9, 'board-soft').setScale(0.42, 2.1).setTint(GOLD).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  const ride = scene.add.container(0, 0, [shadow, beam, body, labels]);
  const token = scene.add.container(entry.x, entry.y, [ride]);
  token.setInteractive({ hitArea: new Phaser.Geom.Rectangle(-36, -height, 72, height), hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
  token.parts = { ride, shadow, beam, body, figure, glow, rim, rope, name, marks, pips, labels };
  token.seed = Math.random() * Math.PI * 2; // so a row of souls does not sway in step
  return token;
}

/** The slow bob every soul has at rest. */
export function startBreathing(scene, token) {
  scene.tweens.add({
    targets: token.parts.figure,
    y: -tune('boarding.bobPx'),
    duration: tune('boarding.bobMs'),
    delay: Math.random() * 1200, // so a row of souls does not breathe in step
    ease: 'Sine.InOut',
    yoyo: true,
    repeat: -1,
  });
}

/** Bends the tail for this frame. amp is in game pixels at the tail tip, whatever the sprite's size. */
export function swayTail(token, t, amp, speed) {
  const { rope } = token.parts;
  if (!rope) return;
  const textureAmp = amp / rope.scaleX;
  rope.points.forEach((point, i) => { point.x = tailOffset(i / (TAIL_POINTS - 1), t, token.seed, textureAmp, speed); });
  rope.updateVertices();
}

/** Shows or hides the wooden seat at the back of the deck, under a soul the rules give no seat. */
export function setBackSeat(token, on) {
  if (on && !token.parts.backSeat) {
    const { w, lid, plank, top } = BACK_SEAT;
    const seat = token.scene.add.graphics();
    seat.fillStyle(WOOD.plank, 1).fillRect(-w / 2 + 5, top, w - 10, REAR_LIFT - top);
    seat.lineStyle(1, WOOD.post, 1);
    for (let y = top + plank; y < REAR_LIFT; y += plank) seat.lineBetween(-w / 2 + 5, y, w / 2 - 5, y);
    seat.fillStyle(WOOD.edge, 1).fillRoundedRect(-w / 2, top - 2, w, lid, 2);
    token.parts.ride.addAt(seat, 0);
    token.parts.backSeat = seat;
  }
  token.parts.backSeat?.setVisible(on);
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
}
