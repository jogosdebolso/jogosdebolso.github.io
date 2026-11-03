import configJson from "./game.json";

interface RastroGameFile {
  lives: number;
  player: {
    width: number;
    height: number;
    speed: number;
    startY: number;
    minScale: number;
    scaleRange: number;
    rotation: number;
    rotationSmoothingMs: number;
  };
  asteroids: {
    spawnIntervalMs: number;
    maxCount: number;
    speedRange: number[];
    sizeRange: number[];
    lanes: number[];
    straightDownChance: number;
    downwardChance: number;
    downwardTravel: number[];
    upwardTravel: number[];
    horizontalTravel: number[];
    verticalHorizonJitter: number;
    projectionExponent: number;
    scaleRange: number[];
    removeMargin: number;
  };
  enemies: {
    spawnIntervalMs: number;
    maxCount: number;
    speedRange: number[];
    sizeRange: number[];
    lanes: number[];
    verticalHorizonJitter: number;
    destinationXRange: number[];
    destinationYRange: number[];
    bossHoldY: number;
    projectionExponent: number;
    scaleRange: number[];
    bossScaleRange: number[];
    removeMargin: number;
  };
  weapon: {
    cooldownMs: number;
    maxShots: number;
    speed: number;
    initialScale: number;
    aimOffset: number;
    rotationInfluence: number;
    projectionExponent: number;
    targetWidthFactor: number;
    targetHeightFactor: number;
  };
  collision: {
    obstacleWidthFactor: number;
    obstacleHeightFactor: number;
    playerWidthFactor: number;
    playerHeightFactor: number;
    cameraShakeMs: number;
    cameraShakeIntensity: number;
    cameraFlashMs: number;
    restartDelayMs: number;
    invulnerabilityMs: number;
  };
  perspective: {
    horizonY: number;
    distantTint: string;
    nearTint: string;
  };
  texts: {
    title: string;
    livesLabel: string;
    startInstructionsTitle: string;
    startInstructions: string[];
    startButton: string;
    gameOverTitle: string;
    restartButton: string;
    victoryEnemiesTitle: string;
    victoryCongratsTitle: string;
    victoryCongratsMessage: string;
    victoryExitHint: string;
  };
}

const file: RastroGameFile = configJson;

function assertPositive(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`rastro-estelar/game.json: ${name} deve ser maior que zero.`);
  }
}

function assertUnitInterval(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`rastro-estelar/game.json: ${name} deve estar entre 0 e 1.`);
  }
}

function parseTint(value: string, name: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`rastro-estelar/game.json: ${name} deve usar o formato #rrggbb.`);
  }
  return Number.parseInt(value.slice(1), 16);
}

function validateRange(range: number[], name: string): void {
  validatePair(range, name);
  const [min, max] = range;
  if (max < min) {
    throw new Error(`rastro-estelar/game.json: intervalo inválido em ${name}.`);
  }
}

function validatePair(pair: number[], name: string): void {
  if (
    pair.length !== 2 ||
    !Number.isFinite(pair[0]) ||
    !Number.isFinite(pair[1]) ||
    pair[0] < 0 ||
    pair[1] < 0
  ) {
    throw new Error(`rastro-estelar/game.json: par de valores inválido em ${name}.`);
  }
}

function validateConfig(config: RastroGameFile): void {
  if (!Number.isInteger(config.lives) || config.lives < 1) {
    throw new Error("rastro-estelar/game.json: lives deve ser inteiro positivo.");
  }
  assertPositive(config.player.width, "player.width");
  assertPositive(config.player.height, "player.height");
  assertPositive(config.player.speed, "player.speed");
  assertPositive(config.player.rotationSmoothingMs, "player.rotationSmoothingMs");
  assertUnitInterval(config.player.startY, "player.startY");
  assertUnitInterval(config.player.minScale, "player.minScale");
  assertUnitInterval(config.player.scaleRange, "player.scaleRange");
  assertPositive(config.asteroids.spawnIntervalMs, "asteroids.spawnIntervalMs");
  assertPositive(config.asteroids.maxCount, "asteroids.maxCount");
  assertPositive(config.enemies.spawnIntervalMs, "enemies.spawnIntervalMs");
  assertPositive(config.enemies.maxCount, "enemies.maxCount");
  assertPositive(config.weapon.cooldownMs, "weapon.cooldownMs");
  assertPositive(config.weapon.maxShots, "weapon.maxShots");
  assertPositive(config.weapon.speed, "weapon.speed");
  assertPositive(config.collision.restartDelayMs, "collision.restartDelayMs");
  assertPositive(config.collision.invulnerabilityMs, "collision.invulnerabilityMs");
  validateRange(config.asteroids.speedRange, "asteroids.speedRange");
  validateRange(config.asteroids.sizeRange, "asteroids.sizeRange");
  validatePair(config.asteroids.downwardTravel, "asteroids.downwardTravel");
  validatePair(config.asteroids.upwardTravel, "asteroids.upwardTravel");
  validatePair(config.asteroids.horizontalTravel, "asteroids.horizontalTravel");
  validateRange(config.asteroids.scaleRange, "asteroids.scaleRange");
  validateRange(config.enemies.speedRange, "enemies.speedRange");
  validateRange(config.enemies.sizeRange, "enemies.sizeRange");
  validateRange(config.enemies.destinationXRange, "enemies.destinationXRange");
  validateRange(config.enemies.destinationYRange, "enemies.destinationYRange");
  validateRange(config.enemies.scaleRange, "enemies.scaleRange");
  validateRange(config.enemies.bossScaleRange, "enemies.bossScaleRange");
  assertUnitInterval(config.perspective.horizonY, "perspective.horizonY");
  assertUnitInterval(config.enemies.bossHoldY, "enemies.bossHoldY");
  assertUnitInterval(config.asteroids.straightDownChance, "asteroids.straightDownChance");
  assertUnitInterval(config.asteroids.downwardChance, "asteroids.downwardChance");
}

validateConfig(file);

export const RASTRO_GAME_CONFIG = {
  ...file,
  perspective: {
    ...file.perspective,
    distantTint: parseTint(file.perspective.distantTint, "perspective.distantTint"),
    nearTint: parseTint(file.perspective.nearTint, "perspective.nearTint"),
  },
};
