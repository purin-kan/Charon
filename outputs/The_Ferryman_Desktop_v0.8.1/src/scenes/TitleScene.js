import { StubScene } from './StubScene.js';

// STUB. Its Next button starts a fresh run (seed 1) through the router, which then shows BoardingScene.
export class TitleScene extends StubScene {
  constructor() {
    super('TitleScene');
  }

  next() {
    console.log('[ferry] TitleScene: Next pressed, starting a new run (seed 1)');
    this.scene.stop();
    this.router.newGame(1);
  }
}
