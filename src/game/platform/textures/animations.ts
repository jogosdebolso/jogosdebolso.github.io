import Phaser from "phaser";
import { COIN_FRAMES, ENEMY_FRAMES, GOAL_FRAMES, HERO_FRAMES } from "../constants";

/** Registra as animações globais (idempotente: a cena pode reiniciar). */
export function registerAnimations(scene: Phaser.Scene): void {
  const sequence = (prefix: string, length: number): Phaser.Types.Animations.AnimationFrame[] =>
    Array.from({ length }, (_, i) => ({ key: `${prefix}-${i}` }));
  const define = (key: string, config: Omit<Phaser.Types.Animations.Animation, "key">): void => {
    if (!scene.anims.exists(key)) {
      scene.anims.create({ key, ...config });
    }
  };

  define("coin-spin", { frames: sequence("coin", COIN_FRAMES), frameRate: 9, repeat: -1 });
  define("goal-wave", { frames: sequence("goal", GOAL_FRAMES), frameRate: 7, repeat: -1 });
  define("ladybug-walk", { frames: sequence("ladybug-walk", ENEMY_FRAMES), frameRate: 8, repeat: -1 });
  define("ladybug-fly", { frames: sequence("ladybug-fly", ENEMY_FRAMES), frameRate: 22, repeat: -1 });
  define("mushroom-walk", { frames: sequence("mushroom-walk", ENEMY_FRAMES), frameRate: 8, repeat: -1 });
  define("slug-crawl", { frames: sequence("slug-crawl", ENEMY_FRAMES), frameRate: 5, repeat: -1 });
  define("bat-fly", { frames: sequence("bat-fly", ENEMY_FRAMES), frameRate: 14, repeat: -1 });
  define("spider-crawl", { frames: sequence("spider-crawl", ENEMY_FRAMES), frameRate: 8, repeat: -1 });
  define("bee-fly", { frames: sequence("bee-fly", ENEMY_FRAMES), frameRate: 24, repeat: -1 });
  define("hero-idle", {
    frames: [{ key: "hero-idle-0" }, { key: "hero-idle-1" }],
    frameRate: 2.5,
    repeat: -1,
  });
  define("hero-walk", { frames: sequence("hero-walk", HERO_FRAMES), frameRate: 11, repeat: -1 });
  define("hero-run", { frames: sequence("hero-run", HERO_FRAMES), frameRate: 17, repeat: -1 });
  define("hero-jump", { frames: [{ key: "hero-jump" }], frameRate: 1 });
  define("hero-fall", { frames: [{ key: "hero-fall" }], frameRate: 1 });
}
