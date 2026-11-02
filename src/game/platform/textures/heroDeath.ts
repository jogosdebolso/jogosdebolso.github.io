import Phaser from "phaser";
import { bake } from "./bake";

type DeathPose = "hurt" | "dazed";

const TUNIC = 0xe2572b;
const SKIN = 0xf2c9a0;

/** Desenha o explorador de frente (48x56; a linha do chão fica em y≈50, como nos outros quadros). */
function drawFront(g: Phaser.GameObjects.Graphics, pose: DeathPose): void {
  const dazed = pose === "dazed";
  const shoulderY = dazed ? 31 : 24;
  const hipY = dazed ? 43 : 36;
  const headX = dazed ? 26 : 24;
  const headY = dazed ? 22 : 15;

  // Mochila aparecendo atrás dos ombros.
  g.fillStyle(0x1e3a5f, 1);
  g.fillRoundedRect(14, shoulderY, 20, hipY - shoulderY - 1, 4);

  // Pernas.
  if (dazed) {
    // Sentado, com as pernas esticadas na direção de quem olha.
    g.fillStyle(0xc9a26b, 1);
    g.fillEllipse(19, 44, 13, 10);
    g.fillEllipse(29, 44, 13, 10);
    g.fillStyle(0x6b3f17, 1);
    g.fillEllipse(18, 47.5, 13, 6);
    g.fillEllipse(30, 47.5, 13, 6);
  } else {
    g.lineStyle(6, 0xc9a26b, 1);
    g.beginPath();
    g.moveTo(21, hipY);
    g.lineTo(15, 47);
    g.moveTo(27, hipY);
    g.lineTo(33, 47);
    g.strokePath();
    g.fillStyle(0x6b3f17, 1);
    g.fillRoundedRect(9, 45.5, 11, 5, 2);
    g.fillRoundedRect(28, 45.5, 11, 5, 2);
  }

  // Tronco, cinto e lenço.
  g.fillStyle(TUNIC, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(17, shoulderY),
      new Phaser.Math.Vector2(31, shoulderY),
      new Phaser.Math.Vector2(32, hipY),
      new Phaser.Math.Vector2(16, hipY),
    ],
    true,
  );
  g.fillStyle(0xf4814f, 1);
  g.fillRect(17, shoulderY, 3, hipY - shoulderY - 3);
  g.fillStyle(0x5b3a1c, 1);
  g.fillRect(16, hipY - 3, 16, 3);
  g.fillStyle(0xfacc15, 1);
  g.fillRect(22.5, hipY - 3, 3, 3);
  g.fillStyle(0xdc2626, 1);
  g.fillRoundedRect(17, shoulderY - 2.5, 14, 4.5, 2);

  // Braços: para cima (susto) ou apoiados no chão (zonzo).
  g.lineStyle(5, TUNIC, 1);
  g.beginPath();
  if (dazed) {
    g.moveTo(17, shoulderY + 2);
    g.lineTo(10, 46);
    g.moveTo(31, shoulderY + 2);
    g.lineTo(38, 46);
  } else {
    g.moveTo(17, shoulderY + 2);
    g.lineTo(8, 13);
    g.moveTo(31, shoulderY + 2);
    g.lineTo(40, 13);
  }
  g.strokePath();
  g.fillStyle(SKIN, 1);
  if (dazed) {
    g.fillCircle(10, 47, 3);
    g.fillCircle(38, 47, 3);
  } else {
    g.fillCircle(8, 12, 3.2);
    g.fillCircle(40, 12, 3.2);
  }

  // Cabeça.
  g.fillStyle(0x5a2f12, 1);
  g.fillCircle(headX, headY + 1, 9);
  g.fillStyle(SKIN, 1);
  g.fillCircle(headX, headY, 8);

  if (dazed) {
    // Olhos em espiral e boca mole.
    [-3.6, 3.6].forEach((dx) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(headX + dx, headY - 1, 3.4);
      g.lineStyle(1.2, 0x0f172a, 1);
      g.strokeCircle(headX + dx, headY - 1, 2.3);
      g.strokeCircle(headX + dx, headY - 1, 1);
    });
    g.fillStyle(0x7a3b22, 1);
    g.fillEllipse(headX + 1, headY + 5, 5, 3);
    g.fillStyle(0xe58a7a, 0.8);
    g.fillCircle(headX - 5.5, headY + 3, 1.8);
    g.fillCircle(headX + 6.5, headY + 3, 1.8);
  } else {
    // Olhos arregalados e boca aberta.
    [-3.6, 3.6].forEach((dx) => {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(headX + dx, headY - 1, 3.4);
      g.fillStyle(0x0f172a, 1);
      g.fillCircle(headX + dx, headY - 0.5, 1.3);
    });
    g.lineStyle(1.4, 0x5a2f12, 1);
    g.beginPath();
    g.moveTo(headX - 6, headY - 6);
    g.lineTo(headX - 2, headY - 5);
    g.moveTo(headX + 6, headY - 6);
    g.lineTo(headX + 2, headY - 5);
    g.strokePath();
    g.fillStyle(0x7f1d1d, 1);
    g.fillEllipse(headX, headY + 5, 4.5, 5.5);
  }

  // Chapéu de palha (torto quando zonzo).
  const hx = headX + (dazed ? 3 : 0);
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(hx, headY - 6, 28, 6);
  g.fillStyle(0xf2cf6b, 1);
  g.fillEllipse(hx, headY - 7, 28, 7);
  g.fillRoundedRect(hx - 7, headY - 16, 14, 10, 4);
  g.fillStyle(0xd9ae44, 1);
  g.fillRect(hx - 13, headY - 7, 26, 1.4);
  g.fillStyle(0x15803d, 1);
  g.fillRect(hx - 7, headY - 10, 14, 2.6);
  g.fillStyle(0xf8fafc, 1);
  g.fillTriangle(hx + 5, headY - 10, hx + 12, headY - 16, hx + 8, headY - 8);
}

/** Quadros de dano: "hero-hurt" (susto, de frente) e "hero-dazed" (sentado e zonzo). */
export function buildHeroDeathTextures(scene: Phaser.Scene): void {
  bake(scene, "hero-hurt", 48, 56, (g) => drawFront(g, "hurt"));
  bake(scene, "hero-dazed", 48, 56, (g) => drawFront(g, "dazed"));
}
