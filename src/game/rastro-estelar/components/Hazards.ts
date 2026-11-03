import Phaser from "phaser";

/**
 * Tempestade iônica (fase 2): colunas elétricas que primeiro aparecem como
 * um aviso pulsante (1,6 s) e só depois "caem" (0,6 s). Fácil de antecipar:
 * basta sair da coluna avisada.
 */
export class IonStorm {
  private static readonly WARN_MS = 1600;
  private static readonly STRIKE_MS = 600;
  private static readonly FADE_MS = 300;
  private static readonly HALF_WIDTH = 34;

  private readonly graphics: Phaser.GameObjects.Graphics;
  private bolts: Array<{ x: number; age: number; seed: number }> = [];
  private elapsed = 0;
  intervalMs = 0;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(1.5);
  }

  update(delta: number, width: number, height: number, playerX: number): void {
    this.graphics.clear();
    if (this.intervalMs > 0) {
      this.elapsed += delta;
      if (this.elapsed >= this.intervalMs && this.bolts.length < 2) {
        this.elapsed = 0;
        // Metade dos raios cai perto do jogador, para obrigar a se mover.
        const nearPlayer = Math.random() < 0.55;
        const x = nearPlayer
          ? Phaser.Math.Clamp(playerX + (Math.random() - 0.5) * 320, 40, width - 40)
          : 40 + Math.random() * (width - 80);
        this.bolts.push({ x, age: 0, seed: Math.random() * 1000 });
      }
    }

    const total = IonStorm.WARN_MS + IonStorm.STRIKE_MS + IonStorm.FADE_MS;
    this.bolts = this.bolts.filter((bolt) => {
      bolt.age += delta;
      return bolt.age < total;
    });

    for (const bolt of this.bolts) {
      const half = IonStorm.HALF_WIDTH;
      if (bolt.age < IonStorm.WARN_MS) {
        // Aviso: coluna fraca + linha tracejada pulsando cada vez mais rápido.
        const t = bolt.age / IonStorm.WARN_MS;
        const pulse = 0.5 + 0.5 * Math.sin(bolt.age * (0.008 + t * 0.02));
        this.graphics.fillStyle(0xa78bfa, 0.05 + 0.07 * t);
        this.graphics.fillRect(bolt.x - half, 0, half * 2, height);
        this.graphics.lineStyle(2, 0xddd6fe, 0.25 + 0.4 * pulse);
        for (let y = 0; y < height; y += 28) {
          this.graphics.lineBetween(bolt.x, y, bolt.x, y + 14);
        }
        this.graphics.fillStyle(0xf5f3ff, 0.5 + 0.4 * pulse);
        this.graphics.fillCircle(bolt.x, 6, 5 + 3 * t);
      } else if (bolt.age < IonStorm.WARN_MS + IonStorm.STRIKE_MS) {
        this.drawStrike(bolt.x, height, bolt.seed + Math.floor(bolt.age / 60), 1);
      } else {
        const fade =
          1 -
          (bolt.age - IonStorm.WARN_MS - IonStorm.STRIKE_MS) / IonStorm.FADE_MS;
        this.drawStrike(bolt.x, height, bolt.seed, Math.max(0, fade) * 0.6);
      }
    }
  }

  private drawStrike(x: number, height: number, seed: number, strength: number): void {
    const half = IonStorm.HALF_WIDTH;
    this.graphics.fillStyle(0x8b5cf6, 0.28 * strength);
    this.graphics.fillRect(x - half, 0, half * 2, height);
    this.graphics.fillStyle(0xc4b5fd, 0.22 * strength);
    this.graphics.fillRect(x - half * 0.45, 0, half * 0.9, height);

    // Raio em zigue-zague (determinístico por "seed" para tremer sem caos).
    const points: Array<{ x: number; y: number }> = [];
    for (let y = 0; y <= height; y += 36) {
      const jitter = Math.sin(seed * 12.9898 + y * 0.37) * 16;
      points.push({ x: x + (y === 0 ? 0 : jitter), y });
    }
    for (const [width, color, alpha] of [
      [9, 0x8b5cf6, 0.5],
      [4, 0xddd6fe, 0.9],
      [1.8, 0xffffff, 1],
    ] as const) {
      this.graphics.lineStyle(width, color, alpha * strength);
      this.graphics.beginPath();
      points.forEach((point, index) =>
        index === 0
          ? this.graphics.moveTo(point.x, point.y)
          : this.graphics.lineTo(point.x, point.y),
      );
      this.graphics.strokePath();
    }
  }

  /** Há um raio ativo (fase de impacto) sobre a posição do jogador? */
  hits(playerX: number, playerHalfWidth: number): boolean {
    return this.bolts.some(
      (bolt) =>
        bolt.age >= IonStorm.WARN_MS &&
        bolt.age < IonStorm.WARN_MS + IonStorm.STRIKE_MS &&
        Math.abs(bolt.x - playerX) < IonStorm.HALF_WIDTH * 0.8 + playerHalfWidth * 0.45,
    );
  }
}

/**
 * Ondas de plasma (fase 4): anéis lentos que saem do sol e se expandem.
 * Cada anel tem uma abertura larga, por onde dá para passar sem dano.
 */
export class PlasmaWaves {
  private static readonly START = Math.PI * 0.12;
  private static readonly END = Math.PI * 1.15;
  private static readonly GAP_HALF = Math.PI * 0.16;

