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

/** Ajustes de legibilidade: reduza para um cenário mais limpo, aumente para mais brilho. */
const DISK_INNER = 1.28; // raio interno do disco (em raios do buraco negro)
const DISK_SPAN = 1.1; // largura do disco; o alcance é INNER + SPAN (antes 3,58)
const OUTER_ALPHA = 0.15; // brilho das órbitas mais externas (a interna é 1)
const WHITE_CHANCE = 0.08; // fração de traços em branco puro
const MAX_LINE_PX = 2.2; // espessura máxima dos traços
const CALM_START = 0.45; // a partir desta altura da tela (0-1) o disco escurece
const CALM_RANGE = 0.3; // e atinge o máximo após esta distância
const LENS_RINGS = 16; // arcos que abraçam a sombra: muitos e juntos, como um halo
const LENS_INNER = 1.05; // raio do primeiro arco (em raios do buraco negro)
const LENS_SPAN = 0.24; // largura do halo (antes 0,5, com só 9 arcos)
const CALM_STRENGTH = 0.65; // quanto escurece sob a nave (0 = nada)

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
    const dashes = Math.max(
      1,
      Math.round(
        (2 + Math.floor(random() * 4) + Math.round((1 - t) * 3)) * (1 - t * 0.5),
      ),
    );
    for (let dash = 0; dash < dashes; dash += 1) {
      list.push({
        orbit: t + (random() - 0.5) * 0.015,
        start: random() * Math.PI * 2,
        span: (0.25 + random() * 1.4) * (1 - t * 0.45),
        width: 0.6 + random() * 0.8,
        drift: 0.5 + random() * 0.5,
        color: random() < WHITE_CHANCE
          ? 0xffffff
          : PALETTE[Math.min(PALETTE.length - 1, Math.floor(t * 3.6 + random() * 1.4))],
        lens: false,
      });
    }
  }
  // Traços curvos rente à sombra, por cima e por baixo (luz do fundo do disco).
  for (let ring = 0; ring < LENS_RINGS; ring += 1) {
    const t = ring / (LENS_RINGS - 1);
    for (let dash = 0; dash < 5; dash += 1) {
      list.push({
        orbit: t,
        start: Math.PI * (1.0 + random() * 0.8),
        span: 0.45 + random() * 1.0,
        width: 0.5 + random() * 0.6,
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
  screenHeight = cy * 2,
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
        rx = radius * (LENS_INNER + streak.orbit * LENS_SPAN);
        ry = rx * (0.92 + streak.orbit * 0.05);
        angle0 = streak.start + seconds * streak.drift * 0.15;
      } else {
        rx = radius * (DISK_INNER + streak.orbit * DISK_SPAN);
        ry = rx * FLATTEN;
        // Gira mais rápido por dentro (lei de Kepler simplificada).
        angle0 = streak.start + seconds * streak.drift * (1.1 / (1 + streak.orbit * 3.2));
      }
      const steps = Math.max(4, Math.ceil(streak.span / 0.07));
      // Esmaece com a distância e escurece na zona onde a nave joga.
      const midAngle = angle0 + streak.span / 2;
      const midY = lens
        ? cy + Math.sin(midAngle) * ry
        : place(rx, ry, midAngle).y;
      const calm = Phaser.Math.Clamp(
        (midY / screenHeight - CALM_START) / CALM_RANGE,
        0,
        1,
      );
      const alpha =
        Phaser.Math.Linear(1, OUTER_ALPHA, streak.orbit ** 0.8) *
        (1 - CALM_STRENGTH * calm * Math.min(1, 0.3 + streak.orbit));
      graphics.lineStyle(
        Math.min(MAX_LINE_PX, hairline * streak.width),
        streak.color,
        alpha,
      );
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
