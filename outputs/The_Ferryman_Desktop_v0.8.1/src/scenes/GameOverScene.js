import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { queueAssets } from '../preloader.js';
import { deleteSave, readSave, startAutosave, writeSave } from '../save.js';
import { t } from '../text.js';
import { bodyText, COLOR, CSS, drawPanel, EASE, enterScene, headText, leaveScene, LightFlames, makeButton } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { TEXT, gameOverView } from './gameover-layout.js';
import { DEPTH, NightStage } from './night-fx.js';

// Game over (T-17). The run is endless, so there is no win screen: the lantern gutters and goes dark, then a
// quiet summary shows how far the player rowed and why it went out. New game starts again at once; Title goes
// back to the seed field. A run that is not over is never replaced from here: that goes through TitleScene's warning.

defineTuning({
  'gameover.lanternMs': { type: 'number', default: 1700, min: 0, max: 5000, step: 50, help: 'The lantern gutters and goes out' },
  'gameover.revealMs': { type: 'number', default: 1200, min: 0, max: 4000, step: 50, help: 'The summary fades in' },
  'gameover.veil': { type: 'number', default: 0.8, min: 0, max: 1, step: 0.02, help: 'How dark the river stays behind the summary' },
});

const UI = DEPTH.hero + 2;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { backgrounds: ['bg-starting-shore'] });
  }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get('state');
    const view = gameOverView(state, Ferry);
    console.log(`[ferry] GameOverScene shown (cycle ${state.cycle}, completed ${state.completed}, ending: ${state.ending})`);
    this.leaving = false;
    this.seconds = 0;

    this.night = new NightStage(this, 'bg-starting-shore', () => 0, { settle: true, push: true });
    const dark = this.add.rectangle(width / 2, height / 2, width, height, COLOR.deep, 1).setDepth(UI - 1);
    enterScene(this);
    this.playLantern(() => {
      this.tweens.add({ targets: dark, fillAlpha: tune('gameover.veil'), duration: tune('gameover.revealMs'), ease: EASE.move });
      this.drawSummary(view);
    });
    this.input.keyboard.once('keydown-ENTER', () => this.toTitle());
    this.events.once('shutdown', () => { this.night = null; });
  }

  update(time, delta) {
    this.night?.update(time, delta);
    this.seconds = time / 1000;
    this.flame?.flicker(this.seconds);
  }

  /** One flame in the dark, with its glow: it gutters, shrinks and goes out. */
  playLantern(done) {
    const { width, height } = this.scale;
    const glow = this.add.image(width / 2, height / 2 - 10, 'board-soft').setTint(COLOR.lantern).setBlendMode(Phaser.BlendModes.ADD).setDepth(UI).setScale(1.2).setAlpha(0.5);
    this.flame = new LightFlames(this, 0, 0);
    this.flame.set([true]);
    this.flame.root.setPosition(width / 2, height / 2 + 14).setScale(2).setDepth(UI);
    const ms = tune('gameover.lanternMs');
    this.tweens.add({ targets: glow, alpha: { from: 0.5, to: 0.18 }, duration: ms / 7, ease: EASE.move, yoyo: true, repeat: 2 });
    this.tweens.add({
      targets: [glow, this.flame.root],
      alpha: 0,
      scale: 0.5,
      delay: ms * 0.6,
      duration: ms * 0.4,
      ease: EASE.exit,
      onComplete: () => {
        glow.destroy();
        this.flame.root.destroy();
        this.flame = null;
        done();
      },
    });
  }

  drawSummary(view) {
    const { width } = this.scale;
    const parts = [
      this.add.text(width / 2, 100, view.heading, headText(52, CSS.gold)).setOrigin(0.5),
      this.add.text(width / 2, 168, view.summary, bodyText(25, CSS.bone, { align: 'center', wordWrap: { width: 1000 } })).setOrigin(0.5),
      this.add.text(width / 2, 204, view.ending, bodyText(21, CSS.danger, { align: 'center', wordWrap: { width: 1000 } })).setOrigin(0.5),
      this.add.text(width / 2, 234, view.reached, bodyText(18, CSS.muted)).setOrigin(0.5),
      ...this.drawQuests(width, view),
      makeButton(this, width / 2 - 130, 620, 240, 54, t('title.newGame'), () => this.newGame(), { gold: true, size: 19 }).setEnabled(true),
      makeButton(this, width / 2 + 130, 620, 240, 54, t('gameOver.toTitle'), () => this.toTitle(), { size: 19 }).setEnabled(true),
    ];
    for (const part of parts) part.setDepth(UI).setAlpha(0);
    this.tweens.add({ targets: parts, alpha: 1, duration: tune('gameover.revealMs'), ease: EASE.enter });
  }

  drawQuests(width, view) {
    const panelW = 800;
    // Every quest is shown: rows get shorter and the text smaller when there are many, so the panel ends above the buttons.
    const rows = Math.max(1, Math.ceil(view.quests.length / 2));
    const rowH = Math.min(30, Math.floor(226 / rows));
    const size = Math.min(19, rowH - 5);
    const panelH = 64 + rows * rowH;
    const left = width / 2 - panelW / 2;
    const top = 266;
    const parts = [
      drawPanel(this.add.graphics(), left, top, panelW, panelH),
      this.add.text(left + 22, top + 14, TEXT.questsHeading, headText(17, CSS.muted)),
    ];
    if (view.questNote) {
      parts.push(this.add.text(left + 22, top + 48, view.questNote, bodyText(19)));
      return parts;
    }
    this.hint = this.add.text(width / 2, top + panelH + 18, '', bodyText(18, CSS.muted)).setOrigin(0.5);
    parts.push(this.hint);
    const colW = (panelW - 44 - 32) / 2;
    view.quests.forEach((q, i) => {
      const x = left + 22 + (i % 2) * (colW + 32);
      const y = top + 48 + Math.floor(i / 2) * rowH;
      const color = q.status === 'completed' ? CSS.gold : q.status === 'failed' ? CSS.danger : CSS.muted;
      parts.push(this.add.text(x, y, q.name, bodyText(size)));
      const status = this.add.text(x + colW, y, q.label, bodyText(size, color)).setOrigin(1, 0);
      parts.push(status);
      // The failure reason is long, so it sits behind a hover on the status word.
      if (q.reason) {
        status.setInteractive();
        status.on('pointerover', () => this.hint.setText(`${q.name}: ${q.reason}`));
        status.on('pointerout', () => this.hint.setText(''));
      }
    });
    return parts;
  }

  /** A new run with a random seed, saved like one from TitleScene. Anything but a finished run goes through TitleScene's warning. */
  newGame() {
    if (this.leaving) return;
    const saved = readSave();
    if (saved.broken || (saved.state && saved.state.phase !== 'ended')) {
      this.toTitle();
      return;
    }
    this.leaving = true;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    console.log(`[ferry] GameOverScene: new game (seed ${seed})`);
    const state = Ferry.create(seed);
    deleteSave();
    startAutosave(this.game, () => console.warn('[ferry] ' + t('title.storageFailed')));
    if (!writeSave(state)) console.warn('[ferry] ' + t('title.storageFailed'));
    leaveScene(this, () => this.router.start(state));
  }

  /** Fades out, then hands over to TitleScene, which starts the next run through the router. */
  toTitle() {
    if (this.leaving) return;
    this.leaving = true;
    console.log('[ferry] GameOverScene: back to title for a new run');
    leaveScene(this, () => this.scene.start('TitleScene'));
  }
}
