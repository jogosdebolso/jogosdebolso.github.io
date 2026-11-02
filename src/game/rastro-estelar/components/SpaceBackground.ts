import Phaser from "phaser";
import type { RastroLevel } from "../levelConfig";

export function drawSpaceBackground(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  theme: RastroLevel["background"],
): void {
  const random = createRandom(31);
  const shortestSide = Math.min(width, height);
  const { planet, moon } = theme;
  const planetRadius = Phaser.Math.Clamp(shortestSide * planet.radius, 52, 104);
  const planetX = width * planet.x;
  const planetY = height * planet.y;
  const horizonY = height * 0.15;

  graphics.clear();
  graphics.fillStyle(theme.baseColor, 1);
  graphics.fillRect(0, 0, width, height);

  const nebulaClouds = [
    [0.18, 0.56, 0.47, 0.32, 0],
    [0.73, 0.72, 0.4, 0.27, 1],
    [0.78, 0.18, 0.32, 0.22, 2],
    [0.37, 0.21, 0.24, 0.17, 3],
    [0.49, 0.48, 0.33, 0.16, 1],
  ] as const;
  for (const [x, y, radius, flatten, colorIndex] of nebulaClouds) {
    const color = theme.nebulaColors[colorIndex];
    for (let layer = 3; layer >= 0; layer -= 1) {
      const spread = 1 + layer * 0.22;
      graphics.fillStyle(color, 0.025 + (3 - layer) * 0.015);
      graphics.fillEllipse(
        width * x,
        height * y,
        shortestSide * radius * spread,
        shortestSide * radius * flatten * spread,
      );
    }
  }

  const starCount = Math.floor((width * height) / 6500);
  for (let index = 0; index < starCount; index += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = random() > 0.94 ? 1.6 : random() > 0.55 ? 1 : 0.6;
    const alpha = 0.25 + random() * 0.65;

    graphics.fillStyle(random() > 0.82 ? 0xb9d8ff : 0xffffff, alpha);
    graphics.fillCircle(x, y, radius);

    if (radius > 1.5) {
      graphics.lineStyle(1, 0xc4d8ff, alpha * 0.45);
      graphics.lineBetween(x - 4, y, x + 4, y);
      graphics.lineBetween(x, y - 4, x, y + 4);
    }
  }

  drawHorizonAndPerspectiveGrid(graphics, width, height, horizonY, theme.horizonColor);
  drawDistantConstellations(graphics, width, height, theme.horizonColor);

  graphics.lineStyle(1, planet.ringColor, 0.18);
  graphics.strokeEllipse(planetX, planetY, planetRadius * 4.2, planetRadius * 1.55);
  graphics.lineStyle(1, planet.ringColor, 0.1);
  graphics.strokeEllipse(planetX, planetY, planetRadius * 4.8, planetRadius * 1.8);

  graphics.fillStyle(planet.color, 1);
  graphics.fillCircle(planetX, planetY, planetRadius);
  graphics.fillStyle(planet.ringColor, 0.13);
  graphics.fillCircle(planetX, planetY, planetRadius * 1.12);
  graphics.fillStyle(planet.color, 1);
  graphics.fillCircle(planetX, planetY, planetRadius);
  graphics.fillStyle(planet.highlightColor, 0.5);
  graphics.fillCircle(
    planetX - planetRadius * 0.24,
    planetY - planetRadius * 0.2,
    planetRadius * 0.76,
  );
  graphics.fillStyle(planet.shadowColor, 0.48);
  graphics.fillCircle(
    planetX + planetRadius * 0.36,
    planetY + planetRadius * 0.25,
    planetRadius * 0.61,
  );
  graphics.fillStyle(0x252448, 0.42);
  graphics.fillCircle(
    planetX - planetRadius * 0.35,
    planetY + planetRadius * 0.33,
    planetRadius * 0.2,
  );
  graphics.fillCircle(
    planetX + planetRadius * 0.18,
    planetY - planetRadius * 0.25,
    planetRadius * 0.12,
  );
  graphics.lineStyle(1, planet.highlightColor, 0.24);
  graphics.strokeEllipse(
    planetX - planetRadius * 0.12,
    planetY - planetRadius * 0.02,
    planetRadius * 1.42,
    planetRadius * 0.28,
  );
  graphics.lineStyle(1, planet.shadowColor, 0.28);
  graphics.strokeEllipse(
    planetX + planetRadius * 0.08,
    planetY + planetRadius * 0.32,
    planetRadius * 1.2,
    planetRadius * 0.18,
  );
  graphics.lineStyle(1.5, planet.ringColor, 0.62);
  graphics.strokeCircle(planetX, planetY, planetRadius);
  graphics.lineStyle(2, planet.ringColor, 0.52);
  graphics.strokeEllipse(planetX, planetY, planetRadius * 3.8, planetRadius * 1.3);

  const moonRadius = Phaser.Math.Clamp(shortestSide * moon.radius, 9, 18);
  graphics.fillStyle(moon.color, 0.95);
  graphics.fillCircle(width * moon.x, height * moon.y, moonRadius);
  graphics.fillStyle(moon.shadowColor, 0.75);
  graphics.fillCircle(
    width * moon.x + moonRadius * 0.35,
    height * moon.y - moonRadius * 0.2,
    moonRadius * 0.72,
  );
  graphics.lineStyle(1, moon.color, 0.32);
  graphics.strokeCircle(width * moon.x, height * moon.y, moonRadius * 1.25);
  graphics.fillStyle(moon.shadowColor, 0.3);
  graphics.fillCircle(
    width * moon.x - moonRadius * 0.25,
    height * moon.y + moonRadius * 0.35,
    moonRadius * 0.16,
  );
}

