import Phaser from "phaser";
import { RASTRO_GAME_CONFIG } from "../gameConfig";

export interface PlayerShipVisuals {
  player: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  centerExhaust: ExhaustLayers;
  wingExhausts: ExhaustLayers[];
}

interface ExhaustLayers {
  plume: Phaser.GameObjects.Graphics;
  glow: Phaser.GameObjects.Graphics;
  core: Phaser.GameObjects.Graphics;
  phase: number;
}

export function createPlayerShip(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
): PlayerShipVisuals {
  const shadow = scene.add
    .ellipse(centerX, centerY + 27, 74, 15, 0x020817, 0.62)
    .setDepth(0.85);
  const player = scene.add
    .container(centerX, centerY)
    .setSize(RASTRO_GAME_CONFIG.player.width, RASTRO_GAME_CONFIG.player.height)
    .setDepth(1.2);
  drawPlayerShip(player);
  const centerExhaust = createExhaust(scene, player, 0, 15, 23, 38);
  const wingExhausts = [-36.5, 36.5].map((x, index) =>
    createExhaust(scene, player, x, 14, 9, 19, index * Math.PI),
  );

  return {
    player,
    shadow,
    centerExhaust,
    wingExhausts,
  };
}

export function updatePlayerShipVisuals(
  ship: PlayerShipVisuals,
  perspective: number,
  time: number,
  verticalDirection: number,
): void {
  const exhaustWidth = verticalDirection > 0 ? 0.86 : verticalDirection === 0 ? 0.88 : 1;
  const exhaustLength = verticalDirection > 0 ? 0.52 : verticalDirection === 0 ? 0.76 : 1;

  ship.shadow
    .setPosition(ship.player.x, ship.player.y + 26 * ship.player.scaleX)
    .setScale(0.8 + perspective * 0.35, 0.75 + perspective * 0.25)
    .setAlpha(0.2 + perspective * 0.38);
  animateExhaust(ship.centerExhaust, time * 0.011, exhaustWidth, exhaustLength);
  ship.wingExhausts.forEach((exhaust, index) => {
    animateExhaust(
      exhaust,
      time * 0.014 + index * Math.PI,
      exhaustWidth,
      exhaustLength,
    );
  });
}

function createExhaust(
  scene: Phaser.Scene,
  player: Phaser.GameObjects.Container,
  x: number,
  y: number,
  width: number,
  length: number,
  phase = 0,
): ExhaustLayers {
  const plume = drawExhaustLayer(scene, width, length, 0x2563eb, 0.38);
  const glow = drawExhaustLayer(
    scene,
    width * 0.66,
    length * 0.78,
    0x22d3ee,
    0.72,
  );
  const core = drawExhaustLayer(
    scene,
    width * 0.32,
    length * 0.58,
    0xe0fbff,
    0.95,
  );

  player.add([
    plume.setPosition(x, y).setDepth(1),
    glow.setPosition(x, y + length * 0.08).setDepth(1.01),
    core.setPosition(x, y + length * 0.16).setDepth(1.02),
  ]);
  return { plume, glow, core, phase };
}

function drawExhaustLayer(
  scene: Phaser.Scene,
  width: number,
  length: number,
  color: number,
  alpha: number,
): Phaser.GameObjects.Graphics {
  const graphics = scene.add.graphics();
  graphics.fillStyle(color, alpha);
  const halfContour = Array.from({ length: 9 }, (_, index) => {
    const progress = index / 8;
    const widthProfile =
      Math.sin(progress * Math.PI) ** 0.72 * (0.85 + 0.15 * Math.cos(progress * Math.PI));
    return {
      x: (width / 2) * widthProfile,
      y: length * progress,
    };
  });
  graphics.fillPoints(
    [...halfContour, ...halfContour.slice(1, -1).reverse().map(({ x, y }) => ({ x: -x, y }))],
    true,
  );
  return graphics;
}

function animateExhaust(
  exhaust: ExhaustLayers,
  time: number,
  width: number,
  length: number,
): void {
  const pulse = Math.sin(time + exhaust.phase);
  const flutter = Math.sin(time * 2.3 + exhaust.phase * 0.6);

  exhaust.plume
    .setScale(width * (0.9 + pulse * 0.12), length * (0.82 + flutter * 0.18))
    .setAlpha(0.78 + flutter * 0.22);
  exhaust.glow
    .setScale(width * (0.94 + flutter * 0.12), length * (0.86 + pulse * 0.14))
    .setAlpha(0.8 + pulse * 0.2);
  exhaust.core
    .setScale(width * (0.94 + pulse * 0.1), length * (0.9 + flutter * 0.1))
    .setAlpha(0.82 + flutter * 0.18);
}

export function getPlayerShipObjects(
  ship: PlayerShipVisuals,
): Phaser.GameObjects.GameObject[] {
  return [
    ship.player,
    ship.shadow,
  ];
}

function drawPlayerShip(player: Phaser.GameObjects.Container): void {
  const graphics = player.scene.add.graphics();
  graphics.fillStyle(0x0c3045, 1);
  graphics.fillPoints(
    [
      { x: -52, y: -1 }, { x: -38, y: -16 }, { x: -19, y: -13 },
      { x: 0, y: -21 }, { x: 19, y: -13 }, { x: 38, y: -16 },
      { x: 52, y: -1 }, { x: 41, y: 16 }, { x: 22, y: 12 },
      { x: 0, y: 22 }, { x: -22, y: 12 }, { x: -41, y: 16 },
    ],
    true,
  );
  graphics.fillStyle(0x1493a7, 1);
  graphics.fillPoints(
    [
      { x: -44, y: 0 }, { x: -34, y: -10 }, { x: -18, y: -7 },
      { x: 0, y: -16 }, { x: 18, y: -7 }, { x: 34, y: -10 },
      { x: 44, y: 0 }, { x: 36, y: 10 }, { x: 19, y: 7 },
      { x: 0, y: 15 }, { x: -19, y: 7 }, { x: -36, y: 10 },
    ],
    true,
  );
  graphics.fillStyle(0x0b4964, 0.95);
  graphics.fillPoints(
    [{ x: 0, y: 0 }, { x: -42, y: 0 }, { x: -17, y: 13 }, { x: -8, y: 8 }],
    true,
  );
  graphics.fillPoints(
    [{ x: 0, y: 0 }, { x: 42, y: 0 }, { x: 17, y: 13 }, { x: 8, y: 8 }],
    true,
  );
  graphics.fillStyle(0x155e75, 1);
  graphics.fillRoundedRect(-15, -24, 30, 48, 14);

  graphics.fillStyle(0x38bdf8, 0.9);
  graphics.fillPoints(
    [{ x: 0, y: -13 }, { x: -5, y: -5 }, { x: -6, y: 8 }, { x: 0, y: 13 }],
    true,
  );
  graphics.fillStyle(0x0e7490, 0.95);
  graphics.fillPoints(
    [{ x: 0, y: -13 }, { x: 5, y: -5 }, { x: 6, y: 8 }, { x: 0, y: 13 }],
    true,
  );

  graphics.fillStyle(0x041b2d, 1);
  graphics.fillRoundedRect(-43, 5, 13, 15, 5);
  graphics.fillRoundedRect(30, 5, 13, 15, 5);
  graphics.fillRoundedRect(-8, 10, 16, 13, 6);
  graphics.fillStyle(0x0e7490, 1);
  graphics.fillRoundedRect(-5, 15, 10, 7, 3);
  graphics.fillStyle(0xfda4af, 0.95);
  graphics.fillCircle(-43, 0, 2);
  graphics.fillCircle(43, 0, 2);
  player.add(graphics);
}
