import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { WRAITH_FRAMES, playSound, queueAssets, soulArtIds } from '../preloader.js';
import { t } from '../text.js';
import { COLOR, CSS, DecisionPanel, bodyText, drawPanel, edgeFlash, fadeIn, fadeOut, lossShake } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { Hud } from '../components/Hud.js';
import { MemoryHand } from '../components/MemoryHand.js';
import { STAGE, layoutStage, soulBadge } from './boarding-layout.js';
import { soulDetail } from './crossing-layout.js';
import { HoverTip } from './hover-tip.js';
import { DEPTH, NightStage } from './night-fx.js';
import { actionSound, returnLightSteps, returnView } from './return-layout.js';
import { PIER_ART, RiverBoat, addPier } from './river-boat.js';
import { addBoardingSoul, setBoardingBadge } from './soul-token.js';

// Return to the Starting Shore (T-21): phase 'window' or 'review' with window.kind 'return'.
// The empty boat comes back to the shore where the souls wait. Prepare: the memory hand (T-16) and what
// the engine will do. "Review return" dispatches PLAN RETURN; the panel then offers Back or Confirm, and
// CONFIRM runs RETURN. The router then waits, so the return plays out before the scene fades: Anger pips
// fill one by one, a soul at the limit turns into a Wraith, the flames go out, the lantern is fed, and new
// arrivals walk in. All of it must fit inside the router's 5 s exit limit.

defineTuning({
  'return.boatFrom': { type: 'number', default: 420, min: 0, max: 900, step: 10, help: 'How far the boat comes in from' },
  'return.boatMs': { type: 'number', default: 1100, min: 0, max: 3000, step: 50, help: 'The boat comes back to the shore' },
  'return.pipMs': { type: 'number', default: 200, min: 0, max: 600, step: 10, help: 'Between one soul Anger pip and the next' },
  'return.frameMs': { type: 'number', default: 160, min: 40, max: 400, step: 10, help: 'One Wraith transformation frame' },
  'return.holdMs': { type: 'number', default: 300, min: 0, max: 1000, step: 10, help: 'Last Wraith frame held' },
  'return.fadeMs': { type: 'number', default: 700, min: 0, max: 2000, step: 10, help: 'A soul with no frames burns away' },
  'return.arrivalMs': { type: 'number', default: 680, min: 0, max: 1500, step: 10, help: 'New souls walk in' },
});

const LOG_PLATE = { right: 1256, y: 172, w: 400, maxLines: 6 };

const stageView = () => Object.fromEntries(Object.keys(STAGE).map((key) => [key, tune(`boarding.${key}`)]));

export class ReturnScene extends Phaser.Scene {
  constructor() {
    super('ReturnScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { art: [...soulArtIds(), 'sprite-boat-horizontal', PIER_ART, ...MemoryHand.artIds(), ...WRAITH_FRAMES], backgrounds: ['bg-starting-shore'] });
  }

  create() {
    const state = this.registry.get('state');
    const view = returnView(state, Ferry);
    console.log(`[ferry] ReturnScene shown (phase ${state.phase}, shore ${state.shore.length}, light ${state.light}, after: ${view.light || view.reason})`);
    this.leaving = false;
    this.targets = null; // soul ids a picked memory can target
    this.tokens = new Map();
    this.logParts = [];
    this.confirmed = null; // the state and view before a confirmed return, which plays out on exit

    this.night = new NightStage(this, 'bg-starting-shore', () => tune('boarding.backdropShift'));
    addPier(this)?.setDepth(DEPTH.seated - 1);
    const deckWidth = tune('art.boat.width') * tune('art.boat.deck');
    this.boat = new RiverBoat(this, tune('boarding.deckX'), tune('boarding.deckY'), deckWidth);
    this.boat.root.setDepth(DEPTH.boat).setX(tune('boarding.deckX') + tune('return.boatFrom'));
    this.tweens.add({ targets: this.boat.root, x: tune('boarding.deckX'), duration: tune('return.boatMs'), ease: 'Cubic.Out' });

    this.bar = new Hud(this);
    this.panel = new DecisionPanel(this);
    this.tip = new HoverTip(this, DEPTH.hero + 1);
    this.hand = new MemoryHand(this, {
      compact: true,
      onTargets: (ids) => { this.targets = ids; this.render(this.registry.get('state')); },
      onHover: (card) => (card ? this.tip.show(this.input.activePointer, card.name, [card.text, t('memory.from', { source: card.source }), card.playable ? '' : card.reason]) : this.tip.hide()),
    });

    this.render(state);
    this.onState = (s) => {
      if (this.router.willLeave(this.scene.key)) return this.startExit(s);
      this.render(s);
    };
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => {
      this.game.events.off('ferry-state', this.onState);
      this.boat = null; // update() can fire once more, after the scene has gone
    });
    fadeIn(this);
  }

