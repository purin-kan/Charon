import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { TEXT, gameOverView } from './gameover-layout.js';

// Game over (T-17). The run is endless, so there is no win screen: this shows how far the player
// rowed and why the lantern went out. "Start a new run" returns to TitleScene (suggested by
// Tinpatpun in PR 16) so the player sees the seed field and the replace-save confirmation.
// Style follows TitleScene (T-11): river backdrop, gold heading, wide gold-outlined button.

const FONT = 'sans-serif';
const GOLD = '#edc47f';
const FADE_MS = 300;

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  get router() { return this.game.router; }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get('state');
    const view = gameOverView(state, Ferry);
    console.log(`[ferry] GameOverScene shown (cycle ${state.cycle}, completed ${state.completed}, ending: ${state.ending})`);
    this.leaving = false;

    this.drawBackdrop(width, height);
    this.add.text(width / 2, 100, view.heading, { fontFamily: FONT, fontSize: '64px', color: GOLD, fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(width / 2, 168, view.summary, { fontFamily: FONT, fontSize: '22px', color: '#c9d6df', align: 'center', wordWrap: { width: 1000 } }).setOrigin(0.5);
    this.add.text(width / 2, 204, view.ending, { fontFamily: FONT, fontSize: '19px', color: '#ff9f8a', align: 'center', wordWrap: { width: 1000 } }).setOrigin(0.5);
    this.add.text(width / 2, 234, view.reached, { fontFamily: FONT, fontSize: '16px', color: '#9fb6c6' }).setOrigin(0.5);

    this.drawQuests(width, view);

    this.button(width / 2, 610, TEXT.newRun, () => this.toTitle());
    this.input.keyboard.once('keydown-ENTER', () => this.toTitle());
    this.cameras.main.fadeIn(FADE_MS, 11, 17, 23);
  }

  /** Same drawn river as TitleScene, so the two screens read as one place. */
  drawBackdrop(width, height) {
    this.add.graphics().fillGradientStyle(0x0b1117, 0x0b1117, 0x10283a, 0x10283a, 1).fillRect(0, 0, width, height);
    this.add.graphics().fillStyle(0x0d2230, 1).fillRect(0, height * 0.7, width, height * 0.3);
    for (let i = 0; i < 5; i++) {
      const y = height * 0.72 + i * 28;
      const wave = this.add.graphics().lineStyle(2, 0x2c5168, 0.6 - i * 0.08);
      wave.beginPath();
      for (let x = -40; x <= width + 40; x += 20) wave.lineTo(x, y + Math.sin(x / 70 + i) * 4);
      wave.strokePath();
      this.tweens.add({ targets: wave, x: { from: -30, to: 30 }, duration: 4000 + i * 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }
  }

  drawQuests(width, view) {
    const panelW = 800;
    const rows = Math.max(1, Math.ceil(view.quests.length / 2)) + (view.more ? 1 : 0);
    const panelH = 64 + rows * 30;
    const left = width / 2 - panelW / 2;
    const top = 266;
    this.add.rectangle(width / 2, top + panelH / 2, panelW, panelH, 0x10202c).setStrokeStyle(2, 0x33454f);
    this.add.text(left + 22, top + 14, TEXT.questsHeading, { fontFamily: FONT, fontSize: '20px', color: '#9fb6c6' });
    if (view.questNote) {
      this.add.text(left + 22, top + 48, view.questNote, { fontFamily: FONT, fontSize: '17px', color: '#cfe3f0' });
      return;
    }
    const colW = (panelW - 44 - 32) / 2;
    view.quests.forEach((q, i) => {
      const x = left + 22 + (i % 2) * (colW + 32);
      const y = top + 48 + Math.floor(i / 2) * 30;
      const color = q.status === 'completed' ? GOLD : q.status === 'failed' ? '#ff9f8a' : '#9fb6c6';
      this.add.text(x, y, q.name, { fontFamily: FONT, fontSize: '17px', color: '#e8f1f7' });
      const status = this.add.text(x + colW, y, q.label, { fontFamily: FONT, fontSize: '17px', color }).setOrigin(1, 0);
      // The failure reason is long, so it sits behind a hover on the status word.
      if (q.reason) {
        status.setInteractive();
        status.on('pointerover', () => this.hint.setText(`${q.name}: ${q.reason}`));
        status.on('pointerout', () => this.hint.setText(''));
      }
    });
    if (view.more) this.add.text(left + 22, top + panelH - 34, view.more, { fontFamily: FONT, fontSize: '16px', color: '#9fb6c6' });
    this.hint = this.add.text(width / 2, top + panelH + 18, '', { fontFamily: FONT, fontSize: '16px', color: '#9fb6c6' }).setOrigin(0.5);
  }

  /** Wide button with the TitleScene look. */
  button(x, y, label, onPress) {
    const w = 380, h = 64;
    const box = this.add.rectangle(0, 0, w, h, 0x1d363c).setStrokeStyle(2, 0xedc47f);
    const text = this.add.text(0, 0, label, { fontFamily: FONT, fontSize: '28px', color: '#f3ecd9' }).setOrigin(0.5);
    const btn = this.add.container(x, y, [box, text]).setSize(w, h).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => box.setFillStyle(0x2c4a51));
    btn.on('pointerout', () => box.setFillStyle(0x1d363c));
    btn.on('pointerdown', onPress);
    return btn;
  }

  /** Fades out, then hands over to TitleScene, which starts the next run through the router. */
  toTitle() {
    if (this.leaving) return;
    this.leaving = true;
    console.log('[ferry] GameOverScene: back to title for a new run');
    this.cameras.main.fadeOut(FADE_MS, 11, 17, 23);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('TitleScene'));
  }
}
