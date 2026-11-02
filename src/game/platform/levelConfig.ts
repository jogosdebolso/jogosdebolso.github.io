import game from "./game.json";
import level1 from "./levels/level-1.json";
import level2 from "./levels/level-2.json";
import level3 from "./levels/level-3.json";
import level4 from "./levels/level-4.json";
import level5 from "./levels/level-5.json";

export interface Point {
  x: number;
  y: number;
}

export interface PlatformSpec {
  x: number;
  y: number;
  width: number;
  height: number;
}

type CoinGroup =
  | { type: "line"; x: number; y: number; count: number; step: number }
  | { type: "arc"; centerX: number; baseY: number; count: number; step: number; height: number };

/** Região coberta por folhagem: ao entrar nela o herói descobre a passagem secreta. */
export interface SecretSpec {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Desenha um tronco sob a copa (padrão: sim). Em cavernas use `false`. */
  trunk?: boolean;
}

/** Obstáculo fixo: tocar nele machuca (não dá para pisar). */
export interface ObstacleSpec {
  type: "thorns";
  x: number;
  /** Largura em px (a textura se repete a cada 48 px). */
  width: number;
  surfaceY?: number;
}

export type EnemyType = "mushroom" | "slug" | "ladybug" | "bee" | "bat" | "spider";

/**
 * Inimigo patrulheiro: anda (ou voa) entre `minX` e `maxX`.
 * - `mushroom` e `slug` andam no chão; `ladybug` alterna entre andar e voar; `bee` e `bat` só voam.
 * - `spider` fica pendurada num fio fixo em `x`, descendo e subindo `length` px a partir de `anchorY`
 *   (`minX`/`maxX` são ignorados; `speed` é a velocidade vertical média).
 * - `altitude`: altura de voo acima da superfície (padrão 90); `surfaceY`: superfície em que
 *   o inimigo anda (padrão `world.groundY`).
 */
export interface EnemySpec {
  type: EnemyType;
  x: number;
  minX: number;
  maxX: number;
  speed: number;
  altitude?: number;
  surfaceY?: number;
  anchorY?: number;
  length?: number;
}

interface PanelTexts {
  title: string;
  subtitle: string;
  hint: string;
  controls: string;
}

interface HillColors {
  fill: string;
  rim: string;
}

/** Formato de cada arquivo em `levels/`. */
interface LevelFile {
  id: string;
  name: string;
  world: { width: number; height: number; groundY: number; deepY: number };
  spawn: Point;
  goal: { x: number };
  platforms: PlatformSpec[];
  coins: CoinGroup[];
  enemies: EnemySpec[];
  obstacles: ObstacleSpec[];
  secrets: SecretSpec[];
  extraLives: Point[];
  background: {
    skyTop: string;
    skyBottom: string;
    hazeColor: string;
    hazeAlpha: number;
    pitColor: string;
    cameraColor: string;
    farTreeTint: string;
    sunTint: string;
    cloudTint: string;
    clouds: { seed: number; count: number };
    farTrees: { seed: number; texture?: string };
    /** Mostra o sol/lua (padrão: sim). */
    sun?: boolean;
    hills: { far: HillColors; mid: HillColors; near: HillColors };
  };
  decoration: {
    /** `meadow` (árvores, arbustos, cercas) ou `cave` (estalagmites). */
    style?: "meadow" | "cave";
    seed: number;
    flowerColors: string[];
    signX: number;
    butterflies: { count: number; startX: number; spacing: number };
  };
}

/** Ajustes de "game feel" do personagem (acelerações em px/s², tempos em ms). */
export interface MovementConfig {
  groundAccel: number;
  groundDecel: number;
  turnAccel: number;
  airAccel: number;
  airDecel: number;
  fallGravityMultiplier: number;
  apexSpeedThreshold: number;
  apexGravityFactor: number;
  jumpCutFactor: number;
  maxFallSpeed: number;
  coyoteMs: number;
  jumpBufferMs: number;
}

/**
 * Moedas perto da beirada de uma plataforma sobem um pouco, para dar para pegá-las em
 * pleno pulo sem cair (valores em px).
 */
export interface CoinPlacement {
  /** Distância horizontal da beirada em que a moeda é considerada "perto". */
  edgeMargin: number;
  /** Quanto a moeda sobe. */
  edgeLift: number;
  /** Só moedas até essa altura acima do topo da plataforma são ajustadas. */
  maxHeightAbovePlatform: number;
}

/** Formato de `game.json`: regras e textos compartilhados por todas as fases. */
interface GameFile {
  coinPlacement: CoinPlacement;
  player: {
    size: { width: number; height: number };
    walkSpeed: number;
    runSpeed: number;
    jumpSpeed: number;
    lives: number;
    movement: MovementConfig;
  };
  texts: {
    title: string;
    start: Omit<PanelTexts, "title">;
    won: { title: string; subtitle: string; detail: string; next: string };
    finished: PanelTexts;
    secret: string;
    extraLife: string;
    hundredCoins: string;
    over: { title: string };
    hud: { controls: string; label: string };
  };
}

type ColorKeys =
  | "skyTop"
  | "skyBottom"
  | "hazeColor"
  | "pitColor"
  | "cameraColor"
  | "farTreeTint"
  | "sunTint"
  | "cloudTint";

