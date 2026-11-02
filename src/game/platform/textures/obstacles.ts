import Phaser from "phaser";
import { bake } from "./bake";

const poly = (...pts: number[]): Phaser.Math.Vector2[] => {
  const out: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < pts.length; i += 2) {
    out.push(new Phaser.Math.Vector2(pts[i], pts[i + 1]));
  }
  return out;
};

/** Espinheiro (48x28, repete a cada 48 px) e estalagmite (decoração de caverna, 44x72). */
export function buildObstacleTextures(scene: Phaser.Scene): void {
  bake(scene, "thorns", 48, 28, (g) => {
    // Touceira baixa de folhas escuras.
    g.fillStyle(0x365314, 1);
    g.fillEllipse(24, 25, 48, 10);
    g.fillStyle(0x4d7c0f, 1);
    g.fillEllipse(24, 24, 44, 8);
    // Espinhos pontudos em tons de marrom-avermelhado.
    const spikes: ReadonlyArray<readonly [number, number, number]> = [
      [6, 22, 12],
      [15, 24, 20],
      [24, 25, 26],
      [33, 24, 19],
      [42, 22, 13],
    ];
    spikes.forEach(([x, base, height]) => {
      g.fillStyle(0x7c2d12, 1);
      g.fillPoints(poly(x - 4.5, base, x + 4.5, base, x, base - height), true);
      g.fillStyle(0xb45309, 1);
      g.fillPoints(poly(x - 4.5, base, x - 0.5, base, x - 0.5, base - height + 3), true);
      g.fillStyle(0xfde68a, 1);
      g.fillCircle(x, base - height + 1.5, 1.1);
    });
    g.fillStyle(0xdc2626, 1);
    g.fillCircle(11, 24, 1.8);
    g.fillCircle(29, 25, 1.8);
    g.fillCircle(38, 24, 1.8);
  });

  bake(scene, "stalagmite", 44, 72, (g) => {
    g.fillStyle(0x3f3f5a, 1);
    g.fillPoints(poly(0, 72, 15, 20, 24, 0, 33, 24, 44, 72), true);
    g.fillStyle(0x56567a, 1);
    g.fillPoints(poly(6, 72, 17, 26, 24, 4, 27, 30, 26, 72), true);
    g.fillStyle(0x7878a3, 0.8);
    g.fillPoints(poly(14, 72, 20, 34, 24, 10, 23, 40, 20, 72), true);
    g.fillStyle(0x2c2c44, 1);
    g.fillPoints(poly(30, 72, 31, 40, 36, 72), true);
  });
}
