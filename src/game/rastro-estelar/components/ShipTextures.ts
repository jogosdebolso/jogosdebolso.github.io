import Phaser from "phaser";
import { RASTRO_TEXTURE_KEYS } from "../constants";
import type { EnemyStyle } from "../types";

export function createRastroTextures(scene: Phaser.Scene): void {
  createAsteroidTexture(scene);
  createEnemyTextures(scene);
  createShotTexture(scene);
}

function createAsteroidTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(RASTRO_TEXTURE_KEYS.asteroid)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 });
  const points = [
    { x: 48, y: 5 },
    { x: 68, y: 12 },
    { x: 88, y: 29 },
    { x: 82, y: 52 },
    { x: 70, y: 77 },
    { x: 49, y: 89 },
    { x: 25, y: 81 },
    { x: 9, y: 64 },
    { x: 5, y: 39 },
    { x: 19, y: 18 },
  ];

  graphics.fillStyle(0x737d91, 1);
  graphics.fillPoints(points, true);
  graphics.lineStyle(3, 0xa2adbd, 0.55);
  graphics.strokePoints(points, true);
  graphics.fillStyle(0x4c566a, 0.72);
  graphics.fillCircle(31, 37, 10);
  graphics.fillCircle(63, 58, 14);
  graphics.fillCircle(42, 70, 5);
  graphics.fillStyle(0xc0c9d4, 0.28);
  graphics.fillCircle(27, 24, 5);
  graphics.fillCircle(72, 39, 4);
  graphics.generateTexture(RASTRO_TEXTURE_KEYS.asteroid, 96, 96);
  graphics.destroy();
}

function createEnemyTextures(scene: Phaser.Scene): void {
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
      edgeColor: 0x67e8f9,
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
      edgeColor: 0xf0abfc,
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
      edgeColor: 0xfda4af,
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
      edgeColor: 0xc4b5fd,
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
      edgeColor: 0xfcd34d,
      coreColor: 0xf59e0b,
    },
  ];

  for (const style of styles) {
    if (scene.textures.exists(`${RASTRO_TEXTURE_KEYS.enemyPrefix}${style.key}`)) {
      continue;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });
    graphics.fillStyle(style.edgeColor, 0.18);
    graphics.fillPoints(style.wing, true);
    graphics.fillStyle(style.wingColor, 1);
    graphics.fillPoints(style.wing, true);
    graphics.lineStyle(3, style.edgeColor, 0.95);
    graphics.strokePoints(style.wing, true);
    graphics.fillStyle(style.hullColor, 1);
    graphics.fillPoints(style.hull, true);
    graphics.lineStyle(1.5, 0xfff7ed, 0.85);
    graphics.strokePoints(style.hull, true);
    graphics.fillStyle(style.coreColor, 1);
    graphics.fillPoints(style.core, true);
    graphics.fillStyle(0xfde68a, 0.95);
    graphics.fillCircle(25, 41, style.key === "bastiao" ? 6 : 4);
    graphics.fillCircle(75, 41, style.key === "bastiao" ? 6 : 4);
    graphics.generateTexture(
      `${RASTRO_TEXTURE_KEYS.enemyPrefix}${style.key}`,
      100,
      72,
    );
    graphics.destroy();
  }
}

function createShotTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists(RASTRO_TEXTURE_KEYS.shot)) {
    return;
  }

  const graphics = scene.make.graphics({ x: 0, y: 0 });
  graphics.fillStyle(0x22d3ee, 0.14);
  graphics.fillRoundedRect(0, 0, 16, 40, 8);
  graphics.fillStyle(0x22d3ee, 0.34);
  graphics.fillRoundedRect(2, 0, 12, 38, 6);
  graphics.fillStyle(0x67e8f9, 0.82);
  graphics.fillRoundedRect(4, 2, 8, 34, 4);
  graphics.fillStyle(0xf0fdff, 1);
  graphics.fillRoundedRect(6, 3, 4, 28, 2);
  graphics.fillStyle(0xffffff, 0.9);
  graphics.fillTriangle(8, 0, 5, 6, 11, 6);
  graphics.generateTexture(RASTRO_TEXTURE_KEYS.shot, 16, 40);
  graphics.destroy();
}
