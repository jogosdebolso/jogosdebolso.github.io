import Phaser from "phaser";
import { RASTRO_TEXTURE_KEYS } from "../constants";
import { createAsteroidTextures } from "./AsteroidTextures";
import { createEnemyTextures } from "./EnemyTextures";

export function createRastroTextures(scene: Phaser.Scene): void {
  createAsteroidTextures(scene);
  createEnemyTextures(scene);
  createBossTextures(scene);
  createShotTexture(scene);
}

function createBossTextures(scene: Phaser.Scene): void {
  for (let bossId = 1; bossId <= 7; bossId += 1) {
    const key = `${RASTRO_TEXTURE_KEYS.bossPrefix}${bossId}`;
    if (scene.textures.exists(key)) {
      continue;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 });
    drawBossSilhouette(graphics, bossId);
    graphics.generateTexture(key, 320, 224);
    graphics.destroy();
  }
}

function drawBossSilhouette(
  graphics: Phaser.GameObjects.Graphics,
  bossId: number,
): void {
  switch (bossId) {
    case 1:
      drawOrionDreadnought(graphics);
      break;
    case 2:
      drawSpectralAdmiral(graphics);
      break;
    case 3:
      drawTitanColossus(graphics);
      break;
    case 4:
      drawSolarHerald(graphics);
      break;
    case 5:
      drawCarinaMatriarch(graphics);
      break;
    case 6:
      drawHorizonGuardian(graphics);
      break;
    case 7:
      drawSingularityWarden(graphics);
      break;
  }
}

function drawSingularityWarden(graphics: Phaser.GameObjects.Graphics): void {
  graphics.lineStyle(12, 0x9b654d, 0.72);
  graphics.strokeEllipse(160, 110, 300, 112);
  graphics.lineStyle(5, 0xf2bd7c, 0.92);
  graphics.strokeEllipse(160, 110, 276, 82);
  graphics.lineStyle(2, 0xffe6b5, 0.82);
  graphics.strokeEllipse(160, 110, 244, 56);

  fillBossShape(graphics, 0x211c2c, [
    { x: 160, y: 9 }, { x: 183, y: 56 }, { x: 220, y: 72 },
    { x: 275, y: 55 }, { x: 243, y: 92 }, { x: 314, y: 110 },
    { x: 243, y: 128 }, { x: 275, y: 165 }, { x: 220, y: 148 },
    { x: 183, y: 164 }, { x: 160, y: 213 }, { x: 137, y: 164 },
    { x: 100, y: 148 }, { x: 45, y: 165 }, { x: 77, y: 128 },
    { x: 6, y: 110 }, { x: 77, y: 92 }, { x: 45, y: 55 },
    { x: 100, y: 72 }, { x: 137, y: 56 },
  ]);
  fillBossShape(graphics, 0x68444a, [
    { x: 160, y: 34 }, { x: 177, y: 75 }, { x: 211, y: 87 },
    { x: 257, y: 73 }, { x: 223, y: 105 }, { x: 259, y: 111 },
    { x: 223, y: 117 }, { x: 257, y: 147 }, { x: 211, y: 133 },
    { x: 177, y: 145 }, { x: 160, y: 184 }, { x: 143, y: 145 },
    { x: 109, y: 133 }, { x: 63, y: 147 }, { x: 97, y: 117 },
    { x: 61, y: 111 }, { x: 97, y: 105 }, { x: 63, y: 73 },
    { x: 109, y: 87 }, { x: 143, y: 75 },
  ]);
  graphics.fillStyle(0x02030a, 1);
  graphics.fillCircle(160, 110, 35);
  graphics.lineStyle(5, 0xf5c987, 0.95);
  graphics.strokeCircle(160, 110, 42);
  graphics.fillStyle(0xfdecc2, 0.9);
  graphics.fillEllipse(160, 110, 76, 11);
  graphics.fillStyle(0xff9f58, 0.9);
  graphics.fillTriangle(150, 67, 170, 67, 160, 14);
  graphics.fillTriangle(150, 153, 170, 153, 160, 206);
  for (const x of [105, 215]) {
    graphics.fillStyle(0x140f1b, 1);
    graphics.fillCircle(x, 110, 18);
    graphics.fillStyle(0xffc782, 0.96);
    graphics.fillCircle(x, 110, 9);
    graphics.fillStyle(0xfff0ce, 0.88);
    graphics.fillCircle(x, 110, 3);
  }
  drawBossCore(graphics, 160, 110, 21, 0xffa45f, 0xfff5d6);
  drawBossEngines(graphics, [128, 192], 178, 0xffad6b);
}

