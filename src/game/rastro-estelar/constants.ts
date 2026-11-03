export const RASTRO_REFERENCE_VIEWPORT = {
  width: 1280,
  height: 720,
} as const;

export const RASTRO_TEXTURE_KEYS = {
  asteroid: "space-asteroid",
  shot: "space-shot",
  enemyShot: "space-enemy-shot",
  bossShotPrefix: "space-boss-shot-",
  crate: "space-crate",
  powerUpPrefix: "space-powerup-",
  laserShot: "space-laser-shot",
  missileShot: "space-missile-shot",
  satellite: "space-satellite",
  probe: "space-probe",
  enemyPrefix: "space-enemy-",
  bossPrefix: "space-boss-",
} as const;

/** Nomes exibidos na galeria de inimigos da tela de vitória. */
export const RASTRO_ENEMY_ROSTER = [
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}cometa`, name: "Cometa" },
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}vanguarda`, name: "Vanguarda" },
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}vespa`, name: "Vespa" },
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}espectro`, name: "Espectro" },
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}bastiao`, name: "Bastião" },
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}atirador`, name: "Atirador" },
  { texture: `${RASTRO_TEXTURE_KEYS.enemyPrefix}fantasma`, name: "Fantasma" },
  { texture: RASTRO_TEXTURE_KEYS.satellite, name: "Satélite" },
  { texture: RASTRO_TEXTURE_KEYS.probe, name: "Sonda" },
] as const;
