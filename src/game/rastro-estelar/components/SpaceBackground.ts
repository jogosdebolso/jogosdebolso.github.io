import Phaser from "phaser";
import type { RastroLevel } from "../levelConfig";
import { drawBlackHoleVariant, type BlackHoleVariant } from "./BlackHoleVariants";

export function drawSpaceBackground(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  horizonPosition: number,
  projectionExponent: number,
  level: RastroLevel,
): void {
  const { background: theme } = level;
  const random = createRandom(31);
  const shortestSide = Math.min(width, height);
  const horizonY = height * horizonPosition;

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

  if (level.id < 6) {
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
  }

  drawHorizonAndPerspectiveGrid(
    graphics,
    width,
    height,
    horizonY,
    projectionExponent,
    theme.horizonColor,
  );
  if (level.id < 6) {
    drawDistantConstellations(graphics, width, height, theme.horizonColor);
  }
  drawEnvironmentLandmark(graphics, level.id, width, height, shortestSide, theme);
}

function drawEnvironmentLandmark(
  graphics: Phaser.GameObjects.Graphics,
  levelId: number,
  width: number,
  height: number,
  shortestSide: number,
  theme: RastroLevel["background"],
): void {
  switch (levelId) {
    case 1:
      drawRingedWorld(graphics, width, height, shortestSide, theme);
      break;
    case 2:
      drawCrimsonRift(graphics, width, height, shortestSide, theme);
      break;
    case 3:
      drawIcyWorld(graphics, width, height, shortestSide, theme);
      break;
    case 4:
      drawSolarCorona(graphics, width, height, shortestSide, theme);
      break;
    case 5:
      drawCarinaPillars(graphics, width, height, theme);
      break;
    case 6:
      drawCygnusBlackHole(graphics, width, height, shortestSide, theme);
      break;
    case 7:
      drawEventHorizonOrbit(graphics, height, shortestSide);
      break;
    default:
      drawRingedWorld(graphics, width, height, shortestSide, theme);
  }
}

function drawRingedWorld(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  shortestSide: number,
  theme: RastroLevel["background"],
): void {
  const { planet, moon } = theme;
  const color = softenDistantColor(planet.color, 0.52);
  const highlight = softenDistantColor(planet.highlightColor, 0.56);
  const shadow = softenDistantColor(planet.shadowColor, 0.4);
  const ring = softenDistantColor(planet.ringColor, 0.6);
  const moonColor = softenDistantColor(moon.color, 0.54);
  const moonShadow = softenDistantColor(moon.shadowColor, 0.42);
  const radius = Phaser.Math.Clamp(shortestSide * planet.radius, 52, 104);
  const x = width * planet.x;
  const y = height * planet.y;

  graphics.lineStyle(1, ring, 0.12);
  graphics.strokeEllipse(x, y, radius * 4.2, radius * 1.55);
  graphics.lineStyle(1, ring, 0.07);
  graphics.strokeEllipse(x, y, radius * 4.8, radius * 1.8);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(ring, 0.1);
  graphics.fillCircle(x, y, radius * 1.12);
  graphics.fillStyle(color, 1);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(highlight, 0.36);
  graphics.fillCircle(x - radius * 0.24, y - radius * 0.2, radius * 0.76);
  graphics.fillStyle(shadow, 0.38);
  graphics.fillCircle(x + radius * 0.36, y + radius * 0.25, radius * 0.61);
  graphics.fillStyle(0x252448, 0.42);
  graphics.fillCircle(x - radius * 0.35, y + radius * 0.33, radius * 0.2);
  graphics.fillCircle(x + radius * 0.18, y - radius * 0.25, radius * 0.12);
  graphics.lineStyle(1, highlight, 0.17);
  graphics.strokeEllipse(x - radius * 0.12, y - radius * 0.02, radius * 1.42, radius * 0.28);
  graphics.lineStyle(1, shadow, 0.2);
  graphics.strokeEllipse(x + radius * 0.08, y + radius * 0.32, radius * 1.2, radius * 0.18);
  graphics.lineStyle(1.5, ring, 0.42);
  graphics.strokeCircle(x, y, radius);
  graphics.lineStyle(2, ring, 0.36);
  graphics.strokeEllipse(x, y, radius * 3.8, radius * 1.3);

  const moonRadius = Phaser.Math.Clamp(shortestSide * moon.radius, 9, 18);
  const moonX = width * moon.x;
  const moonY = height * moon.y;
  graphics.fillStyle(moonColor, 0.7);
  graphics.fillCircle(moonX, moonY, moonRadius);
  graphics.fillStyle(moonShadow, 0.4);
  graphics.fillCircle(moonX + moonRadius * 0.35, moonY - moonRadius * 0.2, moonRadius * 0.72);
  graphics.lineStyle(1, moonColor, 0.22);
  graphics.strokeCircle(moonX, moonY, moonRadius * 1.25);
}

