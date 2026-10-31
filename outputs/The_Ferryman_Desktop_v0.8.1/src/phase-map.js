// Pure mapping from engine state to scene key. No imports, so Node tools can test it.
// Add a scene's phase rule here (README, "Add a scene").
export const OVERLAYS = ['ChoiceOverlay', 'TrimOverlay'];

export function sceneFor(state) {
  switch (state.phase) {
    case 'boarding': return 'BoardingScene';
    case 'window': // fall through
    case 'review':
      // state.window.kind is 'outward' or 'return' (windowState in engine.js); review keeps the same window.
      return state.window.kind === 'return' ? 'ReturnScene' : 'CrossingScene';
    case 'delivery': return 'DeliveryScene';
    case 'choice': return 'ChoiceOverlay';
    case 'trim': return 'TrimOverlay';
    case 'ended': return 'GameOverScene';
    default: throw new Error('Router: unknown phase ' + state.phase);
  }
}