  private readonly graphics: Phaser.GameObjects.Graphics;
  private waves: Array<{
    radius: number;
    gapCenter: number;
    puffs: Array<{
      angle: number;
      offset: number;
      size: number;
      phase: number;
      speed: number;
      taper: number;
    }>;
  }> = [];
  private elapsed = 0;
  private clock = 0;
  intervalMs = 0;

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setDepth(0.6);
  }

  /** Massa de plasma: muitas bolhas sobrepostas, com bordas irregulares. */
  private createPuffs(gapCenter: number) {
    const puffs: (typeof this.waves)[number]["puffs"] = [];
    while (puffs.length < 90) {
      const angle = Phaser.Math.Linear(
        PlasmaWaves.START,
        PlasmaWaves.END,
        Math.random(),
      );
      const gapDistance = Math.abs(angle - gapCenter) - PlasmaWaves.GAP_HALF;
      if (gapDistance < 0) {
        continue;
      }
      puffs.push({
        angle,
        offset: (Math.random() + Math.random() - 1) * 1.1,
        size: 0.6 + Math.random() * 0.9,
        phase: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 2.4,
        // Afina perto da abertura e nas pontas do arco.
        taper: Phaser.Math.Clamp(gapDistance / 0.22, 0.35, 1),
      });
    }
    return puffs;
  }

  update(
    delta: number,
    width: number,
    height: number,
    sunX: number,
    sunY: number,
    sunRadius: number,
  ): void {
    this.graphics.clear();
    this.clock += delta / 1000;
    if (this.intervalMs > 0) {
      this.elapsed += delta;
      if (this.elapsed >= this.intervalMs) {
        this.elapsed = 0;
        const gapCenter = Phaser.Math.Linear(
          Math.PI * 0.4,
          Math.PI * 0.95,
          Math.random(),
        );
        this.waves.push({
          radius: sunRadius,
          gapCenter,
          puffs: this.createPuffs(gapCenter),
        });
      }
    }

    // Lento: ~11% da altura da tela por segundo.
    const speed = height * 0.11;
    const limit = Math.hypot(width, height) * 1.2;
    this.waves = this.waves.filter((wave) => {
      wave.radius += speed * (delta / 1000);
      return wave.radius < limit;
    });

    const unit = Math.max(18, height * 0.034);
    for (const wave of this.waves) {
      // Três passadas para manter as camadas ordenadas: névoa, plasma e núcleo.
      for (const layer of [0, 1, 2] as const) {
        for (const puff of wave.puffs) {
          const flicker = 0.75 + 0.25 * Math.sin(this.clock * puff.speed + puff.phase);
          const wobble =
            Math.sin(this.clock * puff.speed * 0.7 + puff.phase * 1.7) * unit * 0.45;
          const swirl = Math.sin(this.clock * 0.9 + puff.phase) * 0.012;
          const angle = puff.angle + swirl;
          const radial = wave.radius + puff.offset * unit * 0.9 + wobble;
          const x = sunX + Math.cos(angle) * radial;
          const y = sunY + Math.sin(angle) * radial;
          const size = unit * puff.size * puff.taper * flicker;
          // Quanto mais à frente (offset > 0), mais quente.
          const heat = Phaser.Math.Clamp(0.5 + puff.offset * 0.5, 0, 1);

          if (layer === 0) {
            // Névoa externa: três discos largos e quase transparentes.
            for (const [scale, alpha] of [[2.8, 0.025], [2.2, 0.03], [1.7, 0.035]] as const) {
              this.graphics.fillStyle(0xa8300f, alpha * puff.taper);
              this.graphics.fillCircle(x, y, size * scale);
            }
          } else if (layer === 1) {
            // Corpo do plasma: laranja, em duas camadas.
            const color = heat > 0.55 ? 0xff8a2a : 0xe8541a;
            this.graphics.fillStyle(color, 0.05);
            this.graphics.fillCircle(x, y, size * 1.5);
            this.graphics.fillStyle(color, 0.07);
            this.graphics.fillCircle(x, y, size * 1.05);
          } else if (heat > 0.35) {
            // Núcleo quente, só na frente da massa.
            const hot = heat > 0.75 ? 0xfff0b0 : 0xffc65a;
            this.graphics.fillStyle(hot, 0.06 * flicker);
            this.graphics.fillCircle(x, y, size * 0.9);
            this.graphics.fillStyle(hot, 0.09 * flicker);
            this.graphics.fillCircle(x, y, size * 0.5);
          }
        }
      }
    }
  }

  hits(
    playerX: number,
    playerY: number,
    playerHalfWidth: number,
    sunX: number,
    sunY: number,
  ): boolean {
    const distance = Math.hypot(playerX - sunX, playerY - sunY);
    let angle = Math.atan2(playerY - sunY, playerX - sunX);
    if (angle < 0) {
      angle += Math.PI * 2;
    }
    if (angle < PlasmaWaves.START || angle > PlasmaWaves.END) {
      return false;
    }
    return this.waves.some(
      (wave) =>
        Math.abs(distance - wave.radius) < 16 + playerHalfWidth * 0.4 &&
        Math.abs(angle - wave.gapCenter) > PlasmaWaves.GAP_HALF,
    );
  }
}
