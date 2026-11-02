import Phaser from "phaser";
import { bake } from "./bake";

type Draw = (g: Phaser.GameObjects.Graphics) => void;

interface Candidate {
  key: string;
  label: string;
  draw: Draw;
}

/** Inimigos de reserva (48x40, olhando para a direita, chão em y≈38). */
const RESERVE: Candidate[] = [
  {
    key: "reserve-gosma",
    label: "Gosma",
    draw: (g) => {
      g.fillStyle(0x047857, 1);
      g.fillEllipse(24, 31, 40, 16);
      g.fillCircle(24, 24, 14);
      g.fillStyle(0x10b981, 1);
      g.fillEllipse(24, 30, 38, 15);
      g.fillCircle(24, 23, 13);
      g.fillStyle(0x6ee7b7, 0.9);
      g.fillEllipse(17, 15, 9, 5);
      g.fillStyle(0x10b981, 1);
      g.fillEllipse(8, 38, 5, 4);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(19, 26, 3.4);
      g.fillCircle(29, 26, 3.4);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(20, 27, 1.6);
      g.fillCircle(30, 27, 1.6);
      g.fillStyle(0x064e3b, 1);
      g.fillEllipse(24, 33, 8, 4);
    },
  },
  {
    key: "reserve-toupeira",
    label: "Toupeira",
    draw: (g) => {
      g.fillStyle(0x78716c, 1);
      g.fillEllipse(24, 24, 24, 22);
      g.fillStyle(0xa8a29e, 1);
      g.fillEllipse(24, 22, 22, 18);
      g.fillStyle(0xf9a8d4, 1);
      g.fillCircle(24, 27, 4.4);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(17, 20, 1.8);
      g.fillCircle(31, 20, 1.8);
      g.lineStyle(1.4, 0x57534e, 1);
      g.beginPath();
      g.moveTo(24, 31);
      g.lineTo(24, 33);
      g.strokePath();
      g.fillStyle(0x6b4423, 1);
      g.fillEllipse(24, 37, 46, 10);
      g.fillStyle(0x8b5a2b, 1);
      g.fillEllipse(24, 36, 42, 8);
      g.fillStyle(0xfde68a, 1);
      g.fillTriangle(8, 34, 12, 30, 14, 35);
      g.fillTriangle(40, 34, 36, 30, 34, 35);
    },
  },
  {
    key: "reserve-caracol",
    label: "Caracol",
    draw: (g) => {
      g.fillStyle(0xd6d3d1, 1);
      g.fillEllipse(24, 34, 42, 9);
      g.fillEllipse(39, 29, 9, 14);
      g.lineStyle(2, 0xa8a29e, 1);
      g.beginPath();
      g.moveTo(38, 23);
      g.lineTo(36, 14);
      g.moveTo(42, 24);
      g.lineTo(45, 15);
      g.strokePath();
      g.fillStyle(0xffffff, 1);
      g.fillCircle(36, 13, 2.8);
      g.fillCircle(45, 14, 2.8);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(36.8, 13, 1.2);
      g.fillCircle(45.8, 14, 1.2);
      g.fillStyle(0x92400e, 1);
      g.fillCircle(19, 22, 14);
      g.fillStyle(0xf59e0b, 1);
      g.fillCircle(19, 21, 13);
      g.lineStyle(2, 0x92400e, 1);
      g.strokeCircle(19, 21, 8);
      g.strokeCircle(19, 21, 3.5);
      g.fillStyle(0xfde68a, 1);
      g.fillEllipse(13, 14, 7, 4);
    },
  },
];

/**
 * Reserva de inimigos desenhados para fases futuras (nada aqui é usado ainda).
 * O morcego e a aranha são para uma fase de caverna/subterrâneo. Para usá-los, chame
 * `buildReserveEnemyTextures` em `textures/index.ts` e crie animações/comportamento.
 */
export function buildReserveEnemyTextures(scene: Phaser.Scene): void {
  RESERVE.forEach(({ key, draw }) => bake(scene, key, 48, 40, draw));
}
