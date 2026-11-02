import Phaser from "phaser";
import { ENEMY_FRAMES } from "../constants";
import { bake } from "./bake";

/**
 * Inimigos da fase 1: todos em quadros 48x40, olhando para a direita, com a linha
 * do chão em y=38 (a origem do sprite fica na base).
 */
type Pose = (g: Phaser.GameObjects.Graphics, phase: number) => void;

function bakeFrames(scene: Phaser.Scene, prefix: string, draw: Pose): void {
  for (let f = 0; f < ENEMY_FRAMES; f += 1) {
    bake(scene, `${prefix}-${f}`, 48, 40, (g) => draw(g, (f / ENEMY_FRAMES) * Math.PI * 2));
  }
}

const X = (v: number): number => v + 2;
const Y = (v: number): number => v + 10;

/** Corpo da joaninha (casco, pintas e cabeça); `lift` ergue o casco ao voar. */
function ladybugBody(g: Phaser.GameObjects.Graphics, lift: number): void {
  g.fillStyle(0x991b1b, 1);
  g.fillEllipse(X(19), Y(19 - lift), 32, 22);
  g.fillStyle(0xdc2626, 1);
  g.fillEllipse(X(19), Y(17 - lift), 32, 22);
  g.fillStyle(0xf87171, 1);
  g.fillEllipse(X(13), Y(11 - lift), 12, 6);
  g.lineStyle(2, 0x7f1d1d, 1);
  g.beginPath();
  g.moveTo(X(19), Y(7 - lift));
  g.lineTo(X(19), Y(26 - lift));
  g.strokePath();
  g.fillStyle(0x1f2937, 1);
  g.fillCircle(X(11), Y(17 - lift), 3);
  g.fillCircle(X(27), Y(15 - lift), 3);
  g.fillCircle(X(24), Y(23 - lift), 2.2);
  g.fillCircle(X(35), Y(19), 7);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(X(37), Y(17), 2.6);
  g.fillStyle(0x0f172a, 1);
  g.fillCircle(X(38), Y(17.5), 1.3);
  g.lineStyle(2, 0x1f2937, 1);
  g.beginPath();
  g.moveTo(X(37), Y(13));
  g.lineTo(X(41), Y(8));
  g.strokePath();
}

const ladybugWalk: Pose = (g, phase) => {
  g.lineStyle(3, 0x1f2937, 1);
  [11, 20, 29].forEach((x, i) => {
    const lift = Math.max(0, Math.sin(phase + i * 2.1)) * 3;
    g.beginPath();
    g.moveTo(X(x), Y(22));
    g.lineTo(X(x + (i % 2 === 0 ? -2 : 2)), Y(28 - lift));
    g.strokePath();
  });
  ladybugBody(g, 0);
};

const ladybugFly: Pose = (g, phase) => {
  const flap = Math.sin(phase * 2) * 6;
  // Asas translúcidas batendo atrás do casco.
  g.fillStyle(0xe0f2fe, 0.85);
  g.fillEllipse(X(10), Y(6 - flap), 20, 9);
  g.fillEllipse(X(23), Y(3 - flap * 0.8), 22, 8);
  g.lineStyle(1, 0x93c5fd, 1);
  g.strokeEllipse(X(10), Y(6 - flap), 20, 9);
  g.strokeEllipse(X(23), Y(3 - flap * 0.8), 22, 8);
  // Pernas recolhidas.
  g.lineStyle(2, 0x1f2937, 1);
  g.beginPath();
  g.moveTo(X(12), Y(22));
  g.lineTo(X(10), Y(27));
  g.moveTo(X(22), Y(22));
  g.lineTo(X(24), Y(27));
  g.strokePath();
  ladybugBody(g, 1);
};

