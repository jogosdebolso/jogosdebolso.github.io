import Phaser from "phaser";

type MovingStar = {
  progress: number;
  speed: number;
  size: number;
  startX: number;
  /** 1 desce (como a grade), -1 sobe (espelhado no céu). */
  vertical: number;
  hasTail: boolean;
  color: number;
};

export class MovingStarfield {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly stars: MovingStar[];
  private readonly random: () => number;

  /**
   * `sidesOnly`: as estrelas nascem perto das bordas laterais (fase 6, ao redor
   * do buraco negro) e passam rente às laterais da tela.
   */
  constructor(
    scene: Phaser.Scene,
    count = 130,
    private readonly sidesOnly = false,
  ) {
    this.graphics = scene.add.graphics().setDepth(-8);
    this.random = createRandom(73021);
    this.stars = Array.from({ length: count }, () => this.createStar());
  }

  update(delta: number, width: number, height: number, horizonY: number): void {
    this.graphics.clear();
    const elapsed = Math.min(delta, 50) / 1000;

    // Cada estrela nasce em um ponto aleatório da linha do horizonte e se
    // afasta do centro (ponto de fuga), para cima ou para baixo, como se a
    // nave avançasse e as deixasse para trás.
    // Mesmo ponto de fuga distante da grade desenhada em SpaceBackground.
    const vanishingDepth = horizonY + height * 0.12;
    const maxDistance = height;
    const centerX = width / 2;

    for (const star of this.stars) {
      star.progress += star.speed * elapsed;
      if (star.progress >= 1) {
        Object.assign(star, this.createStar(0));
      }

      const progress = star.progress;
      const projected = progress ** 2.2;
      const distance = projected * maxDistance;
      const startPx = star.startX * width;
      // Nas laterais (fase 6) abrem menos, para ficarem mais tempo na tela.
      const slopePx = ((startPx - centerX) / vanishingDepth) * (this.sidesOnly ? 0.3 : 1);
      const x = startPx + slopePx * distance;
      const y = horizonY + star.vertical * distance;
      // Nas laterais (fase 6) as estrelas são maiores e mais visíveis desde o início.
      const size = star.size * (0.3 + projected * 1.1) * (this.sidesOnly ? 1.25 : 1);
      const alpha = Math.min(1, (this.sidesOnly ? 0.3 : 0.15) + projected * 1.1);

      if (star.hasTail && progress > 0.08) {
        const tailDistance = (Math.max(0, progress - 0.03) ** 2.2) * maxDistance;
        this.graphics.lineStyle(
          Math.max(0.7, size * 0.72),
          star.color,
          alpha * 0.55,
        );
        this.graphics.lineBetween(
          startPx + slopePx * tailDistance,
          horizonY + star.vertical * tailDistance,
          x,
          y,
        );
      }

      this.graphics.fillStyle(star.color, alpha);
      this.graphics.fillCircle(x, y, size);
    }
  }

  private createStar(progress = this.random()): MovingStar {
    const edge = 0.015 + this.random() * 0.2;
    const startX = this.sidesOnly
      ? this.random() < 0.5
        ? edge
        : 1 - edge
      : this.random();
    const vertical = this.random() < 0.5 ? -1 : 1;
    const colors = [0xffffff, 0xc7ddff, 0x9be8ff];

    return {
      progress,
      speed: 0.05 + this.random() ** 2 * 0.4,
      size: 0.65 + this.random() * 0.95,
      startX,
      vertical,
      hasTail: this.random() < 0.12,
      color: colors[Math.floor(this.random() * colors.length)],
    };
  }
}

function createRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