function drawOrionDreadnought(graphics: Phaser.GameObjects.Graphics): void {
  const hull = 0x263957;
  const armor = 0x496b8e;
  const gold = 0xfbbf5a;

  fillBossShape(graphics, hull, [
    { x: 160, y: 18 }, { x: 197, y: 63 }, { x: 296, y: 74 },
    { x: 276, y: 112 }, { x: 308, y: 145 }, { x: 217, y: 133 },
    { x: 187, y: 173 }, { x: 160, y: 202 }, { x: 133, y: 173 },
    { x: 103, y: 133 }, { x: 12, y: 145 }, { x: 44, y: 112 },
    { x: 24, y: 74 }, { x: 123, y: 63 },
  ]);
  fillBossShape(graphics, armor, [
    { x: 160, y: 34 }, { x: 187, y: 74 }, { x: 264, y: 83 },
    { x: 243, y: 111 }, { x: 274, y: 130 }, { x: 207, y: 123 },
    { x: 178, y: 157 }, { x: 160, y: 177 }, { x: 142, y: 157 },
    { x: 113, y: 123 }, { x: 46, y: 130 }, { x: 77, y: 111 },
    { x: 56, y: 83 }, { x: 133, y: 74 },
  ]);
  for (const x of [57, 263]) {
    graphics.fillStyle(0x0b172b, 1);
    graphics.fillRoundedRect(x - 13, 61, 26, 42, 8);
    graphics.fillStyle(gold, 0.9);
    graphics.fillRoundedRect(x - 5, 65, 10, 28, 5);
    graphics.fillStyle(0x67e8f9, 0.82);
    graphics.fillCircle(x, 115, 8);
  }
  drawBossCore(graphics, 160, 111, 28, gold, 0xfff1b3);
  graphics.lineStyle(3, 0x9ec5e8, 0.75);
  graphics.lineBetween(83, 91, 135, 101);
  graphics.lineBetween(237, 91, 185, 101);
  graphics.lineBetween(105, 117, 139, 128);
  graphics.lineBetween(215, 117, 181, 128);
  drawBossEngines(graphics, [96, 224], 173, 0x38bdf8);
}

function drawSpectralAdmiral(graphics: Phaser.GameObjects.Graphics): void {
  fillBossShape(graphics, 0x241c59, [
    { x: 160, y: 28 }, { x: 193, y: 67 }, { x: 310, y: 37 },
    { x: 280, y: 101 }, { x: 319, y: 137 }, { x: 250, y: 129 },
    { x: 214, y: 170 }, { x: 160, y: 194 }, { x: 106, y: 170 },
    { x: 70, y: 129 }, { x: 1, y: 137 }, { x: 40, y: 101 },
    { x: 10, y: 37 }, { x: 127, y: 67 },
  ]);
  fillBossShape(graphics, 0x5541a0, [
    { x: 160, y: 46 }, { x: 183, y: 77 }, { x: 275, y: 56 },
    { x: 250, y: 101 }, { x: 285, y: 121 }, { x: 231, y: 117 },
    { x: 199, y: 151 }, { x: 160, y: 173 }, { x: 121, y: 151 },
    { x: 89, y: 117 }, { x: 35, y: 121 }, { x: 70, y: 101 },
    { x: 45, y: 56 }, { x: 137, y: 77 },
  ]);
  graphics.lineStyle(5, 0xa78bfa, 0.65);
  graphics.beginPath();
  graphics.moveTo(45, 54);
  graphics.lineTo(91, 84);
  graphics.lineTo(124, 94);
  graphics.strokePath();
  graphics.beginPath();
  graphics.moveTo(275, 54);
  graphics.lineTo(229, 84);
  graphics.lineTo(196, 94);
  graphics.strokePath();
  graphics.fillStyle(0x111033, 1);
  graphics.fillEllipse(160, 109, 94, 92);
  drawBossCore(graphics, 160, 108, 25, 0xe879f9, 0xf5d0fe);
  for (const x of [72, 248]) {
    graphics.fillStyle(0x17143f, 1);
    graphics.fillCircle(x, 112, 16);
    graphics.fillStyle(0xc4b5fd, 0.94);
    graphics.fillCircle(x, 112, 7);
  }
  drawBossEngines(graphics, [131, 189], 169, 0xc084fc);
}