export interface HillStyle {
  fill: number;
  rim: number;
}

/** Fase pronta para uso: cores como números, moedas expandidas e regras do jogo anexadas. */
export interface LevelConfig {
  id: string;
  name: string;
  world: LevelFile["world"];
  goal: LevelFile["goal"];
  platforms: PlatformSpec[];
  coins: Point[];
  enemies: EnemySpec[];
  obstacles: ObstacleSpec[];
  secrets: SecretSpec[];
  extraLives: Point[];
  player: GameFile["player"] & { spawn: Point };
  texts: GameFile["texts"];
  background: Omit<LevelFile["background"], ColorKeys | "hills"> &
    Record<ColorKeys, number> & { hills: { far: HillStyle; mid: HillStyle; near: HillStyle } };
  decoration: Omit<LevelFile["decoration"], "flowerColors"> & { flowerColors: number[] };
}

export function hexColor(value: string): number {
  if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new Error(`Cor inválida em level.json: "${value}" (use #rrggbb).`);
  }
  return Number.parseInt(value.slice(1), 16);
}

function expandCoins(
  groups: CoinGroup[],
  platforms: readonly PlatformSpec[],
  placement: CoinPlacement,
): Point[] {
  const raw = groups.flatMap((group): Point[] => {
    if (group.type === "line") {
      return Array.from({ length: group.count }, (_, i) => ({
        x: group.x + i * group.step,
        y: group.y,
      }));
    }
    return Array.from({ length: group.count }, (_, i) => {
      const t = group.count === 1 ? 0.5 : i / (group.count - 1);
      return {
        x: group.centerX + (i - (group.count - 1) / 2) * group.step,
        y: group.baseY - Math.sin(t * Math.PI) * group.height,
      };
    });
  });
  return raw.map((coin) => liftNearEdges(coin, platforms, placement));
}

/** Sobe a moeda quando ela fica rente à beirada de uma plataforma logo abaixo dela. */
function liftNearEdges(
  coin: Point,
  platforms: readonly PlatformSpec[],
  { edgeMargin, edgeLift, maxHeightAbovePlatform }: CoinPlacement,
): Point {
  const nearEdge = platforms.some((p) => {
    const above = p.y - coin.y;
    if (above < 0 || above > maxHeightAbovePlatform) {
      return false;
    }
    return (
      Math.abs(coin.x - p.x) <= edgeMargin || Math.abs(coin.x - (p.x + p.width)) <= edgeMargin
    );
  });
  return nearEdge ? { x: coin.x, y: coin.y - edgeLift } : coin;
}

/** Substitui marcadores como `{coins}` nos textos configuráveis. */
export function formatText(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

function hill({ fill, rim }: HillColors): HillStyle {
  return { fill: hexColor(fill), rim: hexColor(rim) };
}

function parseLevel(file: LevelFile, rules: GameFile): LevelConfig {
  if (file.platforms.length === 0) {
    throw new Error(`Fase "${file.id}": precisa de ao menos uma plataforma.`);
  }
  if (!Number.isInteger(rules.player.lives) || rules.player.lives < 1) {
    throw new Error("game.json: player.lives deve ser um inteiro maior que zero.");
  }
  file.enemies.forEach((enemy) => {
    if (enemy.type === "spider") {
      if (enemy.anchorY === undefined || !enemy.length) {
        throw new Error(`Fase "${file.id}": aranha precisa de anchorY e length.`);
      }
      return;
    }
    if (enemy.minX >= enemy.maxX || enemy.x < enemy.minX || enemy.x > enemy.maxX) {
      throw new Error(`Fase "${file.id}": inimigo com limites inválidos (minX < x < maxX).`);
    }
  });
  const { background, decoration } = file;
  return {
    id: file.id,
    name: file.name,
    world: file.world,
    goal: file.goal,
    platforms: file.platforms,
    coins: expandCoins(file.coins, file.platforms, rules.coinPlacement),
    enemies: file.enemies,
    obstacles: file.obstacles,
    secrets: file.secrets,
    extraLives: file.extraLives,
    player: { ...rules.player, spawn: file.spawn },
    texts: rules.texts,
    background: {
      ...background,
      skyTop: hexColor(background.skyTop),
      skyBottom: hexColor(background.skyBottom),
      hazeColor: hexColor(background.hazeColor),
      pitColor: hexColor(background.pitColor),
      cameraColor: hexColor(background.cameraColor),
      farTreeTint: hexColor(background.farTreeTint),
      sunTint: hexColor(background.sunTint),
      cloudTint: hexColor(background.cloudTint),
      hills: {
        far: hill(background.hills.far),
        mid: hill(background.hills.mid),
        near: hill(background.hills.near),
      },
    },
    decoration: { ...decoration, flowerColors: decoration.flowerColors.map(hexColor) },
  };
}

const rules = game as unknown as GameFile;

/** Fases em ordem de jogo. Para adicionar uma, crie `levels/level-N.json` e inclua aqui. */
export const levels: LevelConfig[] = [level1, level2, level3, level4, level5].map((file) =>
  parseLevel(file as unknown as LevelFile, rules),
);
