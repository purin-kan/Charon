import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { fadeInLoop, fadeOutLoop, queueAssets } from '../preloader.js';
import { t } from '../text.js';
import { bodyText, COLOR, CSS, drawPanel, EASE, enterScene, fadeInParts, fadeOutParts, headText, leaveScene, makeButton, makeChip, MS, whenFontsReady } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { readSave, writeSave, deleteSave, startAutosave, qaName } from '../save.js';
import { DEPTH, NightStage } from './night-fx.js';

// Title screen (T-11): Continue and New game over one save slot. New game takes an optional seed,
// so a demo can replay the same routes and encounters (Ferry.create(seed)).
defineTuning({
  'title.revealMs': { type: 'number', default: 2200, min: 0, max: 6000, step: 50, help: 'The title draws together and fades in' },
  'title.startSpacing': { type: 'number', default: 26, min: 0, max: 60, step: 1, help: 'Letter spacing the title starts at' },
  'title.endSpacing': { type: 'number', default: 4, min: 0, max: 30, step: 1, help: 'Letter spacing the title settles at' },
  'title.fontSize': { type: 'number', default: 76, min: 30, max: 120, step: 1 },
  'title.taglineDelay': { type: 'number', default: 900, min: 0, max: 4000, step: 50, help: 'Then the one-line pitch' },
  'title.buttonsDelay': { type: 'number', default: 1400, min: 0, max: 5000, step: 50, help: 'Then the buttons' },
});

const MAX_SEED = 4294967295;
const MUSIC_VOLUME = 0.5;
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
    this.handledKeys = new WeakSet();
    console.log(`[ferry] TitleScene shown (save: ${this.save.state ? 'found' : this.save.broken ? 'unreadable' : 'none'})`);

    this.night = new NightStage(this, 'bg-starting-shore', () => 0, { settle: true, push: true });
    enterScene(this);

    // Keyboard listeners outlive a scene restart, so remove this one on shutdown.
    const onKey = (e) => this.onKey(e);
    this.input.keyboard.on('keydown', onKey);
    fadeOutLoop(this.sound.get('amb-crossing')); // the run's loop (router.js RUN_AMBIENCE) waits for the next run
    this.music = MENU_MUSIC.map((id) => fadeInLoop(this, id, MUSIC_VOLUME)).find(Boolean) ?? null; // resumes, never restarts
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
    this.tweens.add({
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
    if (qaName()) makeChip(this, 16, height - 30, 220, 28, t('title.qaBadge', { name: qaName() })).setDepth(UI_DEPTH);

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
    this.begin(state);
  }

  askNewGame() {
    if (this.chosenSeed() === null) return;
    if (this.save.state || this.save.broken) this.openDialog();
    else this.newGame();
  }

  newGame() {
    const seed = this.chosenSeed();
    if (seed === null) return;
    deleteSave();
    console.log(`[ferry] TitleScene: new game (seed ${seed})`);
    this.begin(Ferry.create(seed));
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
