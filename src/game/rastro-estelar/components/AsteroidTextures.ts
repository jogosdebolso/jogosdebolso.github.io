import Phaser from "phaser";
import { RASTRO_TEXTURE_KEYS } from "../constants";

export const ASTEROID_VARIANT_COUNT = 4;

type AsteroidDesign = {
  seed: number;
  lobes: number;
  stretch: number;
  rough: number;
  craters: number;
  light: string;
  mid: string;
  dark: string;
  speck: string;
  vein?: string;
};

const DESIGNS: AsteroidDesign[] = [
  // Rocha cinzenta clássica, cheia de crateras.
  { seed: 11, lobes: 17, stretch: 1.04, rough: 0.2, craters: 5,
    light: "#b4bccb", mid: "#737d91", dark: "#2d3445", speck: "#e3e8f0" },
  // Rocha ferrugem, alongada, com veios de minério.
  { seed: 29, lobes: 15, stretch: 1.22, rough: 0.16, craters: 3,
    light: "#d09a74", mid: "#8a5a44", dark: "#3a2220", speck: "#f3c9a4",
    vein: "#f0b36a" },
  // Gelo azulado, facetado, com brilho.
  { seed: 47, lobes: 11, stretch: 0.96, rough: 0.12, craters: 2,
    light: "#e1f5ff", mid: "#8cb5d3", dark: "#32506e", speck: "#ffffff",
    vein: "#bfe6ff" },
  // Carbono escuro, irregular, com poucos brilhos metálicos.
  { seed: 83, lobes: 19, stretch: 1.12, rough: 0.27, craters: 4,
    light: "#7d8190", mid: "#454a58", dark: "#14161f", speck: "#a8b0c4",
    vein: "#8fa0c0" },
];

export function createAsteroidTextures(scene: Phaser.Scene): void {
  DESIGNS.forEach((design, index) => {
    const key = `${RASTRO_TEXTURE_KEYS.asteroid}-${index}`;
    if (scene.textures.exists(key)) {
      return;
    }
    const texture = scene.textures.createCanvas(key, 96, 96);
    if (!texture) {
      return;
    }
    drawAsteroid(texture.getContext(), design);
    texture.refresh();
  });
}

function drawAsteroid(ctx: CanvasRenderingContext2D, design: AsteroidDesign): void {
  const random = seeded(design.seed);
  const cx = 48;
  const cy = 48;
  ctx.clearRect(0, 0, 96, 96);

  const outline: Array<[number, number]> = [];
  for (let step = 0; step < design.lobes; step += 1) {
    const angle = (step / design.lobes) * Math.PI * 2 + random() * 0.1;
    const radius = 38 * (1 - design.rough + random() * design.rough * 1.6);
    outline.push([
      cx + Math.cos(angle) * radius * design.stretch,
      cy + Math.sin(angle) * radius / design.stretch,
    ]);
  }
  const shape = (dx = 0, dy = 0) => {
    ctx.beginPath();
    const last = outline[outline.length - 1];
    ctx.moveTo((last[0] + outline[0][0]) / 2 + dx, (last[1] + outline[0][1]) / 2 + dy);
    for (let index = 0; index < outline.length; index += 1) {
      const point = outline[index];
      const next = outline[(index + 1) % outline.length];
      ctx.quadraticCurveTo(
        point[0] + dx, point[1] + dy,
        (point[0] + next[0]) / 2 + dx, (point[1] + next[1]) / 2 + dy,
      );
    }
    ctx.closePath();
  };

  // Base sólida.
  ctx.fillStyle = design.mid;
  shape();
  ctx.fill();

  ctx.save();
  shape();
  ctx.clip();

  // Sombra em bloco (lado oposto à luz): a própria silhueta deslocada.
  ctx.fillStyle = design.dark;
  ctx.beginPath();
  ctx.rect(0, 0, 96, 96);
  shape(-8, -8);
  ctx.fill("evenodd");

  // Luz em bloco (canto superior esquerdo).
  ctx.fillStyle = design.light;
  ctx.beginPath();
  ctx.rect(0, 0, 96, 96);
  shape(4, 4);
  ctx.fill("evenodd");
  // Só a faixa clara dentro da silhueta; o resto já está recortado.

  // Veios / fraturas.
  if (design.vein) {
    ctx.strokeStyle = design.vein;
    ctx.lineCap = "round";
    ctx.lineWidth = 1.4;
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      let x = 14 + random() * 20;
      let y = 14 + random() * 68;
      ctx.moveTo(x, y);
      for (let seg = 0; seg < 4; seg += 1) {
        x += 10 + random() * 8;
        y += (random() - 0.5) * 16;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }

  // Crateras flat: disco escuro com meia-lua clara embaixo à direita.
  for (let index = 0; index < design.craters; index += 1) {
    const radius = 4 + random() * (index === 0 ? 10 : 6);
    const x = cx + (random() - 0.5) * 50;
    const y = cy + (random() - 0.5) * 50;
    ctx.fillStyle = design.dark;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = design.mid;
    ctx.beginPath();
    ctx.arc(x + radius * 0.22, y + radius * 0.22, radius * 0.78, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = design.light;
    ctx.beginPath();
    ctx.arc(x, y, radius, Math.PI * 0.05, Math.PI * 0.6);
    ctx.arc(x + radius * 0.22, y + radius * 0.22, radius * 0.78, Math.PI * 0.6, Math.PI * 0.05, true);
    ctx.fill();
  }

  // Pontos sólidos.
  for (let index = 0; index < 14; index += 1) {
    ctx.fillStyle = random() > 0.5 ? design.speck : design.dark;
    ctx.beginPath();
    ctx.arc(10 + random() * 76, 10 + random() * 76, 0.9 + random() * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Contorno escuro.
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#0b0e1a";
  shape();
  ctx.stroke();
}

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
