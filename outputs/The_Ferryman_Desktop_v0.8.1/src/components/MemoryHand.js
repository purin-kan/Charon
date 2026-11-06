import { Ferry } from '../ferry.js';
import { addArt } from '../preloader.js';
import { COLOR as THEME, CSS, bodyText, drawPanel, headText } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { TEXT, memoryHand, playAction } from './memory-layout.js';

defineTuning({
  'hud.handRight': { type: 'number', default: 1256, min: 900, max: 1280, step: 1, help: 'Right edge of the memory hand' },
  'hud.handY': { type: 'number', default: 20, min: 0, max: 200, step: 1, help: 'Top edge of the memory hand' },
  'hud.miniW': { type: 'number', default: 64, min: 40, max: 120, step: 1, help: 'Small memory card' },
  'hud.miniH': { type: 'number', default: 84, min: 50, max: 160, step: 1 },
  'hud.miniArt': { type: 'number', default: 58, min: 16, max: 100, step: 1, help: 'Memory art on a small card' },
});

// Memory hand (T-16): a component, not a scene. BoardingScene, CrossingScene and ReturnScene each
// create one, call render(state) on every 'ferry-state', and highlight souls while a card waits for
// a target (see onTargets). Style follows TitleScene (T-11) and BoardingScene (T-12).
//
//   this.hand = new MemoryHand(this, { x: 40, y: 400, onTargets: (ids) => this.highlight(ids) });
//   this.hand.render(state);                  // in create() and in the 'ferry-state' handler
//   this.hand.pickTarget(actorId);            // when a highlighted soul is clicked
//   preload(): queueAssets(this, { art: MemoryHand.artIds() })
//   Optional onHover(card | null): called when the pointer enters or leaves a card, so a host can
//   show the full card while the hand is drawn small (CrossingScene's strip).

export const CARD = { w: 200, h: 230, gap: 20, lift: 16 };
const BODY_LINES = 4;

function cardFace(scene, w, h, picked) {
  const face = scene.add.graphics();
  face.fillStyle(picked ? THEME.panelHi : THEME.panel, 0.97).fillRoundedRect(-w / 2, -h / 2, w, h, 10);
  face.lineStyle(picked ? 2 : 1, THEME.gold, picked ? 1 : 0.4).strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
  return face;
}

/**
 * Draws one memory card as a Container centred on (x, y). Used by the hand and by TrimOverlay.
 * @param {{type:string,name:string,text:string,source:string}} card
 * @param {{picked?:boolean, dim?:boolean, footer?:string}} look
 */
export function drawCard(scene, x, y, card, look = {}) {
  const { w, h } = CARD;
  const panel = cardFace(scene, w, h, look.picked);
  const inner = w - 28;
  // One line for the name: long names ("Full Fog Protection") shrink instead of wrapping into the art.
  const name = scene.add.text(-w / 2 + 14, -h / 2 + 12, card.name, headText(16, look.picked ? CSS.gold : CSS.bone));
  for (let size = 15; name.width > inner && size >= 10; size -= 1) name.setFontSize(size);
  const art = addArt(scene, 0, -h / 2 + 76, card.type, tune('art.memory.size'));
  // Four lines of rule text at most; longer texts end with an ellipsis (full text in rules/content.json).
  const body = scene.add.text(-w / 2 + 14, -h / 2 + 112, '', bodyText(16, CSS.bone, { wordWrap: { width: inner }, lineSpacing: -1 }));
  const lines = body.getWrappedText(card.text);
  if (lines.length > BODY_LINES) {
    lines.length = BODY_LINES;
    // Drop the last word for room, and any punctuation left before the ellipsis ("PoLong.…").
    lines[BODY_LINES - 1] = lines[BODY_LINES - 1].replace(/\s*\S*\s*$/, '').replace(/[\s.,;:]+$/, '') + '…';
  }
  body.setText(lines);
  // The footer grows upwards from the bottom edge, so a two-line prompt stays inside the card.
  const footerText = look.footer ?? TEXT.from(card.source);
  const footer = scene.add.text(-w / 2 + 14, h / 2 - 10, footerText, bodyText(15, look.picked ? CSS.gold : CSS.muted, { wordWrap: { width: inner } })).setOrigin(0, 1);
  const box = scene.add.container(x, y, [panel, name, art, body, footer]);
  box.setSize(w, h);
  box.setAlpha(look.dim ? 0.5 : 1);
  return box;
}

