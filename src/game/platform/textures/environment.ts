import Phaser from "phaser";
import { CAP_SURFACE } from "../constants";
import { createRandom } from "../random";
import type { LevelConfig } from "../levelConfig";
import { bake } from "./bake";

/** Gera as texturas do cenário (colinas, terra, grama, árvores e decoração). */
export function buildEnvironmentTextures(scene: Phaser.Scene, level: LevelConfig): void {
  const { id } = level;
  const { hills: hillStyle } = level.background;
  const flowerColors = level.decoration.flowerColors;
  const rng = createRandom(9001);

  const hills = (
    key: string,
    fill: number,
    rim: number,
    base: number,
    amp: number,
    phase: number,
  ): void => {
    bake(scene, key, 1024, 512, (g) => {
      const points: Phaser.Math.Vector2[] = [];
      for (let x = 0; x <= 1024; x += 8) {
        const t = (x / 1024) * Math.PI * 2;
        const y =
          512 - base - amp * (0.6 * Math.sin(t * 2 + phase) + 0.4 * Math.sin(t * 5 + phase * 2));
        points.push(new Phaser.Math.Vector2(x, y));
      }
      g.fillStyle(fill, 1);
      g.beginPath();
      g.moveTo(0, 512);
      points.forEach((p) => g.lineTo(p.x, p.y));
      g.lineTo(1024, 512);
      g.closePath();
      g.fillPath();
      g.lineStyle(4, rim, 0.7);
      g.beginPath();
      points.forEach((p, i) => (i === 0 ? g.moveTo(p.x, p.y) : g.lineTo(p.x, p.y)));
      g.strokePath();
    });
  };
  hills(`hills-far-${id}`, hillStyle.far.fill, hillStyle.far.rim, 250, 70, 0.4);
  hills(`hills-mid-${id}`, hillStyle.mid.fill, hillStyle.mid.rim, 175, 55, 1.7);
  hills(`hills-near-${id}`, hillStyle.near.fill, hillStyle.near.rim, 110, 40, 3.1);

  bake(scene, "sun", 240, 240, (g) => {
    for (let r = 120; r > 40; r -= 10) {
      g.fillStyle(0xfef08a, 0.05);
      g.fillCircle(120, 120, r);
    }
    g.fillStyle(0xfde047, 1);
    g.fillCircle(120, 120, 36);
    g.fillStyle(0xfef9c3, 1);
    g.fillCircle(120, 120, 26);
  });

  bake(scene, "cloud", 200, 90, (g) => {
    const puffs: ReadonlyArray<readonly [number, number, number]> = [
      [52, 54, 26],
      [88, 40, 32],
      [126, 46, 28],
      [152, 58, 22],
    ];
    g.fillStyle(0xc4dcf4, 1);
    puffs.forEach(([x, y, r]) => g.fillCircle(x, y + 5, r));
    g.fillRoundedRect(30, 56, 148, 28, 14);
    g.fillStyle(0xffffff, 1);
    puffs.forEach(([x, y, r]) => g.fillCircle(x, y, r));
    g.fillRoundedRect(30, 52, 148, 26, 13);
  });

  bake(scene, "grass-cap", 64, 32, (g) => {
    const s = CAP_SURFACE;
    for (let i = 0; i < 11; i += 1) {
      const x = 4 + i * 5.6;
      const h = 3 + rng() * 5;
      g.fillStyle(i % 2 === 0 ? 0x4ade80 : 0x22c55e, 1);
      g.fillTriangle(x - 2.5, s + 2, x + 0.5, s - h, x + 2.5, s + 2);
    }
    g.fillStyle(0x22c55e, 1);
    g.fillRect(0, s, 64, 16);
    g.fillStyle(0x4ade80, 1);
    g.fillRect(0, s, 64, 4);
    g.fillStyle(0x16a34a, 1);
    g.fillRect(0, s + 12, 64, 4);
    [9, 24, 38, 53].forEach((x, i) => {
      g.fillCircle(x, s + 16, 4 + (i % 2));
    });
    g.fillStyle(0x86efac, 0.8);
    for (let i = 0; i < 6; i += 1) {
      g.fillRect(3 + rng() * 56, s + 5 + rng() * 6, 3, 1);
    }
  });

  bake(scene, "dirt", 64, 64, (g) => {
    g.fillStyle(0x8b5a2b, 1);
    g.fillRect(0, 0, 64, 64);
    g.fillStyle(0x6f4522, 1);
    for (let i = 0; i < 26; i += 1) {
      g.fillRect(Math.floor(rng() * 62), Math.floor(rng() * 62), 2 + Math.floor(rng() * 3), 2);
    }
    g.fillStyle(0xa8743f, 1);
    for (let i = 0; i < 18; i += 1) {
      g.fillRect(Math.floor(rng() * 62), Math.floor(rng() * 62), 2, 2);
    }
    const stones: ReadonlyArray<readonly [number, number]> = [
      [14, 18],
      [44, 40],
      [26, 52],
    ];
    stones.forEach(([x, y]) => {
      g.fillStyle(0x5b3a1c, 1);
      g.fillEllipse(x + 1, y + 2, 12, 8);
      g.fillStyle(0xa3a8ae, 1);
      g.fillEllipse(x, y, 11, 7);
      g.fillStyle(0xd1d5db, 1);
      g.fillEllipse(x - 2, y - 1.5, 5, 3);
    });
    g.lineStyle(2, 0x6f4522, 0.7);
    g.beginPath();
    g.moveTo(34, 6);
    g.lineTo(38, 12);
    g.lineTo(36, 20);
    g.strokePath();
  });

  bake(scene, "tree", 128, 176, (g) => {
    g.fillStyle(0x7c4a21, 1);
    g.fillRect(54, 96, 20, 80);
    g.fillStyle(0x5e3516, 1);
    g.fillRect(68, 96, 6, 80);
    g.fillStyle(0x7c4a21, 1);
    g.fillTriangle(54, 176, 40, 176, 54, 160);
    g.fillTriangle(74, 176, 88, 176, 74, 160);
    g.fillStyle(0x23803f, 1);
    g.fillCircle(64, 76, 46);
    g.fillCircle(36, 92, 32);
    g.fillCircle(92, 94, 32);
    g.fillStyle(0x2f9e4f, 1);
    g.fillCircle(62, 66, 40);
    g.fillCircle(38, 82, 26);
    g.fillCircle(90, 82, 26);
    g.fillStyle(0x4fbf6a, 1);
    g.fillCircle(52, 52, 24);
    g.fillCircle(80, 62, 16);
    g.fillStyle(0x7ddb90, 0.9);
    g.fillCircle(46, 44, 11);
    g.fillCircle(74, 54, 7);
    g.fillStyle(0xdc2626, 1);
    g.fillCircle(84, 82, 3.5);
    g.fillCircle(40, 96, 3.5);
    g.fillCircle(62, 100, 3.5);
  });

  bake(scene, "bush", 80, 48, (g) => {
    g.fillStyle(0x23803f, 1);
    g.fillCircle(22, 32, 17);
    g.fillCircle(42, 26, 22);
    g.fillCircle(60, 32, 16);
    g.fillRect(8, 32, 64, 14);
    g.fillStyle(0x2f9e4f, 1);
    g.fillCircle(20, 28, 14);
    g.fillCircle(42, 21, 18);
    g.fillCircle(58, 28, 13);
    g.fillStyle(0x58c46f, 1);
    g.fillCircle(36, 14, 8);
    g.fillCircle(16, 24, 5);
    g.fillStyle(0xf43f5e, 1);
    g.fillCircle(52, 30, 2.5);
    g.fillCircle(28, 34, 2.5);
  });

  bake(scene, "rock", 48, 28, (g) => {
    g.fillStyle(0x5f6874, 1);
    g.fillEllipse(24, 20, 44, 18);
    g.fillStyle(0x8b95a1, 1);
    g.fillEllipse(24, 16, 42, 22);
    g.fillStyle(0xb4bcc6, 1);
    g.fillEllipse(17, 10, 18, 8);
    g.fillStyle(0x4ade80, 1);
    g.fillTriangle(34, 26, 37, 20, 40, 26);
    g.fillTriangle(38, 26, 42, 21, 45, 26);
  });

  bake(scene, "mushroom", 22, 22, (g) => {
    g.fillStyle(0xfef3c7, 1);
    g.fillRoundedRect(8, 11, 6, 10, 2);
    g.fillStyle(0xdc2626, 1);
    g.fillEllipse(11, 10, 20, 14);
    g.fillStyle(0xf8fafc, 1);
    g.fillCircle(6, 8, 2);
    g.fillCircle(12, 6, 2);
    g.fillCircle(16, 10, 1.6);
  });

  bake(scene, "fence", 62, 38, (g) => {
    g.fillStyle(0xb7793d, 1);
    g.fillRect(0, 12, 62, 5);
    g.fillRect(0, 24, 62, 5);
    g.fillStyle(0x8f5a28, 1);
    g.fillRect(0, 16, 62, 1);
    g.fillRect(0, 28, 62, 1);
    g.fillStyle(0xcf8f4f, 1);
    g.fillRoundedRect(4, 4, 9, 34, 3);
    g.fillStyle(0x9a6129, 1);
    g.fillRect(10, 6, 3, 32);
  });

  bake(scene, "sign", 72, 84, (g) => {
    g.fillStyle(0x7c4a21, 1);
    g.fillRect(32, 22, 7, 62);
    g.fillStyle(0x5e3516, 1);
    g.fillRect(37, 22, 2, 62);
    g.fillStyle(0xe0ad6a, 1);
    g.fillTriangle(60, 5, 60, 41, 70, 23);
    g.fillRect(4, 5, 56, 36);
    g.lineStyle(2, 0x8f5a28, 1);
    g.strokeRect(4, 5, 56, 36);
    g.fillStyle(0x6b3f17, 1);
    g.fillRect(14, 21, 30, 4);
    g.fillTriangle(40, 12, 40, 34, 54, 23);
  });

  for (let index = 0; index < flowerColors.length; index += 1) {
    const color = flowerColors[index];
    bake(scene, `flower-${id}-${index}`, 18, 28, (g) => {
      g.fillStyle(0x16a34a, 1);
      g.fillRect(8, 11, 2, 17);
      g.fillEllipse(5, 21, 8, 4);
      g.fillEllipse(13, 17, 8, 4);
      g.fillStyle(color ?? 0xffffff, 1);
      for (let i = 0; i < 5; i += 1) {
        const angle = (i / 5) * Math.PI * 2;
        g.fillCircle(9 + Math.cos(angle) * 4.5, 8 + Math.sin(angle) * 4.5, 3.6);
      }
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(9, 8, 3);
    });
  }

  bake(scene, "tuft", 32, 20, (g) => {
    const blades: ReadonlyArray<readonly [number, number, number]> = [
      [6, 11, 0x16a34a],
      [11, 16, 0x22c55e],
      [16, 19, 0x4ade80],
      [21, 15, 0x22c55e],
      [26, 10, 0x16a34a],
    ];
    blades.forEach(([x, h, color]) => {
      g.fillStyle(color, 1);
      g.fillTriangle(x - 3, 20, x + (x < 16 ? -2 : 2), 20 - h, x + 3, 20);
    });
  });

  bake(scene, "butterfly", 22, 16, (g) => {
    g.fillStyle(0xf472b6, 1);
    g.fillEllipse(6, 6, 11, 10);
    g.fillEllipse(16, 6, 11, 10);
    g.fillStyle(0xfbbf24, 1);
    g.fillEllipse(7, 12, 8, 6);
    g.fillEllipse(15, 12, 8, 6);
    g.fillStyle(0x3b1d0e, 1);
    g.fillRect(10, 2, 2, 12);
  });
}
