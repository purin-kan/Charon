import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { playSound, queueAssets, soulArtIds } from '../preloader.js';
import { t } from '../text.js';
import { COLOR, DecisionPanel, edgeFlash, fadeOut, lossShake } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { Hud } from '../components/Hud.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { STAGE, TOKEN, arcPoint, boatZone, ridePoint, shipBadge } from './boarding-layout.js';
import { soulDetail } from './crossing-layout.js';
import {
  arrivalOutcome, confirmLabel, deliverAction, exitWarning, headingText, introText, keepValidMarks, layoutDelivery, toggleMark,
} from './delivery-layout.js';
import { HoverTip } from './hover-tip.js';
import { DEPTH, NightStage, seatedDepth } from './night-fx.js';
import { showOutcome } from './outcome-panel.js';
import { PIER_ART, RiverBoat, addPier } from './river-boat.js';
import { LABEL_TIER_PX, addBoardingSoul, setBoardingBadge, swayTail } from './soul-token.js';

const FEET = TOKEN.h / 2; // a seat's centre to the deck floor

defineTuning({
  'delivery.departDistance': { type: 'number', default: 120, min: 0, max: 400, step: 10, help: 'How far a soul walks along the shore' },
  'delivery.riseDistance': { type: 'number', default: 150, min: 0, max: 400, step: 10, help: 'A soul at its wish rises in the light' },
  'delivery.beamAlpha': { type: 'number', default: 0.34, min: 0, max: 1, step: 0.02, help: 'Gold beam on a soul at its wish' },
  'delivery.dimAlpha': { type: 'number', default: 0.62, min: 0.2, max: 1, step: 0.02, help: 'A soul that cannot leave here' },
  'delivery.walkMs': { type: 'number', default: 760, min: 100, max: 1500, step: 10, help: 'A soul goes ashore and back' },
  'delivery.rideEase': { type: 'number', default: 6, min: 1, max: 20, step: 1, help: 'How fast a soul picks up or drops the boat rocking' },
  'delivery.arcPx': { type: 'number', default: 46, min: 0, max: 160, step: 2, help: 'Height of the step between boat and shore' },
});

export class DeliveryScene extends Phaser.Scene {
  constructor() {
    super('DeliveryScene');
  }

  get router() { return this.game.router; }

  preload() {
    const { destination } = this.registry.get('state');
    queueAssets(this, { art: [...soulArtIds(), 'sprite-boat-horizontal', PIER_ART, ...MemoryHand.artIds()], backgrounds: destination ? [destination] : [] });
  }

