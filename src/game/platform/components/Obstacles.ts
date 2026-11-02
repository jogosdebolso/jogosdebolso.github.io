import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { ObstacleSpec } from "../levelConfig";

const TILE = 48;
/** Altura da parte que machuca (a base das folhas não conta). */
const HIT_HEIGHT = 24;

interface Hazard {
  left: number;
  right: number;
  surface: number;
}

/** Espinheiros no chão: encostar neles machuca, e não dá para pisar para derrotá-los. */
export class Obstacles {
  private readonly hazards: Hazard[];

  constructor(scene: Phaser.Scene, specs: readonly ObstacleSpec[], groundY: number) {
    this.hazards = specs.map((spec) => {
      const surface = spec.surfaceY ?? groundY;
      const count = Math.max(1, Math.round(spec.width / TILE));
      for (let i = 0; i < count; i += 1) {
        scene.add
          .image(spec.x + i * TILE, surface + 4, "thorns")
          .setOrigin(0, 1)
          .setDepth(DEPTH.THORNS);
      }
      return { left: spec.x + 4, right: spec.x + count * TILE - 4, surface };
    });
  }

  /** Verdadeiro se a caixa do herói (centrada em `x`, `y`) toca algum espinheiro. */
  touches(x: number, y: number, halfWidth: number, halfHeight: number): boolean {
    return this.hazards.some(
      (h) =>
        x + halfWidth - 4 > h.left &&
        x - halfWidth + 4 < h.right &&
        y + halfHeight > h.surface - HIT_HEIGHT &&
        y - halfHeight < h.surface,
    );
  }
}
