import Phaser from 'phaser';

/**
 * Placeholder scene: shows its name, the current engine phase and a "Next" button.
 * "Next" dispatches nothing real; it only reports "exit animation done" to the router.
 * Replace a stub by making the scene file extend Phaser.Scene directly (see README, "Add a scene").
 */
export class StubScene extends Phaser.Scene {
  get router() { return this.game.router; }

  create() {
    const { width, height } = this.scale;
    const state = this.registry.get('state');
    console.log(`[ferry] ${this.scene.key} shown (phase ${state?.phase ?? 'none'})`);
    this.add.rectangle(width / 2, height / 2, width, height, 0x10202c).setAlpha(this.isOverlay ? 0.85 : 1);
    this.add.text(width / 2, height * 0.32, this.scene.key, { fontSize: '48px', color: '#e8f1f7' }).setOrigin(0.5);
    this.info = this.add
      .text(width / 2, height * 0.45, this.describe(state), { fontSize: '20px', color: '#9fb6c6', align: 'center' })
      .setOrigin(0.5);

    const btn = this.add
      .text(width / 2, height * 0.65, '  Next  ', { fontSize: '28px', color: '#0b1117', backgroundColor: '#7fa6c0' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    btn.on('pointerdown', () => this.next());

    this.onState = (s) => this.info.setText(this.describe(s));
    this.game.events.on('ferry-state', this.onState);
    this.events.once('shutdown', () => this.game.events.off('ferry-state', this.onState));
  }

  get isOverlay() { return this.scene.key.endsWith('Overlay'); }

  describe(state) {
    if (!state) return '(no state)';
    return `phase: ${state.phase}   window: ${state.window?.kind}   light: ${state.light}\nround ${state.round}, cycle ${state.cycle}`;
  }

  /** Placeholder behavior: nothing is dispatched to the engine. */
  next() {
    console.log(`[ferry] ${this.scene.key}: Next pressed (placeholder, no dispatch)`);
    this.router.exitDone();
  }
}
