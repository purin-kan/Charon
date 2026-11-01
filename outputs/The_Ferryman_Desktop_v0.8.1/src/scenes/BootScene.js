import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { queueAssets } from '../preloader.js';
import { openFromQuery } from '../dev/launcher.js';

/** Loads whatever assets exist (the rest falls back to emblems/silence), proves the engine works, then leaves. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Ids come from the engine data; files are optional. Convention: assets/art/<id>.png, etc.
    queueAssets(this, {
      art: Ferry.data.souls.map((s) => s.id),
      backgrounds: Ferry.data.destinations.map((d) => d.id),
      // Audio ids follow notes/T-07_AUDIO_PLAN.md (bgm-, amb-, sfx- prefixes).
      audio: ['bgm-menu', 'amb-crossing', 'sfx-board', 'sfx-unboard', 'sfx-ui-click', 'sfx-delivery-success', 'sfx-wraith'],
    });
  }

  create() {
    const { width, height } = this.scale;
    const state = Ferry.create(1);
    console.log(`[ferry] Phaser ${Phaser.VERSION} booted (renderer: ${this.game.renderer.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS'})`);
    console.log(`[ferry] Ferry.create(1) -> state.phase = ${state.phase} (version ${Ferry.data.version})`);
    this.add.text(width / 2, height / 2, `Phaser ${Phaser.VERSION} + Ferry engine OK\nstate.phase = ${state.phase}`, {
      fontSize: '28px', color: '#e8f1f7', align: 'center',
    }).setOrigin(0.5);

    const router = this.game.router;
    // Plain timer (not this.time): keeps working even if the window is hidden and the game loop is throttled.
    setTimeout(() => {
      this.scene.stop();
      if (!openFromQuery(router)) this.scene.start('TitleScene');
    }, 600);
  }
}
