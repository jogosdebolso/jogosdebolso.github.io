/** Valores fixos de implementação. O que é ajustável pela fase fica em `level.json`. */

export const CAP_SURFACE = 8; // linha da superfície dentro da textura "grass-cap"
export const HERO_FRAMES = 8;
export const COIN_FRAMES = 6;
export const GOAL_FRAMES = 4;
export const ENEMY_FRAMES = 4;
export const UI_FONT = "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif";

/**
 * Ordem de profundidade. Tudo com valor menor que `HAZE` fica atrás da camada do
 * jogador e é suavizado pela névoa; o restante permanece com a cor cheia.
 */
export const DEPTH = {
  SKY: -10,
  SUN: -9,
  CLOUDS: -8,
  HILLS_FAR: -7,
  HILLS_MID: -6,
  HILLS_NEAR: -5,
  FAR_TREES: -4.5,
  BACK_TREE: -2,
  BACK_BUSH: -1.6,
  BACK_FENCE: -1.55,
  BACK_SIGN: -1.5,
  HAZE: -1.45,
  GOAL: -1.4,
  PIT: -1.3,
  DIRT: -1.1,
  DEPTH_SHADE: -0.9,
  GRASS_CAP: -0.8,
  GRASS_TUFT: 0.4,
  FRONT_DECOR: 0.5,
  COIN: 0.7,
  ENEMY: 0.75,
  THORNS: 0.55,
  BUTTERFLY: 0.8,
  DUST: 0.9,
  HERO: 1,
  EFFECT: 1.5,
  FRONT_TUFT: 2,
  SECRET_COVER: 2.5,
  HUD: 20,
  PANEL: 30,
} as const;

/** Espaço extra à direita do mundo para o herói correr para fora da tela ao vencer. */
export const EXIT_MARGIN = 800;
