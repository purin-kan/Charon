import { Ferry } from '../ferry.js';
import { t } from '../text.js';
import { COLOR, CSS, bodyText, headText } from '../theme.js';
import { defineTuning, tune } from '../tuning.js';
import { REWARD, lossLines, rewardSpots } from './delivery-layout.js';
import { DEPTH } from './night-fx.js';

defineTuning({
  'delivery.rewardMs': { type: 'number', default: 1600, min: 200, max: 6000, step: 100, help: 'How long a memory reward stays' },
  'delivery.flyMs': { type: 'number', default: 520, min: 0, max: 2000, step: 10, help: 'A memory flies into the hand' },
});

const SHADE_DEPTH = DEPTH.hero + 2;

function rewardCard(scene, x, y, memory) {
  const face = scene.add.graphics();
  face.fillStyle(COLOR.panel, 0.97).fillRoundedRect(-REWARD.w / 2, -REWARD.h / 2, REWARD.w, REWARD.h, 12);
  face.lineStyle(1, COLOR.gold, 0.8).strokeRoundedRect(-REWARD.w / 2, -REWARD.h / 2, REWARD.w, REWARD.h, 12);
  const name = scene.add.text(0, -52, memory.name, headText(17, CSS.gold)).setOrigin(0.5);
  const body = scene.add.text(0, 14, memory.text, bodyText(16, CSS.bone, { align: 'center', lineSpacing: -1, wordWrap: { width: REWARD.w - 24 } })).setOrigin(0.5);
  return scene.add.container(x, y, [face, name, body]).setDepth(SHADE_DEPTH + 1);
}

/**
 * New memories and what was lost, over the scene, until a click or delivery.rewardMs; then each new memory flies up into
 * the hand as a card. Calls done at once if there is nothing to show.
 */
export function showOutcome(scene, outcome, done) {
  const { rewards } = outcome;
  const losses = lossLines(outcome, t, Ferry);
  if (!rewards.length && !losses.length) {
    done();
    return;
  }
  const spots = rewardSpots(rewards.length);
  const { width, height } = scene.scale;
  const shade = scene.add.rectangle(width / 2, height / 2, width, height, COLOR.deep, tune('ui.shadeAlpha')).setDepth(SHADE_DEPTH);
  const parts = [shade];
  if (rewards.length) parts.push(scene.add.text(640, REWARD.y - 120, t('delivery.received'), headText(24, CSS.gold)).setOrigin(0.5).setDepth(SHADE_DEPTH + 1));
  const lossTop = rewards.length ? REWARD.y + 110 : REWARD.y - 14 * (losses.length - 1);
  losses.forEach((line, i) => {
    parts.push(scene.add.text(640, lossTop + i * 28, line, bodyText(21, CSS.danger)).setOrigin(0.5).setDepth(SHADE_DEPTH + 1));
  });
  const cards = rewards.map((memory, i) => rewardCard(scene, spots[i].x, spots[i].y, memory));
  for (const part of [...parts, ...cards]) {
    const alpha = part.alpha;
    part.setAlpha(0);
    scene.tweens.add({ targets: part, alpha, duration: 220, ease: 'Sine.Out' });
  }
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    for (const part of parts) part.destroy();
    if (!cards.length) {
      done();
      return;
    }
    cards.forEach((card, i) => scene.tweens.add({
      targets: card,
      x: tune('hud.handLeft') + 40 + i * 20,
      y: tune('hud.handY') + 40,
      scale: 0.25,
      alpha: 0.2,
      duration: tune('delivery.flyMs'),
      ease: 'Cubic.InOut',
      delay: i * 80,
      onComplete: () => {
        card.destroy();
        if (i === cards.length - 1) done();
      },
    }));
  };
  scene.time.delayedCall(tune('delivery.rewardMs'), finish);
  // Armed a frame later: this can run inside the click that confirmed, which would skip it.
  scene.time.delayedCall(0, () => scene.input.once('pointerdown', finish));
}