const mushroomWalk: Pose = (g, phase) => {
  const step = Math.sin(phase) * 3;
  const bob = Math.abs(Math.sin(phase)) * 1.2;
  g.fillStyle(0x6b3f17, 1);
  g.fillEllipse(18 + step, 37 - Math.max(0, Math.cos(phase)) * 2.5, 12, 6);
  g.fillEllipse(30 - step, 37 - Math.max(0, -Math.cos(phase)) * 2.5, 12, 6);
  g.fillStyle(0xfef3c7, 1);
  g.fillRoundedRect(16, 22 - bob, 16, 15, 5);
  g.fillStyle(0x991b1b, 1);
  g.fillEllipse(24, 18 - bob, 40, 24);
  g.fillStyle(0xdc2626, 1);
  g.fillEllipse(24, 16 - bob, 40, 24);
  g.fillStyle(0xf8fafc, 1);
  g.fillCircle(12, 14 - bob, 3.4);
  g.fillCircle(34, 10 - bob, 3);
  g.fillCircle(24, 6 - bob, 2.6);
  g.fillCircle(39, 19 - bob, 2.2);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(20, 27 - bob, 3);
  g.fillCircle(28, 27 - bob, 3);
  g.fillStyle(0x0f172a, 1);
  g.fillCircle(21, 28 - bob, 1.4);
  g.fillCircle(29, 28 - bob, 1.4);
  g.lineStyle(2, 0x7f1d1d, 1);
  g.beginPath();
  g.moveTo(16, 22.5 - bob);
  g.lineTo(22, 25.5 - bob);
  g.moveTo(32, 22.5 - bob);
  g.lineTo(26, 25.5 - bob);
  g.strokePath();
  g.fillStyle(0x0f172a, 1);
  g.fillRect(21, 32 - bob, 6, 1.6);
};

const slugCrawl: Pose = (g, phase) => {
  const stretch = Math.sin(phase) * 3;
  g.fillStyle(0xbef264, 0.5);
  g.fillEllipse(22, 38, 42 + stretch, 4);
  g.fillStyle(0x65a30d, 1);
  g.fillEllipse(22 - stretch / 2, 31, 38 + stretch, 14);
  g.fillEllipse(37, 25, 13, 18);
  g.fillStyle(0x84cc16, 1);
  g.fillEllipse(22 - stretch / 2, 29, 36 + stretch, 12);
  g.fillEllipse(37, 24, 11, 16);
  g.fillStyle(0xd9f99d, 1);
  g.fillEllipse(20, 35, 30 + stretch, 5);
  const sway = Math.sin(phase + 1) * 1.5;
  g.lineStyle(2, 0x65a30d, 1);
  g.beginPath();
  g.moveTo(36, 17);
  g.lineTo(34 + sway, 7);
  g.moveTo(41, 18);
  g.lineTo(44 + sway, 8);
  g.strokePath();
  g.fillStyle(0xffffff, 1);
  g.fillCircle(34 + sway, 7, 3);
  g.fillCircle(44 + sway, 8, 3);
  g.fillStyle(0x0f172a, 1);
  g.fillCircle(35 + sway, 7, 1.4);
  g.fillCircle(45 + sway, 8, 1.4);
  g.fillRect(38, 29, 5, 1.6);
};

const beeFly: Pose = (g, phase) => {
  const flap = Math.sin(phase * 2) * 4;
  g.fillStyle(0xe0f2fe, 0.85);
  g.fillEllipse(18, 10 - flap, 14, 11);
  g.fillEllipse(28, 9 - flap * 0.8, 14, 11);
  g.lineStyle(1, 0x93c5fd, 1);
  g.strokeEllipse(18, 10 - flap, 14, 11);
  g.strokeEllipse(28, 9 - flap * 0.8, 14, 11);
  g.fillStyle(0x1f2937, 1);
  g.fillTriangle(3, 26, 11, 22, 11, 30);
  g.fillStyle(0xfacc15, 1);
  g.fillEllipse(21, 26, 26, 18);
  g.fillStyle(0x1f2937, 1);
  g.fillRect(15, 17.5, 4, 17);
  g.fillRect(23, 17.5, 4, 17);
  g.fillCircle(37, 26, 7);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(39, 24, 2.6);
  g.fillStyle(0x0f172a, 1);
  g.fillCircle(40, 24.5, 1.2);
  g.lineStyle(1.6, 0x1f2937, 1);
  g.beginPath();
  g.moveTo(38, 19);
  g.lineTo(42, 13);
  g.strokePath();
};


