// The scene list. Order matters only for BootScene (must be first: it is the one Phaser starts).
// To add a scene: create its file, import it here, add it to SCENES, and add a phase rule in ../router.js.
import { BootScene } from './BootScene.js';
import { TitleScene } from './TitleScene.js';
import { BoardingScene } from './BoardingScene.js';
import { CrossingScene } from './CrossingScene.js';
import { DeliveryScene } from './DeliveryScene.js';
import { ReturnScene } from './ReturnScene.js';
import { GameOverScene } from './GameOverScene.js';
import { ChoiceOverlay } from './ChoiceOverlay.js';
import { TrimOverlay } from './TrimOverlay.js';

export const SCENES = [
  BootScene,
  TitleScene,
  BoardingScene,
  CrossingScene,
  DeliveryScene,
  ReturnScene,
  GameOverScene,
  ChoiceOverlay,
  TrimOverlay,
];

