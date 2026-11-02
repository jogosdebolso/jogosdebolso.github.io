import Phaser from "phaser";
import { RASTRO_GAME_CONFIG } from "../gameConfig";

export interface PlayerShipVisuals {
  player: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  propulsionGlow: Phaser.GameObjects.Arc;
  propulsionCore: Phaser.GameObjects.Arc;
  leftThruster: Phaser.GameObjects.Arc;
  rightThruster: Phaser.GameObjects.Arc;
}

export function createPlayerShip(
  scene: Phaser.Scene,
  centerX: number,
  centerY: number,
): PlayerShipVisuals {
  const shadow = scene.add
    .ellipse(centerX, centerY + 27, 74, 15, 0x020817, 0.62)
    .setDepth(0.85);
  const propulsionGlow = scene.add
    .circle(centerX, centerY + 28, 13, 0x2563eb, 0.75)
    .setDepth(0.9);
  const propulsionCore = scene.add
    .circle(centerX, centerY + 28, 6, 0xa5f3fc, 0.95)
    .setDepth(1);
  const leftThruster = scene.add
    .circle(centerX - 36, centerY + 25, 4, 0x38bdf8, 0.9)
    .setDepth(1.05);
  const rightThruster = scene.add
    .circle(centerX + 36, centerY + 25, 4, 0x38bdf8, 0.9)
    .setDepth(1.05);
  const player = scene.add
    .container(centerX, centerY)
    .setSize(RASTRO_GAME_CONFIG.player.width, RASTRO_GAME_CONFIG.player.height)
    .setDepth(1.2);
  drawPlayerShip(player);

  return {
    player,
    shadow,
    propulsionGlow,
    propulsionCore,
    leftThruster,
    rightThruster,
  };
}

export function updatePlayerShipVisuals(
  ship: PlayerShipVisuals,
  perspective: number,
  time: number,
  isMoving: boolean,
): void {
  const flicker = 0.85 + Math.sin(time * 0.025) * 0.15;
  const thrust = isMoving ? 1 : 0.65;
  const enginePulse = 0.8 + flicker * 0.2;
  const scale = ship.player.scaleX;
  const rotation = ship.player.rotation;
  const engineOffsetX = Math.sin(rotation) * 14 * scale;
  const engineOffsetY = Math.cos(rotation) * 24 * scale;

  ship.shadow
    .setPosition(ship.player.x, ship.player.y + 26 * scale)
    .setScale(0.8 + perspective * 0.35, 0.75 + perspective * 0.25)
    .setAlpha(0.2 + perspective * 0.38);
  ship.propulsionGlow
    .setPosition(ship.player.x, ship.player.y + engineOffsetY)
    .setAlpha((0.2 + flicker * 0.25) * thrust)
    .setScale((0.75 + flicker * 0.2) * scale);
  ship.propulsionCore
    .setPosition(ship.player.x, ship.player.y + engineOffsetY)
    .setAlpha((0.55 + flicker * 0.35) * thrust)
    .setScale((0.75 + flicker * 0.2) * scale);
  ship.leftThruster
    .setPosition(
      ship.player.x - 36 * scale + engineOffsetX,
      ship.player.y + engineOffsetY,
    )
    .setAlpha((0.55 + enginePulse * 0.35) * thrust)
    .setScale((0.65 + enginePulse * 0.3) * scale);
  ship.rightThruster
    .setPosition(
      ship.player.x + 36 * scale + engineOffsetX,
      ship.player.y + engineOffsetY,
    )
    .setAlpha((0.55 + enginePulse * 0.35) * thrust)
    .setScale((0.65 + enginePulse * 0.3) * scale);
}

export function getPlayerShipObjects(
  ship: PlayerShipVisuals,
): Phaser.GameObjects.GameObject[] {
  return [
    ship.player,
    ship.shadow,
    ship.propulsionGlow,
    ship.propulsionCore,
    ship.leftThruster,
    ship.rightThruster,
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
  graphics.lineStyle(2, 0x67e8f9, 0.95);
  graphics.strokePoints(
    [
      { x: -52, y: -1 }, { x: -38, y: -16 }, { x: -19, y: -13 },
      { x: 0, y: -21 }, { x: 19, y: -13 }, { x: 38, y: -16 },
      { x: 52, y: -1 }, { x: 41, y: 16 }, { x: 22, y: 12 },
      { x: 0, y: 22 }, { x: -22, y: 12 }, { x: -41, y: 16 },
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

  graphics.lineStyle(1, 0xa5f3fc, 0.7);
  graphics.lineBetween(-39, 1, -17, 10);
  graphics.lineBetween(39, 1, 17, 10);
  graphics.lineBetween(-25, -6, -13, -2);
  graphics.lineBetween(25, -6, 13, -2);

  graphics.fillStyle(0x155e75, 1);
  graphics.fillRoundedRect(-15, -24, 30, 48, 14);
  graphics.lineStyle(1.5, 0xbaefff, 0.95);
  graphics.strokeRoundedRect(-15, -24, 30, 48, 14);

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
  graphics.lineStyle(1.5, 0x94a3b8, 0.95);
  graphics.strokeRoundedRect(-43, 5, 13, 15, 5);
  graphics.strokeRoundedRect(30, 5, 13, 15, 5);
  graphics.fillStyle(0x67e8f9, 0.95);
  graphics.fillCircle(-36.5, 12.5, 3.5);
  graphics.fillCircle(36.5, 12.5, 3.5);

  graphics.fillStyle(0xfda4af, 0.95);
  graphics.fillCircle(-43, 0, 2);
  graphics.fillCircle(43, 0, 2);
  graphics.lineStyle(1, 0xe0f2fe, 0.7);
  graphics.lineBetween(0, -9, 0, -3);

  player.add(graphics);
}
