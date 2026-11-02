import levelOneJson from "./levels/level-1.json";
import levelTwoJson from "./levels/level-2.json";
import levelThreeJson from "./levels/level-3.json";
import levelFourJson from "./levels/level-4.json";
import levelFiveJson from "./levels/level-5.json";
import levelSixJson from "./levels/level-6.json";
import levelSevenJson from "./levels/level-7.json";
import type { EnemyVariant } from "./types";

type LevelObstacle = {
  progress: number;
  lane: number;
  speed?: number;
};

type EnemySpawnFile = {
  variant: string;
  lane: number;
  size?: number;
  speed?: number;
};

type LevelEnemyFile = LevelObstacle & EnemySpawnFile;

type LevelBossFile = EnemySpawnFile & {
  name: string;
  health: number;
};

type LevelEventFile = {
  atMs: number;
  title: string;
  message: string;
  wave?: EnemySpawnFile[];
  boss?: LevelBossFile;
};

type LevelFile = {
  id: number;
  name: string;
  description: string;
  background: {
    baseColor: string;
    nebulaColors: string[];
    horizonColor: string;
    planet: {
      x: number;
      y: number;
      radius: number;
      color: string;
      highlightColor: string;
      shadowColor: string;
      ringColor: string;
    };
    moon: {
      x: number;
      y: number;
      radius: number;
      color: string;
      shadowColor: string;
    };
  };
  initialAsteroids: LevelObstacle[];
  initialEnemies: LevelEnemyFile[];
  ambientVariants: string[];
  events: LevelEventFile[];
};

export type RastroEnemySpawn = Omit<EnemySpawnFile, "variant"> & {
  variant: EnemyVariant;
};

export type RastroLevelEvent = {
  atMs: number;
  title: string;
  message: string;
  wave?: RastroEnemySpawn[];
  boss?: RastroEnemySpawn & { name: string; health: number };
};

export type RastroLevel = Omit<
  LevelFile,
  "background" | "initialEnemies" | "ambientVariants" | "events"
> & {
  background: {
    baseColor: number;
    nebulaColors: number[];
    horizonColor: number;
    planet: {
      x: number;
      y: number;
      radius: number;
      color: number;
      highlightColor: number;
      shadowColor: number;
      ringColor: number;
    };
    moon: {
      x: number;
      y: number;
      radius: number;
      color: number;
      shadowColor: number;
    };
  };
  initialEnemies: (LevelObstacle & RastroEnemySpawn)[];
  ambientVariants: EnemyVariant[];
  events: RastroLevelEvent[];
};

const levelFiles: LevelFile[] = [
  levelOneJson,
  levelTwoJson,
  levelThreeJson,
  levelFourJson,
  levelFiveJson,
  levelSixJson,
  levelSevenJson,
];

function isEnemyVariant(value: string): value is EnemyVariant {
  return ["cometa", "vanguarda", "vespa", "espectro", "bastiao"].includes(value);
}

function parseEnemyVariant(value: string, field: string): EnemyVariant {
  if (!isEnemyVariant(value)) {
    throw new Error(`rastro-estelar/levels: variante inimiga inválida em ${field}.`);
  }
  return value;
}

function parseColor(value: string, field: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`rastro-estelar/levels: ${field} deve usar o formato #rrggbb.`);
  }
  return Number.parseInt(value.slice(1), 16);
}

function validateObstacle(obstacle: LevelObstacle, field: string): void {
  if (
    !Number.isFinite(obstacle.progress) ||
    obstacle.progress < 0 ||
    !Number.isFinite(obstacle.lane) ||
    (obstacle.speed !== undefined &&
      (!Number.isFinite(obstacle.speed) || obstacle.speed <= 0))
  ) {
    throw new Error(`rastro-estelar/levels: configuração inválida em ${field}.`);
  }
}

function normalizeSpawn(spawn: EnemySpawnFile, field: string): RastroEnemySpawn {
  if (!Number.isFinite(spawn.lane)) {
    throw new Error(`rastro-estelar/levels: faixa inválida em ${field}.`);
  }
  if (
    (spawn.size !== undefined && (!Number.isFinite(spawn.size) || spawn.size <= 0)) ||
    (spawn.speed !== undefined && (!Number.isFinite(spawn.speed) || spawn.speed <= 0))
  ) {
    throw new Error(`rastro-estelar/levels: escala/velocidade inválida em ${field}.`);
  }
  return {
    ...spawn,
    variant: parseEnemyVariant(spawn.variant, field),
  };
}

