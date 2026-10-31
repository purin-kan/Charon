import './index.css';
import Phaser from 'phaser';
import { SCENES } from './scenes/index.js';
import { Router } from './router.js';
import { mountDevMenu } from './dev/launcher.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 1280,
  height: 720,
  backgroundColor: '#0b1117',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: SCENES, // BootScene is first, so it is the only one that starts automatically
});

new Router(game); // sets game.router
game.events.once('ready', () => mountDevMenu(game, Object.keys(game.scene.keys)));
