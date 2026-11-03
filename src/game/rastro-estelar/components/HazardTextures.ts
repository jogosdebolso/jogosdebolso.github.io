import Phaser from "phaser";
import { RASTRO_TEXTURE_KEYS } from "../constants";

/** Satélite, sonda espacial e projétil inimigo, em flat design. */
export function createHazardTextures(scene: Phaser.Scene): void {
  if (!scene.textures.exists(RASTRO_TEXTURE_KEYS.satellite)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Painéis solares.
    g.fillStyle(0x1e3a8a, 1);
    g.fillRect(2, 34, 34, 28);
    g.fillRect(60, 34, 34, 28);
    g.lineStyle(1.5, 0x60a5fa, 1);
    for (const x of [13, 24]) {
      g.lineBetween(x, 34, x, 62);
      g.lineBetween(x + 58, 34, x + 58, 62);
    }
    g.lineBetween(2, 48, 36, 48);
    g.lineBetween(60, 48, 94, 48);
    // Hastes e corpo.
    g.fillStyle(0x94a3b8, 1);
    g.fillRect(36, 45, 6, 6);
    g.fillRect(54, 45, 6, 6);
    g.fillStyle(0xd1d5db, 1);
    g.fillRoundedRect(38, 32, 20, 32, 4);
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(38, 40, 20, 6);
    g.fillStyle(0x64748b, 1);
    g.fillRect(38, 56, 20, 8);
    // Antena parabólica.
    g.fillStyle(0xe5e7eb, 1);
    g.fillTriangle(48, 8, 36, 28, 60, 28);
    g.fillStyle(0xef4444, 1);
    g.fillCircle(48, 10, 3);
    g.generateTexture(RASTRO_TEXTURE_KEYS.satellite, 96, 96);
    g.destroy();
  }

  if (!scene.textures.exists(RASTRO_TEXTURE_KEYS.probe)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    // Antenas.
    g.lineStyle(2, 0x94a3b8, 1);
    g.lineBetween(48, 48, 48, 6);
    g.lineBetween(48, 48, 12, 18);
    g.lineBetween(48, 48, 84, 18);
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(48, 6, 4);
    g.fillCircle(12, 18, 3);
    g.fillCircle(84, 18, 3);
    // Casco esférico em três tons.
    g.fillStyle(0x475569, 1);
    g.fillCircle(48, 54, 28);
    g.fillStyle(0x64748b, 1);
    g.fillCircle(45, 51, 24);
    g.fillStyle(0xcbd5e1, 1);
    g.fillCircle(39, 44, 10);
    // Olho/sensor e faixa.
    g.fillStyle(0x0f172a, 1);
    g.fillCircle(52, 58, 11);
    g.fillStyle(0x22d3ee, 1);
    g.fillCircle(52, 58, 6);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(50, 56, 2);
    g.fillStyle(0xf97316, 1);
    g.fillRect(22, 70, 52, 4);
    g.generateTexture(RASTRO_TEXTURE_KEYS.probe, 96, 96);
    g.destroy();
  }

  createDebrisTextures(scene);

  if (!scene.textures.exists(RASTRO_TEXTURE_KEYS.enemyShot)) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xf97316, 1);
    g.fillCircle(12, 12, 11);
    g.fillStyle(0xfdba74, 1);
    g.fillCircle(12, 12, 7);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(12, 12, 3.5);
    g.generateTexture(RASTRO_TEXTURE_KEYS.enemyShot, 24, 24);
    g.destroy();
  }
}

/** Destroços de naves: 4 placa de casco, 5 asa partida, 6 tanque de combustível. */
function createDebrisTextures(scene: Phaser.Scene): void {
  const key = (index: number) => `${RASTRO_TEXTURE_KEYS.asteroid}-${index}`;

  if (!scene.textures.exists(key(4))) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x475569, 1);
    g.fillPoints([
      { x: 10, y: 18 }, { x: 82, y: 10 }, { x: 88, y: 60 },
      { x: 60, y: 84 }, { x: 14, y: 70 },
    ], true);
    g.fillStyle(0x94a3b8, 1);
    g.fillPoints([
      { x: 10, y: 18 }, { x: 82, y: 10 }, { x: 84, y: 26 }, { x: 14, y: 34 },
    ], true);
    g.fillStyle(0x334155, 1);
    g.fillPoints([
      { x: 60, y: 84 }, { x: 88, y: 60 }, { x: 80, y: 52 }, { x: 52, y: 70 },
    ], true);
    g.fillStyle(0x0f172a, 1);
    for (const [x, y] of [[22, 46], [42, 44], [62, 40], [30, 62], [50, 60]]) {
      g.fillCircle(x, y, 3);
    }
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(16, 38, 52, 4);
    g.generateTexture(key(4), 96, 96);
    g.destroy();
  }

  if (!scene.textures.exists(key(5))) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x64748b, 1);
    g.fillPoints([
      { x: 8, y: 72 }, { x: 40, y: 20 }, { x: 62, y: 14 }, { x: 56, y: 36 },
      { x: 88, y: 44 }, { x: 70, y: 56 }, { x: 78, y: 82 }, { x: 40, y: 70 },
    ], true);
    g.fillStyle(0x94a3b8, 1);
    g.fillPoints([
      { x: 40, y: 20 }, { x: 62, y: 14 }, { x: 56, y: 36 }, { x: 44, y: 40 },
    ], true);
    g.fillStyle(0xdc2626, 1);
    g.fillPoints([
      { x: 20, y: 62 }, { x: 36, y: 38 }, { x: 44, y: 44 }, { x: 30, y: 68 },
    ], true);
    g.fillStyle(0x1e293b, 1);
    g.fillTriangle(70, 56, 88, 44, 76, 68);
    g.generateTexture(key(5), 96, 96);
    g.destroy();
  }

  if (!scene.textures.exists(key(6))) {
    const g = scene.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0xe5e7eb, 1);
    g.fillRoundedRect(20, 24, 56, 50, 8);
    g.fillStyle(0xb0b8c4, 1);
    g.fillRoundedRect(20, 52, 56, 22, { tl: 0, tr: 0, bl: 8, br: 8 });
    g.fillStyle(0xea580c, 1);
    g.fillRect(20, 36, 56, 8);
    g.fillRect(20, 58, 56, 5);
    g.fillStyle(0x334155, 1);
    g.fillPoints([
      { x: 20, y: 24 }, { x: 36, y: 14 }, { x: 44, y: 22 }, { x: 56, y: 12 },
      { x: 76, y: 24 },
    ], true);
    g.fillStyle(0x0f172a, 1);
    g.fillCircle(40, 14, 3);
    g.fillRect(56, 70, 14, 10);
    g.generateTexture(key(6), 96, 96);
    g.destroy();
  }
}
