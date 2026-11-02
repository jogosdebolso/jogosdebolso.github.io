import Phaser from "phaser";
import { DEPTH } from "../constants";

/** Explosão radial de faíscas coloridas. */
export function burst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tint: number,
  count: number,
  radius: number,
): void {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const distance = radius * (0.6 + Math.random() * 0.6);
    const spark = scene.add
      .image(x, y, "spark")
      .setDepth(DEPTH.EFFECT)
      .setTint(tint)
      .setScale(0.8 + Math.random() * 0.6);
    scene.tweens.add({
      targets: spark,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0.2,
      duration: 380 + Math.random() * 200,
      onComplete: () => spark.destroy(),
    });
  }
}