  create() {
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'})`);
    this.tokens = new Map();
    this.entries = new Map();
    this.marked = [];
    this.leaving = false;
    this.targets = null; // soul ids the picked memory can target

    this.night = new NightStage(this, state.destination, () => tune('boarding.backdropShift')); // the same stage as the start
    this.slots = layoutDelivery(state, [], Ferry).slots;
    const hull = boatZone(this.slots);
    this.boat = new RiverBoat(this, hull.x, hull.y + FEET, tune('art.boat.width') * tune('art.boat.deck'));
    this.boat.root.setDepth(DEPTH.boat);
    addPier(this)?.setDepth(DEPTH.seated - 1);

    this.bar = new Hud(this);
    this.panel = new DecisionPanel(this);
    // One memory per stop can also be played here (VarisPah on #27, Nov 4); the engine says which.
    this.tip = new HoverTip(this, DEPTH.hero + 1);
    this.hand = new MemoryHand(this, {
      compact: true,
      onTargets: (ids) => { this.targets = ids; this.render(this.registry.get('state')); },
      onHover: (card) => (card ? this.tip.show(this.input.activePointer, card.name, [card.text, t('memory.from', { source: card.source }), card.playable ? '' : card.reason]) : this.tip.hide()),
    });
    this.hand.render(state);
    this.render(state);

    // A trim or choice overlay can open after DELIVER, over this scene, so the board stays current
    // behind it. The overlay closes on a state this handler then leaves from.
    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) return this.startExit(s);
      if (!this.leaving) this.hand.render(s); // the hand is hidden once the delivery is on its way
      this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => {
      this.game.events.off('ferry-state', this.onState);
      this.boat = null; // update() can fire once more, after the scene has gone
    });
  }

  update(time, delta) {
    if (!this.boat) return;
    const seconds = time / 1000;
    this.night.update(time, delta);
    this.boat.update(seconds);
    this.bar.update(seconds);
    const { root } = this.boat;
    const pivot = { x: this.boat.x, y: this.boat.y };
    const settle = Math.min(1, (delta / 1000) * tune('delivery.rideEase'));
    for (const token of this.tokens.values()) {
      swayTail(token, seconds, token.walking ? tune('boarding.tailPx') : 0, tune('boarding.tailSpeed'));
      token.riding += ((token.onBoat ? 1 : 0) - token.riding) * settle;
      const at = ridePoint(token, pivot, root.rotation, { x: 0, y: root.y - pivot.y });
      token.parts.ride.setPosition((at.x - token.x) * token.riding, (at.y - token.y) * token.riding).setRotation(root.rotation * token.riding);
    }
  }

  say(text) {
    this.bar.toast(text);
  }

  /** A click marks a seated soul or calls one back from the shore. Nothing reaches the engine until confirm. */
  pick(id) {
    if (this.leaving) return;
    if (this.targets) {
      if (this.targets.includes(id)) this.hand.pickTarget(id);
      return;
    }
    const state = this.registry.get('state');
    const { marked, reason } = toggleMark(state, this.marked, this.entries.get(id), Ferry, t);
    this.marked = marked;
    this.tip.hide();
    if (reason) {
      this.say(reason);
      this.refuse(id);
    }
    this.render(state);
  }

  /** A short shake on the figure only, as on the shore. */
  refuse(id) {
    const token = this.tokens.get(id);
    if (!token) return;
    const { figure } = token.parts;
    token.shake?.remove();
    figure.x = 0;
    token.shake = this.tweens.add({
      targets: figure,
      x: { from: -tune('boarding.shakePx'), to: tune('boarding.shakePx') },
      duration: tune('boarding.shakeMs'),
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: 2,
      onComplete: () => { figure.x = 0; },
    });
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
    this.tip.hide();
    this.hand.cancel();
    this.hand.root.setVisible(false); // no memory once the delivery is on its way
    this.panel.slideOut();
    const outcome = arrivalOutcome(state, next, action, Ferry);
    if (outcome.departed.some((id) => Ferry.wish(state.boat.find((x) => x.id === id)) === state.destination)) playSound(this, 'sfx-delivery-success'); // someone reached their wish
    if (outcome.wraiths.length) playSound(this, 'sfx-wraith');
    if (next.light < state.light) {
      this.bar.stepLight(state.light, next.light, Ferry.maxLight(state));
      edgeFlash(this);
      lossShake(this);
    }
    this.playDeparture(state, outcome.departed, () => showOutcome(this, outcome, () => this.router.dispatch(action)));
  }

  /** Delivered souls walk along the dock; a soul at its wish rises in its beam of light, the others fade into the mist. */
  playDeparture(state, ids, done) {
    if (!ids.length) {
      done();
      return;
    }
    const tokens = ids.map((id) => this.tokens.get(id));
    // A soul can still be walking ashore, and that tween would fight this one.
    for (const token of tokens) token.walk?.remove();
    this.tweens.killTweensOf(tokens);
    ids.forEach((id, i) => {
      const entry = this.entries.get(id);
      const token = tokens[i].setPosition(entry.x, entry.y + FEET).setDepth(DEPTH.shore);
      const home = Ferry.wish(entry.actor) === state.destination;
      token.disableInteractive();
      if (home) this.tweens.add({ targets: token.parts.beam, alpha: 1, scaleY: 3, duration: tune('delivery.departMs'), ease: 'Sine.Out' });
      this.tweens.add({
        targets: token,
        x: token.x - tune('delivery.departDistance'),
        y: token.y - (home ? tune('delivery.riseDistance') : 0),
        alpha: 0,
        duration: tune('delivery.departMs'),
        ease: tune('delivery.departEase'),
        onComplete: i === ids.length - 1 ? done : undefined,
      });
      this.night.fx.trail(token.x, token.y - 60, 3);
    });
  }

  /** Brings the screen in line with the state and the marked list. */
  render(state) {
    this.marked = keepValidMarks(state, this.marked, Ferry); // a memory may have taken a marked soul
    const { entries } = layoutDelivery(state, this.marked, Ferry);
    this.bar.render(state);
    this.entries = new Map(entries.map((e) => [e.id, e]));
    for (const [id, token] of this.tokens) {
      if (this.entries.has(id)) continue;
      this.tip.hide(); // its hover box would stay with no token under it
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      this.updateToken(token, entry);
    }
    if (this.leaving) return;
    this.panel.show({
      heading: headingText(state, Ferry, t),
      lines: [introText(state, t)],
      warning: exitWarning(state, this.marked, Ferry, t),
      buttons: [{ label: confirmLabel(state, this.marked, t), gold: true, onPress: () => this.confirm() }],
    });
  }

  addToken(entry) {
    const token = addBoardingSoul(this, { ...entry, y: entry.y + FEET }, STAGE.soulHeight);
    token.parts.shadow.setAlpha(0);
    token.goal = { x: entry.x, y: entry.y };
    token.onBoat = entry.area === 'seat';
    token.riding = token.onBoat ? 1 : 0;
    token.on('pointerdown', () => this.pick(entry.id));
    token.on('pointerover', (pointer) => {
      const state = this.registry.get('state');
      const actor = state.boat.find((x) => x.id === entry.id);
      if (!actor) return;
      const d = soulDetail(state, actor, Ferry, t);
      this.tip.show(pointer, d.title, d.lines);
    });
    token.on('pointerout', () => this.tip.hide());
    this.tokens.set(entry.id, token);
    return token;
  }

  fade(target, alpha) {
    if (!target) return;
    this.tweens.killTweensOf(target);
    this.tweens.add({ targets: target, alpha, duration: tune('boarding.glowMs'), ease: 'Sine.Out' });
  }

  updateToken(token, entry) {
    setBoardingBadge(token, shipBadge(entry.actor, Ferry));
    // A beam is at its wish (its memory, quest step or fare), plain can leave without it, dimmed cannot leave.
    const beam = entry.canLeave && entry.wishMatches;
    const target = !!this.targets?.includes(entry.id);
    const { parts } = token;
    this.fade(parts.beam, beam ? tune('delivery.beamAlpha') : 0);
    parts.rim?.setTint(target ? COLOR.calm : COLOR.gold);
    this.fade(parts.rim, beam || target ? tune('boarding.rimAlpha') : 0);
    parts.body.setAlpha(entry.canLeave ? 1 : tune('delivery.dimAlpha'));
    const onBoat = entry.area === 'seat';
    this.fade(parts.shadow, onBoat ? 0 : tune('boarding.shadowAlpha'));
    this.pose(token, tune(onBoat ? 'boarding.seatHeight' : 'boarding.soulHeight'), entry.tier);
    this.walkTo(token, entry);
  }

  /** A soul grows as it comes ashore, like the walk in BoardingScene. Its name follows, one step higher in a tight row. */
  pose(token, height, tier) {
    const key = `${height}/${tier}`;
    if (token.poseKey === key) return;
    const first = token.poseKey === undefined;
    token.poseKey = key;
    const { body, labels } = token.parts;
    const scale = height / STAGE.soulHeight;
    const nameY = -height * token.headRoom - 2 - tier * LABEL_TIER_PX;
    token.input.hitArea.setTo(-36, -height * token.headRoom, 72, height * token.headRoom);
    this.tweens.killTweensOf(body);
    this.tweens.killTweensOf(labels);
    if (first) {
      body.setScale(scale);
      labels.setY(nameY);
      return;
    }
    const motion = { duration: tune('delivery.walkMs'), ease: 'Sine.InOut' };
    this.tweens.add({ targets: body, scaleX: scale, scaleY: scale, ...motion });
    this.tweens.add({ targets: labels, y: nameY, ...motion });
  }

  /** On the boat a soul sits behind the hull. It steps over the side in an arc and stands on the shore in front. */
  walkTo(token, entry) {
    const onBoat = entry.area === 'seat';
    const restDepth = onBoat ? seatedDepth(entry.x) : DEPTH.shore;
    if (token.goal.x === entry.x && token.goal.y === entry.y) {
      if (!token.walking) token.setDepth(restDepth);
      return;
    }
    const arc = token.onBoat !== onBoat ? tune('delivery.arcPx') : 0;
    const from = { x: token.x, y: token.y };
    const to = { x: entry.x, y: entry.y + FEET };
    token.goal = { x: entry.x, y: entry.y };
    token.onBoat = onBoat;
    token.walking = true;
    token.setDepth(DEPTH.shore);
    token.walk?.remove();
    token.walk = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: tune('delivery.walkMs'),
      ease: 'Sine.InOut',
      onUpdate: (tween) => {
        const at = arcPoint(from, to, tween.getValue(), arc);
        token.setPosition(at.x, at.y);
      },
      onComplete: () => {
        token.walking = false;
        token.setDepth(restDepth);
      },
    });
  }

  /** The next stop of this trip follows with no cut; anything else (the return, the end) fades out first. */
  startExit(state) {
    if (state.phase === 'window' && state.window.kind === 'outward') return this.router.exitDone();
    fadeOut(this, () => this.router.exitDone());
  }
}
