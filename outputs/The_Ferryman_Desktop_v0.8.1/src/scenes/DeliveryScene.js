import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { defineTuning, tune } from '../tuning.js';
import { boatZone, statusLine } from './boarding-layout.js';
import {
  DOCK, REWARD, applyDrop, arrivalOutcome, confirmLabel, deliverAction, dropArea, headingText,
  introText, layoutDelivery, lossLines, rewardSpots,
} from './delivery-layout.js';
import { addSoulToken, setTokenLabels } from './soul-token.js';

const DRAG_START_PX = 6;
const FONT = 'sans-serif';
const GOLD = 0xedc47f;
const STROKE = 0x7fa6c0;

defineTuning({
  'delivery.departDistance': { type: 'number', default: 120, min: 0, max: 400, step: 10, help: 'How far a soul walks off the dock' },
  'delivery.rewardMs': { type: 'number', default: 1600, min: 200, max: 6000, step: 100, help: 'How long a memory reward stays' },
});

export class DeliveryScene extends Phaser.Scene {
  constructor() {
    super('DeliveryScene');
  }

  get router() { return this.game.router; }

  preload() {
    const { destination } = this.registry.get('state');
    queueAssets(this, { art: Ferry.data.souls.map((s) => s.id), backgrounds: destination ? [destination] : [] });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'})`);
    this.tokens = new Map();
    this.entries = new Map();
    this.marked = [];
    this.leaving = false;

    if (this.textures.exists(state.destination)) this.add.image(640, 360, state.destination).setDisplaySize(1280, 720);
    this.slots = layoutDelivery(state, [], Ferry).slots;
    this.drawBoat();
    this.drawHud(state);
    this.render(state);

    // Without a threshold a click counts as a drag.
    this.input.dragDistanceThreshold = DRAG_START_PX;
    this.input.on('drag', (_pointer, token, x, y) => token.setPosition(x, y));
    this.input.on('dragstart', (_pointer, token) => {
      this.tweens.killTweensOf(token);
      token.setDepth(2);
    });
    this.input.on('dragend', (pointer, token) => {
      token.setDepth(1);
      this.drop(token, dropArea(pointer.worldX, pointer.worldY, this.slots));
    });

    // A trim or choice overlay can open after DELIVER. It closes on a state this handler then leaves from.
    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) this.router.exitDone();
      else if (s.phase === 'delivery') this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  drawBoat() {
    const hull = boatZone(this.slots);
    this.add.rectangle(hull.x, hull.y, hull.w, hull.h, 0x2a3b49);
    for (const slot of this.slots) {
      this.add.rectangle(slot.x, slot.y, slot.w, slot.h, 0x16232e).setStrokeStyle(2, 0x3d5566);
    }
    this.add.rectangle(DOCK.x, DOCK.y, DOCK.w, DOCK.h, 0x3a3226).setStrokeStyle(2, 0x6b5a3f);
    this.add.text(DOCK.x - DOCK.w / 2 + 12, DOCK.y - DOCK.h / 2 + 8, t('delivery.dock'), { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' });
  }

  drawHud(state) {
    this.status = this.add.text(40, 24, '', { fontFamily: FONT, fontSize: '24px', color: '#e8f1f7' });
    this.add.text(640, 70, headingText(state, Ferry, t), { fontFamily: FONT, fontSize: '26px', color: '#edc47f' }).setOrigin(0.5);
    this.intro = this.add.text(640, 102, introText(state, t), { fontFamily: FONT, fontSize: '16px', color: '#cfe3f0' }).setOrigin(0.5);
    this.message = this.add.text(640, 610, '', { fontFamily: FONT, fontSize: '20px', color: '#e8c27f' }).setOrigin(0.5);
    const style = { fontFamily: FONT, fontSize: '24px', color: '#0b1117', backgroundColor: '#7fa6c0', padding: { x: 12, y: 6 } };
    this.confirmBtn = this.add.text(1000, 664, '', style).setOrigin(0.5).setInteractive({ useHandCursor: true });
    this.confirmBtn.on('pointerdown', () => this.confirm());
  }

  say(text) {
    this.message.setText(text);
    this.messageTimer?.remove();
    this.messageTimer = this.time.delayedCall(tune('boarding.messageMs'), () => this.message.setText(''));
  }

  /** Applies a finished drag to the marked list. Nothing reaches the engine until confirm. */
  drop(token, area) {
    const state = this.registry.get('state');
    const { marked, reason } = applyDrop(state, this.marked, this.entries.get(token.getData('id')), area, Ferry);
    this.marked = marked;
    if (reason) this.say(reason);
    this.render(state);
  }

  /** Plays the result first, because the router opens overlays the moment the state changes. */
  confirm() {
    if (this.leaving) return;
    const state = this.registry.get('state');
    const action = deliverAction(this.marked);
    let next;
    try {
      next = Ferry.transition(state, action);
    } catch (err) {
      this.say(err.message);
      return;
    }
    this.leaving = true;
    for (const token of this.tokens.values()) this.input.setDraggable(token, false);
    this.confirmBtn.setVisible(false).disableInteractive();
    const outcome = arrivalOutcome(state, next, this.marked, Ferry);
    this.playDeparture(outcome.departed, () => this.showRewards(outcome, () => this.router.dispatch(action)));
  }

  playDeparture(ids, done) {
    if (!ids.length) {
      done();
      return;
    }
    const tokens = ids.map((id) => this.tokens.get(id));
    // A soul can still be gliding to the dock, and that tween would fight this one.
    this.tweens.killTweensOf(tokens);
    ids.forEach((id, i) => tokens[i].setPosition(this.entries.get(id).x, this.entries.get(id).y));
    this.tweens.add({
      targets: tokens,
      x: `-=${tune('delivery.departDistance')}`,
      alpha: 0,
      duration: tune('delivery.departMs'),
      ease: tune('delivery.departEase'),
      onComplete: done,
    });
  }

  showRewards(outcome, done) {
    const { rewards } = outcome;
    const losses = lossLines(outcome, t);
    if (!rewards.length && !losses.length) {
      done();
      return;
    }
    const spots = rewardSpots(rewards.length);
    const { width, height } = this.scale;
    const parts = [this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(3)];
    if (rewards.length) {
      parts.push(this.add.text(640, REWARD.y - 120, t('delivery.received'), { fontFamily: FONT, fontSize: '26px', color: '#edc47f' }).setOrigin(0.5).setDepth(4));
    }
    losses.forEach((line, i) => {
      parts.push(this.add.text(640, REWARD.y + 110 + i * 28, line, { fontFamily: FONT, fontSize: '20px', color: '#ff9f8a' }).setOrigin(0.5).setDepth(4));
    });
    rewards.forEach((memory, i) => {
      const { x, y } = spots[i];
      const panel = this.add.rectangle(x, y, REWARD.w, REWARD.h, 0x1d2c38).setStrokeStyle(2, GOLD).setDepth(4);
      const name = this.add.text(x, y - 52, memory.name, { fontFamily: FONT, fontSize: '20px', color: '#e8f1f7' }).setOrigin(0.5).setDepth(4);
      const body = this.add.text(x, y + 14, memory.text, {
        fontFamily: FONT, fontSize: '14px', color: '#cfe3f0', align: 'center', wordWrap: { width: REWARD.w - 24 },
      }).setOrigin(0.5).setDepth(4);
      parts.push(panel, name, body);
    });
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      for (const part of parts) part.destroy();
      done();
    };
    this.time.delayedCall(tune('delivery.rewardMs'), finish);
    this.input.once('pointerdown', finish);
  }

  /** Brings the screen in line with the state and the marked list. */
  render(state) {
    const { entries } = layoutDelivery(state, this.marked, Ferry);
    this.status.setText(statusLine(state, Ferry));
    this.intro.setText(introText(state, t));
    this.confirmBtn.setText(confirmLabel(state, this.marked, t));
    this.entries = new Map(entries.map((e) => [e.id, e]));
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      this.updateToken(token, entry);
    }
  }

  addToken(entry) {
    const token = addSoulToken(this, entry);
    this.input.setDraggable(token, true);
    this.tokens.set(entry.id, token);
    return token;
  }

  updateToken(token, entry) {
    setTokenLabels(token, entry.labels);
    token.getData('panel').setStrokeStyle(entry.matches ? 3 : 1, entry.matches ? GOLD : STROKE);
    token.setAlpha(entry.matches ? 1 : 0.6);
    this.tweens.killTweensOf(token);
    this.tweens.add({ targets: token, x: entry.x, y: entry.y, duration: tune('boarding.snapMs'), ease: tune('boarding.snapEase') });
  }
}