  update(time, delta) {
    if (!this.boat) return;
    const seconds = time / 1000;
    this.night.update(time, delta);
    this.boat.update(seconds);
    this.bar.update(seconds);
  }

  render(state) {
    if (this.leaving || !state) return;
    this.bar.render(state);
    this.hand.render(state);
    this.drawShore(state);
    const view = returnView(state, Ferry);
    this.drawLog(view);
    this.drawPanel(view);
  }

  addToken(entry) {
    const token = addBoardingSoul(this, entry, tune('boarding.soulHeight'));
    token.setDepth(DEPTH.shore);
    token.parts.shadow.setAlpha(tune('boarding.shadowAlpha'));
    token.on('pointerdown', () => { if (this.targets?.includes(entry.id)) this.hand.pickTarget(entry.id); });
    token.on('pointerover', (pointer) => {
      const state = this.registry.get('state');
      const actor = state.shore.find((x) => x.id === entry.id);
      if (!actor) return;
      const d = soulDetail(state, actor, Ferry, t);
      this.tip.show(pointer, d.title, d.lines);
    });
    token.on('pointerout', () => this.tip.hide());
    this.tokens.set(entry.id, token);
    return token;
  }

  /** The waiting souls in the spots they hold at boarding. A soul about to turn has red pips; a memory's target has the rim. */
  drawShore(state) {
    const { entries } = layoutStage(state, Ferry, stageView());
    const ids = new Set(entries.map((e) => e.id));
    for (const [id, token] of this.tokens) {
      if (ids.has(id)) continue;
      this.tip.hide();
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const token = this.tokens.get(entry.id) ?? this.addToken(entry);
      token.setPosition(entry.x, entry.y);
      token.entry = entry;
      const badge = soulBadge(entry, Ferry);
      setBoardingBadge(token, badge);
      this.syncPulse(token, badge.pips?.danger ?? false);
      const target = !!this.targets?.includes(entry.id);
      token.parts.rim?.setAlpha(target ? tune('boarding.rimAlpha') : 0);
      token.input.cursor = target ? 'pointer' : 'default';
    }
  }

  syncPulse(token, danger) {
    const { pips } = token.parts;
    if (danger && !token.pulse) {
      token.pulse = this.tweens.add({ targets: pips, alpha: 0.35, duration: tune('boarding.pulseMs'), ease: 'Sine.InOut', yoyo: true, repeat: -1 });
    } else if (!danger && token.pulse) {
      token.pulse.remove();
      token.pulse = null;
      pips.setAlpha(1);
    }
  }