function drawTitanColossus(graphics: Phaser.GameObjects.Graphics): void {
  fillBossShape(graphics, 0x18394a, [
    { x: 160, y: 14 }, { x: 205, y: 50 }, { x: 298, y: 66 },
    { x: 279, y: 101 }, { x: 305, y: 159 }, { x: 235, y: 145 },
    { x: 205, y: 187 }, { x: 160, y: 210 }, { x: 115, y: 187 },
    { x: 85, y: 145 }, { x: 15, y: 159 }, { x: 41, y: 101 },
    { x: 22, y: 66 }, { x: 115, y: 50 },
  ]);
  fillBossShape(graphics, 0x52798b, [
    { x: 160, y: 33 }, { x: 190, y: 60 }, { x: 264, y: 73 },
    { x: 250, y: 103 }, { x: 274, y: 138 }, { x: 222, y: 129 },
    { x: 194, y: 164 }, { x: 160, y: 185 }, { x: 126, y: 164 },
    { x: 98, y: 129 }, { x: 46, y: 138 }, { x: 70, y: 103 },
    { x: 56, y: 73 }, { x: 130, y: 60 },
  ]);
  for (const x of [72, 248]) {
    graphics.fillStyle(0x102838, 1);
    graphics.fillPoints([
      { x: x - 24, y: 74 }, { x: x + 24, y: 74 },
      { x: x + 31, y: 133 }, { x, y: 151 }, { x: x - 31, y: 133 },
    ], true);
    graphics.fillStyle(0x9ee8f2, 0.8);
    graphics.fillPoints([
      { x, y: 85 }, { x: x + 14, y: 111 }, { x, y: 132 }, { x: x - 14, y: 111 },
    ], true);
  }
  graphics.lineStyle(4, 0xc8f4f7, 0.62);
  graphics.lineBetween(111, 64, 140, 81);
  graphics.lineBetween(209, 64, 180, 81);
  graphics.lineBetween(101, 144, 133, 161);
  graphics.lineBetween(219, 144, 187, 161);
  drawBossCore(graphics, 160, 111, 32, 0x67e8f9, 0xe0fbff);
  drawBossEngines(graphics, [115, 205], 186, 0x22d3ee);
}

function drawSolarHerald(graphics: Phaser.GameObjects.Graphics): void {
  for (let ray = 0; ray < 12; ray += 1) {
    const angle = (ray / 12) * Math.PI * 2;
    const inner = 66;
    const outer = ray % 2 === 0 ? 108 : 88;
    const tipX = 160 + Math.cos(angle) * outer;
    const tipY = 108 + Math.sin(angle) * outer * 0.78;
    const baseLeftX = 160 + Math.cos(angle - 0.18) * inner;
    const baseLeftY = 108 + Math.sin(angle - 0.18) * inner * 0.78;
    const baseRightX = 160 + Math.cos(angle + 0.18) * inner;
    const baseRightY = 108 + Math.sin(angle + 0.18) * inner * 0.78;
    graphics.fillStyle(ray % 2 === 0 ? 0xb45309 : 0x7c2d12, 1);
    graphics.fillPoints([
      { x: baseLeftX, y: baseLeftY },
      { x: tipX, y: tipY },
      { x: baseRightX, y: baseRightY },
    ], true);
    graphics.lineStyle(2, 0xfde68a, 0.7);
    graphics.lineBetween(
      (baseLeftX + tipX) / 2,
      (baseLeftY + tipY) / 2,
      tipX,
      tipY,
    );
  }
  graphics.fillStyle(0x7c2d12, 1);
  graphics.fillCircle(160, 108, 61);
  graphics.fillStyle(0xea580c, 1);
  graphics.fillEllipse(160, 108, 116, 82);
  graphics.fillStyle(0xfbbf24, 1);
  graphics.fillEllipse(160, 108, 76, 62);
  drawBossCore(graphics, 160, 108, 27, 0xfff1a8, 0xffffff);
  for (const x of [118, 202]) {
    graphics.fillStyle(0x431407, 1);
    graphics.fillCircle(x, 109, 12);
    graphics.fillStyle(0xfef3c7, 0.92);
    graphics.fillCircle(x, 109, 5);
  }
  drawBossEngines(graphics, [141, 179], 167, 0xf97316);
}

