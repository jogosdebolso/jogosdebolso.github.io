import Phaser from "phaser";
import { HERO_FRAMES } from "../constants";
import { bake } from "./bake";

interface HeroPose {
  thighF: number; // ângulos em radianos a partir da vertical (positivo = para frente)
  kneeF: number;
  thighB: number;
  kneeB: number;
  armF: number;
  armB: number;
  elbow: number;
  bob: number;
  lean: number;
  scarf: number;
}

function drawHero(g: Phaser.GameObjects.Graphics, pose: HeroPose): void {
  const hipX = 24;
  const hipY = 35;
  const SKIN = 0xf2c9a0;
  const SKIN_SHADE = 0xd9a87c;

  const limb = (
    startX: number,
    startY: number,
    upper: number,
    lower: number,
    angle: number,
    bend: number,
    width: number,
    color: number,
  ): { x: number; y: number; angle: number } => {
    const midX = startX + Math.sin(angle) * upper;
    const midY = startY + Math.cos(angle) * upper;
    const endAngle = angle - bend;
    const endX = midX + Math.sin(endAngle) * lower;
    const endY = midY + Math.cos(endAngle) * lower;
    g.lineStyle(width, color, 1);
    g.beginPath();
    g.moveTo(startX, startY);
    g.lineTo(midX, midY);
    g.lineTo(endX, endY);
    g.strokePath();
    g.fillStyle(color, 1);
    g.fillCircle(startX, startY, width / 2);
    g.fillCircle(midX, midY, width / 2);
    g.fillCircle(endX, endY, width / 2);
    return { x: endX, y: endY, angle: endAngle };
  };

  const leg = (thigh: number, knee: number, pants: number, boot: number, cuff: number): void => {
    const foot = limb(hipX, hipY, 7.5, 7.5, thigh, knee, 5.5, pants);
    g.fillStyle(cuff, 1);
    g.fillCircle(foot.x - Math.sin(foot.angle) * 2, foot.y - Math.cos(foot.angle) * 2, 3.3);
    g.fillStyle(boot, 1);
    g.fillRoundedRect(foot.x - 3, foot.y - 2, 9, 5, 2);
  };

  const shoulderX = hipX + pose.lean * 0.6;
  const shoulderY = 25 + pose.bob;
  const arm = (angle: number, sleeve: number, hand: number): void => {
    const end = limb(shoulderX, shoulderY, 6, 5.5, angle, -pose.elbow, 4.6, sleeve);
    g.fillStyle(hand, 1);
    g.fillCircle(end.x, end.y, 2.8);
  };

  // Plano de trás: braço, perna e mochila.
  arm(pose.armB, 0xb8441c, SKIN_SHADE);
  leg(pose.thighB, pose.kneeB, 0xa8824f, 0x4a2a12, 0x6b4a22);
  g.fillStyle(0x1e3a5f, 1);
  g.fillRoundedRect(12 + pose.lean * 0.4, 24 + pose.bob, 9, 13, 3);
  g.fillStyle(0x2f5a8f, 1);
  g.fillRoundedRect(13 + pose.lean * 0.4, 25 + pose.bob, 3, 11, 1.5);

  // Cauda do lenço, atrás do tronco.
  g.fillStyle(0xdc2626, 1);
  g.fillTriangle(
    21 + pose.lean * 0.6,
    24 + pose.bob,
    21 + pose.lean * 0.6,
    28 + pose.bob,
    13 - pose.scarf,
    25 + pose.bob + pose.scarf * 0.25,
  );

  // Tronco: túnica laranja com cinto.
  const tl = 19 + pose.lean;
  const tr = 30 + pose.lean;
  const top = 23 + pose.bob;
  g.fillStyle(0xe2572b, 1);
  g.fillPoints(
    [
      new Phaser.Math.Vector2(tl, top),
      new Phaser.Math.Vector2(tr, top),
      new Phaser.Math.Vector2(30, hipY + 1),
      new Phaser.Math.Vector2(19, hipY + 1),
    ],
    true,
  );
  g.fillStyle(0xf4814f, 1);
  g.fillRect(tl, top, 3, 9);
  g.fillStyle(0x5b3a1c, 1);
  g.fillRect(19.5, hipY - 3, 10.5, 3);
  g.fillStyle(0xfacc15, 1);
  g.fillRect(24.5, hipY - 3, 3, 3);

  // Lenço no pescoço.
  g.fillStyle(0xdc2626, 1);
  g.fillRoundedRect(20 + pose.lean, 21 + pose.bob, 11, 4.5, 2);

  // Cabeça, cabelo e rosto.
  const headX = 26 + pose.lean;
  const headY = 15 + pose.bob;
  g.fillStyle(0x5a2f12, 1);
  g.fillCircle(headX - 3, headY + 1, 7);
  g.fillStyle(SKIN, 1);
  g.fillCircle(headX, headY, 7.5);
  g.fillStyle(0x5a2f12, 1);
  g.fillRect(headX - 8, headY - 3, 6, 6);
  g.fillStyle(0xffffff, 1);
  g.fillCircle(headX + 3.5, headY - 0.5, 2.6);
  g.fillStyle(0x0f172a, 1);
  g.fillCircle(headX + 4.3, headY - 0.3, 1.5);
  g.fillStyle(0xe58a7a, 0.8);
  g.fillCircle(headX + 3, headY + 4, 1.8);
  g.fillStyle(0x7a3b22, 1);
  g.fillRect(headX + 2, headY + 5.2, 3, 1);

  // Chapéu de palha de aba larga com fita e pena.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(headX + 1, headY - 4, 27, 6);
  g.fillStyle(0xf2cf6b, 1);
  g.fillEllipse(headX + 1, headY - 5, 27, 6.5);
  g.fillRoundedRect(headX - 6.5, headY - 15, 15, 11, 5);
  g.fillStyle(0xd9ae44, 1);
  g.fillRect(headX - 9, headY - 5, 20, 1.5);
  g.fillStyle(0x15803d, 1);
  g.fillRect(headX - 6.5, headY - 8.5, 15, 3);
  g.fillStyle(0xf8fafc, 1);
  g.fillTriangle(headX + 5, headY - 8, headX + 12, headY - 15, headX + 7.5, headY - 6);

  // Plano da frente: perna e braço próximos à câmera.
  leg(pose.thighF, pose.kneeF, 0xc9a26b, 0x6b3f17, 0x8a5a2b);
  arm(pose.armF, 0xe2572b, SKIN);
}

