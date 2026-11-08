import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { fadeInLoop, fadeOutLoop, queueAssets } from '../preloader.js';
import { lookup, t } from '../text.js';
import { bodyText, COLOR, CSS, drawPanel, EASE, enterScene, fadeInParts, fadeOutParts, headText, leaveScene, makeButton, makeChip, MS, reducedMotion, whenFontsReady } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { readSave, writeSave, deleteSave, startAutosave, qaName } from '../save.js';
import { DEPTH, NightStage } from './night-fx.js';
import { asksBeforeNewGame } from './title-layout.js';
import { createLoreSequence, loreScreens, loreTimeline, showsLore } from './lore-layout.js';

// Title screen (T-11): Continue and New game over one save slot. New game takes an optional seed,
// so a demo can replay the same routes and encounters (Ferry.create(seed)).
defineTuning({
  'title.revealMs': { type: 'number', default: 2200, min: 0, max: 6000, step: 50, help: 'The title draws together and fades in' },
  'title.startSpacing': { type: 'number', default: 26, min: 0, max: 60, step: 1, help: 'Letter spacing the title starts at' },
  'title.endSpacing': { type: 'number', default: 4, min: 0, max: 30, step: 1, help: 'Letter spacing the title settles at' },
  'title.fontSize': { type: 'number', default: 76, min: 30, max: 120, step: 1 },
  'title.taglineDelay': { type: 'number', default: 900, min: 0, max: 4000, step: 50, help: 'Then the one-line pitch' },
  'title.buttonsDelay': { type: 'number', default: 1400, min: 0, max: 5000, step: 50, help: 'Then the buttons' },
  // The lore intro after New game (lore-layout.js). Reduced motion cuts the fades, never the hold.
  'lore.fadeMs': { type: 'number', default: 900, min: 0, max: 3000, step: 50, help: 'Each lore line fades in, and each screen fades out, over this' },
  'lore.lineGapMs': { type: 'number', default: 1100, min: 0, max: 4000, step: 50, help: 'Wait between the lines of one lore screen' },
  'lore.holdMs': { type: 'number', default: 3200, min: 500, max: 12000, step: 100, help: 'A lore screen stays this long once all its lines are in' },
  'lore.lineSize': { type: 'number', default: 30, min: 16, max: 48, step: 1 },
  'lore.lineSpacing': { type: 'number', default: 58, min: 30, max: 100, step: 1, help: 'Distance between lore lines' },
  'lore.veilAlpha': { type: 'number', default: 0.9, min: 0, max: 1, step: 0.02, help: 'Darkness over the shore behind the lore' },
});

