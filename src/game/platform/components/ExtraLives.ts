import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { Point } from "../levelConfig";
import { burst } from "./effects";

/** Corações dourados escondidos: cada um devolve uma vida. */
export class ExtraLives {
  private readonly items: Array<{ sprite: Phaser.GameObjects.Image; glow: Phaser.GameObjects.Arc; taken: boolean }>;

  constructor(
    private readonly scene: Phaser.Scene,
    positions: readonly Point[],
  ) {
    this.items = positions.map(({ x, y }) => {
      const glow = scene.add.circle(x, y, 24, 0xfde047, 0.35).setDepth(DEPTH.COIN - 0.05);
      const sprite = scene.add.image(x, y, "heart").setScale(1.25).setDepth(DEPTH.COIN);
      scene.tweens.add({ targets: glow, scale: 1.35, alpha: 0.15, duration: 650, yoyo: true, repeat: -1 });
      scene.tweens.add({ targets: sprite, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return { sprite, glow, taken: false };
    });
  }

  /** Coleta os corações tocados e devolve quantos foram pegos neste quadro. */
  collect(playerX: number, playerY: number): number {
    let gained = 0;
    for (const item of this.items) {
      if (item.taken) {
        continue;
      }
      const { sprite, glow } = item;
      if (Math.abs(sprite.x - playerX) < 30 && Math.abs(sprite.y - playerY) < 36) {
        item.taken = true;
        gained += 1;
        this.scene.tweens.killTweensOf([sprite, glow]);
        burst(this.scene, sprite.x, sprite.y, 0xfde047, 14, 50);
        burst(this.scene, sprite.x, sprite.y, 0xf87171, 8, 36);
        this.scene.tweens.add({
          targets: [sprite, glow],
          y: sprite.y - 40,
          scale: 2,
          alpha: 0,
          duration: 420,
          onComplete: () => {
            sprite.destroy();
            glow.destroy();
          },
        });
      }
    }
    return gained;
  }
}