/** Quadros do explorador (48x56; o corpo físico 32x44 fica centralizado). */
export function buildHeroTextures(scene: Phaser.Scene): void {
  const cycle = (running: boolean, index: number, total: number): HeroPose => {
    const theta = (index / total) * Math.PI * 2;
    const swing = Math.sin(theta);
    const amp = running ? 0.95 : 0.5;
    const knee = running ? 1.35 : 0.65;
    return {
      thighF: amp * swing,
      kneeF: knee * Math.max(0, Math.cos(theta)),
      thighB: -amp * swing,
      kneeB: knee * Math.max(0, -Math.cos(theta)),
      armF: (running ? 1.0 : 0.55) * -swing,
      armB: (running ? 1.0 : 0.55) * swing,
      elbow: running ? 1.3 : 0.3,
      bob: -Math.abs(Math.cos(theta)) * (running ? 2.2 : 1.2),
      lean: running ? 3 : 0,
      scarf: running ? 7 + Math.sin(theta * 2) * 2 : 2 + Math.sin(theta * 2),
    };
  };

  const frames: ReadonlyArray<readonly [string, HeroPose]> = [
    ["hero-idle-0", { thighF: 0.05, kneeF: 0, thighB: -0.08, kneeB: 0, armF: 0.1, armB: -0.1, elbow: 0.15, bob: 0, lean: 0, scarf: 1 }],
    ["hero-idle-1", { thighF: 0.05, kneeF: 0, thighB: -0.08, kneeB: 0, armF: 0.14, armB: -0.06, elbow: 0.2, bob: 0.9, lean: 0, scarf: 2 }],
    ["hero-jump", { thighF: 0.95, kneeF: 1.2, thighB: -0.35, kneeB: 0.7, armF: 2.5, armB: 2.1, elbow: 0.25, bob: 0, lean: 2, scarf: 8 }],
    ["hero-fall", { thighF: 0.4, kneeF: 0.3, thighB: -0.4, kneeB: 0.35, armF: 2.1, armB: 1.7, elbow: 0.2, bob: 0, lean: 1, scarf: -3 }],
  ];
  frames.forEach(([key, pose]) => bake(scene, key, 48, 56, (g) => drawHero(g, pose)));

  for (let i = 0; i < HERO_FRAMES; i += 1) {
    bake(scene, `hero-walk-${i}`, 48, 56, (g) => drawHero(g, cycle(false, i, HERO_FRAMES)));
    bake(scene, `hero-run-${i}`, 48, 56, (g) => drawHero(g, cycle(true, i, HERO_FRAMES)));
  }
}