const MAX_SEED = 4294967295;
const MENU_MUSIC = ['bgm-menu']; // the T-07 id; BootScene queues the same one
const UI_DEPTH = DEPTH.ui;

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { audio: MENU_MUSIC, backgrounds: ['bg-starting-shore'] });
  }

  create() {
    this.save = readSave();
    this.seedText = '';
    this.editingSeed = false;
    this.leaving = false;
    this.ready = false;
    this.dialog = null;
    this.lore = null;
    this.menuParts = [];
    this.handledKeys = new WeakSet();
    console.log(`[ferry] TitleScene shown (save: ${this.save.state ? 'found' : this.save.broken ? 'unreadable' : 'none'})`);

    this.night = new NightStage(this, 'bg-starting-shore', () => 0, { settle: true, push: true });
    enterScene(this);

    // Keyboard listeners outlive a scene restart, so remove this one on shutdown.
    const onKey = (e) => this.onKey(e);
    this.input.keyboard.on('keydown', onKey);
    fadeOutLoop(this.sound.get('amb-crossing')); // the run's loop (router.js RUN_AMBIENCE) waits for the next run
    this.music = MENU_MUSIC.map((id) => fadeInLoop(this, id)).find(Boolean) ?? null; // resumes, never restarts
    const run = (this.run = {}); // a scene stopped while the fonts load must not build
    this.events.once('shutdown', () => {
      this.run = null;
      this.night = null;
      this.input.keyboard.off('keydown', onKey);
      fadeOutLoop(this.music);
    });
    whenFontsReady().then(() => {
      if (this.run !== run) return;
      this.build();
      this.ready = true;
    });
  }

  update(time, delta) {
    this.night?.update(time, delta);
  }

  build() {
    const { width, height } = this.scale;
    const title = this.add.text(width / 2, 170, t('title.heading'), headText(tune('title.fontSize'), CSS.gold)).setOrigin(0.5).setDepth(UI_DEPTH).setAlpha(0);
    title.setLetterSpacing(tune('title.startSpacing'));
    const reveal = { spacing: tune('title.startSpacing') };
    this.revealTween = this.tweens.add({
      targets: reveal,
      spacing: tune('title.endSpacing'),
      duration: tune('title.revealMs'),
      ease: EASE.enter,
      onUpdate: () => title.setLetterSpacing(reveal.spacing),
    });
    this.tweens.add({ targets: title, alpha: 1, duration: tune('title.revealMs'), ease: EASE.move });

    const tagline = this.add.text(width / 2, 246, t('title.tagline'), bodyText(24, CSS.bone, { align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5).setDepth(UI_DEPTH);

    const saved = this.save.state;
    const continueDetail = saved
      ? saved.phase === 'ended' ? t('title.continueEnded') : t('title.continueDetail', { cycle: saved.cycle, light: saved.light, maxLight: Ferry.maxLight(saved) })
      : this.save.broken ? '' : t('title.noSave');
    const guarded = (fn) => () => { if (!this.leaving && !this.dialog) fn(); };
    this.continueBtn = makeButton(this, width / 2, 350, 380, 72, t('title.continue'), guarded(() => this.continueRun()), { gold: !!saved, detail: continueDetail, size: 22 }).setEnabled(!!saved).setDepth(UI_DEPTH);
    this.newBtn = makeButton(this, width / 2, 446, 380, 64, t('title.newGame'), guarded(() => this.askNewGame()), { gold: !saved, size: 22 }).setEnabled(true).setDepth(UI_DEPTH);

    this.seedLabel = this.add.text(width / 2, 516, '', bodyText(21, CSS.muted)).setOrigin(0.5).setDepth(UI_DEPTH).setInteractive({ useHandCursor: true });
    this.seedLabel.on('pointerdown', () => { if (!this.dialog) this.setEditingSeed(!this.editingSeed); });
    const hint = this.add.text(width / 2, 544, t('title.seedHint'), bodyText(17, CSS.muted)).setOrigin(0.5).setDepth(UI_DEPTH);
    this.renderSeed();

    this.note = this.add.text(width / 2, 610, '', bodyText(20, CSS.danger, { align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5).setDepth(UI_DEPTH);
    if (this.save.unavailable) this.note.setText(t('title.storageUnavailable'));
    else if (this.save.broken) this.note.setText(t('title.brokenSave'));
    const chip = qaName() ? makeChip(this, 16, height - 30, 220, 28, t('title.qaBadge', { name: qaName() })).setDepth(UI_DEPTH) : null;
    this.menuParts = [title, tagline, this.continueBtn, this.newBtn, this.seedLabel, hint, this.note, chip].filter(Boolean);

    const delay = tune('title.buttonsDelay');
    tagline.setAlpha(0);
    this.tweens.add({ targets: tagline, alpha: 1, duration: MS.slow, delay: tune('title.taglineDelay'), ease: EASE.enter });
    // The buttons keep their enabled look, so the fade only brings them up to the alpha they already have.
    for (const part of [this.continueBtn, this.newBtn, this.seedLabel, hint, this.note]) {
      const alpha = part.alpha;
      part.setAlpha(0);
      this.tweens.add({ targets: part, alpha, duration: MS.slow, delay, ease: EASE.enter });
    }
  }

  renderSeed() {
    const value = this.seedText || (this.editingSeed ? '' : t('title.seedRandom'));
    this.seedLabel.setText(`${t('title.seedLabel')}: ${value}${this.editingSeed ? '_' : ''}`);
    this.seedLabel.setColor(this.editingSeed ? CSS.gold : CSS.muted);
  }

  setEditingSeed(on) {
    this.editingSeed = on;
    this.renderSeed();
  }

  onKey(e) {
    // Phaser 4.2.1 can hand the same keydown event over more than once, and when several keys arrive
    // in one frame it replays earlier ones after later ones. Each event object is handled once.
    if (this.handledKeys.has(e)) return;
    this.handledKeys.add(e);
    if (!this.ready) return;
    if (this.lore) {
      if (e.key === 'Escape') this.skipLore();
      else if (!e.repeat) this.advanceLore();
      return;
    }
    if (this.leaving) return; // the menu parts may already be gone
    if (this.dialog) {
      if (e.key === 'Escape') this.closeDialog();
      return;
    }
    if (!this.editingSeed) return;
    if (/^[0-9]$/.test(e.key) && this.seedText.length < 10) this.seedText += e.key;
    else if (e.key === 'Backspace') this.seedText = this.seedText.slice(0, -1);
    else if (e.key === 'Enter' || e.key === 'Escape') this.editingSeed = false;
    this.note.setText('');
    this.renderSeed();
  }

  /** The typed seed, a random one when blank, or null (with a message) when out of range. */
  chosenSeed() {
    if (this.seedText === '') return randomSeed();
    const n = Number(this.seedText);
    if (Number.isInteger(n) && n >= 0 && n <= MAX_SEED) return n;
    this.note.setText(t('title.seedInvalid'));
    return null;
  }

  continueRun() {
    let state = this.save.state;
    if (!state) return;
    if (state.paused) state = Ferry.transition(state, { type: 'RESUME' });
    console.log(`[ferry] TitleScene: continue (cycle ${state.cycle}, phase ${state.phase})`);
    this.enterRun('continue', () => state);
  }

  askNewGame() {
    if (this.chosenSeed() === null) return;
    if (asksBeforeNewGame(this.save)) this.openDialog();
    else this.newGame();
  }

  newGame() {
    const seed = this.chosenSeed();
    if (seed === null) return;
    console.log(`[ferry] TitleScene: new game (seed ${seed})`);
    // The old save is deleted only when the run really starts, so closing the window during the
    // lore leaves it as it was.
    this.enterRun('new', () => {
      deleteSave();
      return Ferry.create(seed);
    });
  }

  /** New game plays the lore first (showsLore); Continue does not. makeState runs once, as the run starts. */
  enterRun(kind, makeState) {
    if (this.leaving) return;
    if (showsLore(kind)) this.playLore(() => this.begin(makeState()));
    else this.begin(makeState());
  }

  /**
   * The lore intro: the menu fades away, then each screen's lines fade in on a dark veil, hold, and
   * fade out. A click or key moves on, Esc or Skip goes straight to the run. done runs once.
   */
  playLore(done) {
    this.leaving = true; // guarded() and the seed label ignore the menu from now on
    const screens = loreScreens(lookup('lore.screens'));
    const seq = createLoreSequence(screens.length);
    const { width, height } = this.scale;
    const depth = DEPTH.hero + 2; // over the menu and the replace dialog
    const veil = this.add.rectangle(width / 2, height / 2, width, height, COLOR.deep, tune('lore.veilAlpha')).setDepth(depth).setInteractive();
    const hint = this.add.text(width / 2, height - 46, t('lore.hint'), bodyText(17, CSS.muted)).setOrigin(0.5).setDepth(depth + 1);
    const skip = this.add.text(width - 36, height - 46, t('lore.skip'), bodyText(19, CSS.gold)).setOrigin(1, 0.5).setDepth(depth + 1).setInteractive({ useHandCursor: true });
    const lore = (this.lore = { seq, screens, lines: [], timers: [], frame: [veil, hint, skip], done });
    this.editingSeed = false;
    veil.on('pointerdown', () => this.advanceLore());
    skip.on('pointerdown', () => this.skipLore());
    fadeInParts(this, lore.frame, MS.base);
    if (this.dialog) this.closeDialog();
    // The title reveal and the menu's delayed fade-ins may still be running; stop them before the
    // parts they touch are destroyed.
    this.revealTween?.remove();
    this.tweens.killTweensOf(this.menuParts);
    fadeOutParts(this, this.menuParts, () => {
      if (this.lore === lore) this.runLore(seq.start());
    }, MS.base);
    this.menuParts = [];
  }

  /** Carries out one step from the lore sequence (lore-layout.js createLoreSequence). */
  runLore(step) {
    const lore = this.lore;
    if (!step || !lore) return;
    if (step.show !== undefined) this.showLoreScreen(step.show);
    else if (step.leave !== undefined) {
      this.clearLoreTimers();
      const lines = lore.lines;
      lore.lines = [];
      const after = () => {
        if (this.lore !== lore) return;
        if (step.finish) this.finishLore();
        else this.runLore(lore.seq.arrive());
      };
      if (lines.length) {
        this.tweens.killTweensOf(lines);
        fadeOutParts(this, lines, after, lore.timeline.fadeMs);
      } else after();
    } else if (step.finish) this.finishLore();
  }

  showLoreScreen(index) {
    const lore = this.lore;
    const lines = lore.screens[index] ?? [];
    const timeline = (lore.timeline = loreTimeline(lines.length, {
      fadeMs: tune('lore.fadeMs'),
      lineGapMs: tune('lore.lineGapMs'),
      holdMs: tune('lore.holdMs'),
      reduced: reducedMotion(),
      reducedMs: tune('motion.reducedMs'),
    }));
    const { width, height } = this.scale;
    const spacing = tune('lore.lineSpacing');
    const top = height / 2 - 30 - ((lines.length - 1) * spacing) / 2;
    const depth = DEPTH.hero + 3;
    lore.lines = lines.map((line, i) => {
      const text = this.add.text(width / 2, top + i * spacing, line, bodyText(tune('lore.lineSize'), i === lines.length - 1 ? CSS.gold : CSS.bone, { align: 'center', wordWrap: { width: 1000 } }))
        .setOrigin(0.5).setDepth(depth).setAlpha(0);
      this.tweens.add({ targets: text, alpha: 1, duration: timeline.fadeMs, delay: timeline.lineStarts[i], ease: EASE.enter });
      return text;
    });
    lore.timers.push(this.time.delayedCall(timeline.holdEnd, () => this.advanceLore(index)));
  }

  advanceLore(index) {
    if (!this.lore) return;
    this.runLore(this.lore.seq.advance(index ?? this.lore.seq.index));
  }

  skipLore() {
    if (!this.lore) return;
    this.runLore(this.lore.seq.skip());
  }

  clearLoreTimers() {
    for (const timer of this.lore?.timers ?? []) timer.remove(false);
    if (this.lore) this.lore.timers = [];
  }

  /** The intro is over: the run starts with the lore still on screen, and leaveScene dissolves it into the run. */
  finishLore() {
    const lore = this.lore;
    if (!lore) return;
    this.clearLoreTimers();
    lore.frame[0].disableInteractive();
    lore.frame[2].disableInteractive();
    this.lore = null;
    lore.done();
  }

  /** Saves at once and after every later change, then fades out and hands the run to the router. */
  begin(state) {
    this.leaving = true;
    startAutosave(this.game, () => console.warn('[ferry] ' + t('title.storageFailed')));
    if (!writeSave(state)) console.warn('[ferry] ' + t('title.storageFailed'));
    leaveScene(this, () => {
      this.scene.stop();
      this.router.start(state);
    });
  }

  openDialog() {
    const { width, height } = this.scale;
    const w = 620;
    const h = 260;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, COLOR.deep, 0.65).setInteractive();
    const back = drawPanel(this.add.graphics(), width / 2 - w / 2, height / 2 - h / 2, w, h);
    const title = this.add.text(width / 2, height / 2 - 80, t('title.replaceTitle'), headText(25, CSS.gold)).setOrigin(0.5);
    const body = this.add.text(width / 2, height / 2 - 22, t('title.replaceBody'), bodyText(22, CSS.bone, { align: 'center', wordWrap: { width: 540 } })).setOrigin(0.5);
    const yes = makeButton(this, width / 2 - 110, height / 2 + 72, 220, 46, t('title.replaceYes'), () => { this.closeDialog(); this.newGame(); }, { gold: true, size: 16 });
    const no = makeButton(this, width / 2 + 120, height / 2 + 72, 160, 46, t('common.cancel'), () => this.closeDialog(), { size: 16 });
    this.dialog = [shade, back, title, body, yes, no];
    fadeInParts(this, this.dialog);
    for (const part of this.dialog) part.setDepth(DEPTH.hero + 1);
  }

  closeDialog() {
    fadeOutParts(this, this.dialog ?? []);
    this.dialog = null;
  }
}
