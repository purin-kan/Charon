import Phaser from 'phaser';
import { Ferry } from '../ferry.js';
import { WRAITH_FRAMES, queueAssets, soulArtIds } from '../preloader.js';
import { openFromQuery } from '../dev/launcher.js';
import { whenFontsReady } from '../theme.js';
import { CHOICE_ART } from './delivery-layout.js';
import { makeTextures } from './night-fx.js';
import { PIER_ART } from './river-boat.js';

/** Loads whatever assets exist (the rest falls back to emblems/silence), proves the engine works, then leaves. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Ids come from the engine data; files are optional. Convention: assets/art/<id>.png, etc.
    queueAssets(this, {
      // Everything, once: scenes still queue what they use, but a scene change then has nothing left to load.
      art: [...soulArtIds(), ...Ferry.data.memories.map((m) => m.id), ...Object.values(CHOICE_ART), ...WRAITH_FRAMES, 'sprite-boat-horizontal', PIER_ART],
      backgrounds: ['bg-starting-shore', ...Ferry.data.destinations.map((d) => d.id)],
      // Audio ids follow notes/T-07_AUDIO_PLAN.md (bgm-, amb-, sfx- prefixes).
      audio: ['bgm-menu', 'amb-crossing', 'sfx-board', 'sfx-unboard', 'sfx-ui-click', 'sfx-delivery-success', 'sfx-wraith', 'sfx-fog'],
    });
  }

  create() {
    const state = Ferry.create(1);
    console.log(`[ferry] Phaser ${Phaser.VERSION} booted (renderer: ${this.game.renderer.type === Phaser.WEBGL ? 'WEBGL' : 'CANVAS'})`);
    console.log(`[ferry] Ferry.create(1) -> state.phase = ${state.phase} (version ${Ferry.data.version})`);
    const router = this.game.router;
    // Every scene after this one may draw text at once, so the fonts come first. makeTextures gives them the soft shapes
    // the theme's buttons use. Plain promise (not this.time): keeps working if the window is hidden and the loop is throttled.
    makeTextures(this);
    whenFontsReady().then(() => {
      this.scene.stop();
      if (!openFromQuery(router)) this.scene.start('TitleScene');
    });
  }
}
