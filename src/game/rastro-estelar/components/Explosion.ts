import Phaser from "phaser";

const EXPLOSION_COLORS = [0x38bdf8, 0x67e8f9, 0xa5f3fc, 0xfbbf24, 0xfb7185];
const SMOKE_COLORS = [0x334155, 0x475569, 0x64748b];

export function createExplosion(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  dramatic = false,
): number {
  const radius = Math.max(size * 0.5, 20);
  const duration = dramatic ? 2850 : 680;
  const flash = scene.add
    .circle(x, y, radius * 0.28, 0xffffff, 0.96)
    .setDepth(6);

  scene.tweens.add({
    targets: flash,
    scale: dramatic ? 5.2 : 3.2,
    alpha: 0,
    duration: dramatic ? 520 : 210,
    ease: "Cubic.easeOut",
    onComplete: () => flash.destroy(),
  });

  const ringCount = dramatic ? 5 : 2;
  for (let index = 0; index < ringCount; index += 1) {
    const color = EXPLOSION_COLORS[index % EXPLOSION_COLORS.length];
    const ring = scene.add
      .circle(x, y, radius * (dramatic ? 0.16 : 0.2), color, 0)
      .setStrokeStyle(dramatic ? 3 : 2, color, 0.92)
      .setScale(0.35)
      .setDepth(5.8 + index * 0.01);
    scene.tweens.add({
      targets: ring,
      scale: dramatic ? 4.6 + index * 0.55 : 3.4,
      alpha: 0,
      delay: index * (dramatic ? 130 : 55),
      duration: dramatic ? 1050 + index * 140 : 460 + index * 65,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
  }

  const debrisCount = dramatic ? 46 : 14;
  for (let index = 0; index < debrisCount; index += 1) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = radius * Phaser.Math.FloatBetween(
      dramatic ? 0.7 : 0.65,
      dramatic ? 2.9 : 1.9,
    );
    const length = Phaser.Math.FloatBetween(radius * 0.08, radius * 0.24);
    const spark = scene.add
      .rectangle(
        x,
        y,
        Math.max(3, length),
        Math.max(2, length * 0.22),
        Phaser.Utils.Array.GetRandom(EXPLOSION_COLORS),
      )
      .setRotation(angle)
      .setDepth(6.1);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      rotation: angle + Phaser.Math.FloatBetween(-2, 2),
      scale: 0,
      alpha: 0,
      delay: dramatic ? Phaser.Math.Between(80, 320) : 0,
      duration: dramatic ? Phaser.Math.Between(850, 1500) : 420,
      ease: "Cubic.easeOut",
      onComplete: () => spark.destroy(),
    });
  }

  if (dramatic) {
    for (let index = 0; index < 8; index += 1) {
      const smoke = scene.add
        .circle(
          x + Phaser.Math.Between(-radius * 0.3, radius * 0.3),
          y + Phaser.Math.Between(-radius * 0.3, radius * 0.3),
          radius * Phaser.Math.FloatBetween(0.12, 0.24),
          Phaser.Utils.Array.GetRandom(SMOKE_COLORS),
          0.68,
        )
        .setDepth(5.7);
      scene.tweens.add({
        targets: smoke,
        x: smoke.x + Phaser.Math.Between(-radius, radius),
        y: smoke.y + Phaser.Math.Between(-radius, radius),
        scale: Phaser.Math.FloatBetween(2.2, 3.6),
        alpha: 0,
        delay: index * 90,
        duration: Phaser.Math.Between(1050, 1650),
        ease: "Sine.easeOut",
        onComplete: () => smoke.destroy(),
      });
    }

    for (let index = 0; index < 3; index += 1) {
      scene.time.delayedCall(720 + index * 490, () => {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const distance = radius * Phaser.Math.FloatBetween(0.2, 0.7);
        createExplosion(
          scene,
          x + Math.cos(angle) * distance,
          y + Math.sin(angle) * distance,
          size * 0.24,
        );
      });
    }
  }

  return duration;
}