function normalizeLevel(level: LevelFile): RastroLevel {
  if (!Number.isInteger(level.id) || level.id < 1 || !level.name || !level.description) {
    throw new Error("rastro-estelar/levels: id, nome ou descrição da fase inválidos.");
  }
  if (
    level.background.nebulaColors.length < 4 ||
    level.ambientVariants.length === 0 ||
    !level.events.length
  ) {
    throw new Error(`rastro-estelar/levels/level-${level.id}.json: configuração incompleta.`);
  }
  level.initialAsteroids.forEach((obstacle, index) =>
    validateObstacle(obstacle, `level-${level.id}.initialAsteroids[${index}]`),
  );
  level.initialEnemies.forEach((enemy, index) =>
    validateObstacle(enemy, `level-${level.id}.initialEnemies[${index}]`),
  );

  const ambientVariants = level.ambientVariants.map((variant, index) =>
    parseEnemyVariant(variant, `level-${level.id}.ambientVariants[${index}]`),
  );
  const initialEnemies = level.initialEnemies.map((enemy, index) => ({
    ...enemy,
    ...normalizeSpawn(enemy, `level-${level.id}.initialEnemies[${index}]`),
  }));
  let previousAtMs = -1;
  const events = level.events.map((event, index): RastroLevelEvent => {
    if (
      !Number.isFinite(event.atMs) ||
      event.atMs < previousAtMs ||
      !event.title ||
      !event.message
    ) {
      throw new Error(`rastro-estelar/levels/level-${level.id}.json: evento ${index} inválido.`);
    }
    previousAtMs = event.atMs;
    const wave = event.wave?.map((spawn, spawnIndex) =>
      normalizeSpawn(spawn, `level-${level.id}.events[${index}].wave[${spawnIndex}]`),
    );
    const boss = event.boss
      ? {
          ...normalizeSpawn(event.boss, `level-${level.id}.events[${index}].boss`),
          name: event.boss.name,
          health: event.boss.health,
        }
      : undefined;
    if (boss && (!boss.name || !Number.isInteger(boss.health) || boss.health < 1)) {
      throw new Error(`rastro-estelar/levels/level-${level.id}.json: chefe inválido.`);
    }
    if (!wave?.length && !boss) {
      throw new Error(`rastro-estelar/levels/level-${level.id}.json: evento sem spawns.`);
    }
    return { ...event, wave, boss };
  });
  if (!events[events.length - 1]?.boss) {
    throw new Error(
      `rastro-estelar/levels/level-${level.id}.json: o último evento deve ser um chefe.`,
    );
  }

  return {
    ...level,
    initialEnemies,
    ambientVariants,
    events,
    background: {
      ...level.background,
      baseColor: parseColor(
        level.background.baseColor,
        `level-${level.id}.background.baseColor`,
      ),
      nebulaColors: level.background.nebulaColors.map((color, index) =>
        parseColor(color, `level-${level.id}.background.nebulaColors[${index}]`),
      ),
      horizonColor: parseColor(
        level.background.horizonColor,
        `level-${level.id}.background.horizonColor`,
      ),
      planet: {
        ...level.background.planet,
        color: parseColor(level.background.planet.color, `level-${level.id}.planet.color`),
        highlightColor: parseColor(
          level.background.planet.highlightColor,
          `level-${level.id}.planet.highlightColor`,
        ),
        shadowColor: parseColor(
          level.background.planet.shadowColor,
          `level-${level.id}.planet.shadowColor`,
        ),
        ringColor: parseColor(
          level.background.planet.ringColor,
          `level-${level.id}.planet.ringColor`,
        ),
      },
      moon: {
        ...level.background.moon,
        color: parseColor(level.background.moon.color, `level-${level.id}.moon.color`),
        shadowColor: parseColor(
          level.background.moon.shadowColor,
          `level-${level.id}.moon.shadowColor`,
        ),
      },
    },
  };
}

export const RASTRO_LEVELS = levelFiles.map(normalizeLevel);
