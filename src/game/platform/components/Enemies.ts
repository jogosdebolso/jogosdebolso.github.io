import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { EnemySpec, EnemyType } from "../levelConfig";
import { burst } from "./effects";

type Contact = "stomp" | "hit" | undefined;

interface TypeInfo {
  /** Animação usada ao andar (ou ao voar, para a abelha). */
  walk: string;
  /** Animação de voo (joaninha e abelha). */
  fly?: string;
  halfWidth: number;
  height: number;
  /** Multiplicador da velocidade horizontal ao voar. */
  flySpeed: number;
  /** Amplitude da ondulação vertical de quem voa o tempo todo. */
  bob?: number;
}

const TYPES: Record<EnemyType, TypeInfo> = {
  mushroom: { walk: "mushroom-walk", halfWidth: 17, height: 34, flySpeed: 1 },
  slug: { walk: "slug-crawl", halfWidth: 17, height: 24, flySpeed: 1 },
  ladybug: { walk: "ladybug-walk", fly: "ladybug-fly", halfWidth: 16, height: 26, flySpeed: 1.4 },
  bee: { walk: "bee-fly", fly: "bee-fly", halfWidth: 16, height: 26, flySpeed: 1, bob: 16 },
  bat: { walk: "bat-fly", fly: "bat-fly", halfWidth: 18, height: 28, flySpeed: 1, bob: 32 },
  spider: { walk: "spider-crawl", halfWidth: 15, height: 30, flySpeed: 1 },
};

/** A joaninha anda um tempo, decola, voa um tempo e pousa, repetindo o ciclo. */
const LADYBUG_WALK_MS = 3500;
const LADYBUG_TAKEOFF_MS = 800;
const LADYBUG_FLY_MS = 3200;
const LADYBUG_LAND_MS = 800;
const DEFAULT_ALTITUDE = 90;
/** A textura tem a linha do chão em y=38 de 40. */
const ORIGIN_Y = 38 / 40;

type Phase = "walk" | "takeoff" | "fly" | "land";

interface Enemy {
  spec: EnemySpec;
  info: TypeInfo;
  sprite: Phaser.GameObjects.Sprite;
  direction: 1 | -1;
  alive: boolean;
  phase: Phase;
  phaseTime: number;
  clock: number;
  surface: number;
  /** Altura atual acima da superfície. */
  lift: number;
  /** Fio da aranha (desenhado a cada quadro). */
  thread?: Phaser.GameObjects.Graphics;
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Inimigos patrulheiros: pular em cima derrota; encostar tira uma vida. */
export class Enemies {
  private readonly items: Enemy[];

  constructor(
    private readonly scene: Phaser.Scene,
    specs: readonly EnemySpec[],
    groundY: number,
  ) {
    this.items = specs.map((spec, index) => {
      const info = TYPES[spec.type];
      const surface = spec.surfaceY ?? groundY;
      const sprite = scene.add
        .sprite(spec.x, surface + 2, `${info.walk}-0`)
        .setOrigin(0.5, ORIGIN_Y)
        .setDepth(DEPTH.ENEMY);
      sprite.play({ key: info.walk, startFrame: index % 4 });
      const enemy: Enemy = {
        spec,
        info,
        sprite,
        direction: 1,
        alive: true,
        phase: spec.type === "bee" || spec.type === "bat" ? "fly" : "walk",
        phaseTime: 0,
        clock: index * 700,
        surface,
        lift: 0,
      };
      if (spec.type === "bee" || spec.type === "bat") {
        enemy.lift = spec.altitude ?? DEFAULT_ALTITUDE;
      }
      if (spec.type === "spider") {
        enemy.thread = scene.add.graphics().setDepth(DEPTH.ENEMY - 0.05);
        enemy.lift = 100; // se for derrotada, despenca
      }
      this.place(enemy);
      return enemy;
    });
  }

  update(delta: number): void {
    for (const enemy of this.items) {
      if (!enemy.alive) {
        continue;
      }
      enemy.clock += delta;
      this.updatePhase(enemy, delta);
      this.moveHorizontally(enemy, delta);
      this.place(enemy);
    }
  }

