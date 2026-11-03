import Phaser from "phaser";

/** Buraco negro da fase 7: disco feito de traços finos em órbita. */
export type BlackHoleVariant = "fluxo";

type Graphics = Phaser.GameObjects.Graphics;

type Streak = {
  /** 0 = órbita mais interna, 1 = mais externa. */
  orbit: number;
  start: number;
  span: number;
  width: number;
  /** Fator de velocidade angular (sinal já embutido na física: dentro gira mais rápido). */
  drift: number;
  color: number;
  /** Traço que contorna a sombra por cima (lente) em vez de seguir o disco. */
  lens: boolean;
};

const PALETTE = [0xffffff, 0xfff4d6, 0xffe6ae, 0xf8cf86, 0xe6ae68, 0xc08650];
const CREAM = 0xfff4d6;
const SHADOW = 0x010208;
const TILT = 0.12;
const FLATTEN = 0.34;

let streaks: Streak[] | undefined;

function buildStreaks(): Streak[] {
  let state = 4242;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  const list: Streak[] = [];

  for (let orbit = 0; orbit < 54; orbit += 1) {
    const t = orbit / 53;
    // Mais traços e mais longos perto do buraco.
    const dashes = 2 + Math.floor(random() * 4) + Math.round((1 - t) * 3);
    for (let dash = 0; dash < dashes; dash += 1) {
      list.push({
        orbit: t + (random() - 0.5) * 0.015,
        start: random() * Math.PI * 2,
        span: (0.25 + random() * 1.4) * (1 - t * 0.45),
        width: 0.7 + random() * 1.5,
        drift: 0.5 + random() * 0.5,
        // Cerca de 1 em cada 4 traços é branco puro.
        color: random() < 0.25
          ? 0xffffff
          : PALETTE[Math.min(PALETTE.length - 1, Math.floor(t * 3.6 + random() * 1.4))],
        lens: false,
      });
    }
  }
  // Traços curvos rente à sombra, por cima e por baixo (luz do fundo do disco).
  for (let ring = 0; ring < 9; ring += 1) {
    const t = ring / 8;
    for (let dash = 0; dash < 4; dash += 1) {
      list.push({
        orbit: t,
        start: Math.PI * (1.05 + random() * 0.6),
        span: 0.5 + random() * 1.1,
        width: 0.8 + random() * 1.4,
        drift: 0.3 + random() * 0.3,
        color: PALETTE[Math.min(3, Math.floor(t * 3.5))],
        lens: true,
      });
    }
  }
  return list;
}

export function drawBlackHoleVariant(
  graphics: Graphics,
  _variant: BlackHoleVariant,
  cx: number,
  cy: number,
  radius: number,
  time: number,
): void {
  streaks ??= buildStreaks();
  const seconds = time / 1000;
  const hairline = Math.max(1, radius * 0.0045);
  const cosTilt = Math.cos(TILT);
  const sinTilt = Math.sin(TILT);

  // Ponto da órbita (com inclinação do disco). `front` = lado voltado a nós.
  const place = (rx: number, ry: number, angle: number) => {
    const px = Math.cos(angle) * rx;
    const py = Math.sin(angle) * ry;
    return {
      x: cx + px * cosTilt - py * sinTilt,
      y: cy + px * sinTilt + py * cosTilt,
      front: Math.sin(angle) >= 0,
    };
  };

  const drawStreaks = (front: boolean, lens: boolean) => {
    for (const streak of streaks!) {
      if (streak.lens !== lens) {
        continue;
      }
      let rx: number;
      let ry: number;
      let angle0: number;
      if (lens) {
        // Arco quase circular que abraça a sombra.
        rx = radius * (1.07 + streak.orbit * 0.5);
        ry = rx * (0.92 + streak.orbit * 0.05);
        angle0 = streak.start + seconds * streak.drift * 0.15;
      } else {
        rx = radius * (1.28 + streak.orbit * 2.3);
        ry = rx * FLATTEN;
        // Gira mais rápido por dentro (lei de Kepler simplificada).
        angle0 = streak.start + seconds * streak.drift * (1.1 / (1 + streak.orbit * 3.2));
      }
      const steps = Math.max(4, Math.ceil(streak.span / 0.07));
      graphics.lineStyle(hairline * streak.width, streak.color, 1);
      let drawing = false;
      for (let step = 0; step <= steps; step += 1) {
        const angle = angle0 + (streak.span * step) / steps;
        const point = lens
          ? {
              x: cx + Math.cos(angle) * rx,
              y: cy + Math.sin(angle) * ry,
              // Lente: só a calota de cima fica atrás/ao redor; usa o sinal de y.
              front: Math.sin(angle) >= 0,
            }
          : place(rx, ry, angle);
        // Traços de lente nunca entram na sombra: ficam fora do raio.
        if (point.front !== front) {
          if (drawing) {
            graphics.strokePath();
            drawing = false;
          }
          continue;
        }
        if (!drawing) {
          graphics.beginPath();
          graphics.moveTo(point.x, point.y);
          drawing = true;
        } else {
          graphics.lineTo(point.x, point.y);
        }
      }
      if (drawing) {
        graphics.strokePath();
      }
    }
  };

  drawStreaks(false, false); // fundo do disco
  drawStreaks(false, true); // luz curvada por cima
  drawStreaks(true, true); // luz curvada por baixo

  graphics.fillStyle(SHADOW, 1);
  graphics.fillCircle(cx, cy, radius);
  graphics.lineStyle(Math.max(2, radius * 0.01), CREAM, 1);
  graphics.strokeCircle(cx, cy, radius * 1.03);

  drawStreaks(true, false); // frente do disco, por cima da sombra
}