/** A small card for the HUD: the art and nothing else. The host shows the full text on hover. */
function drawMiniCard(scene, x, y, card, look = {}) {
  const w = tune('hud.miniW');
  const h = tune('hud.miniH');
  const box = scene.add.container(x, y, [cardFace(scene, w, h, look.picked), addArt(scene, 0, 0, card.type, tune('hud.miniArt'))]);
  box.setSize(w, h);
  box.setAlpha(look.dim ? 0.55 : 1);
  return box;
}

export class MemoryHand {
  /** Art ids to queue in the host scene's preload(); missing files become letter emblems. */
  static artIds() { return Ferry.data.memories.map((m) => m.id); }

  /**
   * @param {Phaser.Scene} scene host scene (must have scene.game.router)
   * @param {{x?:number, y?:number, onTargets?:(ids:string[]|null)=>void, onHover?:(card:object|null)=>void}} opts
   *   x, y: top-left of the hand. onTargets: called with the legal target ids when a card that needs a
   *   target is picked, and with null when the pick ends (played or cancelled).
   *   compact: the HUD hand, small cards in a plate at the top right of the screen; x and y are ignored.
   */
  constructor(scene, { x = 40, y = 400, onTargets = () => {}, onHover = () => {}, compact = false } = {}) {
    this.scene = scene;
    this.onHover = onHover;
    this.x = x;
    this.y = y;
    this.compact = compact;
    this.onTargets = onTargets;
    this.picked = null; // card waiting for a target
    this.cards = [];
    this.root = scene.add.container(0, 0).setDepth(compact ? 12 : 5);
    this.plate = scene.add.graphics();
    this.counter = scene.add.text(x, y, '', bodyText(18, CSS.muted));
    this.message = scene.add.text(x, y + 34 + CARD.h + 12, '', bodyText(17, CSS.gold, compact ? { align: 'right', wordWrap: { width: 340 } } : {}));
    this.cancelBtn = scene.add.text(0, 0, TEXT.cancel, bodyText(18, CSS.gold, { backgroundColor: CSS.ink, padding: { x: 12, y: 4 } }))
      .setInteractive({ useHandCursor: true }).setVisible(false);
    this.cancelBtn.on('pointerdown', () => this.cancel());
    this.root.add([this.plate, this.counter, this.message, this.cancelBtn]);
    scene.events.once('shutdown', () => this.destroy());
  }

  get router() { return this.scene.game.router; }

  /** Rebuilds the cards from state. A pending pick survives if that card can still target. */
  render(state) {
    const view = memoryHand(state, Ferry);
    this.cards = view.cards;
    this.counter.setText(view.counter);
    if (this.picked) {
      const before = this.picked.targets.join();
      const still = view.cards.find((c) => c.id === this.picked.id && c.playable && c.needsTarget);
      this.picked = still ?? null;
      // Only a real change: a host that renders in onTargets calls render again, so telling it every time never ends.
      if (this.picked?.targets.join() !== before) this.onTargets(this.picked ? this.picked.targets : null);
    }
    if (this.cardObjects?.length) this.onHover(null); // a destroyed card never gets its pointerout
    for (const obj of this.cardObjects ?? []) obj.destroy();
    if (this.compact) {
      this.renderCompact(view);
      return;
    }
    this.cardObjects = view.cards.map((card, i) => {
      const picked = this.picked?.id === card.id;
      const cx = this.x + CARD.w / 2 + i * (CARD.w + CARD.gap);
      const cy = this.y + 34 + CARD.h / 2 - (picked ? CARD.lift : 0);
      const box = drawCard(this.scene, cx, cy, card, {
        picked,
        dim: !card.playable,
        footer: picked ? TEXT.chooseTarget(card.name) : undefined,
      });
      box.setInteractive({ useHandCursor: card.playable });
      box.on('pointerdown', () => this.press(card));
      box.on('pointerover', () => this.onHover(card));
      box.on('pointerout', () => this.onHover(null));
      this.root.add(box);
      return box;
    });
    const right = this.x + view.cards.length * (CARD.w + CARD.gap);
    this.cancelBtn.setPosition(right, this.y + 34 + CARD.h - 40).setVisible(!!this.picked);
    if (!this.picked) this.say(view.note, false);
  }

