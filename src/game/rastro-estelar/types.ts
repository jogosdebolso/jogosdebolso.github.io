import type Phaser from "phaser";

export type Asteroid = {
  image: Phaser.GameObjects.Image;
  progress: number;
  speed: number;
  size: number;
  rotationSpeed: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type Enemy = {
  image: Phaser.GameObjects.Image;
  progress: number;
  speed: number;
  size: number;
  variant: EnemyVariant;
  health: number;
  maxHealth: number;
  isBoss: boolean;
  bossName?: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  movementState: "approaching" | "holding" | "diving" | "side-exit";
  movementTimeMs: number;
  holdProgress: number;
  holdDurationMs: number;
  holdElapsedMs: number;
  holdTransitionMs: number;
  holdX: number;
  holdEntryX: number;
  maneuverAmplitude: number;
  maneuverFrequency: number;
  maneuverPhase: number;
  sideExitDirection: -1 | 1;
  sideExitProgress: number;
  sideExitStartX: number;
  sideExitStartY: number;
  diveBlendProgress: number;
  diveStartX: number;
  diveStartY: number;
  /** Fantasma: invulnerável e translúcido (só contorno) durante parte do ciclo. */
  ghost: boolean;
  ghostTimerMs: number;
  /** Atirador: tempo desde o último disparo. */
  fireElapsedMs: number;
  /** Só o chefe final encerra a fase (os demais são do "boss rush"). */
  isFinalBoss: boolean;
  /** Arte (1 a 7) do chefe: define o tipo de tiro. */
  bossArt: number;
};

export type EnemyShot = {
  image: Phaser.GameObjects.Image;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  progress: number;
  durationMs: number;
  /** Multiplicador do tamanho do projétil (padrão 1). */
  scaleFactor: number;
};

export type EnemyVariant =
  | "cometa"
  | "vanguarda"
  | "vespa"
  | "espectro"
  | "bastiao"
  | "atirador"
  | "fantasma"
  | "satelite"
  | "sonda";

export type EnemySpawnSettings = {
  variant: EnemyVariant;
  lane?: number;
  size?: number;
  speed?: number;
  bossName?: string;
  health?: number;
  /** Número da arte do chefe (1 a 7); padrão: a fase atual. */
  bossArt?: number;
  /** Falso para chefes intermediários do "boss rush". */
  finalBoss?: boolean;
};

export type EnemyStyle = {
  key: EnemyVariant;
  wing: Array<{ x: number; y: number }>;
  hull: Array<{ x: number; y: number }>;
  core: Array<{ x: number; y: number }>;
  wingColor: number;
  hullColor: number;
  coreColor: number;
};

export type PlayerShot = {
  image: Phaser.GameObjects.Image;
  progress: number;
  speed: number;
  startX: number;
  startY: number;
  endX: number;
};
