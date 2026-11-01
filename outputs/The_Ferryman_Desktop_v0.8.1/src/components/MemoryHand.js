import { Ferry } from '../ferry.js';
import { addArt } from '../preloader.js';
import { TEXT, memoryHand, playAction } from './memory-layout.js';

// Memory hand (T-16): a component, not a scene. BoardingScene, CrossingScene and ReturnScene each
// create one, call render(state) on every 'ferry-state', and highlight souls while a card waits for
// a target (see onTargets). Style follows TitleScene (T-11) and BoardingScene (T-12).
//
//   this.hand = new MemoryHand(this, { x: 40, y: 400, onTargets: (ids) => this.highlight(ids) });
//   this.hand.render(state);                  // in create() and in the 'ferry-state' handler
//   this.hand.pickTarget(actorId);            // when a highlighted soul is clicked
//   preload(): queueAssets(this, { art: MemoryHand.artIds() })

const FONT = 'sans-serif';
export const CARD = { w: 200, h: 230, gap: 20, lift: 16 };
const COLOR = {
  card: 0x1d2c38, cardStroke: 0x7fa6c0, picked: 0x2c4a51, gold: 0xedc47f,
  name: '#e8f1f7', body: '#cfe3f0', muted: '#9fb6c6', goldText: '#edc47f', message: '#e8c27f',
};

/**
 * Draws one memory card as a Container centred on (x, y). Used by the hand and by TrimOverlay.
 * @param {{type:string,name:string,text:string,source:string}} card
 * @param {{picked?:boolean, dim?:boolean, footer?:string}} look
 */
export function drawCard(scene, x, y, card, look = {}) {
  const { w, h } = CARD;
  const panel = scene.add.rectangle(0, 0, w, h, look.picked ? COLOR.picked : COLOR.card)
    .setStrokeStyle(look.picked ? 2 : 1, look.picked ? COLOR.gold : COLOR.cardStroke);
  const name = scene.add.text(-w / 2 + 14, -h / 2 + 12, card.name, {
    fontFamily: FONT, fontSize: '22px', color: look.picked ? COLOR.goldText : COLOR.name, wordWrap: { width: w - 28 },
  });
  const art = addArt(scene, 0, -h / 2 + 82, card.type, 56);
  const body = scene.add.text(-w / 2 + 14, -h / 2 + 118, card.text, {
    fontFamily: FONT, fontSize: '14px', color: COLOR.body, wordWrap: { width: w - 28 }, lineSpacing: 2,
  });
  // Long engine texts are cut to the card; the full text stays in rules/content.json.
  body.setCrop(0, 0, w - 28, 72);
  const footerText = look.footer ?? TEXT.from(card.source);
  const footer = scene.add.text(-w / 2 + 14, h / 2 - 28, footerText, {
    fontFamily: FONT, fontSize: '14px', color: look.picked ? COLOR.goldText : COLOR.muted, wordWrap: { width: w - 28 },
  });
  const box = scene.add.container(x, y, [panel, name, art, body, footer]);
  box.setSize(w, h);
  box.setAlpha(look.dim ? 0.5 : 1);
  return box;
}

export class MemoryHand {
  /** Art ids to queue in the host scene's preload(); missing files become letter emblems. */
  static artIds() { return Ferry.data.memories.map((m) => m.id); }

  /**
   * @param {Phaser.Scene} scene host scene (must have scene.game.router)
   * @param {{x?:number, y?:number, onTargets?:(ids:string[]|null)=>void}} opts
   *   x, y: top-left of the hand. onTargets: called with the legal target ids when a card that needs a
   *   target is picked, and with null when the pick ends (played or cancelled).
   */
  constructor(scene, { x = 40, y = 400, onTargets = () => {} } = {}) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.onTargets = onTargets;
    this.picked = null; // card waiting for a target
    this.cards = [];
    this.root = scene.add.container(0, 0).setDepth(5);
    this.counter = scene.add.text(x, y, '', { fontFamily: FONT, fontSize: '20px', color: COLOR.muted });
    this.message = scene.add.text(x, y + 34 + CARD.h + 12, '', { fontFamily: FONT, fontSize: '18px', color: COLOR.message });
    this.cancelBtn = scene.add.text(0, 0, TEXT.cancel, {
      fontFamily: FONT, fontSize: '22px', color: '#f3ecd9', backgroundColor: '#1d363c', padding: { x: 14, y: 6 },
    }).setInteractive({ useHandCursor: true }).setVisible(false);
    this.cancelBtn.on('pointerdown', () => this.cancel());
    this.root.add([this.counter, this.message, this.cancelBtn]);
    scene.events.once('shutdown', () => this.destroy());
  }

  get router() { return this.scene.game.router; }

  /** Rebuilds the cards from state. A pending pick survives if that card can still target. */
  render(state) {
    const view = memoryHand(state, Ferry);
    this.cards = view.cards;
    this.counter.setText(view.counter);
    if (this.picked) {
      const still = view.cards.find((c) => c.id === this.picked.id && c.playable && c.needsTarget);
      this.picked = still ?? null;
      this.onTargets(this.picked ? this.picked.targets : null);
    }
    for (const obj of this.cardObjects ?? []) obj.destroy();
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
      this.root.add(box);
      return box;
    });
    const right = this.x + view.cards.length * (CARD.w + CARD.gap);
    this.cancelBtn.setPosition(right, this.y + 34 + CARD.h - 40).setVisible(!!this.picked);
    if (!this.picked) this.say(view.note, false);
  }

  press(card) {
    if (!card.playable) return this.say(card.reason);
    if (this.picked?.id === card.id) return this.cancel();
    if (!card.needsTarget) return this.play(playAction(card));
    this.picked = card;
    this.onTargets(card.targets);
    this.say(TEXT.chooseTarget(card.name), false);
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
