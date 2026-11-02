import Phaser from "phaser";

type FallingStar = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: number;
};

type BlackHole = { x: number; y: number; radius: number };

/**
 * Fase 7: estrelas em trajetórias quase aleatórias que a gravidade do buraco
 * negro desvia, estica na direção da queda e engole.
 */
export class GravityStarfield {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly stars: FallingStar[] = [];
  private readonly random: () => number = Math.random;

  constructor(
    scene: Phaser.Scene,
    private readonly count = 40,
  ) {
    this.graphics = scene.add.graphics().setDepth(-8);
  }

  update(
    delta: number,
    width: number,
    height: number,
    hole: BlackHole,
  ): void {
    const elapsed = Math.min(delta, 50) / 1000;
    this.graphics.clear();

    while (this.stars.length < this.count) {
      // As primeiras já nascem espalhadas pela metade de cima da tela.
      this.stars.push(this.createStar(width, height, hole, true));
    }

    const gravity = 330; // aceleração (px/s²) na borda do buraco negro
    this.stars.forEach((star, index) => {
      const dx = hole.x - star.x;
      const dy = hole.y - star.y;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const pull = gravity * (hole.radius / Math.max(distance, hole.radius * 0.6)) ** 2;
      star.vx += (dx / distance) * pull * elapsed;
      star.vy += (dy / distance) * pull * elapsed;
      star.x += star.vx * elapsed;
      star.y += star.vy * elapsed;

      const swallowed = distance < hole.radius * 0.82;
      const lost =
        star.x < -width * 0.3 ||
        star.x > width * 1.3 ||
        star.y < -height * 0.3 ||
        star.y > height * 1.3;
      if (swallowed || lost) {
        this.stars[index] = this.createStar(width, height, hole);
        return;
      }

      // Perto do horizonte de eventos a estrela estica e some.
      const closeness = Phaser.Math.Clamp(
        1 - (distance - hole.radius * 0.82) / (hole.radius * 1.6),
        0,
        1,
      );
      const speed = Math.hypot(star.vx, star.vy);
      const stretch = Math.min(220, speed * (0.03 + closeness * 0.22));
      const alpha = 0.75 * (1 - closeness ** 3);
      const size = star.size * (1 - closeness * 0.5);
      const hex = star.color;

      if (stretch > 2) {
        const tx = star.x - (star.vx / speed) * stretch;
        const ty = star.y - (star.vy / speed) * stretch;
        this.graphics.lineStyle(Math.max(0.7, size * 0.8), hex, alpha * 0.55);
        this.graphics.lineBetween(tx, ty, star.x, star.y);
      }
      this.graphics.fillStyle(hex, alpha);
      this.graphics.fillCircle(star.x, star.y, size);
    });
  }

  private createStar(
    width: number,
    height: number,
    hole: BlackHole,
    scattered = false,
  ): FallingStar {
    const colors = [0xffffff, 0xc7ddff, 0x9be8ff, 0xffd9b0];
    let x = 0;
    let y = 0;
    do {
      // Nascem no alto da tela (ou espalhadas pela parte de cima, no início).
      x = width * (0.2 + this.random() * 0.85);
      y = scattered ? this.random() * height * 0.55 : -8;
    } while (Math.hypot(x - hole.x, y - hole.y) < hole.radius * 1.1);

    // Seguem para o canto inferior direito; a gravidade as desvia depois.
    const angle = Math.PI * (0.18 + this.random() * 0.12);
    const speed = 55 + this.random() * 55;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 0.7 + this.random() * 1.1,
      color: colors[Math.floor(this.random() * colors.length)],
    };
  }
}