function drawCarinaMatriarch(graphics: Phaser.GameObjects.Graphics): void {
  const shell = 0x3f334e;
  const petal = 0x9a5260;
  for (let side = -1; side <= 1; side += 1) {
    const offset = side * 72;
    graphics.fillStyle(side === 0 ? 0x6d3b5a : petal, 0.95);
    graphics.fillPoints([
      { x: 160, y: 88 },
      { x: 160 + offset * 0.42, y: 20 + Math.abs(side) * 28 },
      { x: 160 + offset, y: 42 + Math.abs(side) * 25 },
      { x: 160 + offset * 0.86, y: 104 },
      { x: 160 + offset * 0.55, y: 145 },
      { x: 160, y: 133 },
    ], true);
  }
  fillBossShape(graphics, shell, [
    { x: 160, y: 48 }, { x: 209, y: 79 }, { x: 225, y: 124 },
    { x: 197, y: 174 }, { x: 160, y: 201 }, { x: 123, y: 174 },
    { x: 95, y: 124 }, { x: 111, y: 79 },
  ]);
  graphics.fillStyle(0xd18a83, 0.76);
  graphics.fillEllipse(160, 120, 94, 94);
  graphics.fillStyle(0x251d3b, 1);
  graphics.fillEllipse(160, 117, 62, 78);
  drawBossCore(graphics, 160, 111, 24, 0xfda4af, 0xffe4e6);
  for (const x of [119, 201]) {
    graphics.fillStyle(0x211c35, 1);
    graphics.fillCircle(x, 119, 17);
    graphics.fillStyle(0xf9a8d4, 0.8);
    graphics.fillCircle(x, 119, 7);
  }
  graphics.lineStyle(3, 0xf0a7a5, 0.55);
  graphics.lineBetween(160, 150, 160, 185);
  graphics.lineBetween(142, 155, 129, 175);
  graphics.lineBetween(178, 155, 191, 175);
  drawBossEngines(graphics, [137, 183], 190, 0xfb7185);
}

function drawHorizonGuardian(graphics: Phaser.GameObjects.Graphics): void {
  graphics.lineStyle(17, 0x704d57, 0.62);
  graphics.strokeEllipse(160, 107, 296, 106);
  graphics.lineStyle(7, 0xe9b879, 0.92);
  graphics.strokeEllipse(160, 107, 274, 84);
  graphics.lineStyle(3, 0xf8e2b8, 0.82);
  graphics.strokeEllipse(160, 107, 243, 57);
  fillBossShape(graphics, 0x28334b, [
    { x: 160, y: 37 }, { x: 195, y: 70 }, { x: 232, y: 73 },
    { x: 216, y: 107 }, { x: 238, y: 139 }, { x: 192, y: 145 },
    { x: 160, y: 178 }, { x: 128, y: 145 }, { x: 82, y: 139 },
    { x: 104, y: 107 }, { x: 88, y: 73 }, { x: 125, y: 70 },
  ]);
  graphics.fillStyle(0x02030a, 1);
  graphics.fillCircle(160, 107, 32);
  graphics.lineStyle(5, 0xfbbf7a, 0.92);
  graphics.strokeCircle(160, 107, 38);
  graphics.fillStyle(0xfef3c7, 1);
  graphics.fillEllipse(160, 107, 62, 12);
  graphics.fillStyle(0xf97316, 0.85);
  graphics.fillTriangle(146, 72, 174, 72, 160, 13);
  graphics.fillTriangle(146, 142, 174, 142, 160, 207);
  for (const side of [-1, 1]) {
    graphics.fillStyle(0x9a6f60, 0.9);
    graphics.fillPoints([
      { x: 160 + side * 44, y: 91 },
      { x: 160 + side * 94, y: 70 },
      { x: 160 + side * 115, y: 103 },
      { x: 160 + side * 83, y: 124 },
      { x: 160 + side * 42, y: 119 },
    ], true);
    graphics.fillStyle(0xffd69a, 0.96);
    graphics.fillCircle(160 + side * 91, 98, 8);
  }
  drawBossEngines(graphics, [130, 190], 186, 0xfbbf7a);
}

function fillBossShape(
  graphics: Phaser.GameObjects.Graphics,
  color: number,
  points: Phaser.Types.Math.Vector2Like[],
): void {
  graphics.fillStyle(color, 1);
  graphics.fillPoints(points, true);
  graphics.lineStyle(2, 0xc4d8ec, 0.32);
  graphics.strokePoints(points, true);
}

function drawBossCore(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  highlight: number,
): void {
  graphics.fillStyle(color, 0.28);
  graphics.fillCircle(x, y, radius * 1.65);
  graphics.fillStyle(0x111827, 1);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(x, y, radius * 0.72);
  graphics.fillStyle(highlight, 0.96);
  graphics.fillCircle(x, y, radius * 0.34);
  graphics.lineStyle(2, highlight, 0.82);
  graphics.strokeCircle(x, y, radius * 1.24);
}

function drawBossEngines(
  graphics: Phaser.GameObjects.Graphics,
  positions: number[],
  y: number,
  color: number,
): void {
  for (const x of positions) {
    graphics.fillStyle(0x101827, 1);
    graphics.fillEllipse(x, y, 34, 22);
    graphics.fillStyle(color, 0.8);
    graphics.fillEllipse(x, y + 1, 20, 10);
    graphics.fillStyle(0xe0fbff, 0.92);
    graphics.fillCircle(x, y + 1, 4);
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
