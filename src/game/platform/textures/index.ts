import Phaser from "phaser";
import type { LevelConfig } from "../levelConfig";
import { registerAnimations } from "./animations";
import { buildEnemyTextures } from "./enemy";
import { buildEnvironmentTextures } from "./environment";
import { buildHeroDeathTextures } from "./heroDeath";
import { buildHeroTextures } from "./hero";
import { buildObstacleTextures } from "./obstacles";
import { buildPickupTextures } from "./pickups";

/** Gera todas as texturas e animações procedurais do jogo. */
export function buildAllTextures(scene: Phaser.Scene, level: LevelConfig): void {
  buildEnvironmentTextures(scene, level);
  buildObstacleTextures(scene);
  buildPickupTextures(scene);
  buildEnemyTextures(scene);
  buildHeroTextures(scene);
  buildHeroDeathTextures(scene);
  registerAnimations(scene);
}