  private updatePhase(enemy: Enemy, delta: number): void {
    const { spec, info } = enemy;
    const altitude = spec.altitude ?? DEFAULT_ALTITUDE;

    if (spec.type === "bee" || spec.type === "bat") {
      enemy.lift = altitude + Math.sin(enemy.clock * 0.003) * (info.bob ?? 16);
      return;
    }
    if (spec.type === "spider") {
      return;
    }
    if (spec.type !== "ladybug") {
      return;
    }

    enemy.phaseTime += delta;
    const next = (phase: Phase): void => {
      enemy.phase = phase;
      enemy.phaseTime = 0;
    };
    switch (enemy.phase) {
      case "walk":
        enemy.lift = 0;
        if (enemy.phaseTime >= LADYBUG_WALK_MS) {
          next("takeoff");
        }
        break;
      case "takeoff":
        enemy.lift = altitude * smooth(Math.min(1, enemy.phaseTime / LADYBUG_TAKEOFF_MS));
        if (enemy.phaseTime >= LADYBUG_TAKEOFF_MS) {
          next("fly");
        }
        break;
      case "fly":
        enemy.lift = altitude + Math.sin(enemy.clock * 0.004) * 6;
        if (enemy.phaseTime >= LADYBUG_FLY_MS) {
          next("land");
        }
        break;
      case "land":
        enemy.lift = altitude * (1 - smooth(Math.min(1, enemy.phaseTime / LADYBUG_LAND_MS)));
        if (enemy.phaseTime >= LADYBUG_LAND_MS) {
          next("walk");
        }
        break;
    }
    const wanted = enemy.phase === "walk" ? info.walk : (info.fly ?? info.walk);
    enemy.sprite.anims.play(wanted, true);
  }

  private moveHorizontally(enemy: Enemy, delta: number): void {
    const { spec, info, sprite } = enemy;
    if (spec.type === "spider") {
      return;
    }
    const flying = enemy.phase !== "walk";
    const speed = spec.speed * (flying ? info.flySpeed : 1);
    sprite.x += enemy.direction * speed * (delta / 1000);
    if (sprite.x >= spec.maxX) {
      sprite.x = spec.maxX;
      enemy.direction = -1;
    } else if (sprite.x <= spec.minX) {
      sprite.x = spec.minX;
      enemy.direction = 1;
    }
    sprite.setFlipX(enemy.direction < 0);
  }

  private place(enemy: Enemy): void {
    const { spec, sprite, thread, info } = enemy;
    if (spec.type === "spider" && thread) {
      // Sobe e desce no fio: meio ciclo de cosseno leva de `anchorY` a `anchorY + length`.
      const length = spec.length ?? 200;
      const speed = Math.max(1, spec.speed);
      const offset = length * (0.5 - 0.5 * Math.cos(((enemy.clock * 0.001 * speed) / length) * Math.PI));
      sprite.setPosition(spec.x, (spec.anchorY ?? 0) + offset + info.height + 6);
      thread.clear();
      thread.lineStyle(1.5, 0xe5e7eb, 0.9);
      thread.beginPath();
      thread.moveTo(spec.x, (spec.anchorY ?? 0) - 400);
      thread.lineTo(spec.x, sprite.y - info.height + 4);
      thread.strokePath();
      return;
    }
    sprite.y = enemy.surface + 2 - enemy.lift;
  }

  /**
   * Testa o contato com o herói (caixa centrada em `heroX`, `heroY`).
   * Devolve "stomp" (pisou de cima; o inimigo é derrotado), "hit" (encostou) ou nada.
   */
  checkContact(
    heroX: number,
    heroY: number,
    heroHalfWidth: number,
    heroHalfHeight: number,
    fallingSpeed: number,
  ): Contact {
    for (const enemy of this.items) {
      if (!enemy.alive) {
        continue;
      }
      const { sprite, info } = enemy;
      const bottom = sprite.y;
      const top = bottom - info.height;
      const heroBottom = heroY + heroHalfHeight;
      const overlapX = Math.abs(sprite.x - heroX) < info.halfWidth + heroHalfWidth - 4;
      const overlapY = heroBottom > top + 2 && heroY - heroHalfHeight < bottom;
      if (!overlapX || !overlapY) {
        continue;
      }
      if (fallingSpeed > 0 && heroBottom < top + 16) {
        this.defeat(enemy);
        return "stomp";
      }
      return "hit";
    }
    return undefined;
  }

  private defeat(enemy: Enemy): void {
    enemy.alive = false;
    const { sprite } = enemy;
    enemy.thread?.destroy();
    sprite.anims.stop();
    burst(this.scene, sprite.x, sprite.y - 12, 0xfca5a5, 8, 30);
    if (enemy.lift > 20) {
      // Inimigo no ar: gira e despenca.
      this.scene.tweens.add({
        targets: sprite,
        y: sprite.y + 160,
        angle: enemy.direction * 300,
        alpha: 0,
        duration: 600,
        ease: "Quad.easeIn",
        onComplete: () => sprite.destroy(),
      });
      return;
    }
    // No chão: achata e some.
    this.scene.tweens.add({
      targets: sprite,
      scaleY: 0.25,
      scaleX: 1.25,
      duration: 90,
    });
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      delay: 350,
      duration: 250,
      onComplete: () => sprite.destroy(),
    });
  }
}
