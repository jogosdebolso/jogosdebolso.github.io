import Phaser from "phaser";
import { RASTRO_ENEMY_ROSTER, RASTRO_TEXTURE_KEYS } from "../constants";
import { RASTRO_GAME_CONFIG } from "../gameConfig";
import { RASTRO_LEVELS } from "../levelConfig";

/**
 * Páginas da tela de vitória, em sequência automática com fade entre elas:
 * 0 = galeria de inimigos (no cenário da última fase, em continuidade com o
 * fim do jogo); 1..N = chefe de cada fase, na ordem, no seu próprio cenário;
 * N+1 = parabéns, de volta ao cenário da última fase (qualquer tecla ou
 * clique volta ao início).
 */
export const VICTORY_PAGE_COUNT = RASTRO_LEVELS.length + 2;

/** Índice da fase cujo cenário serve de fundo para a página. */
export function getVictoryPhaseIndex(page: number): number {
  if (page === 0 || page === VICTORY_PAGE_COUNT - 1) {
    return RASTRO_LEVELS.length - 1;
  }
  return page - 1;
}

const FONT = "system-ui, sans-serif";
const INPUT_LOCK_MS = 900;
const FADE_MS = 900;
const FADE_COLOR = [8, 13, 32] as const;
/** Tempo de leitura de cada página antes do fade para a próxima. */
const ENEMIES_PAGE_MS = 10000;
const BOSS_PAGE_MS = 7500;

export function showVictoryPage(
  scene: Phaser.Scene,
  page: number,
  resolution: number,
  onNext: () => void,
  onExit: () => void,
): void {
  const { width, height } = scene.scale;
  const centerX = width / 2;
  const texts = RASTRO_GAME_CONFIG.texts;
  const isCongrats = page === VICTORY_PAGE_COUNT - 1;

  scene.add
    .rectangle(centerX, height / 2, width, height, 0x080d20, page > 0 && !isCongrats ? 0.2 : 0.68)
    .setDepth(20);

  const addText = (
    x: number,
    y: number,
    value: string,
    size: number,
    color = "#f8fafc",
    wrap = width - 48,
  ) =>
    scene.add
      .text(x, y, value, {
        color,
        fontFamily: FONT,
        fontSize: `${size}px`,
        fontStyle: "bold",
        align: "center",
        stroke: "#080d20",
        strokeThickness: 4,
        wordWrap: { width: wrap },
        resolution,
      })
      .setOrigin(0.5)
      .setDepth(21);

  if (page === 0) {
    addText(centerX, height * 0.14, texts.victoryEnemiesTitle.toUpperCase(), 32);
    const columns = Math.min(5, RASTRO_ENEMY_ROSTER.length);
    const cell = Math.min(width / columns, 190);
    const rows = Math.ceil(RASTRO_ENEMY_ROSTER.length / columns);
    const top = height * 0.3;
    const rowHeight = Math.min(150, (height * 0.5) / rows);
    RASTRO_ENEMY_ROSTER.forEach((enemy, index) => {
      const row = Math.floor(index / columns);
      const inRow = Math.min(columns, RASTRO_ENEMY_ROSTER.length - row * columns);
      const x = centerX + (index - row * columns - (inRow - 1) / 2) * cell;
      const y = top + row * rowHeight;
      const image = scene.add.image(x, y, enemy.texture).setDepth(21);
      image.setScale(Math.min(84, cell * 0.6) / Math.max(image.width, image.height));
      addText(x, y + rowHeight * 0.4, enemy.name, 16, "#cbd5e1", cell);
    });
  } else if (!isCongrats) {
    const level = RASTRO_LEVELS[page - 1];
    const bossEvent = level.events.find((event) => event.boss && event.boss.final !== false);
    const boss = bossEvent?.boss;
    if (boss) {
      addText(centerX, height * 0.12, level.name.toUpperCase(), 16, "#94a3b8");
      addText(centerX, height * 0.2, boss.name, 38);
      const image = scene.add
        .image(centerX, height * 0.52, `${RASTRO_TEXTURE_KEYS.bossPrefix}${boss.art ?? level.id}`)
        .setDepth(21);
      image.setScale(Math.min(width * 0.6, 460, height * 0.5 * (image.width / image.height)) / image.width);
      scene.tweens.add({
        targets: image,
        y: image.y - 10,
        duration: 1800,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  } else {
    addText(centerX, height * 0.38, texts.victoryCongratsTitle.toUpperCase(), 52, "#fde68a");
    addText(centerX, height * 0.52, texts.victoryCongratsMessage, 20, "#f8fafc", Math.min(width - 48, 560));
    const hint = addText(centerX, height * 0.8, texts.victoryExitHint, 15, "#94a3b8");
    scene.tweens.add({ targets: hint, alpha: 0.35, duration: 900, yoyo: true, repeat: -1 });
  }

  const camera = scene.cameras.main;
  camera.fadeIn(FADE_MS, ...FADE_COLOR);

  let leaving = false;
  const leave = (action: () => void): void => {
    if (leaving) {
      return;
    }
    leaving = true;
    camera.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, action);
    camera.fadeOut(FADE_MS, ...FADE_COLOR);
  };

  let unlocked = false;
  scene.time.delayedCall(INPUT_LOCK_MS, () => {
    unlocked = true;
  });
  const skip = (): void => {
    if (unlocked) {
      leave(isCongrats ? onExit : onNext);
    }
  };

  if (!isCongrats) {
    // Avança sozinha; clique, Enter ou Espaço apenas adiantam.
    scene.time.delayedCall(page === 0 ? ENEMIES_PAGE_MS : BOSS_PAGE_MS, () =>
      leave(onNext),
    );
    scene.input.keyboard?.on("keydown-ENTER", skip);
    scene.input.keyboard?.on("keydown-SPACE", skip);
    scene.input.on("pointerdown", skip);
  } else {
    scene.input.keyboard?.on("keydown", skip);
    scene.input.on("pointerdown", skip);
  }
}
