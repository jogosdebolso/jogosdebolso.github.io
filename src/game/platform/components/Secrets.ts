import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { SecretSpec } from "../levelConfig";
import { createRandom } from "../random";
import { burst } from "./effects";

interface Secret {
  spec: SecretSpec;
  cover: Phaser.GameObjects.Graphics;
  found: boolean;
}

const LEAF_COLORS = [0x23803f, 0x2f9e4f, 0x4fbf6a, 0x3aa85a] as const;

/** Folhagem que esconde uma passagem secreta; ao entrar nela, a copa fica transparente. */
export class Secrets {
  private readonly items: Secret[];

  constructor(
    private readonly scene: Phaser.Scene,
    specs: readonly SecretSpec[],
    private readonly groundY: number,
  ) {
    this.items = specs.map((spec) => ({ spec, cover: this.drawCover(spec), found: false }));
  }

  /** Revela as passagens em que o herói entrou e devolve quantas foram descobertas agora. */
  update(heroX: number, heroY: number): number {
    let discovered = 0;
    for (const item of this.items) {
      const { spec } = item;
      const inside =
        heroX >= spec.x && heroX <= spec.x + spec.width && heroY >= spec.y && heroY <= spec.y + spec.height;
      if (!item.found && inside) {
        item.found = true;
        discovered += 1;
        this.scene.tweens.add({
          targets: item.cover,
          alpha: 0,
          duration: 450,
          onComplete: () => item.cover.setVisible(false),
        });
        burst(this.scene, heroX, heroY, 0x86efac, 12, 60);
      }
    }
    return discovered;
  }

  private drawCover(spec: SecretSpec): Phaser.GameObjects.Graphics {
    const rng = createRandom(Math.floor(spec.x * 31 + spec.y * 17));
    // Tronco atrás da copa: a folhagem parece a copa de uma árvore enorme.
    const trunkX = spec.x + spec.width / 2 - 20;
    const trunkTop = spec.y + spec.height - 10;
    const trunk = this.scene.add.graphics().setDepth(DEPTH.BACK_TREE).setVisible(spec.trunk !== false);
    trunk.fillStyle(0x7c4a21, 1);
    trunk.fillRect(trunkX, trunkTop, 40, this.groundY + 8 - trunkTop);
    trunk.fillStyle(0x5e3516, 1);
    trunk.fillRect(trunkX + 28, trunkTop, 12, this.groundY + 8 - trunkTop);
    trunk.fillStyle(0x7c4a21, 1);
    trunk.fillTriangle(trunkX, this.groundY + 8, trunkX - 18, this.groundY + 8, trunkX, this.groundY - 24);
    trunk.fillTriangle(trunkX + 40, this.groundY + 8, trunkX + 58, this.groundY + 8, trunkX + 40, this.groundY - 24);

    const g = this.scene.add.graphics().setDepth(DEPTH.SECRET_COVER);
    const blobs: Array<{ x: number; y: number; r: number; color: number }> = [];
    const cols = Math.ceil(spec.width / 46);
    const rows = Math.ceil(spec.height / 46);
    for (let row = 0; row <= rows; row += 1) {
      for (let col = 0; col <= cols; col += 1) {
        blobs.push({
          x: spec.x + (col / cols) * spec.width + (rng() - 0.5) * 24,
          y: spec.y + (row / rows) * spec.height + (rng() - 0.5) * 24,
          r: 34 + rng() * 20,
          color: LEAF_COLORS[Math.floor(rng() * LEAF_COLORS.length)] ?? 0x2f9e4f,
        });
      }
    }
    // Contorno escuro por baixo, depois as folhas claras por cima.
    g.fillStyle(0x14532d, 1);
    blobs.forEach((b) => g.fillCircle(b.x, b.y, b.r + 3));
    blobs.forEach((b) => {
      g.fillStyle(b.color, 1);
      g.fillCircle(b.x, b.y, b.r);
    });
    g.fillStyle(0x86efac, 0.55);
    blobs.forEach((b, i) => {
      if (i % 3 === 0) {
        g.fillCircle(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.35);
      }
    });
    return g;
  }
}
