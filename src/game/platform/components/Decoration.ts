import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { LevelConfig, PlatformSpec } from "../levelConfig";
import { createRandom } from "../random";

/** Árvores, arbustos, flores, cercas, placa, tufos de grama e borboletas (só visual). */
export function createDecoration(scene: Phaser.Scene, level: LevelConfig): void {
  const rng = createRandom(level.decoration.seed);
  level.platforms.forEach((spec) => decoratePlatform(scene, level, spec, rng));
  createLandmarks(scene, level, rng);
}

function decoratePlatform(
  scene: Phaser.Scene,
  { id, world, decoration }: LevelConfig,
  spec: PlatformSpec,
  rng: () => number,
): void {
  const flowerCount = decoration.flowerColors.length;
  const cave = decoration.style === "cave";
  const isGround = spec.y === world.groundY;
  const surface = spec.y;
  const start = spec.x + 28;
  const end = spec.x + spec.width - 28;
  let lastTree = -999;

  for (let x = start; x < end; x += 44 + rng() * 78) {
    const roll = rng();
    if (isGround && roll < 0.2 && x - lastTree > 260 && x > 320 && x < end - 60) {
      scene.add
        .image(x, surface + 10, cave ? "stalagmite" : "tree")
        .setOrigin(0.5, 1)
        .setScale(cave ? 1.1 + rng() * 0.9 : 0.8 + rng() * 0.5)
        .setDepth(DEPTH.BACK_TREE);
      lastTree = x;
    } else if (roll < 0.36) {
      scene.add
        .image(x, surface + 6, cave ? "stalagmite" : "bush")
        .setOrigin(0.5, 1)
        .setScale(cave ? 0.45 + rng() * 0.4 : 0.8 + rng() * 0.6)
        .setFlipX(rng() > 0.5)
        .setDepth(DEPTH.BACK_BUSH);
    } else if (isGround && roll < 0.46) {
      scene.add.image(x, surface + 6, "rock").setOrigin(0.5, 1).setScale(0.7 + rng() * 0.6).setDepth(DEPTH.FRONT_DECOR);
    } else if (isGround && !cave && roll < 0.56) {
      const sections = 2 + Math.floor(rng() * 2);
      for (let i = 0; i < sections; i += 1) {
        scene.add
          .image(x + i * 62, surface + 4, "fence")
          .setOrigin(0, 1)
          .setDepth(DEPTH.BACK_FENCE);
      }
      x += sections * 62;
    } else if (roll < 0.66) {
      scene.add.image(x, surface + 5, "mushroom").setOrigin(0.5, 1).setDepth(DEPTH.FRONT_DECOR);
    } else {
      const count = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < count; i += 1) {
        const key = `flower-${id}-${Math.floor(rng() * flowerCount)}`;
        scene.add
          .image(x + i * 13 - count * 6, surface + 5, key)
          .setOrigin(0.5, 1)
          .setScale(0.9 + rng() * 0.5)
          .setAngle((rng() - 0.5) * 16)
          .setDepth(DEPTH.FRONT_DECOR);
      }
    }
  }

  // Tufos de grama espalhados, alguns à frente do jogador para criar profundidade.
  for (let x = spec.x + 12; x < spec.x + spec.width - 12; x += 22 + rng() * 34) {
    const front = rng() > 0.7;
    scene.add
      .image(x, surface + (front ? 12 : 6), "tuft")
      .setOrigin(0.5, 1)
      .setScale(0.7 + rng() * 0.7)
      .setFlipX(rng() > 0.5)
      .setDepth(front ? DEPTH.FRONT_TUFT : DEPTH.GRASS_TUFT);
  }
}

function createLandmarks(scene: Phaser.Scene, { world, decoration }: LevelConfig, rng: () => number): void {
  // Placa indicando a direção da trilha, perto do ponto de partida.
  scene.add
    .image(decoration.signX, world.groundY + 6, "sign")
    .setOrigin(0.5, 1)
    .setDepth(DEPTH.BACK_SIGN);

  // Borboletas ocupam o ar acima dos campos.
  const { count, startX, spacing } = decoration.butterflies;
  for (let index = 0; index < count; index += 1) {
    const x = startX + index * spacing + rng() * 120;
    const y = 470 + rng() * 80;
    const butterfly = scene.add.image(x, y, "butterfly").setDepth(DEPTH.BUTTERFLY);
    scene.tweens.add({
      targets: butterfly,
      scaleX: 0.35,
      duration: 140 + rng() * 80,
      yoyo: true,
      repeat: -1,
    });
    scene.tweens.add({
      targets: butterfly,
      x: x + 90 + rng() * 80,
      y: y - 30 - rng() * 40,
      duration: 2600 + rng() * 1800,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });
  }
}
