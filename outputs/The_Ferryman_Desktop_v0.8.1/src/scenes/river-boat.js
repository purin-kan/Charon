// The boat as scenes other than BoardingScene draw it: the image (or the drawn hull) with its lantern glow, in a container
// whose (0, 0) is the middle of the deck floor. Put seated souls in the container before the hull, so its side hides their
// tails: boat.seat(token). Positions come from the art.boat.* frame values, never from the file's pixels.
import Phaser from 'phaser';
import { t } from '../text.js';
import { COLOR, CSS, headText } from '../theme.js';
import { tune } from '../tuning.js';
import { boatSway } from './boarding-layout.js';

const LANTERN_SCALE = 1.1;
export const WOOD = { plank: 0x2b1e14, edge: 0x6b5233, post: 0x1f1610 };

// The dock's drawing, all relative to the centre of DOCK. Souls stand where delivery-layout says; this is only the look.
// The left edge runs off the screen, so the dock reads as joined to the land. Its bottom edge passes behind the panel.
const DOCK_ART = {
  left: -360, right: 285, top: -310, bottom: 285, // the texture's frame
  scale: 2,
  back: -195, front: 190, // the deck's far and near edges
  vanish: -40, backScale: 0.88, // the far edge is narrower, around this x
  end: 258, // the deck's river end, at the near edge
  board: 30,
  posts: [-300, -170, -40, 90, 190],
  piles: [-310, -190, -70, 50, 170],
  bollards: [0.38, 0.78],
  sign: { x: -203, y: -207, w: 84, h: 30 },
  lantern: { x: 167, y: -270, u: 225, height: 105, arm: 26 },
  glowTint: 0x7a5426,
};

