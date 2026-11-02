import Phaser from "phaser";
import { COIN_FRAMES, DEPTH } from "../constants";
import type { Point } from "../levelConfig";
import { burst } from "./effects";

/** Moedas giratórias coletáveis. */
export class Coins {
  private readonly items: Array<{ sprite: Phaser.GameObjects.Sprite; taken: boolean }>;
  private collected = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    positions: readonly Point[],
  ) {
    this.items = positions.map(({ x, y }, index) => {
      const sprite = scene.add.sprite(x, y, "coin-0").setDepth(DEPTH.COIN);
      sprite.play({ key: "coin-spin", startFrame: index % COIN_FRAMES });
      scene.tweens.add({
        targets: sprite,
        y: y - 5,
        duration: 700 + (index % 5) * 60,
        delay: index * 40,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      return { sprite, taken: false };
    });
  }

  get total(): number {
    return this.items.length;
  }

  get count(): number {
    return this.collected;
  }

  /** Coleta as moedas tocadas pelo jogador e devolve quantas foram pegas neste quadro. */
  collect(playerX: number, playerY: number): number {
    let gained = 0;
    for (const item of this.items) {
      if (item.taken) {
        continue;
      }
      const { sprite } = item;
      if (Math.abs(sprite.x - playerX) < 28 && Math.abs(sprite.y - playerY) < 34) {
        item.taken = true;
        gained += 1;
        this.scene.tweens.killTweensOf(sprite);
        burst(this.scene, sprite.x, sprite.y, 0xfde047, 6, 26);
        this.scene.tweens.add({
          targets: sprite,
          y: sprite.y - 28,
          scale: 1.6,
          alpha: 0,
          duration: 260,
          onComplete: () => sprite.destroy(),
        });
      }
    }
    this.collected += gained;
    return gained;
  }
}
