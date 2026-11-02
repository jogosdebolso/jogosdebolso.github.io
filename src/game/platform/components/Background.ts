import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { LevelConfig } from "../levelConfig";
import { createRandom } from "../random";

/** Multiplica cada canal da cor (com teto em 255): usado para tingir a textura de terra. */
function lighten(color: number, factor: number): number {
  const channel = (shift: number): number => Math.min(255, Math.round(((color >> shift) & 0xff) * factor));
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}

/** Céu, sol, nuvens, colinas em paralaxe, árvores distantes, fundo dos buracos e névoa. */
export class Background {
  private readonly sky: Phaser.GameObjects.Graphics;
  private readonly sun: Phaser.GameObjects.Image;
  private readonly haze: Phaser.GameObjects.Rectangle;
  private readonly clouds: Array<{ image: Phaser.GameObjects.Image; speed: number }> = [];
  private readonly worldWidth: number;

  constructor(
    scene: Phaser.Scene,
    private readonly level: LevelConfig,
  ) {
    const { world, background } = level;
    this.worldWidth = world.width;
    this.sky = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.SKY);
    this.sun = scene.add
      .image(0, 0, "sun")
      .setScrollFactor(0).setTint(background.sunTint)
      .setDepth(DEPTH.SUN)
      .setVisible(background.sun !== false);

    const rng = createRandom(background.clouds.seed);
    for (let index = 0; index < background.clouds.count; index += 1) {
      const factor = 0.12 + rng() * 0.2;
      const image = scene.add
        .image(rng() * 2400, 40 + rng() * 210, "cloud")
        .setScrollFactor(factor, 1)
        .setScale(0.6 + rng() * 0.8)
        .setAlpha(0.75 + rng() * 0.25)
        .setTint(background.cloudTint)
        .setDepth(DEPTH.CLOUDS);
      this.clouds.push({ image, speed: 6 + rng() * 10 });
    }

    const layers: ReadonlyArray<{ key: string; factor: number; depth: number }> = [
      { key: `hills-far-${level.id}`, factor: 0.2, depth: DEPTH.HILLS_FAR },
      { key: `hills-mid-${level.id}`, factor: 0.4, depth: DEPTH.HILLS_MID },
      { key: `hills-near-${level.id}`, factor: 0.6, depth: DEPTH.HILLS_NEAR },
    ];
    layers.forEach(({ key, factor, depth }) => {
      scene.add
        .tileSprite(-600, world.groundY, world.width + 2400, 512, key)
        .setOrigin(0, 1)
        .setScrollFactor(factor, 1)
        .setDepth(depth);
    });

    // Árvores distantes em tom esmaecido, para dar profundidade.
    const farRng = createRandom(background.farTrees.seed);
    for (let x = -200; x < world.width * 0.6 + 1500; x += 90 + farRng() * 110) {
      scene.add
        .image(x, world.groundY - 4, background.farTrees.texture ?? "tree")
        .setOrigin(0.5, 1)
        .setScale((0.38 + farRng() * 0.22) * (background.farTrees.texture === "stalagmite" ? 2 : 1))
        .setTint(background.farTreeTint)
        .setScrollFactor(0.6, 1)
        .setDepth(DEPTH.FAR_TREES);
    }

    // Parede dos buracos: terra texturizada e escurecida (a cor do buraco define o tom),
    // que escurece ainda mais com a profundidade.
    scene.add
      .tileSprite(0, world.groundY, world.width, world.deepY - world.groundY, "dirt")
      .setOrigin(0)
      .setTint(lighten(background.pitColor, 2.4))
      .setDepth(DEPTH.PIT);
    const pitShade = scene.add.graphics().setDepth(DEPTH.PIT + 0.01);
    pitShade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.1, 0.1, 0.75, 0.75);
    pitShade.fillRect(0, world.groundY, world.width, 360);
    pitShade.fillStyle(0x000000, 0.75);
    pitShade.fillRect(0, world.groundY + 360, world.width, world.deepY - world.groundY - 360);

    // Névoa leve sobre tudo que fica atrás da camada do jogador: suaviza o fundo e
    // destaca o personagem e o chão.
    this.haze = scene.add
      .rectangle(0, 0, 10, 10, background.hazeColor, background.hazeAlpha)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.HAZE);
  }

  update(delta: number): void {
    const span = this.worldWidth + 800;
    this.clouds.forEach(({ image, speed }) => {
      image.x += (speed * delta) / 1000;
      if (image.x - image.displayWidth / 2 > span) {
        image.x = -image.displayWidth;
      }
    });
  }

  layout(width: number, height: number): void {
    const { skyTop, skyBottom } = this.level.background;
    this.sky.clear();
    this.sky.fillGradientStyle(skyTop, skyTop, skyBottom, skyBottom, 1);
    this.sky.fillRect(0, 0, width, height);
    this.sun.setPosition(width * 0.8, 120);
    this.haze.setSize(width, height);
  }
}