function drawHorizonAndPerspectiveGrid(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  horizonY: number,
  color: number,
): void {
  const vanishingX = width * 0.5;

  for (let band = 5; band >= 0; band -= 1) {
    const spread = 1 + band * 0.24;
    graphics.fillStyle(color, 0.018 + (5 - band) * 0.009);
    graphics.fillEllipse(
      vanishingX,
      horizonY,
      width * 0.52 * spread,
      height * 0.035 * spread,
    );
  }

  graphics.lineStyle(1, color, 0.16);
  graphics.lineBetween(0, horizonY, width, horizonY);
  graphics.lineStyle(1, color, 0.075);
  graphics.lineBetween(0, horizonY + 4, width, horizonY + 4);

  const rayOffsets = [-1.25, -0.94, -0.7, -0.48, -0.3, -0.15, 0, 0.15, 0.3, 0.48, 0.7, 0.94, 1.25];
  for (const offset of rayOffsets) {
    graphics.lineStyle(1, color, Math.abs(offset) > 0.94 ? 0.075 : 0.045);
    graphics.lineBetween(
      vanishingX,
      horizonY,
      vanishingX + width * offset,
      height,
    );
  }

  for (let index = 1; index <= 9; index += 1) {
    const progress = index / 9;
    const y = horizonY + (height - horizonY) * progress ** 2.15;
    graphics.lineStyle(1, color, 0.035 + progress * 0.055);
    graphics.lineBetween(
      vanishingX - width * progress * 0.5,
      y,
      vanishingX + width * progress * 0.5,
      y,
    );
  }
}

function drawDistantConstellations(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  color: number,
): void {
  const patterns = [
    [[0.08, 0.2], [0.12, 0.14], [0.17, 0.18], [0.2, 0.1]],
    [[0.7, 0.12], [0.75, 0.18], [0.81, 0.13], [0.86, 0.2]],
    [[0.31, 0.36], [0.35, 0.31], [0.4, 0.34]],
  ] as const;
  for (const pattern of patterns) {
    graphics.lineStyle(1, color, 0.2);
    for (let index = 1; index < pattern.length; index += 1) {
      const [previousX, previousY] = pattern[index - 1];
      const [x, y] = pattern[index];
      graphics.lineBetween(
        width * previousX,
        height * previousY,
        width * x,
        height * y,
      );
    }
    for (const [x, y] of pattern) {
      graphics.fillStyle(color, 0.48);
      graphics.fillCircle(width * x, height * y, 1.7);
    }
  }
}

function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
