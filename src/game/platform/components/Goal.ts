import Phaser from "phaser";
import { DEPTH } from "../constants";
import { burst } from "./effects";

/** Bandeira de fim de fase. */
export class Goal {
  constructor(
    private readonly scene: Phaser.Scene,
    readonly x: number,
    private readonly groundY: number,
  ) {
    scene.add
      .sprite(x, groundY + 8, "goal-0")
      .setOrigin(14 / 72, 1)
      .setDepth(DEPTH.GOAL)
      .play("goal-wave");
  }

  reached(playerX: number): boolean {
    return playerX >= this.x - 20;
  }

  /** Confetes coloridos ao completar a fase. */
  celebrate(): void {
    const colors = [0xfde047, 0xf472b6, 0x4ade80, 0x60a5fa];
    colors.forEach((color, i) => {
      this.scene.time.delayedCall(i * 140, () =>
        burst(this.scene, this.x + 30, this.groundY - 150, color, 14, 90),
      );
    });
  }
}
