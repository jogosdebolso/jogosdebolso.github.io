import Phaser from "phaser";
import { CAP_SURFACE, DEPTH } from "../constants";
import type { LevelConfig, PlatformSpec } from "../levelConfig";

/** Plataformas (terra + topo de grama) e seus colisores estáticos invisíveis. */
export function createTerrain(scene: Phaser.Scene, level: LevelConfig): Phaser.GameObjects.Rectangle[] {
  return level.platforms.map((spec) => createPlatform(scene, level, spec));
}

function createPlatform(
  scene: Phaser.Scene,
  { world }: LevelConfig,
  spec: PlatformSpec,
): Phaser.GameObjects.Rectangle {
  const isGround = spec.y === world.groundY;
  const bottom = isGround ? world.deepY : spec.y + spec.height;

  // Terra em ladrilhos, por baixo do topo de grama.
  scene.add
    .tileSprite(spec.x, spec.y + 16, spec.width, bottom - spec.y - 16, "dirt")
    .setOrigin(0)
    .setDepth(DEPTH.DIRT);

  if (isGround) {
    // Sombra nas laterais do chão: dá volume à parede dos buracos vizinhos.
    const walls = scene.add.graphics().setDepth(DEPTH.PIT + 0.02);
    const wallHeight = bottom - spec.y;
    walls.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0.6, 0, 0.6);
    walls.fillRect(spec.x - 26, spec.y, 26, wallHeight);
    walls.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.6, 0, 0.6, 0);
    walls.fillRect(spec.x + spec.width, spec.y, 26, wallHeight);

    const shade = scene.add.graphics().setDepth(DEPTH.DEPTH_SHADE);
    shade.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
    shade.fillRect(spec.x, spec.y + 40, spec.width, 360);
    shade.fillStyle(0x000000, 0.6);
    shade.fillRect(spec.x, spec.y + 400, spec.width, bottom - spec.y - 400);
  } else {
    // Borda inferior sombreada para destacar plataformas flutuantes.
    const edge = scene.add.graphics().setDepth(DEPTH.DEPTH_SHADE);
    edge.fillStyle(0x3b2412, 0.55);
    edge.fillRect(spec.x, spec.y + spec.height - 6, spec.width, 6);
    edge.fillStyle(0x000000, 0.18);
    edge.fillRect(spec.x, spec.y + spec.height, spec.width, 8);
  }

  scene.add
    .tileSprite(spec.x, spec.y - CAP_SURFACE, spec.width, 32, "grass-cap")
    .setOrigin(0)
    .setDepth(DEPTH.GRASS_CAP);

  // Colisor invisível: física baseada em retângulos estáticos.
  const collider = scene.add
    .rectangle(spec.x, spec.y, spec.width, isGround ? world.deepY - spec.y : spec.height, 0x000000, 0)
    .setOrigin(0);
  scene.physics.add.existing(collider, true);
  return collider;
}