  /** What the engine will do, in its own words. A long list ends with "+N more". */
  drawLog(view) {
    for (const part of this.logParts) part.destroy();
    this.logParts = [];
    const lines = [...view.lines];
    if (view.arrivals) lines.push(view.arrivals);
    if (!lines.length) return;
    const { right, y, w, maxLines } = LOG_PLATE;
    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines) shown.push(t('gameOver.more', { count: lines.length - maxLines }));
    const text = this.add.text(right - w + 16, y + 12, shown.join('\n'), bodyText(17, CSS.bone, { wordWrap: { width: w - 32 } })).setDepth(DEPTH.ui);
    const back = drawPanel(this.add.graphics(), right - w, y, w, text.height + 24).setDepth(DEPTH.ui - 1);
    this.logParts.push(back, text);
  }

  drawPanel(view) {
    const buttons = [{ label: view.primary.label, gold: true, onPress: () => this.act(view.primary.action) }];
    if (view.secondary) buttons.unshift({ label: view.secondary.label, onPress: () => this.act(view.secondary.action) });
    this.panel.show({
      heading: view.panelHeading,
      lines: [view.intro, view.light],
      warning: view.reason || view.warning,
      buttons,
    });
  }

  act(action) {
    if (this.leaving) return;
    try {
      const before = this.registry.get('state');
      this.confirmed = action.type === 'CONFIRM' ? { state: before, view: returnView(before, Ferry) } : null;
      const sound = actionSound(before, action, Ferry);
      this.router.dispatch(action);
      if (sound) playSound(this, sound); // only once the engine accepted the action
    } catch (err) {
      this.confirmed = null;
      this.bar.toast(err.message);
    }
  }

  /** One soul's pips take the return's Anger. */
  fillPips(soul) {
    const token = this.tokens.get(soul.id);
    if (!token) return;
    const danger = soul.wraith;
    setBoardingBadge(token, { ...soulBadge(token.entry, Ferry), pips: { filled: Math.min(soul.anger + 1, soul.limit), total: soul.limit, danger } });
  }

  /** Goya's Wraith frames over the soul when they are all there, otherwise the soul burns away in red smoke. */
  turnToWraith(token) {
    if (WRAITH_FRAMES.every((f) => this.textures.exists(f))) {
      token.parts.body.setVisible(false);
      const img = this.add.image(token.x, token.y - tune('boarding.soulHeight') * 0.55, WRAITH_FRAMES[0]).setDepth(DEPTH.shore + 0.5);
      const size = tune('boarding.soulHeight') * tune('art.soul.fill');
      img.setScale(size / Math.max(img.width, img.height));
      let frame = 0;
      this.time.addEvent({
        delay: tune('return.frameMs'),
        repeat: WRAITH_FRAMES.length - 1,
        callback: () => {
          frame += 1;
          if (frame < WRAITH_FRAMES.length) img.setTexture(WRAITH_FRAMES[frame]);
        },
      });
      return;
    }
    token.parts.glow.setTint(COLOR.danger);
    token.parts.glow.setAlpha(0.7);
    this.night.fx.trail(token.x, token.y - 90, 12);
    this.tweens.add({ targets: token.parts.ride, alpha: 0, duration: tune('return.fadeMs'), ease: 'Sine.In' });
  }

  /** The return plays out, then the scene fades and the router switches. Without a confirmed return it just fades. */
  startExit(next) {
    if (this.leaving) return;
    this.leaving = true;
    this.input.enabled = false;
    this.tip.hide();
    console.log('[ferry] ReturnScene: rowing back to the Starting Shore');
    const leave = () => fadeOut(this, () => this.router.exitDone());
    if (!this.confirmed) return leave();
    for (const part of this.logParts) part.destroy();
    this.logParts = [];
    this.panel.slideOut();
    this.hand.root.setVisible(false);
    const { state, view } = this.confirmed;
    const turning = view.souls.filter((x) => x.wraith);
    const max = Ferry.maxLight(state);
    const { low, high } = returnLightSteps(state, next, turning.length, Ferry);
    const pipMs = tune('return.pipMs');
    view.souls.forEach((soul, i) => this.time.delayedCall(i * pipMs, () => this.fillPips(soul)));

    const wraithsAt = view.souls.length * pipMs + 150;
    const wraithMs = turning.length
      ? Math.max(tune('return.fadeMs'), WRAITH_FRAMES.length * tune('return.frameMs') + tune('return.holdMs'))
      : 0;
    this.time.delayedCall(wraithsAt, () => {
      for (const soul of turning) this.turnToWraith(this.tokens.get(soul.id));
      if (low === state.light) return;
      this.bar.stepLight(state.light, low, max);
      edgeFlash(this);
      lossShake(this);
    });
    const feedAt = wraithsAt + wraithMs;
    if (next.phase === 'ended') return this.time.delayedCall(feedAt + 200, leave);
    this.time.delayedCall(feedAt, () => {
      if (high > low) {
        this.bar.stepLight(low, high, max);
        edgeFlash(this, COLOR.lantern);
      }
      this.walkArrivals(next);
    });
    this.time.delayedCall(feedAt + tune('return.arrivalMs') + 150, leave);
  }

  /** The next cycle's shore: those who stay move to their spots, new souls walk in from the left. */
  walkArrivals(next) {
    if (next.phase !== 'boarding') return;
    const { entries } = layoutStage(next, Ferry, stageView());
    const ids = new Set(entries.map((e) => e.id));
    for (const [id, token] of this.tokens) {
      if (ids.has(id)) continue;
      token.destroy();
      this.tokens.delete(id);
    }
    for (const entry of entries) {
      const fresh = !this.tokens.has(entry.id);
      const token = this.tokens.get(entry.id) ?? this.addToken({ ...entry, x: -80 });
      if (fresh) setBoardingBadge(token, soulBadge(entry, Ferry));
      this.tweens.add({ targets: token, x: entry.x, duration: tune('return.arrivalMs'), ease: 'Sine.InOut' });
    }
  }
}