const batFly: Pose = (g, phase) => {
  const flap = Math.sin(phase * 2) * 9;
  g.fillStyle(0x3b0764, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(24, 22),
      new Phaser.Math.Vector2(2, 12 + flap),
      new Phaser.Math.Vector2(7, 23 + flap * 0.4),
      new Phaser.Math.Vector2(11, 19 + flap * 0.7),
      new Phaser.Math.Vector2(15, 29),
      new Phaser.Math.Vector2(20, 25),
    ],
    true,
  );
  g.fillPoints(
    [
      new Phaser.Math.Vector2(24, 22),
      new Phaser.Math.Vector2(46, 12 + flap),
      new Phaser.Math.Vector2(41, 23 + flap * 0.4),
      new Phaser.Math.Vector2(37, 19 + flap * 0.7),
      new Phaser.Math.Vector2(33, 29),
      new Phaser.Math.Vector2(28, 25),
    ],
    true,
  );
  g.fillStyle(0x581c87, 1);
  g.fillEllipse(24, 26, 14, 18);
  g.fillTriangle(17, 19, 19, 10, 22, 18);
  g.fillTriangle(31, 19, 29, 10, 26, 18);
  g.fillStyle(0xfca5a5, 1);
  g.fillCircle(21, 24, 2.2);
  g.fillCircle(27, 24, 2.2);
  g.fillStyle(0x7f1d1d, 1);
  g.fillCircle(21.4, 24, 1);
  g.fillCircle(27.4, 24, 1);
  g.fillStyle(0xffffff, 1);
  g.fillTriangle(21, 30, 22.5, 30, 21.8, 33);
  g.fillTriangle(26, 30, 27.5, 30, 26.8, 33);
};

const spiderCrawl: Pose = (g, phase) => {
  g.lineStyle(2, 0x1f2937, 1);
  [-1, 1].forEach((side) => {
    [0, 1, 2, 3].forEach((i) => {
      const wiggle = Math.sin(phase + i * 1.3 + (side > 0 ? 1.5 : 0)) * 2.5;
      g.beginPath();
      g.moveTo(24 + side * 5, 22 + i * 2);
      g.lineTo(24 + side * (12 + i), 14 + i * 4 + wiggle);
      g.lineTo(24 + side * (17 + i * 1.5), 24 + i * 4 + wiggle);
      g.strokePath();
    });
  });
  g.fillStyle(0x111827, 1);
  g.fillCircle(24, 26, 10);
  g.fillCircle(24, 15, 6);
  g.fillStyle(0xdc2626, 1);
  g.fillTriangle(21, 23, 27, 23, 24, 27);
  g.fillTriangle(21, 31, 27, 31, 24, 27);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(21.5, 14, 1.8);
  g.fillCircle(26.5, 14, 1.8);
  g.fillStyle(0x0f172a, 1);
  g.fillCircle(21.8, 14.2, 0.9);
  g.fillCircle(26.8, 14.2, 0.9);
};

export function buildEnemyTextures(scene: Phaser.Scene): void {
  bakeFrames(scene, "ladybug-walk", ladybugWalk);
  bakeFrames(scene, "ladybug-fly", ladybugFly);
  bakeFrames(scene, "mushroom-walk", mushroomWalk);
  bakeFrames(scene, "slug-crawl", slugCrawl);
  bakeFrames(scene, "bee-fly", beeFly);
  bakeFrames(scene, "bat-fly", batFly);
  bakeFrames(scene, "spider-crawl", spiderCrawl);
}
