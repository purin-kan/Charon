import { Ferry } from '../ferry.js';
import { t } from '../text.js';
import { defineTuning, tune } from '../tuning.js';
import { REWARD, lossLines, rewardSpots } from './delivery-layout.js';

const FONT = 'sans-serif';
const GOLD = 0xedc47f;

defineTuning({
  'delivery.rewardMs': { type: 'number', default: 1600, min: 200, max: 6000, step: 100, help: 'How long a memory reward stays' },
});

/** New memories and what was lost, over the scene, until a click or delivery.rewardMs. Calls done at once if there is nothing to show. */
export function showOutcome(scene, outcome, done) {
  const { rewards } = outcome;
  const losses = lossLines(outcome, t, Ferry);
  if (!rewards.length && !losses.length) {
    done();
    return;
  }
  const spots = rewardSpots(rewards.length);
  const { width, height } = scene.scale;
  const parts = [scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6).setDepth(3)];
  if (rewards.length) {
    parts.push(scene.add.text(640, REWARD.y - 120, t('delivery.received'), { fontFamily: FONT, fontSize: '26px', color: '#edc47f' }).setOrigin(0.5).setDepth(4));
  }
  const lossTop = rewards.length ? REWARD.y + 110 : REWARD.y - 14 * (losses.length - 1);
  losses.forEach((line, i) => {
    parts.push(scene.add.text(640, lossTop + i * 28, line, { fontFamily: FONT, fontSize: '20px', color: '#ff9f8a' }).setOrigin(0.5).setDepth(4));
  });
  rewards.forEach((memory, i) => {
    const { x, y } = spots[i];
    const panel = scene.add.rectangle(x, y, REWARD.w, REWARD.h, 0x1d2c38).setStrokeStyle(2, GOLD).setDepth(4);
    const name = scene.add.text(x, y - 52, memory.name, { fontFamily: FONT, fontSize: '20px', color: '#e8f1f7' }).setOrigin(0.5).setDepth(4);
    const body = scene.add.text(x, y + 14, memory.text, {
      fontFamily: FONT, fontSize: '14px', color: '#cfe3f0', align: 'center', wordWrap: { width: REWARD.w - 24 },
    }).setOrigin(0.5).setDepth(4);
    parts.push(panel, name, body);
  });
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    for (const part of parts) part.destroy();
    done();
  };
  scene.time.delayedCall(tune('delivery.rewardMs'), finish);
  // Armed a frame later: this can run inside the click that confirmed, which would skip it.
  scene.time.delayedCall(0, () => scene.input.once('pointerdown', finish));
}
