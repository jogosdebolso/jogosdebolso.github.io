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
};

export type EnemyVariant = "cometa" | "vanguarda" | "vespa" | "espectro" | "bastiao";

export type EnemySpawnSettings = {
  variant: EnemyVariant;
  lane?: number;
  size?: number;
  speed?: number;
  bossName?: string;
  health?: number;
};

export type EnemyStyle = {
  key: EnemyVariant;
  wing: Array<{ x: number; y: number }>;
  hull: Array<{ x: number; y: number }>;
  core: Array<{ x: number; y: number }>;
  wingColor: number;
  hullColor: number;
  edgeColor: number;
  coreColor: number;
};

export type PlayerShot = {
  image: Phaser.GameObjects.Image;
  progress: number;
  speed: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};