/** The boards, posts and ropes, painted once into a canvas. No image file, so nothing here can be missing. */
function paintDock(ctx) {
  const A = DOCK_ART;
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const at = (u, d) => [A.vanish + (u - A.vanish) * (A.backScale + (1 - A.backScale) * d), A.back + (A.front - A.back) * d];
  const span = (u0, u1, d0 = 0, d1 = 1) => {
    ctx.beginPath();
    ctx.moveTo(...at(u0, d0));
    ctx.lineTo(...at(u1, d0));
    ctx.lineTo(...at(u1, d1));
    ctx.lineTo(...at(u0, d1));
    ctx.closePath();
  };
  const dot = (x, y, r, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  const roundBar = (x, y, w, h, light) => { // an upright round timber, lit from the lantern side
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, '#120c07');
    g.addColorStop(0.62, light);
    g.addColorStop(1, '#1a110a');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
  };

  ctx.save();
  ctx.scale(A.scale, A.scale);
  ctx.translate(-A.left, -A.top);

  // Under the deck: its shadow on the water, then the piles going down into it.
  const under = ctx.createLinearGradient(0, A.front + 20, 0, A.bottom);
  under.addColorStop(0, 'rgba(2,5,8,0.8)');
  under.addColorStop(1, 'rgba(2,5,8,0)');
  ctx.fillStyle = under;
  ctx.fillRect(A.left, A.front + 20, at(A.end, 1)[0] - A.left + 12, A.bottom - A.front - 20);
  for (const u of A.piles) {
    const x = at(u, 1)[0];
    roundBar(x - 12, A.front + 12, 24, A.bottom - A.front - 26, '#4b3726');
    const fade = ctx.createLinearGradient(0, A.front + 30, 0, A.bottom - 14);
    fade.addColorStop(0, 'rgba(4,10,14,0.15)');
    fade.addColorStop(1, 'rgba(4,10,14,0.95)');
    ctx.fillStyle = fade;
    ctx.fillRect(x - 12, A.front + 30, 24, A.bottom - A.front - 44);
    ctx.strokeStyle = 'rgba(190,205,225,0.16)';
    ctx.lineWidth = 1;
    for (const r of [20, 30]) {
      ctx.beginPath();
      ctx.ellipse(x, A.bottom - 14, r, r / 5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // The boards, each its own tone, with grain, joints, knots and the nails over the joists.
  for (let u = A.left * 1.3; u < A.end; u += A.board) {
    const right = Math.min(u + A.board, A.end);
    const tone = rand();
    const [r, g, b] = [66 + tone * 30, 49 + tone * 23, 33 + tone * 15].map(Math.round);
    const fill = ctx.createLinearGradient(0, A.back, 0, A.front);
    fill.addColorStop(0, `rgb(${Math.round(r * 0.7)},${Math.round(g * 0.7)},${Math.round(b * 0.74)})`);
    fill.addColorStop(1, `rgb(${r},${g},${b})`);
    span(u, right);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.lineWidth = 0.7;
    for (let line = 0; line < 7; line++) {
      const across = u + 2 + rand() * (A.board - 4);
      const wander = rand() * Math.PI * 2;
      ctx.strokeStyle = rand() < 0.68 ? 'rgba(18,10,5,0.34)' : 'rgba(176,138,96,0.13)';
      ctx.beginPath();
      for (let step = 0; step <= 10; step++) {
        const d = step / 10;
        const [x, y] = at(across + Math.sin(wander + d * 5) * 1.6, d);
        if (step) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.stroke();
    }
    if (rand() < 0.3) {
      const [x, y] = at(u + A.board / 2, 0.1 + rand() * 0.8);
      for (const [size, color] of [[6, 'rgba(70,46,28,0.8)'], [3.6, 'rgba(26,15,8,0.9)']]) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.7, size, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (rand() < 0.65) {
      const d = 0.12 + rand() * 0.76;
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(8,5,3,0.9)';
      ctx.beginPath();
      ctx.moveTo(...at(u, d));
      ctx.lineTo(...at(right, d));
      ctx.stroke();
    }
    for (const d of [0.1, 0.5, 0.9]) {
      for (const side of [7, A.board - 7]) {
        const [x, y] = at(u + side, d);
        dot(x, y, 1.5, 'rgba(10,7,5,0.9)');
        dot(x - 0.4, y - 0.4, 0.6, 'rgba(190,175,150,0.5)');
      }
    }
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(6,4,2,0.95)';
    ctx.beginPath();
    ctx.moveTo(...at(u, 0));
    ctx.lineTo(...at(u, 1));
    ctx.stroke();
  }

  // Night on the boards: far boards fall dark, the lantern pools warm, a little moon lies on the wet wood.
  ctx.save();
  span(A.left * 1.3, A.end);
  ctx.clip();
  const far = ctx.createLinearGradient(0, A.back, 0, A.back + 210);
  far.addColorStop(0, 'rgba(4,9,14,0.62)');
  far.addColorStop(1, 'rgba(4,9,14,0)');
  ctx.fillStyle = far;
  ctx.fillRect(A.left, A.back, A.right - A.left, 210);
  const side = ctx.createLinearGradient(A.left, 0, 60, 0);
  side.addColorStop(0, 'rgba(3,6,10,0.6)');
  side.addColorStop(1, 'rgba(3,6,10,0)');
  ctx.fillStyle = side;
  ctx.fillRect(A.left, A.back, 420, A.front - A.back);
  const [poolX, poolY] = [A.lantern.x, A.back + 60];
  const pool = ctx.createRadialGradient(poolX, poolY, 8, poolX, poolY, 300);
  pool.addColorStop(0, 'rgba(255,176,86,0.36)');
  pool.addColorStop(0.45, 'rgba(255,150,70,0.12)');
  pool.addColorStop(1, 'rgba(255,150,70,0)');
  ctx.fillStyle = pool;
  ctx.fillRect(A.left, A.back, A.right - A.left, A.front - A.back);
  const moon = ctx.createLinearGradient(-260, A.back, 80, A.front);
  moon.addColorStop(0.3, 'rgba(130,150,205,0)');
  moon.addColorStop(0.5, 'rgba(130,150,205,0.09)');
  moon.addColorStop(0.7, 'rgba(130,150,205,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(A.left, A.back, A.right - A.left, A.front - A.back);
  ctx.restore();

  // The stringer along the river end, and the beam across the near edge with its bolts.
  span(A.end, A.end + 14);
  ctx.fillStyle = '#5c452f';
  ctx.fill();
  ctx.strokeStyle = 'rgba(8,5,3,0.9)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  const edge = at(A.end + 14, 1)[0];
  const beam = ctx.createLinearGradient(0, A.front, 0, A.front + 26);
  beam.addColorStop(0, '#5a432e');
  beam.addColorStop(0.3, '#3b2a1c');
  beam.addColorStop(1, '#170f09');
  ctx.fillStyle = beam;
  ctx.fillRect(A.left, A.front, edge - A.left, 26);
  ctx.fillStyle = 'rgba(214,176,124,0.22)';
  ctx.fillRect(A.left, A.front, edge - A.left, 1.4);
  for (let x = A.left + 26; x < edge; x += 62) {
    dot(x, A.front + 13, 3, '#0d0805');
    dot(x - 0.7, A.front + 12.3, 1.3, 'rgba(160,150,135,0.7)');
  }

  // The rope rail along the far edge, with the sign hanging from it.
  const postTop = A.back - 46;
  const tops = A.posts.map((u) => at(u, 0)[0]);
  for (let i = 1; i < tops.length; i++) {
    const [x0, x1] = [tops[i - 1], tops[i]];
    for (const [width, color, dash] of [[5, 'rgba(8,5,3,0.75)', []], [3, '#8b7350', []], [3, 'rgba(38,26,15,0.7)', [3, 3]]]) {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      ctx.setLineDash(dash);
      ctx.beginPath();
      ctx.moveTo(x0, postTop + 8);
      ctx.quadraticCurveTo((x0 + x1) / 2, postTop + 26, x1, postTop + 8);
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }
  for (const x of tops) {
    roundBar(x - 7, postTop, 14, 50, '#5d4530');
    ctx.fillStyle = '#6e5539';
    ctx.beginPath();
    ctx.ellipse(x, postTop, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const { sign } = A;
  ctx.strokeStyle = '#2c2015';
  ctx.lineWidth = 1.6;
  for (const x of [sign.x - 26, sign.x + 26]) {
    ctx.beginPath();
    ctx.moveTo(x, postTop + 15);
    ctx.lineTo(x, sign.y - sign.h / 2);
    ctx.stroke();
  }
  const plate = ctx.createLinearGradient(0, sign.y - sign.h / 2, 0, sign.y + sign.h / 2);
  plate.addColorStop(0, '#59432d');
  plate.addColorStop(1, '#342417');
  ctx.fillStyle = plate;
  ctx.fillRect(sign.x - sign.w / 2, sign.y - sign.h / 2, sign.w, sign.h);
  ctx.strokeStyle = '#120b06';
  ctx.strokeRect(sign.x - sign.w / 2, sign.y - sign.h / 2, sign.w, sign.h);

  // The lantern post at the river end.
  const { lantern } = A;
  const [postX, postY] = at(lantern.u, 0.03);
  const headY = postY - lantern.height;
  roundBar(postX - 6, headY, 12, lantern.height + 4, '#5a432e');
  ctx.fillStyle = '#2a1d13';
  ctx.fillRect(postX - lantern.arm - 2, headY + 6, lantern.arm + 6, 5);
  const [boxX, boxY] = [postX - lantern.arm, headY + 12];
  ctx.strokeStyle = '#17100a';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(boxX, headY + 10);
  ctx.lineTo(boxX, boxY + 3);
  ctx.stroke();
  const flame = ctx.createRadialGradient(boxX, boxY + 15, 1, boxX, boxY + 15, 15);
  flame.addColorStop(0, '#fff0c4');
  flame.addColorStop(0.5, '#f7b75c');
  flame.addColorStop(1, '#a4601f');
  ctx.fillStyle = flame;
  ctx.fillRect(boxX - 8, boxY + 3, 16, 24);
  ctx.strokeStyle = '#1a120b';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(boxX - 8, boxY + 3, 16, 24);
  ctx.beginPath();
  ctx.moveTo(boxX, boxY + 3);
  ctx.lineTo(boxX, boxY + 27);
  ctx.stroke();
  ctx.fillStyle = '#21170e';
  ctx.beginPath();
  ctx.moveTo(boxX - 11, boxY + 3);
  ctx.lineTo(boxX, boxY - 5);
  ctx.lineTo(boxX + 11, boxY + 3);
  ctx.closePath();
  ctx.fill();

  // The bollards on the river end, with their mooring rope.
  for (const d of A.bollards) {
    const [x, y] = at(A.end - 8, d);
    ctx.fillStyle = 'rgba(4,3,2,0.6)';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    roundBar(x - 12, y - 30, 24, 30, '#664b33');
    ctx.fillStyle = '#7b5e41';
    ctx.beginPath();
    ctx.ellipse(x, y - 30, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const lift of [10, 15, 20]) {
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8b7350';
      ctx.beginPath();
      ctx.ellipse(x, y - lift, 13, 4.5, 0, 0, Math.PI);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** The dock of a stop, as CrossingScene and DeliveryScene both draw it. Returns its parts, for a scene to place or fade. */
export function addDock(scene, x, y) {
  const A = DOCK_ART;
  if (!scene.textures.exists('dock-boards')) {
    const texture = scene.textures.createCanvas('dock-boards', (A.right - A.left) * A.scale, (A.bottom - A.top) * A.scale);
    paintDock(texture.getContext());
    texture.refresh();
  }
  const boards = scene.add.image(x + (A.left + A.right) / 2, y + (A.top + A.bottom) / 2, 'dock-boards').setScale(1 / A.scale);
  const glow = scene.add.image(x + A.lantern.x, y + A.lantern.y, 'board-soft').setTint(A.glowTint).setBlendMode(Phaser.BlendModes.ADD).setScale(0.8);
  scene.tweens.add({ targets: glow, scaleX: 0.88, scaleY: 0.88, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  const label = scene.add.text(x + A.sign.x, y + A.sign.y, t('delivery.dock'), headText(15, CSS.gold)).setOrigin(0.5);
  return [boards, glow, label];
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
