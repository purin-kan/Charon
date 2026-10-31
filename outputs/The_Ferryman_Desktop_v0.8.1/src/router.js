// Router: picks the scene from state.phase and switches only after the current scene
// reports its exit animation done (router.exitDone()), because CROSS moves the engine to
// `delivery` at once and a plain phase switch would cut the boat animation.
//
// Scenes never call each other. They read state and call router.dispatch(action).
import { Ferry } from './ferry.js';
import { sceneFor, OVERLAYS } from './phase-map.js';

export { sceneFor, OVERLAYS };

const EXIT_TIMEOUT_MS = 5000; // safety net: a scene that forgets exitDone() cannot freeze the game

export class Router {
  constructor(game) {
    this.game = game;
    this.state = null;
    this.base = null; // running full-screen scene key
    this.overlay = null; // running overlay key
    this.target = null; // base scene the state wants next
    this.timer = null;
    game.router = this;
  }

  /** Begin a run: show the scene for this state immediately. */
  start(state) {
    this.state = state;
    this.game.registry.set('state', state);
    this.target = null;
    this._enter(sceneFor(state));
    this.game.events.emit('ferry-state', state);
  }

  /** Start a fresh engine run. */
  newGame(seed = 1) { this.start(Ferry.create(seed)); }

  /** Apply an engine action. The one place scenes change the state. Returns the new state. */
  dispatch(action) {
    const next = Ferry.transition(this.state, action); // throws on an illegal action
    this.setState(next);
    return next;
  }

  /** Adopt a new state; the scene switch waits for exitDone(). */
  setState(state) {
    this.state = state;
    this.game.registry.set('state', state);
    const key = sceneFor(state);
    const isOverlay = OVERLAYS.includes(key);
    if (isOverlay) {
      this.target = null;
      if (this.overlay !== key) this._openOverlay(key);
    } else {
      if (this.overlay) this._closeOverlay();
      this.target = key === this.base ? null : key;
    }
    // Scenes listen to this to re-render, or to start an exit animation (see willLeave).
    this.game.events.emit('ferry-state', state);
    if (this.target) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.exitDone(), EXIT_TIMEOUT_MS);
    }
    if (this.target && !this.base) this.exitDone();
  }

  /** True when the current state will move the player out of this scene. */
  willLeave(sceneKey) { return this.base === sceneKey && !!this.target; }

  /** Scenes call this when their exit animation is finished (or at once if they have none). */
  exitDone() {
    clearTimeout(this.timer);
    if (!this.target) return;
    const key = this.target;
    this.target = null;
    this._enter(key);
  }

  /** Dev launcher: open any scene with any state, ignoring the phase mapping. */
  devOpen(sceneKey, state) {
    this.state = state;
    this.game.registry.set('state', state);
    this.target = null;
    this._enter(sceneKey);
    this.game.events.emit('ferry-state', state);
  }

  _enter(key) {
    const sm = this.game.scene;
    if (OVERLAYS.includes(key)) return this._openOverlay(key);
    if (this.overlay) this._closeOverlay();
    if (this.base) sm.stop(this.base);
    this.base = key;
    sm.start(key);
  }

  _openOverlay(key) {
    const sm = this.game.scene;
    if (this.overlay) sm.stop(this.overlay);
    this.overlay = key;
    sm.start(key); // runs in parallel with the base scene
    sm.bringToTop(key);
  }

  _closeOverlay() {
    this.game.scene.stop(this.overlay);
    this.overlay = null;
  }
}
