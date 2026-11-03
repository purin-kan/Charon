import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { queueAssets, playSound } from '../preloader.js';
import { t } from '../text.js';
import { readSave, writeSave, deleteSave, startAutosave, qaName } from '../save.js';

// Title screen (T-11): Continue and New game over one save slot. New game takes an optional seed,
// so a demo can replay the same routes and encounters (Ferry.create(seed)).
const FONT = 'sans-serif';
const GOLD = '#edc47f';
const MAX_SEED = 4294967295;
const FADE_MS = 300;
const MENU_MUSIC = ['bgm-menu', 'menu-bgm']; // T-07 names the file bgm-menu; BootScene queues menu-bgm

const randomSeed = () => crypto.getRandomValues(new Uint32Array(1))[0];

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  get router() { return this.game.router; }

  preload() {
    queueAssets(this, { audio: MENU_MUSIC });
  }

  create() {
    const { width, height } = this.scale;
    this.save = readSave();
    this.seedText = '';
    this.editingSeed = false;
    this.leaving = false;
    console.log(`[ferry] TitleScene shown (save: ${this.save.state ? 'found' : this.save.broken ? 'unreadable' : 'none'})`);

    this.drawBackdrop(width, height);
    this.add.text(width / 2, 170, t('title.heading'), { fontFamily: FONT, fontSize: '72px', color: GOLD, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(width / 2, 245, t('title.tagline'), { fontFamily: FONT, fontSize: '22px', color: '#c9d6df', align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5);

    const saved = this.save.state;
    const continueDetail = saved
      ? saved.phase === 'ended' ? t('title.continueEnded') : t('title.continueDetail', { cycle: saved.cycle, light: saved.light, maxLight: Ferry.maxLight(saved) })
      : this.save.broken ? '' : t('title.noSave');
    this.continueBtn = this.button(width / 2, 345, t('title.continue'), continueDetail, () => this.continueRun(), !!saved);
    this.newBtn = this.button(width / 2, 445, t('title.newGame'), '', () => this.askNewGame(), true);

    this.seedLabel = this.add.text(width / 2, 525, '', { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.seedLabel.on('pointerdown', () => this.setEditingSeed(!this.editingSeed));
    this.add.text(width / 2, 555, t('title.seedHint'), { fontFamily: FONT, fontSize: '15px', color: '#6f8796' }).setOrigin(0.5);
    this.renderSeed();

    this.note = this.add.text(width / 2, 620, '', { fontFamily: FONT, fontSize: '18px', color: '#ff9f8a', align: 'center', wordWrap: { width: 900 } }).setOrigin(0.5);
    if (this.save.unavailable) this.note.setText(t('title.storageUnavailable'));
    else if (this.save.broken) this.note.setText(t('title.brokenSave'));
    if (qaName()) this.add.text(16, height - 16, t('title.qaBadge', { name: qaName() }), { fontFamily: FONT, fontSize: '16px', color: '#0b1117', backgroundColor: '#e8c27f', padding: { x: 8, y: 4 } }).setOrigin(0, 1);

    // Keyboard listeners outlive a scene restart, so remove this one on shutdown.
    const onKey = (e) => this.onKey(e);
    this.input.keyboard.on('keydown', onKey);
    this.music = MENU_MUSIC.map((id) => playSound(this, id, { loop: true, volume: 0.5 })).find(Boolean) ?? null;
    this.events.once('shutdown', () => {
      this.input.keyboard.off('keydown', onKey);
      this.music?.stop();
    });
    this.cameras.main.fadeIn(FADE_MS, 11, 17, 23);
  }

  /** Dark river, a moon and a few drifting wave lines. Drawn shapes only, so it needs no art files. */
  drawBackdrop(width, height) {
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0b1117, 0x0b1117, 0x10283a, 0x10283a, 1).fillRect(0, 0, width, height);
    this.add.circle(width * 0.78, 110, 46, 0xe9e3c8, 0.85);
    this.add.circle(width * 0.78, 110, 90, 0xe9e3c8, 0.06);
    const river = this.add.graphics();
    river.fillStyle(0x0d2230, 1).fillRect(0, height * 0.7, width, height * 0.3);
    for (let i = 0; i < 7; i++) {
      const y = height * 0.72 + i * 28;
      const wave = this.add.graphics().lineStyle(2, 0x2c5168, 0.6 - i * 0.06);
      wave.beginPath();
      for (let x = -40; x <= width + 40; x += 20) wave.lineTo(x, y + Math.sin(x / 70 + i) * 4);
      wave.strokePath();
      this.tweens.add({ targets: wave, x: { from: -30, to: 30 }, duration: 4000 + i * 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }

  /** A wide button with an optional second line. Disabled buttons are dimmed and ignore clicks. */
  button(x, y, label, detail, onPress, enabled) {
    const w = 380, h = detail ? 76 : 64;
    const box = this.add.rectangle(0, 0, w, h, enabled ? 0x1d363c : 0x16232b).setStrokeStyle(2, enabled ? 0xedc47f : 0x33454f);
    const main = this.add.text(0, detail ? -12 : 0, label, { fontFamily: FONT, fontSize: '28px', color: enabled ? '#f3ecd9' : '#5d707b' }).setOrigin(0.5);
    const sub = this.add.text(0, 20, detail ?? '', { fontFamily: FONT, fontSize: '16px', color: enabled ? '#9fb6c6' : '#5d707b' }).setOrigin(0.5);
    const btn = this.add.container(x, y, [box, main, sub]).setSize(w, h);
    if (enabled) {
      btn.setInteractive({ useHandCursor: true });
      btn.on('pointerover', () => box.setFillStyle(0x2c4a51));
      btn.on('pointerout', () => box.setFillStyle(0x1d363c));
      btn.on('pointerdown', () => { if (!this.leaving && !this.dialog) onPress(); });
    }
    return btn;
  }

  renderSeed() {
    const value = this.seedText || (this.editingSeed ? '' : t('title.seedRandom'));
    this.seedLabel.setText(`${t('title.seedLabel')}: ${value}${this.editingSeed ? '_' : ''}`);
    this.seedLabel.setColor(this.editingSeed ? GOLD : '#9fb6c6');
  }

  setEditingSeed(on) {
    this.editingSeed = on;
    this.renderSeed();
  }

  onKey(e) {
    // Phaser 4.2.1 can hand the same keydown event over twice (same object, same timeStamp).
    if (e === this.lastKey) return;
    this.lastKey = e;
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
    this.cameras.main.fadeOut(FADE_MS, 11, 17, 23);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.router.start(state);
    });
  }

  openDialog() {
    const { width, height } = this.scale;
    const shade = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, 620, 260, 0x10202c).setStrokeStyle(2, 0xedc47f);
    const title = this.add.text(width / 2, height / 2 - 80, t('title.replaceTitle'), { fontFamily: FONT, fontSize: '30px', color: GOLD }).setOrigin(0.5);
    const body = this.add.text(width / 2, height / 2 - 25, t('title.replaceBody'), { fontFamily: FONT, fontSize: '19px', color: '#e2ded1', align: 'center', wordWrap: { width: 540 } }).setOrigin(0.5);
    const pill = (x, label, fn, fill) => {
      const b = this.add.text(x, height / 2 + 70, label, { fontFamily: FONT, fontSize: '22px', color: fill ? '#18140a' : '#f3ecd9', backgroundColor: fill ? '#edc47f' : '#1d363c', padding: { x: 18, y: 10 } })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', fn);
      return b;
    };
    const yes = pill(width / 2 - 110, t('title.replaceYes'), () => { this.closeDialog(); this.newGame(); }, true);
    const no = pill(width / 2 + 120, t('common.cancel'), () => this.closeDialog(), false);
    this.dialog = [shade, panel, title, body, yes, no];
  }

  closeDialog() {
    for (const part of this.dialog ?? []) part.destroy();
    this.dialog = null;
  }
}
