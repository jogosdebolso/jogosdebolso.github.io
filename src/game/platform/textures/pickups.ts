import Phaser from "phaser";
import { COIN_FRAMES, GOAL_FRAMES } from "../constants";
import { bake } from "./bake";

/** Texturas de moedas, corações do HUD, faíscas, poeira e bandeira de fim de fase. */
export function buildPickupTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < COIN_FRAMES; i += 1) {
    const width = Math.max(3, 20 * Math.abs(Math.cos((i / COIN_FRAMES) * Math.PI * 2)));
    bake(scene, `coin-${i}`, 24, 24, (g) => {
      g.fillStyle(0xb45309, 1);
      g.fillEllipse(12, 12, width, 22);
      g.fillStyle(0xfacc15, 1);
      g.fillEllipse(12, 12, Math.max(1, width - 4), 18);
      if (width > 10) {
        g.lineStyle(1.5, 0xf59e0b, 1);
        g.strokeEllipse(12, 12, width - 9, 12);
        g.fillStyle(0xfef08a, 1);
        g.fillEllipse(12 - width * 0.18, 8, Math.max(1, width * 0.22), 5);
      }
    });
  }

  const heart = (key: string, outline: number, fill: number, alpha: number): void => {
    bake(scene, key, 30, 28, (g) => {
      g.fillStyle(outline, 1);
      g.fillCircle(9.5, 10, 8.5);
      g.fillCircle(20.5, 10, 8.5);
      g.fillTriangle(1, 12.5, 29, 12.5, 15, 27);
      g.fillStyle(fill, alpha);
      g.fillCircle(9.5, 10, 7);
      g.fillCircle(20.5, 10, 7);
      g.fillTriangle(3, 13, 27, 13, 15, 24.5);
      g.fillStyle(0xffffff, 0.55 * alpha);
      g.fillCircle(7, 7, 2.5);
    });
  };
  heart("heart", 0x7f1d1d, 0xef4444, 1);
  heart("heart-empty", 0x334155, 0x1e293b, 1);

  bake(scene, "spark", 10, 10, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillPoints(
      [
        new Phaser.Math.Vector2(5, 0),
        new Phaser.Math.Vector2(6.8, 3.2),
        new Phaser.Math.Vector2(10, 5),
        new Phaser.Math.Vector2(6.8, 6.8),
        new Phaser.Math.Vector2(5, 10),
        new Phaser.Math.Vector2(3.2, 6.8),
        new Phaser.Math.Vector2(0, 5),
        new Phaser.Math.Vector2(3.2, 3.2),
      ],
      true,
    );
  });

  // Bandeira de fim de fase: poste com bola dourada e faixa ondulando.
  for (let f = 0; f < GOAL_FRAMES; f += 1) {
    bake(scene, `goal-${f}`, 72, 160, (g) => {
      g.fillStyle(0x6b7280, 1);
      g.fillRoundedRect(2, 146, 26, 14, 3);
      g.fillStyle(0x9ca3af, 1);
      g.fillRoundedRect(2, 146, 26, 5, 3);
      g.fillStyle(0xe5e7eb, 1);
      g.fillRect(12, 14, 4, 134);
      g.fillStyle(0x9ca3af, 1);
      g.fillRect(14, 14, 2, 134);
      g.fillStyle(0xfacc15, 1);
      g.fillCircle(14, 10, 6);
      g.fillStyle(0xfef08a, 1);
      g.fillCircle(12.5, 8.5, 2.2);
      const top: Phaser.Math.Vector2[] = [];
      const bottom: Phaser.Math.Vector2[] = [];
      for (let i = 0; i <= 10; i += 1) {
        const x = 16 + i * 5.2;
        const wave = Math.sin((f / GOAL_FRAMES) * Math.PI * 2 + i * 0.6) * (1 + i * 0.35);
        top.push(new Phaser.Math.Vector2(x, 20 + wave));
        bottom.unshift(new Phaser.Math.Vector2(x, 56 + wave * 1.1 - i * 1.2));
      }
      g.fillStyle(0x16a34a, 1);
      g.fillPoints([...top, ...bottom], true);
      g.fillStyle(0x4ade80, 1);
      g.fillPoints(
        [...top, ...top.map((p) => new Phaser.Math.Vector2(p.x, p.y + 6)).reverse()],
        true,
      );
      const mid = top[4];
      if (mid) {
        g.fillStyle(0xfde047, 1);
        g.fillCircle(mid.x, mid.y + 20, 7);
        g.fillStyle(0xfef9c3, 1);
        g.fillCircle(mid.x - 1.5, mid.y + 18.5, 3);
      }
    });
  }

  bake(scene, "dust", 12, 12, (g) => {
    g.fillStyle(0xe7d3b0, 1);
    g.fillCircle(6, 6, 5);
  });
}
