import Phaser from "phaser";
import { RASTRO_TEXTURE_KEYS } from "../constants";
import type { EnemyStyle } from "../types";

export function createEnemyTextures(scene: Phaser.Scene): void {
  const styles: EnemyStyle[] = [
    {
      key: "cometa",
      wing: [
        { x: 50, y: 5 }, { x: 65, y: 26 }, { x: 96, y: 39 },
        { x: 77, y: 54 }, { x: 59, y: 48 }, { x: 50, y: 66 },
        { x: 41, y: 48 }, { x: 23, y: 54 }, { x: 4, y: 39 },
        { x: 35, y: 26 },
      ],
      hull: [
        { x: 50, y: 13 }, { x: 60, y: 30 }, { x: 57, y: 51 },
        { x: 50, y: 60 }, { x: 43, y: 51 }, { x: 40, y: 30 },
      ],
      core: [
        { x: 50, y: 22 }, { x: 56, y: 35 }, { x: 50, y: 47 },
        { x: 44, y: 35 },
      ],
      wingColor: 0x155e75,
      hullColor: 0x164e63,
      coreColor: 0x22d3ee,
    },
    {
      key: "vanguarda",
      wing: [
        { x: 50, y: 4 }, { x: 60, y: 29 }, { x: 97, y: 19 },
        { x: 86, y: 43 }, { x: 67, y: 52 }, { x: 58, y: 49 },
        { x: 50, y: 66 }, { x: 42, y: 49 }, { x: 33, y: 52 },
        { x: 14, y: 43 }, { x: 3, y: 19 }, { x: 40, y: 29 },
      ],
      hull: [
        { x: 50, y: 12 }, { x: 59, y: 34 }, { x: 55, y: 54 },
        { x: 50, y: 61 }, { x: 45, y: 54 }, { x: 41, y: 34 },
      ],
      core: [
        { x: 50, y: 21 }, { x: 55, y: 36 }, { x: 50, y: 46 },
        { x: 45, y: 36 },
      ],
      wingColor: 0x7e22a8,
      hullColor: 0x581c87,
      coreColor: 0xe879f9,
    },
    {
      key: "vespa",
      wing: [
        { x: 50, y: 6 }, { x: 69, y: 23 }, { x: 94, y: 39 },
        { x: 77, y: 51 }, { x: 59, y: 45 }, { x: 50, y: 64 },
        { x: 41, y: 45 }, { x: 23, y: 51 }, { x: 6, y: 39 },
        { x: 31, y: 23 },
      ],
      hull: [
        { x: 50, y: 14 }, { x: 61, y: 31 }, { x: 57, y: 50 },
        { x: 50, y: 60 }, { x: 43, y: 50 }, { x: 39, y: 31 },
      ],
      core: [
        { x: 50, y: 23 }, { x: 57, y: 37 }, { x: 50, y: 49 },
        { x: 43, y: 37 },
      ],
      wingColor: 0x7f1d1d,
      hullColor: 0x4c1d2b,
      coreColor: 0xfb7185,
    },
    {
      key: "espectro",
      wing: [
        { x: 50, y: 5 }, { x: 67, y: 22 }, { x: 91, y: 18 },
        { x: 82, y: 43 }, { x: 66, y: 50 }, { x: 50, y: 66 },
        { x: 34, y: 50 }, { x: 18, y: 43 }, { x: 9, y: 18 },
        { x: 33, y: 22 },
      ],
      hull: [
        { x: 50, y: 13 }, { x: 61, y: 32 }, { x: 56, y: 52 },
        { x: 50, y: 61 }, { x: 44, y: 52 }, { x: 39, y: 32 },
      ],
      core: [
        { x: 50, y: 23 }, { x: 56, y: 37 }, { x: 50, y: 49 },
        { x: 44, y: 37 },
      ],
      wingColor: 0x4338ca,
      hullColor: 0x312e81,
      coreColor: 0xa78bfa,
    },
    {
      key: "bastiao",
      wing: [
        { x: 50, y: 6 }, { x: 67, y: 20 }, { x: 95, y: 25 },
        { x: 84, y: 43 }, { x: 91, y: 58 }, { x: 65, y: 51 },
        { x: 50, y: 66 }, { x: 35, y: 51 }, { x: 9, y: 58 },
        { x: 16, y: 43 }, { x: 5, y: 25 }, { x: 33, y: 20 },
      ],
      hull: [
        { x: 39, y: 15 }, { x: 61, y: 15 }, { x: 68, y: 34 },
        { x: 61, y: 53 }, { x: 50, y: 63 }, { x: 39, y: 53 },
        { x: 32, y: 34 },
      ],
      core: [
        { x: 50, y: 25 }, { x: 59, y: 38 }, { x: 50, y: 51 },
        { x: 41, y: 38 },
      ],
      wingColor: 0x854d0e,
      hullColor: 0x713f12,
      coreColor: 0xf59e0b,
    },
    {
      // Atirador: caça com canhões duplos nas asas; dispara ao pairar.
      key: "atirador",
      wing: [
        { x: 50, y: 8 }, { x: 64, y: 22 }, { x: 90, y: 26 },
        { x: 97, y: 46 }, { x: 78, y: 50 }, { x: 60, y: 46 },
        { x: 50, y: 64 }, { x: 40, y: 46 }, { x: 22, y: 50 },
        { x: 3, y: 46 }, { x: 10, y: 26 }, { x: 36, y: 22 },
      ],
      hull: [
        { x: 50, y: 14 }, { x: 60, y: 30 }, { x: 57, y: 52 },
        { x: 50, y: 60 }, { x: 43, y: 52 }, { x: 40, y: 30 },
      ],
      core: [
        { x: 50, y: 24 }, { x: 56, y: 36 }, { x: 50, y: 48 },
        { x: 44, y: 36 },
      ],
      wingColor: 0x166534,
      hullColor: 0x14532d,
      coreColor: 0x4ade80,
    },
    {
      // Fantasma: nave pálida que alterna entre sólida e só contorno.
      key: "fantasma",
      wing: [
        { x: 50, y: 6 }, { x: 66, y: 22 }, { x: 93, y: 30 },
        { x: 80, y: 48 }, { x: 62, y: 46 }, { x: 50, y: 66 },
        { x: 38, y: 46 }, { x: 20, y: 48 }, { x: 7, y: 30 },
        { x: 34, y: 22 },
      ],
      hull: [
        { x: 50, y: 14 }, { x: 60, y: 31 }, { x: 56, y: 52 },
        { x: 50, y: 61 }, { x: 44, y: 52 }, { x: 40, y: 31 },
      ],
      core: [
        { x: 50, y: 22 }, { x: 56, y: 36 }, { x: 50, y: 48 },
        { x: 44, y: 36 },
      ],
      wingColor: 0x7c6f9c,
      hullColor: 0x5b5280,
      coreColor: 0xe9d5ff,
    },
  ];

  for (const style of styles) {
    const key = `${RASTRO_TEXTURE_KEYS.enemyPrefix}${style.key}`;
    if (scene.textures.exists(key)) {
      continue;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });
    const lightWing = mixColor(style.wingColor, 0xffffff, 0.28);
    const darkWing = mixColor(style.wingColor, 0x000000, 0.4);
    const mirror = (point: { x: number; y: number }) => ({
      x: 100 - point.x,
      y: point.y,
    });

    graphics.fillStyle(style.wingColor, 1);
    graphics.fillPoints(style.wing, true);
    // Detalhe 1: borda de ataque clara e ponta de asa escura (blocos flat).
    graphics.lineStyle(1.6, lightWing, 1);
    for (const side of [(p: { x: number; y: number }) => p, mirror]) {
      graphics.lineBetween(
        side(style.wing[0]).x, side(style.wing[0]).y,
        side(style.wing[1]).x, side(style.wing[1]).y,
      );
      graphics.lineBetween(
        side(style.wing[1]).x, side(style.wing[1]).y,
        side(style.wing[2]).x, side(style.wing[2]).y,
      );
    }
    graphics.fillStyle(darkWing, 1);
    graphics.fillTriangle(
      style.wing[2].x, style.wing[2].y,
      style.wing[3].x, style.wing[3].y,
      style.wing[2].x - 14, style.wing[2].y + 6,
    );
    const left = mirror(style.wing[2]);
    const leftLower = mirror(style.wing[3]);
    graphics.fillTriangle(
      left.x, left.y, leftLower.x, leftLower.y, left.x + 14, left.y + 6,
    );

    graphics.fillStyle(style.hullColor, 1);
    graphics.fillPoints(style.hull, true);
    graphics.fillStyle(style.coreColor, 1);
    graphics.fillPoints(style.core, true);
    // Detalhe 2: reflexo na cabine e bocais de motor.
    graphics.fillStyle(0xffffff, 0.85);
    graphics.fillTriangle(
      style.core[0].x, style.core[0].y + 2,
      style.core[0].x + 3, style.core[1].y - 3,
      style.core[0].x - 3, style.core[1].y - 3,
    );
    graphics.fillStyle(style.coreColor, 1);
    graphics.fillRect(46, 58, 3, 5);
    graphics.fillRect(51, 58, 3, 5);
    graphics.fillStyle(0xfde68a, 1);
    graphics.fillCircle(25, 41, style.key === "bastiao" ? 6 : 4);
    graphics.fillCircle(75, 41, style.key === "bastiao" ? 6 : 4);
    if (style.key === "atirador") {
      // Canhões duplos apontados para a frente.
      graphics.fillStyle(0x0b1f14, 1);
      graphics.fillRect(17, 40, 6, 22);
      graphics.fillRect(77, 40, 6, 22);
      graphics.fillStyle(0xfb923c, 1);
      graphics.fillCircle(20, 62, 3);
      graphics.fillCircle(80, 62, 3);
    }
    graphics.generateTexture(key, 100, 72);
    graphics.destroy();

    if (style.key === "fantasma") {
      // Versão "só contorno" usada quando o fantasma fica invulnerável.
      const outline = scene.make.graphics({ x: 0, y: 0 });
      outline.lineStyle(2, 0xe9d5ff, 1);
      outline.strokePoints(style.wing, true);
      outline.lineStyle(1.5, 0xc4b5fd, 1);
      outline.strokePoints(style.hull, true);
      outline.strokePoints(style.core, true);
      outline.generateTexture(`${key}-contorno`, 100, 72);
      outline.destroy();
    }
  }
}

function mixColor(from: number, to: number, amount: number): number {
  const channel = (shift: number) =>
    Math.round(
      Phaser.Math.Linear((from >> shift) & 0xff, (to >> shift) & 0xff, amount),
    );
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