function drawCrimsonRift(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  shortestSide: number,
  theme: RastroLevel["background"],
): void {
  const centerX = width * 0.52;
  const centerY = height * 0.3;
  const riftColor = softenDistantColor(theme.planet.highlightColor, 0.5);
  const hazeColor = softenDistantColor(theme.planet.color, 0.48);

  for (let layer = 4; layer >= 0; layer -= 1) {
    graphics.fillStyle(layer % 2 === 0 ? hazeColor : riftColor, 0.035);
    graphics.fillEllipse(
      centerX + width * (layer - 2) * 0.035,
      centerY + height * (layer - 2) * 0.014,
      shortestSide * (0.32 + layer * 0.035),
      shortestSide * (0.16 + layer * 0.018),
    );
  }

  for (let arc = 0; arc < 3; arc += 1) {
    const color = arc === 1 ? riftColor : softenDistantColor(theme.planet.ringColor, 0.58);
    graphics.lineStyle(2 - arc * 0.35, color, 0.09 - arc * 0.015);
    graphics.beginPath();
    for (let step = 0; step <= 32; step += 1) {
      const progress = step / 32;
      const x = width * (0.12 + progress * 0.77);
      const wave = Math.sin(progress * Math.PI * 2 + arc * 1.4);
      const y = centerY + height * (wave * 0.11 + (progress - 0.5) * 0.12);
      if (step === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.strokePath();
  }

  const random = createRandom(220 + theme.horizonColor);
  for (let index = 0; index < 70; index += 1) {
    const x = random() * width;
    const y = height * (0.12 + random() * 0.42);
    const radius = 0.7 + random() * 1.6;
    graphics.fillStyle(index % 5 === 0 ? riftColor : 0xffc2cc, 0.18 + random() * 0.24);
    graphics.fillCircle(x, y, radius);
  }
}

type Graphics = Phaser.GameObjects.Graphics;

function mixColor(from: number, to: number, amount: number): number {
  const channel = (shift: number) =>
    Math.round(
      Phaser.Math.Linear((from >> shift) & 0xff, (to >> shift) & 0xff, amount),
    );
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Halo difuso: muitos discos concêntricos de baixa opacidade. */
function softGlow(
  graphics: Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  strength: number,
  flatten = 1,
): void {
  const steps = 16;
  for (let step = steps; step >= 1; step -= 1) {
    const t = step / steps;
    graphics.fillStyle(color, (strength / steps) * 1.6 * (1 - t) ** 1.1 + 0.002);
    graphics.fillEllipse(x, y, radius * 2 * t, radius * 2 * t * flatten);
  }
}

/** Nuvem difusa: cada bolha é feita de 4 camadas, da maior e mais fraca à menor. */
function nebulaPuff(
  graphics: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  color: number,
  alpha: number,
): void {
  for (let layer = 0; layer < 4; layer += 1) {
    const scale = 1.7 - layer * 0.4;
    graphics.fillStyle(color, alpha / 3);
    graphics.fillEllipse(x, y, width * scale, height * scale);
  }
}

function drawIcyWorld(
  graphics: Graphics,
  width: number,
  height: number,
  shortestSide: number,
  theme: RastroLevel["background"],
): void {
  const { planet } = theme;
  const radius = Phaser.Math.Clamp(shortestSide * planet.radius, 68, 128);
  const x = width * planet.x;
  const y = height * planet.y;
  const body = softenDistantColor(planet.color, 0.42);
  const light = mixColor(softenDistantColor(planet.highlightColor, 0.5), body, 0.45);
  const shadow = mixColor(softenDistantColor(planet.shadowColor, 0.3), body, 0.35);
  const random = createRandom(303);

  // Nebulosa: massas de nuvens feitas de muitos discos translúcidos
  // sobrepostos, em três faixas de profundidade.
  const clouds = [
    { y: 0.2, spread: 0.16, puffs: 80, size: 0.09, color: theme.nebulaColors[1], alpha: 0.035 },
    { y: 0.33, spread: 0.2, puffs: 110, size: 0.11, color: theme.nebulaColors[0], alpha: 0.04 },
    { y: 0.45, spread: 0.12, puffs: 90, size: 0.12, color: theme.nebulaColors[2], alpha: 0.045 },
  ];
  for (const cloud of clouds) {
    for (let puff = 0; puff < cloud.puffs; puff += 1) {
      const px = width * (0.02 + random() * 0.96);
      const py = height * (cloud.y + (random() - 0.5) * cloud.spread * 2);
      const size = shortestSide * cloud.size * (0.5 + random());
      nebulaPuff(graphics, px, py, size * 2.4, size * 1.3, cloud.color, cloud.alpha);
    }
  }
  // Estrelas dentro da névoa.
  for (let star = 0; star < 40; star += 1) {
    graphics.fillStyle(0xe6fbff, 0.25 + random() * 0.4);
    graphics.fillCircle(random() * width, height * (0.1 + random() * 0.4), 0.6 + random() * 0.9);
  }

  // Planeta simples e opaco: disco, crescente de sombra e três crateras.
  graphics.fillStyle(body, 1);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(shadow, 1);
  graphics.beginPath();
  graphics.arc(x, y, radius, -Math.PI * 0.35, Math.PI * 0.85);
  graphics.arc(x - radius * 0.34, y - radius * 0.1, radius * 0.9, Math.PI * 0.85, -Math.PI * 0.35, true);
  graphics.closePath();
  graphics.fillPath();
  graphics.fillStyle(light, 1);
  graphics.fillCircle(x - radius * 0.38, y - radius * 0.34, radius * 0.26);
  graphics.fillStyle(shadow, 1);
  graphics.fillCircle(x + radius * 0.3, y + radius * 0.12, radius * 0.14);
  graphics.fillCircle(x - radius * 0.1, y + radius * 0.4, radius * 0.1);
}

function drawSolarCorona(
  graphics: Graphics,
  width: number,
  height: number,
  shortestSide: number,
  theme: RastroLevel["background"],
): void {
  const { planet } = theme;
  const x = width * planet.x;
  const y = height * planet.y;
  const radius = Phaser.Math.Clamp(shortestSide * planet.radius, 72, 140);
  const corona = 0xffbd4a;
  const surface = 0xff8f1f;
  const core = 0xffe98a;

  graphics.fillStyle(corona, 0.055);
  graphics.fillCircle(x, y, radius * 1.72);
  graphics.fillStyle(core, 0.075);
  graphics.fillCircle(x, y, radius * 1.3);
  graphics.lineStyle(2, corona, 0.2);
  graphics.strokeCircle(x, y, radius * 1.42);
  graphics.lineStyle(1, core, 0.22);
  graphics.strokeCircle(x, y, radius * 1.56);

  for (let ray = 0; ray < 44; ray += 1) {
    const angle = (ray / 44) * Math.PI * 2;
    const variedLength = radius * (1.15 + 0.3 * (0.5 + 0.5 * Math.sin(ray * 2.17)));
    const innerRadius = radius * 1.08;
    const outerRadius = variedLength;
    graphics.lineStyle(ray % 4 === 0 ? 1.5 : 1, corona, ray % 4 === 0 ? 0.32 : 0.18);
    graphics.lineBetween(
      x + Math.cos(angle) * innerRadius,
      y + Math.sin(angle) * innerRadius,
      x + Math.cos(angle) * outerRadius,
      y + Math.sin(angle) * outerRadius,
    );
  }

  graphics.fillStyle(surface, 1);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(core, 0.42);
  graphics.fillCircle(x - radius * 0.2, y - radius * 0.24, radius * 0.72);
  graphics.fillStyle(0xd65c16, 0.28);
  graphics.fillCircle(x + radius * 0.38, y + radius * 0.25, radius * 0.62);
  graphics.fillStyle(0xfff4bd, 0.26);
  graphics.fillCircle(x - radius * 0.22, y - radius * 0.24, radius * 0.34);
}

function drawCarinaPillars(
  graphics: Graphics,
  width: number,
  height: number,
  theme: RastroLevel["background"],
): void {
  const warmGas = softenDistantColor(theme.planet.highlightColor, 0.4);
  const darkGas = softenDistantColor(theme.planet.shadowColor, 0.3);
  const midGas = mixColor(darkGas, theme.nebulaColors[2], 0.5);
  const ridgeY = height * 0.56;
  const random = createRandom(505);

  // Nuvens de emissão ao fundo.
  softGlow(graphics, width * 0.4, height * 0.4, width * 0.5, theme.nebulaColors[0], 0.35, 0.5);
  softGlow(graphics, width * 0.75, height * 0.34, width * 0.38, theme.nebulaColors[1], 0.3, 0.5);
  softGlow(graphics, width * 0.58, height * 0.3, width * 0.2, warmGas, 0.16, 0.6);

  // Estrelas jovens dentro da nebulosa.
  for (let star = 0; star < 46; star += 1) {
    const sx = random() * width;
    const sy = height * (0.16 + random() * 0.4);
    const bright = random() > 0.85;
    graphics.fillStyle(bright ? 0xfff0d6 : 0xffd9bd, 0.25 + random() * 0.4);
    graphics.fillCircle(sx, sy, bright ? 1.6 : 0.8);
    if (bright) {
      softGlow(graphics, sx, sy, 7, 0xffd9bd, 0.3);
    }
  }

  const pillars = [
    { x: 0.13, width: 0.075, top: 0.3, lean: -0.03, seed: 1 },
    { x: 0.35, width: 0.085, top: 0.22, lean: 0.022, seed: 2 },
    { x: 0.62, width: 0.095, top: 0.33, lean: -0.016, seed: 3 },
    { x: 0.85, width: 0.07, top: 0.27, lean: 0.028, seed: 4 },
  ];

  for (const [index, pillar] of pillars.entries()) {
    const pillarRandom = createRandom(pillar.seed * 97);
    const rows = 34;
    const baseX = width * pillar.x;
    const baseHalf = width * pillar.width;
    const topY = height * pillar.top;
    const bodyColor = index % 2 ? midGas : darkGas;
    let tipX = baseX;

    // Coluna feita de bolhas difusas empilhadas, afunilando para o topo.
    for (let row = 0; row < rows; row += 1) {
      const t = row / (rows - 1); // 0 = base, 1 = topo
      const py = Phaser.Math.Linear(ridgeY, topY, t);
      const centerX = baseX + width * pillar.lean * t ** 1.5;
      const half = baseHalf * (1 - t ** 1.7 * 0.7) * (0.8 + pillarRandom() * 0.35);
      tipX = centerX;
      const step = (ridgeY - topY) / rows;
      for (let puff = 0; puff < 3; puff += 1) {
        const offset = (pillarRandom() - 0.5) * half * 0.9;
        nebulaPuff(graphics, centerX + offset, py, half * 1.5, step * 4, bodyColor, 0.16);
      }
      // Lado iluminado (esquerdo), mais quente e fraco.
      nebulaPuff(graphics, centerX - half * 0.5, py, half * 0.7, step * 3, warmGas, 0.06);
    }
    // Cabeça arredondada.
    const tipHalf = baseHalf * 0.38;
    nebulaPuff(graphics, tipX, topY, tipHalf * 2.2, tipHalf * 1.8, bodyColor, 0.22);
    nebulaPuff(graphics, tipX - tipHalf * 0.3, topY, tipHalf * 1.2, tipHalf, warmGas, 0.12);
    softGlow(graphics, tipX, topY, baseHalf * 0.9, 0xffb98a, 0.22);

    // Jatos de evaporação saindo do topo.
    if (index === 1 || index === 3) {
      graphics.lineStyle(1.5, warmGas, 0.25);
      graphics.lineBetween(tipX, topY - 2, tipX - 2, topY - height * 0.07);
      graphics.fillStyle(0xffe1c0, 0.8);
      graphics.fillCircle(tipX - 2, topY - height * 0.075, 1.8);
      softGlow(graphics, tipX - 2, topY - height * 0.075, 10, 0xffd5a5, 0.35);
    }
  }

  // Névoa de base: bolhas difusas ao longo da crista, sem borda reta.
  for (let layer = 0; layer < 3; layer += 1) {
    const fogRandom = createRandom(900 + layer);
    const color = layer === 0 ? darkGas : midGas;
    for (let puff = 0; puff < 46; puff += 1) {
      const px = width * (-0.05 + fogRandom() * 1.1);
      const py = ridgeY + height * (fogRandom() - 0.1) * (0.12 + layer * 0.06);
      const size = width * (0.07 + fogRandom() * 0.08);
      nebulaPuff(graphics, px, py, size * 2, size * 0.7, color, 0.1 - layer * 0.02);
    }
  }
}

function drawCygnusBlackHole(
  graphics: Graphics,
  width: number,
  height: number,
  shortestSide: number,
  theme: RastroLevel["background"],
): void {
  const x = width * 0.51;
  const y = height * 0.36;
  const radius = Phaser.Math.Clamp(shortestSide * 0.105, 46, 86);
  const hotColor = softenDistantColor(theme.planet.highlightColor, 0.46);
  const jetColor = softenDistantColor(theme.horizonColor, 0.48);

  graphics.fillStyle(jetColor, 0.055);
  graphics.fillPoints(
    [
      { x: x - radius * 0.16, y: y - radius * 0.56 },
      { x: x + radius * 0.16, y: y - radius * 0.56 },
      { x: x + radius * 0.42, y: y - radius * 3.1 },
      { x, y: y - radius * 2.15 },
      { x: x - radius * 0.42, y: y - radius * 3.1 },
    ],
    true,
  );
  graphics.fillPoints(
    [
      { x: x - radius * 0.16, y: y + radius * 0.56 },
      { x: x + radius * 0.16, y: y + radius * 0.56 },
      { x: x + radius * 0.42, y: y + radius * 2.4 },
      { x, y: y + radius * 1.8 },
      { x: x - radius * 0.42, y: y + radius * 2.4 },
    ],
    true,
  );

  softGlow(graphics, x, y, radius * 3.4, hotColor, 0.2, 0.55);
  graphics.fillStyle(0x02030a, 1);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(1.2, hotColor, 0.5);
  graphics.strokeCircle(x, y, radius * 1.04);

  const random = createRandom(660 + theme.horizonColor);
  for (let index = 0; index < 38; index += 1) {
    const angle = random() * Math.PI * 2;
    const orbit = radius * (1.9 + random() * 1.2);
    graphics.fillStyle(index % 3 === 0 ? hotColor : 0xb7c5df, 0.22 + random() * 0.25);
    graphics.fillCircle(
      x + Math.cos(angle) * orbit * 1.8,
      y + Math.sin(angle) * orbit * 0.42,
      0.7 + random() * 1.1,
    );
  }
}

function drawEventHorizonOrbit(
  graphics: Graphics,
  height: number,
  shortestSide: number,
): void {
  const radius = Phaser.Math.Clamp(shortestSide * 0.52, 190, 420);
  const x = -radius * 0.28;
  const y = height * 0.6;

  softGlow(graphics, x, y, radius * 3.2, 0x8a5a48, 0.3, 0.55);
  graphics.fillStyle(0x02030a, 1);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(1.5, 0xf0bd82, 0.5);
  graphics.strokeCircle(x, y, radius * 1.03);

  for (const direction of [-1, 1]) {
    graphics.fillStyle(0x8e5147, 0.09);
    graphics.fillPoints(
      [
        { x: x - radius * 0.12, y: y + direction * radius * 0.82 },
        { x: x + radius * 0.12, y: y + direction * radius * 0.82 },
        { x: x + radius * 0.34, y: y + direction * radius * 3.2 },
        { x, y: y + direction * radius * 2.4 },
        { x: x - radius * 0.34, y: y + direction * radius * 3.2 },
      ],
      true,
    );
  }
}

export function getCygnusBlackHoleGeometry(
  width: number,
  height: number,
  orbitalApproach: boolean,
): { x: number; y: number; radius: number } {
  const shortestSide = Math.min(width, height);
  const radius = orbitalApproach
    ? Phaser.Math.Clamp(shortestSide * 0.52, 190, 420)
    : Phaser.Math.Clamp(shortestSide * 0.105, 46, 86);
  return {
    x: orbitalApproach ? -radius * 0.28 : width * 0.51,
    y: height * (orbitalApproach ? 0.6 : 0.36),
    radius,
  };
}

export function drawCygnusBlackHoleAnimation(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  time: number,
  orbitalApproach = false,
  variant?: BlackHoleVariant,
): void {
  graphics.clear();
  const { x: centerX, y: centerY, radius } = getCygnusBlackHoleGeometry(
    width,
    height,
    orbitalApproach,
  );
  if (variant) {
    drawBlackHoleVariant(graphics, variant, centerX, centerY, radius, time);
    return;
  }
  const seconds = time / 1000;
  const pulse = 0.5 + 0.5 * Math.sin(seconds * 1.35);

  for (const direction of [-1, 1]) {
    const jetLength = radius * (2.65 + pulse * 0.34);
    const jetWidth = radius * (0.18 + pulse * 0.05);
    graphics.fillStyle(0x9a6b63, 0.055 + pulse * 0.035);
    graphics.fillPoints(
      [
        { x: centerX - jetWidth, y: centerY + direction * radius * 0.72 },
        { x: centerX + jetWidth, y: centerY + direction * radius * 0.72 },
        { x: centerX + jetWidth * 0.35, y: centerY + direction * jetLength },
        { x: centerX, y: centerY + direction * jetLength * 0.76 },
        { x: centerX - jetWidth * 0.35, y: centerY + direction * jetLength },
      ],
      true,
    );

    for (let knot = 0; knot < 4; knot += 1) {
      const progress = (seconds * 0.16 + knot * 0.27) % 1;
      const knotY = centerY + direction * radius * (0.9 + progress * 2.15);
      const knotX = centerX + Math.sin(seconds * 2 + knot * 1.7) * radius * 0.08;
      const knotRadius = radius * (0.025 + (1 - progress) * 0.035);
      graphics.fillStyle(0xf0bd88, (1 - progress) * (0.2 + pulse * 0.18));
      graphics.fillCircle(knotX, knotY, knotRadius);
    }
  }

  const flatten = orbitalApproach ? 0.3 : 0.34;
  const hairline = Math.max(1, radius * 0.004);
  const hot = 0xfff2d0;
  const warm = 0xf0a868;
  const cool = 0x8a4a3a;

  // Polilinha elíptica suave entre dois ângulos (y positivo = lado da frente).
  const traceArc = (
    orbitX: number,
    orbitY: number,
    from: number,
    to: number,
    color: number,
    alpha: number,
    width: number,
  ) => {
    const steps = Math.max(6, Math.ceil(Math.abs(to - from) * 14));
    graphics.lineStyle(width, color, alpha);
    graphics.beginPath();
    for (let step = 0; step <= steps; step += 1) {
      const angle = from + ((to - from) * step) / steps;
      const x = centerX + Math.cos(angle) * orbitX;
      const y = centerY + Math.sin(angle) * orbitY;
      if (step === 0) {
        graphics.moveTo(x, y);
      } else {
        graphics.lineTo(x, y);
      }
    }
    graphics.strokePath();
  };

  // Disco: muitos anéis finos; o lado que se aproxima (direita) é mais
  // brilhante (efeito Doppler) e o brilho oscila devagar ao longo do anel.
  const drawDisk = (front: boolean) => {
    const rings = 20;
    const sections = 8;
    for (let ring = 0; ring < rings; ring += 1) {
      const t = ring / (rings - 1);
      const orbit = radius * Phaser.Math.Linear(1.3, orbitalApproach ? 3.4 : 2.9, t);
      const color = t < 0.4 ? mixColor(hot, warm, t / 0.4) : mixColor(warm, cool, (t - 0.4) / 0.6);
      const fade = 1 - t * 0.6;
      for (let section = 0; section < sections; section += 1) {
        const base = front ? 0 : Math.PI;
        const from = base + (section / sections) * Math.PI;
        const to = base + ((section + 1) / sections) * Math.PI;
        const middle = (from + to) / 2;
        const doppler = 0.5 + 0.5 * Math.cos(middle - 0.2);
        const shimmer = 0.8 + 0.2 * Math.sin(middle * 2 + seconds * (1.4 - t) + ring);
        const alpha = (0.18 + doppler * 0.55) * fade * shimmer * (0.88 + pulse * 0.12);
        traceArc(orbit, orbit * flatten, from, to, color, Math.min(0.9, alpha), hairline * (1.1 + (1 - t) * 0.6));
      }
    }
  };

  drawDisk(false);

  // Luz do fundo do disco curvada por cima e por baixo do horizonte.
  for (let lens = 0; lens < 3; lens += 1) {
    const orbit = radius * (1.1 + lens * 0.1);
    const color = mixColor(hot, warm, lens / 2);
    traceArc(orbit * 1.02, orbit, Math.PI * 1.04, Math.PI * 1.96, color, (0.5 - lens * 0.13) * (0.85 + pulse * 0.15), hairline * 1.2);
    traceArc(orbit * 1.02, orbit, Math.PI * 0.12, Math.PI * 0.88, color, (0.22 - lens * 0.06) * (0.85 + pulse * 0.15), hairline);
  }

  // Sombra (horizonte de eventos) e anel de fótons fino.
  graphics.fillStyle(0x010208, 1);
  graphics.fillCircle(centerX, centerY, radius);
  graphics.lineStyle(hairline * 3, 0xffe2ad, 0.12);
  graphics.strokeCircle(centerX, centerY, radius * 1.06);
  graphics.lineStyle(hairline * 1.4, 0xfff2d0, 0.7 + pulse * 0.2);
  graphics.strokeCircle(centerX, centerY, radius * 1.035);

  drawDisk(true);

  // Faíscas de matéria no disco.
  for (let particle = 0; particle < 26; particle += 1) {
    const orbit = radius * (1.35 + (particle % 9) * 0.17);
    const angle = (particle / 26) * Math.PI * 2 + seconds * (0.9 - (particle % 9) * 0.07);
    const px = centerX + Math.cos(angle) * orbit;
    const py = centerY + Math.sin(angle) * orbit * flatten;
    if (Math.sin(angle) < 0 && Math.abs(px - centerX) < radius * 1.05) {
      continue;
    }
    graphics.fillStyle(particle % 4 === 0 ? hot : warm, 0.35 + pulse * 0.3);
    graphics.fillCircle(px, py, Math.max(0.9, radius * 0.008));
  }
}

function softenDistantColor(color: number, amount: number): number {
  const neutral = 0x8795aa;
  const sourceRed = (color >> 16) & 0xff;
  const sourceGreen = (color >> 8) & 0xff;
  const sourceBlue = color & 0xff;
  const neutralRed = (neutral >> 16) & 0xff;
  const neutralGreen = (neutral >> 8) & 0xff;
  const neutralBlue = neutral & 0xff;
  const red = Math.round(Phaser.Math.Linear(sourceRed, neutralRed, amount));
  const green = Math.round(Phaser.Math.Linear(sourceGreen, neutralGreen, amount));
  const blue = Math.round(Phaser.Math.Linear(sourceBlue, neutralBlue, amount));

  return (red << 16) | (green << 8) | blue;
}

function drawHorizonAndPerspectiveGrid(
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  horizonY: number,
  projectionExponent: number,
  color: number,
): void {
  const vanishingX = width * 0.5;
  const vanishingY = -height * 0.12;

  graphics.lineStyle(1, color, 0.055);
  graphics.lineBetween(0, horizonY, width, horizonY);

  const rayCount = 15;
  const halfWidthAtBottom = width * 0.72;
  const horizonProgress =
    (horizonY - vanishingY) / (height - vanishingY);
  const horizonHalfWidth = halfWidthAtBottom * horizonProgress;
  for (let index = 0; index <= rayCount; index += 1) {
    const lane = index / rayCount;
    const bottomX = vanishingX - halfWidthAtBottom + 2 * halfWidthAtBottom * lane;
    const horizonX = vanishingX - horizonHalfWidth + 2 * horizonHalfWidth * lane;
    graphics.lineStyle(1, color, index % 3 === 0 ? 0.09 : 0.06);
    graphics.lineBetween(horizonX, horizonY, bottomX, height);
  }

  const rowCount = 12;
  const firstDepth = ((horizonY - vanishingY) / (height - vanishingY)) **
    (1 / projectionExponent);
  for (let index = 1; index <= rowCount; index += 1) {
    const depth = firstDepth + (1 - firstDepth) * (index / rowCount);
    const projectedDepth = depth ** projectionExponent;
    const y = vanishingY + (height - vanishingY) * projectedDepth;
    const rowHalfWidth = halfWidthAtBottom * projectedDepth;
    graphics.lineStyle(1, color, 0.035 + projectedDepth * 0.065);
    graphics.lineBetween(
      vanishingX - rowHalfWidth,
      y,
      vanishingX + rowHalfWidth,
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