  /** The HUD hand: a plate at the top right that grows to the left with the cards. */
  renderCompact(view) {
    const right = tune('hud.handRight');
    const top = tune('hud.handY');
    const w = tune('hud.miniW');
    const h = tune('hud.miniH');
    const pad = 12;
    const gap = 8;
    const n = view.cards.length;
    const plateW = Math.max(150, pad * 2 + n * w + Math.max(0, n - 1) * gap);
    const plateH = n ? 40 + h + pad : 40;
    this.plate.clear();
    drawPanel(this.plate, right - plateW, top, plateW, plateH);
    this.counter.setOrigin(1, 0.5).setPosition(right - pad - 4, top + 20);
    this.cardObjects = view.cards.map((card, i) => {
      const picked = this.picked?.id === card.id;
      const cx = right - pad - w / 2 - (n - 1 - i) * (w + gap);
      const box = drawMiniCard(this.scene, cx, top + 40 + h / 2 - (picked ? 3 : 0), card, { picked, dim: !card.playable });
      box.setInteractive({ useHandCursor: card.playable });
      box.on('pointerdown', () => this.press(card));
      box.on('pointerover', () => this.onHover(card));
      box.on('pointerout', () => this.onHover(null));
      this.root.add(box);
      return box;
    });
    const below = top + plateH + 8;
    this.message.setOrigin(1, 0).setPosition(right, below);
    this.cancelBtn.setOrigin(1, 0).setPosition(right, below + 26).setVisible(!!this.picked);
    if (this.picked) this.say(TEXT.chooseTarget(this.picked.name), false);
    else this.say(n > view.limit ? view.note : '', false); // a card says why it can't be played when clicked or hovered
  }

  press(card) {
    if (!card.playable) return this.say(card.reason);
    if (this.picked?.id === card.id) return this.cancel();
    if (!card.needsTarget) return this.play(playAction(card));
    this.picked = card;
    this.onTargets(card.targets);
    this.say('', false); // the picked card itself shows "Choose a target for ..."; the compact hand says it in render
    this.render(this.router.state);
  }

  /** Host scene calls this when the player clicks a soul while a card is picked. Returns true if played. */
  pickTarget(targetId) {
    if (!this.picked || !this.picked.targets.includes(targetId)) return false;
    const action = playAction(this.picked, targetId);
    this.picked = null;
    this.onTargets(null);
    return this.play(action);
  }

  cancel() {
    if (!this.picked) return;
    this.picked = null;
    this.onTargets(null);
    this.render(this.router.state);
  }

  /** Dispatches through the router (which re-renders us via 'ferry-state'). Engine refusals are shown. */
  play(action) {
    try {
      this.router.dispatch(action);
      return true;
    } catch (err) {
      this.say(err.message);
      this.render(this.router.state);
      return false;
    }
  }

  say(text, flash = true) {
    this.message.setText(text ?? '');
    this.timer?.remove();
    if (flash && text) this.timer = this.scene.time.delayedCall(2000, () => this.message.setText(''));
  }

  destroy() {
    this.timer?.remove();
    if (this.root?.scene) this.root.destroy(); // the scene may already have destroyed it
    this.root = null;
  }
}

export default MemoryHand;
