import Phaser from "phaser";
import {
  createPlayerShip,
  getPlayerShipObjects,
  updatePlayerShipVisuals,
} from "./components/PlayerShip";
import type { PlayerShipVisuals } from "./components/PlayerShip";
import { createRastroTextures } from "./components/ShipTextures";
import {
  drawCygnusBlackHoleAnimation,
  getCygnusBlackHoleGeometry,
  drawSpaceBackground as renderSpaceBackground,
} from "./components/SpaceBackground";
import { MovingStarfield } from "./components/MovingStarfield";
import { GravityStarfield } from "./components/GravityStarfield";
import { createExplosion } from "./components/Explosion";
import {
  RASTRO_REFERENCE_VIEWPORT,
  RASTRO_TEXTURE_KEYS,
} from "./constants";
import { RASTRO_GAME_CONFIG } from "./gameConfig";
import { RASTRO_LEVELS } from "./levelConfig";
import type { RastroLevel, RastroLevelEvent } from "./levelConfig";
import { IonStorm, PlasmaWaves } from "./components/Hazards";
import {
  VICTORY_PAGE_COUNT,
  getVictoryPhaseIndex,
  showVictoryPage,
} from "./components/VictoryScreen";
import type {
  Asteroid,
  Enemy,
  EnemyShot,
  EnemySpawnSettings,
  PlayerShot,
  PowerUp,
  WeaponKind,
} from "./types";

interface DebugSettings {
  damageDisabled: boolean;
  freezeEnabled: boolean;
  infiniteLives?: boolean;
}

export class RastroEstelarScene extends Phaser.Scene {
  private static readonly DEBUG_SETTINGS_KEY = "rastro-estelar-debug-settings";

  private player!: Phaser.GameObjects.Container;
  private playerVisuals!: PlayerShipVisuals;
  private livesText!: Phaser.GameObjects.Text;
  private debugBar: Phaser.GameObjects.Text[] = [];
  private debugDamageToggle!: Phaser.GameObjects.Text;
  private debugFreezeToggle!: Phaser.GameObjects.Text;
  private debugAdvanceButton!: Phaser.GameObjects.Text;
  private stageAnnouncement!: Phaser.GameObjects.Text;
  private bossStatusText!: Phaser.GameObjects.Text;
  private bossHealthBar!: Phaser.GameObjects.Graphics;
  private background!: Phaser.GameObjects.Graphics;
  private blackHoleAnimation?: Phaser.GameObjects.Graphics;
  private movingStarfield?: MovingStarfield;
  private gravityStarfield?: GravityStarfield;
  private asteroids: Asteroid[] = [];
  private enemies: Enemy[] = [];
  private playerShots: PlayerShot[] = [];
  private enemyShots: EnemyShot[] = [];
  private bossVolleyCount = 0;
  /** Upgrades de tiro: caixa de metal -> item solto -> arma temporária. */
  private static readonly WEAPON_DURATION_MS = 18000;
  private static readonly MAX_LIVES = 4;
  private static readonly WEAPONS: Record<
    Exclude<WeaponKind, "normal">,
    { label: string; color: string }
  > = {
    duplo: { label: "TIRO DUPLO", color: "#fde047" },
    triplo: { label: "TIRO TRIPLO", color: "#86efac" },
    laser: { label: "LASER", color: "#67e8f9" },
    foguete: { label: "FOGUETES", color: "#fb923c" },
  };
  private weaponKind: WeaponKind = "normal";
  private weaponMsRemaining = 0;
  private weaponText!: Phaser.GameObjects.Text;
  private powerUps: PowerUp[] = [];
  private crateElapsedMs = 0;
  private nextCrateMs = 14000;
  /** Inimigos agendados (delayMs) que ainda não nasceram. */
  private pendingSpawns = 0;
  private ionStorm!: IonStorm;
  private plasmaWaves!: PlasmaWaves;
  /** Configuração do setor atual (definida pelos eventos da fase). */
  private minionRate = 1;
  private asteroidVariants: number[] = [];
  private asteroidIntervalMs: number = RASTRO_GAME_CONFIG.asteroids.spawnIntervalMs;
  private asteroidRandom!: () => number;
  private asteroidSpawnElapsed = 0;
  private enemySpawnElapsed = 0;
  private shotCooldownElapsed = 0;
  private invulnerabilityMsRemaining = 0;
  private isColliding = false;
  private isFiring = false;
  private hasStarted = false;
  /** Página da tela de vitória (undefined = jogo normal). */
  private victoryPage?: number;
  private isPlaying = false;
  /** Toque/arrasto: ponteiro que controla a nave e deslocamento acumulado. */
  private touchPointerId?: number;
  private touchLastX = 0;
  private touchLastY = 0;
  private touchDX = 0;
  private touchDY = 0;
  private resizeFrame?: number;
  private lastWidth = 0;
  private lastHeight = 0;
  private hudExtraY = 0;
  private overlay?: Phaser.GameObjects.Container;
  private rebuildOverlay?: () => void;
  private debugDamageDisabled = false;
  private debugFreezeEnabled = false;
  private debugInfiniteLives = false;
  private debugLivesToggle!: Phaser.GameObjects.Text;
  private debugAdvanceHeld = false;
  private lives = RASTRO_GAME_CONFIG.lives;
  private phaseIndex = 0;
  private phase!: RastroLevel;
  private phaseElapsedMs = 0;
  private nextPhaseEventIndex = 0;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private movementKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
  };

  /** Quanto o nave anda por pixel arrastado (dedo na tela). */
  private static readonly TOUCH_SENSITIVITY = 1.6;

  constructor() {
    super("RastroEstelarScene");
  }

  init(data?: {
    lives?: number;
    hasStarted?: boolean;
    phaseIndex?: number;
    victoryPage?: number;
  }): void {
    this.lives = RASTRO_GAME_CONFIG.lives;
    if (data?.lives !== undefined) {
      this.lives = data.lives;
    }

    if (data?.hasStarted !== undefined) {
      this.hasStarted = data.hasStarted;
    }
    this.victoryPage = data?.victoryPage;
    this.phaseIndex = data?.phaseIndex ?? 0;
    const phase = RASTRO_LEVELS[this.phaseIndex];
    if (!phase) {
      throw new Error(`Fase inválida de Rastro Estelar: ${this.phaseIndex + 1}.`);
    }
    this.phase = phase;
  }

  create(): void {
    this.background = this.add.graphics().setDepth(-10);
    this.drawSpaceBackground();
    if (this.phase.id >= 6) {
      this.blackHoleAnimation = this.add.graphics().setDepth(-9);
    }
    if (this.phase.id === 7) {
      this.gravityStarfield = new GravityStarfield(this);
    } else {
      // Fase 6: poucas estrelas, rente às laterais, ao redor do buraco negro.
      this.movingStarfield =
        this.phase.id === 6
          ? new MovingStarfield(this, 85, true)
          : new MovingStarfield(this);
    }
    this.lastWidth = this.scale.width;
    this.lastHeight = this.scale.height;
    this.touchPointerId = undefined;
    this.touchDX = 0;
    this.touchDY = 0;
    this.overlay = undefined;
    this.rebuildOverlay = undefined;
    this.scale.on(Phaser.Scale.Events.RESIZE, this.queueResize, this);
    this.input.on("pointerdown", this.handlePointerDown, this);
    this.input.on("pointermove", this.handlePointerMove, this);
    this.input.on("pointerup", this.handlePointerUp, this);
    this.input.on("pointerupoutside", this.handlePointerUp, this);
    this.input.on("gameout", this.releaseTouch, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.resizeFrame !== undefined) {
        window.cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = undefined;
      }
      this.scale.off(Phaser.Scale.Events.RESIZE, this.queueResize, this);
      this.input.off("pointerdown", this.handlePointerDown, this);
      this.input.off("pointermove", this.handlePointerMove, this);
      this.input.off("pointerup", this.handlePointerUp, this);
      this.input.off("pointerupoutside", this.handlePointerUp, this);
      this.input.off("gameout", this.releaseTouch, this);
      this.input.off("pointerup", this.stopDebugAdvance, this);
    });

    createRastroTextures(this);
    if (this.victoryPage !== undefined) {
      this.showVictory(this.victoryPage);
      return;
    }
    this.asteroidRandom = this.createRandom(Date.now() % 2147483647 || 1);
    this.asteroids = [];
    this.enemies = [];
    this.playerShots = [];
    this.enemyShots = [];
    this.powerUps = [];
    this.weaponKind = "normal";
    this.weaponMsRemaining = 0;
    this.crateElapsedMs = 0;
    this.nextCrateMs = 14000;
    this.pendingSpawns = 0;
    this.asteroidSpawnElapsed = 0;
    this.enemySpawnElapsed = 0;
    this.shotCooldownElapsed = 0;
    this.invulnerabilityMsRemaining = 0;
    this.phaseElapsedMs = 0;
    this.nextPhaseEventIndex = 0;
    this.isFiring = false;
    this.isColliding = false;
    this.isPlaying = this.hasStarted;
    this.minionRate = 1;
    this.asteroidVariants = [];
    this.asteroidIntervalMs = RASTRO_GAME_CONFIG.asteroids.spawnIntervalMs;
    this.ionStorm = new IonStorm(this);
    this.plasmaWaves = new PlasmaWaves(this);
    const firstEvent = this.phase.events[0];
    if (firstEvent && firstEvent.atMs === 0) {
      this.applySectorEnvironment(firstEvent);
    }
    if (this.asteroidVariants.length > 0) {
      this.phase.initialAsteroids.forEach(({ progress, lane, speed }) =>
        this.spawnAsteroid(progress, lane, speed),
      );
    }
    const textResolution = this.getTextResolution();

    this.livesText = this.add
      .text(
        this.scale.width - 24,
        28,
        `${RASTRO_GAME_CONFIG.texts.livesLabel}: ${this.lives}`,
        {
        color: "#fca5a5",
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        fontStyle: "bold",
        resolution: textResolution,
        },
      )
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10);

    this.weaponText = this.add
      .text(this.scale.width - 24, 54, "", {
        color: "#fde047",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        resolution: textResolution,
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10)
      .setVisible(false);

    this.createDebugPanel();

    this.stageAnnouncement = this.add
      .text(this.scale.width / 2, this.scale.height * 0.2, "", {
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        fontSize: "36px",
        fontStyle: "bold",
        align: "center",
        stroke: "#111827",
        strokeThickness: 6,
        wordWrap: { width: this.scale.width - 48 },
        resolution: textResolution,
      })
      .setOrigin(0.5)
      .setDepth(12)
      .setAlpha(0);
    this.bossStatusText = this.add
      .text(this.scale.width / 2, 78, "", {
        color: "#fecaca",
        fontFamily: "system-ui, sans-serif",
        fontSize: "14px",
        fontStyle: "bold",
        resolution: textResolution,
      })
      .setOrigin(0.5, 0)
      .setDepth(10)
      .setVisible(false);
    this.bossHealthBar = this.add.graphics().setDepth(10).setVisible(false);
    this.layoutHud();

    const centerX = this.scale.width / 2;
    const centerY = this.getPlayerStartY();

    this.playerVisuals = createPlayerShip(this, centerX, centerY);
    this.player = this.playerVisuals.player;
    this.phase.initialEnemies.forEach(({ progress, lane, variant, size, speed }) =>
      this.spawnEnemy(progress, lane, { variant, size, speed }),
    );

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("O teclado não está disponível nesta cena.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.movementKeys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    keyboard.on("keydown-SPACE", this.startFiring, this);
    keyboard.on("keyup-SPACE", this.stopFiring, this);
    keyboard.on("keydown-SHIFT", this.startDebugAdvance, this);
    keyboard.on("keyup-SHIFT", this.stopDebugAdvance, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off("keydown-SPACE", this.startFiring, this);
      keyboard.off("keyup-SPACE", this.stopFiring, this);
      keyboard.off("keydown-SHIFT", this.startDebugAdvance, this);
      keyboard.off("keyup-SHIFT", this.stopDebugAdvance, this);
    });

    if (!this.hasStarted) {
      this.showStartScreen();
    }
  }

  update(time: number, delta: number): void {
    this.movingStarfield?.update(
      delta,
      this.scale.width,
      this.scale.height,
      this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY,
    );

    this.gravityStarfield?.update(
      delta,
      this.scale.width,
      this.scale.height,
      getCygnusBlackHoleGeometry(this.scale.width, this.scale.height, true),
    );

    if (this.blackHoleAnimation) {
      drawCygnusBlackHoleAnimation(
        this.blackHoleAnimation,
        this.scale.width,
        this.scale.height,
        time,
        this.phase.id === 7,
        this.phase.id === 7 ? "fluxo" : undefined,
      );
    }

    if (!this.isPlaying || this.isColliding) {
      this.touchDX = 0;
      this.touchDY = 0;
      return;
    }

    this.invulnerabilityMsRemaining = Math.max(
      0,
      this.invulnerabilityMsRemaining - delta,
    );
    const obstacleDelta =
      !this.debugFreezeEnabled || this.debugAdvanceHeld ? delta : 0;
    this.phaseElapsedMs += obstacleDelta;
    if (obstacleDelta > 0) {
      this.processPhaseEvents();
    }
    this.updateAsteroids(obstacleDelta);

    const keyHorizontal =
      Number(this.cursors.right.isDown || this.movementKeys.right.isDown) -
      Number(this.cursors.left.isDown || this.movementKeys.left.isDown);
    const keyVertical =
      Number(this.cursors.down.isDown || this.movementKeys.down.isDown) -
      Number(this.cursors.up.isDown || this.movementKeys.up.isDown);
    const touchMoveX = this.touchDX * RastroEstelarScene.TOUCH_SENSITIVITY;
    const touchMoveY = this.touchDY * RastroEstelarScene.TOUCH_SENSITIVITY;
    this.touchDX = 0;
    this.touchDY = 0;
    const direction = new Phaser.Math.Vector2(keyHorizontal, keyVertical).normalize();
    const distanceX =
      RASTRO_GAME_CONFIG.player.speed *
      (this.scale.width / RASTRO_REFERENCE_VIEWPORT.width) *
      (delta / 1000);
    const distanceY =
      RASTRO_GAME_CONFIG.player.speed *
      (this.scale.height / RASTRO_REFERENCE_VIEWPORT.height) *
      (delta / 1000);
    const horizontalInput = Phaser.Math.Clamp(
      keyHorizontal + touchMoveX / Math.max(distanceX, 0.001),
      -1,
      1,
    );
    const vertical = Phaser.Math.Clamp(
      keyVertical + touchMoveY / Math.max(distanceY, 0.001),
      -1,
      1,
    );
    const horizonY = this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY;
    const perspective = Phaser.Math.Clamp(
      (this.player.y - horizonY) / (this.scale.height - horizonY),
      0,
      1,
    );
    const targetScale =
      RASTRO_GAME_CONFIG.player.minScale +
      perspective * RASTRO_GAME_CONFIG.player.scaleRange;
    const targetRotation = horizontalInput * RASTRO_GAME_CONFIG.player.rotation;
    const motionBlend =
      1 - Math.exp(-delta / RASTRO_GAME_CONFIG.player.rotationSmoothingMs);
    const halfWidth = (this.player.width * targetScale) / 2;
    const halfHeight = (this.player.height * targetScale) / 2;
    const minimumY = horizonY + halfHeight;

    this.player.x = Phaser.Math.Clamp(
      this.player.x + direction.x * distanceX + touchMoveX,
      halfWidth,
      this.scale.width - halfWidth,
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y + direction.y * distanceY + touchMoveY,
      minimumY,
      this.scale.height - halfHeight,
    );
    this.player.setScale(targetScale);
    this.player.rotation = Phaser.Math.Linear(
      this.player.rotation,
      targetRotation,
      motionBlend,
    );
    this.player.setDepth(1 + perspective * 0.35);

    updatePlayerShipVisuals(
      this.playerVisuals,
      perspective,
      time,
      vertical,
    );

    this.updateEnemies(obstacleDelta);
    this.updateEnemyShots(obstacleDelta);
    this.updateBossHud();
    this.updatePlayerShots(delta);
    this.updatePowerUps(delta);
    const planet = this.phase.background.planet;
    const sunX = this.scale.width * planet.x;
    const sunY = this.scale.height * planet.y;
    const sunRadius = Math.min(this.scale.width, this.scale.height) * planet.radius;
    this.ionStorm.update(obstacleDelta, this.scale.width, this.scale.height, this.player.x);
    this.plasmaWaves.update(
      obstacleDelta,
      this.scale.width,
      this.scale.height,
      sunX,
      sunY,
      sunRadius,
    );
    if (
      !this.debugDamageDisabled &&
      this.isPlaying &&
      !this.isColliding &&
      this.invulnerabilityMsRemaining === 0
    ) {
      const halfWidth = this.player.displayWidth / 2;
      if (
        this.ionStorm.hits(this.player.x, halfWidth) ||
        this.plasmaWaves.hits(this.player.x, this.player.y, halfWidth, sunX, sunY)
      ) {
        this.triggerCollision();
        return;
      }
      this.checkAsteroidCollisions();
    }
  }

  private createDebugPanel(): void {
    this.loadDebugSettings();

    const makeButton = (label: string, color = "#cbd5e1", background = "#1e293b") =>
      this.add
        .text(0, 0, label, {
          color,
          backgroundColor: background,
          fontFamily: "system-ui, sans-serif",
          fontSize: "11px",
          fontStyle: "bold",
          padding: { x: 7, y: 4 },
          resolution: this.getTextResolution(),
        })
        .setInteractive({ useHandCursor: true });

    this.debugDamageToggle = makeButton("");
    this.debugFreezeToggle = makeButton("");
    this.debugLivesToggle = makeButton("");
    this.debugAdvanceButton = makeButton("Avançar (Shift)");
    const previousPhaseButton = makeButton("◀");
    const restartPhaseButton = makeButton("↻");
    const nextPhaseButton = makeButton("▶");
    const phaseLabel = makeButton(`Fase ${this.phase.id}/${RASTRO_LEVELS.length}`, "#fde68a");
    phaseLabel.disableInteractive();
    const debugBossButton = makeButton("Chefe", "#fda4af", "#3f1d2b");
    this.debugBar = [
      this.debugDamageToggle,
      this.debugFreezeToggle,
      this.debugLivesToggle,
      this.debugAdvanceButton,
      previousPhaseButton,
      phaseLabel,
      restartPhaseButton,
      nextPhaseButton,
      debugBossButton,
    ];

    this.debugDamageToggle.on("pointerdown", () => {
      this.debugDamageDisabled = !this.debugDamageDisabled;
      this.saveDebugSettings();
      this.updateDebugDamageToggle();
    });
    this.debugFreezeToggle.on("pointerdown", () => {
      this.debugFreezeEnabled = !this.debugFreezeEnabled;
      this.saveDebugSettings();
      this.updateDebugFreezeToggle();
    });
    this.debugLivesToggle.on("pointerdown", () => {
      this.debugInfiniteLives = !this.debugInfiniteLives;
      this.saveDebugSettings();
      this.updateDebugLivesToggle();
    });
    this.debugAdvanceButton.on("pointerdown", this.startDebugAdvance, this);
    previousPhaseButton.on("pointerdown", () => this.jumpToPhase(this.phaseIndex - 1));
    restartPhaseButton.on("pointerdown", () => this.jumpToPhase(this.phaseIndex));
    nextPhaseButton.on("pointerdown", () => this.jumpToPhase(this.phaseIndex + 1));
    debugBossButton.on("pointerdown", this.spawnBossAtDestination, this);
    this.input.on("pointerup", this.stopDebugAdvance, this);
    this.updateDebugDamageToggle();
    this.updateDebugFreezeToggle();
    this.updateDebugLivesToggle();
  }

  /** Barra única no alto da tela: botões lado a lado, pequenos e discretos. */
  private layoutDebugBar(): void {
    let x = 12;
    let y = 8;
    for (const button of this.debugBar) {
      if (x > 12 && x + button.width > this.scale.width - 12) {
        x = 12;
        y += 24;
      }
      button.setPosition(x, y).setDepth(30).setScrollFactor(0);
      x += button.width + 4;
    }
    // Barra com várias linhas (tela estreita): empurra o HUD para baixo.
    this.hudExtraY = y - 8;
    this.layoutHud();
  }

  /** Reposiciona os textos do HUD conforme o tamanho atual da tela. */
  private layoutHud(): void {
    const { width, height } = this.scale;
    this.livesText?.setPosition(width - 24, 28 + this.hudExtraY);
    this.weaponText?.setPosition(width - 24, 54 + this.hudExtraY);
    this.bossStatusText?.setPosition(width / 2, 78 + this.hudExtraY);
    this.stageAnnouncement
      ?.setPosition(width / 2, height * 0.2)
      .setWordWrapWidth(width - 48);
  }

  private queueResize(): void {
    if (this.resizeFrame !== undefined) {
      return;
    }
    // Um único redesenho por quadro: rotacionar a tela dispara vários eventos.
    this.resizeFrame = window.requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.applyResize();
    });
  }

  private applyResize(): void {
    const { width, height } = this.scale;
    if (width === this.lastWidth && height === this.lastHeight) {
      return;
    }
    if (!this.sys.isActive()) {
      return;
    }

    if (this.victoryPage !== undefined) {
      this.showVictoryPageScene(this.victoryPage);
      return;
    }

    const ratioX = width / Math.max(this.lastWidth, 1);
    const ratioY = height / Math.max(this.lastHeight, 1);
    this.lastWidth = width;
    this.lastHeight = height;
    this.drawSpaceBackground();
    if (this.player) {
      this.player.setPosition(this.player.x * ratioX, this.player.y * ratioY);
    }
    this.layoutDebugBar();
    this.rebuildOverlay?.();
  }

  private handlePointerDown(
    pointer: Phaser.Input.Pointer,
    over: Phaser.GameObjects.GameObject[],
  ): void {
    if (over.length > 0 || this.touchPointerId !== undefined || !this.player) {
      return;
    }
    this.touchPointerId = pointer.id;
    this.touchLastX = pointer.x;
    this.touchLastY = pointer.y;
    this.startFiring();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.touchPointerId) {
      return;
    }
    this.touchDX += pointer.x - this.touchLastX;
    this.touchDY += pointer.y - this.touchLastY;
    this.touchLastX = pointer.x;
    this.touchLastY = pointer.y;
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.touchPointerId) {
      this.releaseTouch();
    }
  }

  private releaseTouch(): void {
    if (this.touchPointerId === undefined) {
      return;
    }
    this.touchPointerId = undefined;
    this.touchDX = 0;
    this.touchDY = 0;
    this.stopFiring();
  }

  /** Escala da interface: telas pequenas (celular) usam textos menores. */
  private getUiScale(): number {
    return Phaser.Math.Clamp(
      Math.min(this.scale.height / 600, this.scale.width / 480),
      0.7,
      1,
    );
  }

  /** Empilha os textos na vertical, centralizados na tela. */
  private stackCentered(
    items: Phaser.GameObjects.Text[],
    gaps: number[],
  ): void {
    const total =
      items.reduce((sum, item) => sum + item.height, 0) +
      gaps.reduce((sum, gap) => sum + gap, 0);
    let y = Math.max(8, (this.scale.height - total) / 2);
    items.forEach((item, index) => {
      item.setOrigin(0.5, 0).setPosition(this.scale.width / 2, y);
      y += item.height + (gaps[index] ?? 0);
    });
  }

  private loadDebugSettings(): void {
    this.debugDamageDisabled = false;
    this.debugFreezeEnabled = false;
    this.debugInfiniteLives = false;

    try {
      const saved = window.localStorage.getItem(
        RastroEstelarScene.DEBUG_SETTINGS_KEY,
      );
      if (saved === null) {
        return;
      }

      const settings: unknown = JSON.parse(saved);
      if (
        typeof settings !== "object" ||
        settings === null ||
        !("damageDisabled" in settings) ||
        typeof settings.damageDisabled !== "boolean" ||
        !("freezeEnabled" in settings) ||
        typeof settings.freezeEnabled !== "boolean"
      ) {
        throw new Error("Formato de configuração de debug inválido.");
      }

      this.debugDamageDisabled = settings.damageDisabled;
      this.debugFreezeEnabled = settings.freezeEnabled;
      this.debugInfiniteLives =
        "infiniteLives" in settings && settings.infiniteLives === true;
    } catch (error) {
      console.error("Não foi possível carregar as opções de debug.", error);
    }
  }

  private saveDebugSettings(): void {
    const settings: DebugSettings = {
      damageDisabled: this.debugDamageDisabled,
      freezeEnabled: this.debugFreezeEnabled,
      infiniteLives: this.debugInfiniteLives,
    };

    try {
      window.localStorage.setItem(
        RastroEstelarScene.DEBUG_SETTINGS_KEY,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error("Não foi possível salvar as opções de debug.", error);
    }
  }

  private updateDebugDamageToggle(): void {
    this.debugDamageToggle
      .setText(
        this.debugDamageDisabled ? "Dano OFF" : "Dano ON",
      )
      .setStyle({
        color: this.debugDamageDisabled ? "#86efac" : "#cbd5e1",
        backgroundColor: this.debugDamageDisabled ? "#123524" : "#1e293b",
      });
    this.layoutDebugBar();
  }

  private updateDebugLivesToggle(): void {
    this.debugLivesToggle
      .setText(this.debugInfiniteLives ? "Vidas ∞ ON" : "Vidas ∞ OFF")
      .setStyle({
        color: this.debugInfiniteLives ? "#86efac" : "#cbd5e1",
        backgroundColor: this.debugInfiniteLives ? "#123524" : "#1e293b",
      });
    this.layoutDebugBar();
  }

  private updateDebugFreezeToggle(): void {
    this.debugFreezeToggle
      .setText(
        this.debugFreezeEnabled ? "Congelar ON" : "Congelar OFF",
      )
      .setStyle({
        color: this.debugFreezeEnabled ? "#86efac" : "#cbd5e1",
        backgroundColor: this.debugFreezeEnabled ? "#123524" : "#1e293b",
      });
    this.layoutDebugBar();
  }

  private jumpToPhase(phaseIndex: number): void {
    const targetPhaseIndex =
      (phaseIndex + RASTRO_LEVELS.length) % RASTRO_LEVELS.length;
    this.scene.restart({
      lives: RASTRO_GAME_CONFIG.lives,
      hasStarted: true,
      phaseIndex: targetPhaseIndex,
    });
  }

  private spawnBossAtDestination(): void {
    let bossEventIndex = -1;
    this.phase.events.forEach((event, index) => {
      if (event.boss) {
        bossEventIndex = index;
      }
    });
    const bossEvent = this.phase.events[bossEventIndex];
    if (!bossEvent?.boss) {
      throw new Error(`A fase ${this.phase.id} não tem um chefe configurado.`);
    }

    this.enemies
      .filter((enemy) => enemy.isBoss)
      .forEach((boss) => boss.image.destroy());
    this.enemies = this.enemies.filter((enemy) => !enemy.isBoss);

    this.phaseElapsedMs = Math.max(this.phaseElapsedMs, bossEvent.atMs);
    this.nextPhaseEventIndex = Math.max(
      this.nextPhaseEventIndex,
      bossEventIndex + 1,
    );
    this.spawnEnemy(1, bossEvent.boss.lane, {
      variant: bossEvent.boss.variant,
      size: bossEvent.boss.size,
      speed: bossEvent.boss.speed,
      bossName: bossEvent.boss.name,
      health: bossEvent.boss.health,
      bossArt: bossEvent.boss.art,
      finalBoss: bossEvent.boss.final,
    });
    this.updateEnemies(0);
    this.updateBossHud();
  }

  private startDebugAdvance(): void {
    this.debugAdvanceHeld = true;
  }

  private stopDebugAdvance(): void {
    this.debugAdvanceHeld = false;
  }

  private processPhaseEvents(): void {
    while (
      this.nextPhaseEventIndex < this.phase.events.length &&
      this.phase.events[this.nextPhaseEventIndex].atMs <= this.phaseElapsedMs
    ) {
      const event = this.phase.events[this.nextPhaseEventIndex];
      // Eventos "waitForClear" esperam o campo esvaziar (inimigos e chefes).
      if (
        event.waitForClear &&
        (this.enemies.length > 0 ||
          this.pendingSpawns > 0 ||
          this.asteroids.some((asteroid) => asteroid.crateHealth === undefined))
      ) {
        break;
      }
      this.nextPhaseEventIndex += 1;
      this.applySectorEnvironment(event);
      if (!event.boss) {
        this.showStageAnnouncement(event.title, this.nextPhaseEventIndex > 1);
      }
      event.wave?.forEach((spawn) => {
        const spawnNow = () =>
          this.spawnEnemy(0, spawn.lane, {
            variant: spawn.variant,
            size: spawn.size,
            speed: spawn.speed,
          });
        if (spawn.delayMs) {
          this.pendingSpawns += 1;
          this.time.delayedCall(spawn.delayMs, () => {
            this.pendingSpawns = Math.max(0, this.pendingSpawns - 1);
            if (this.isPlaying) {
              spawnNow();
            }
          });
        } else {
          spawnNow();
        }
      });
      if (event.boss) {
        this.spawnEnemy(0, event.boss.lane, {
          variant: event.boss.variant,
          size: event.boss.size,
          speed: event.boss.speed,
          bossName: event.boss.name,
          health: event.boss.health,
          bossArt: event.boss.art,
          finalBoss: event.boss.final,
        });
      }
    }
  }

  /** `alert`: pisca como alerta (eventos); o título da fase fica fixo. */
  private showStageAnnouncement(title: string, alert: boolean): void {
    this.stageAnnouncement.setText(title);
    this.stageAnnouncement
      .setPosition(this.scale.width / 2, this.scale.height * 0.2)
      .setAlpha(1);
    this.tweens.killTweensOf(this.stageAnnouncement);
    if (!alert) {
      this.tweens.add({
        targets: this.stageAnnouncement,
        alpha: 0,
        delay: 5200,
        duration: 900,
        ease: "Sine.easeIn",
      });
      return;
    }
    // Oscila só a opacidade, como um alerta (~7,6 s), e só então some devagar.
    this.tweens.add({
      targets: this.stageAnnouncement,
      alpha: 0.25,
      duration: 380,
      yoyo: true,
      repeat: 9,
      ease: "Sine.easeInOut",
      onComplete: () => {
        this.tweens.add({
          targets: this.stageAnnouncement,
          alpha: 0,
          duration: 900,
          ease: "Sine.easeIn",
        });
      },
    });
  }

  private updateBossHud(): void {
    const boss = this.enemies.find((enemy) => enemy.isBoss);
    if (!boss) {
      this.bossStatusText.setVisible(false);
      this.bossHealthBar.setVisible(false);
      return;
    }

    this.bossStatusText
      .setText(boss.bossName ?? "")
      .setVisible(true);
    this.bossHealthBar.setVisible(true).clear();
    const barWidth = Math.min(this.scale.width * 0.5, 280);
    const barX = (this.scale.width - barWidth) / 2;
    const barY = 100 + this.hudExtraY;
    this.bossHealthBar.fillStyle(0x1f2937, 0.92).fillRoundedRect(
      barX,
      barY,
      barWidth,
      10,
      5,
    );
    this.bossHealthBar.fillStyle(0xf43f5e, 1).fillRoundedRect(
      barX,
      barY,
      barWidth * (boss.health / boss.maxHealth),
      10,
      5,
    );
  }

  private checkAsteroidCollisions(): void {
    for (const obstacle of [...this.asteroids, ...this.enemies]) {
      const horizontalRadius =
        obstacle.image.displayWidth * RASTRO_GAME_CONFIG.collision.obstacleWidthFactor +
        this.player.width * this.player.scaleX *
          RASTRO_GAME_CONFIG.collision.playerWidthFactor;
      const verticalRadius =
        obstacle.image.displayHeight * RASTRO_GAME_CONFIG.collision.obstacleHeightFactor +
        this.player.height * this.player.scaleY *
          RASTRO_GAME_CONFIG.collision.playerHeightFactor;
      const horizontalDistance = (obstacle.image.x - this.player.x) / horizontalRadius;
      const verticalDistance = (obstacle.image.y - this.player.y) / verticalRadius;

      if (horizontalDistance ** 2 + verticalDistance ** 2 <= 1) {
        this.triggerCollision();
        return;
      }
    }
  }

  private triggerCollision(): void {
    this.enemyShots.forEach(({ image }) => image.destroy());
    this.enemyShots = [];
    this.isColliding = true;
    this.isPlaying = false;
    this.isFiring = false;
    this.setWeapon("normal");
    if (!this.debugInfiniteLives) {
      this.lives = Math.max(0, this.lives - 1);
    }
    this.livesText.setText(
      `${RASTRO_GAME_CONFIG.texts.livesLabel}: ${this.lives}`,
    );
    this.cameras.main.shake(
      RASTRO_GAME_CONFIG.collision.cameraShakeMs,
      RASTRO_GAME_CONFIG.collision.cameraShakeIntensity,
    );
    this.cameras.main.flash(RASTRO_GAME_CONFIG.collision.cameraFlashMs, 220, 245, 255);

    const explosionX = this.player.x;
    const explosionY = this.player.y;
    createExplosion(
      this,
      explosionX,
      explosionY,
      Math.max(this.player.displayWidth, this.player.displayHeight),
    );

    this.tweens.add({
      targets: getPlayerShipObjects(this.playerVisuals),
      alpha: 0,
      duration: 360,
      ease: "Cubic.easeIn",
    });
    this.tweens.add({
      targets: this.player,
      scale: 0.2,
      duration: 420,
      ease: "Cubic.easeIn",
    });

    this.time.delayedCall(RASTRO_GAME_CONFIG.collision.restartDelayMs, () => {
      if (this.lives > 0) {
        this.respawnPlayer();
      } else {
        this.showGameOver();
      }
    });
  }

  private respawnPlayer(): void {
    const centerX = this.scale.width / 2;
    const startY = this.getPlayerStartY();
    const horizonY = this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY;
    const perspective = Phaser.Math.Clamp(
      (startY - horizonY) / (this.scale.height - horizonY),
      0,
      1,
    );
    const scale =
      RASTRO_GAME_CONFIG.player.minScale +
      perspective * RASTRO_GAME_CONFIG.player.scaleRange;

    this.player.setPosition(centerX, startY).setScale(scale).setRotation(0);
    this.player.setAlpha(1);
    this.playerVisuals.shadow.setAlpha(1);
    updatePlayerShipVisuals(this.playerVisuals, perspective, this.time.now, 0);

    this.playerShots.forEach(({ image }) => image.destroy());
    this.playerShots = [];
    this.invulnerabilityMsRemaining = RASTRO_GAME_CONFIG.collision.invulnerabilityMs;
    this.isColliding = false;
    this.isPlaying = true;
  }

  private showGameOver(): void {
    const restart = (): void => {
      this.rebuildOverlay = undefined;
      this.scene.restart({
        lives: RASTRO_GAME_CONFIG.lives,
        hasStarted: false,
        phaseIndex: 0,
      });
    };

    const build = (): void => {
      this.overlay?.destroy();
      const { width, height } = this.scale;
      const ui = this.getUiScale();
      const resolution = this.getTextResolution();
      const container = this.add.container(0, 0).setDepth(20);
      this.overlay = container;
      container.add(
        this.add.rectangle(width / 2, height / 2, width, height, 0x080d20, 0.88).setInteractive(),
      );
      const title = this.add.text(0, 0, RASTRO_GAME_CONFIG.texts.gameOverTitle, {
        color: "#f9fafb",
        fontFamily: "system-ui, sans-serif",
        fontSize: `${Math.round(36 * ui)}px`,
        fontStyle: "bold",
        resolution,
      });
      const button = this.makeOverlayButton(
        RASTRO_GAME_CONFIG.texts.restartButton,
        ui,
        resolution,
      );
      container.add([title, button]);
      this.stackCentered([title, button], [Math.round(28 * ui)]);
      button.once("pointerdown", restart);
    };

    build();
    this.rebuildOverlay = build;
    this.input.keyboard?.once("keydown-ENTER", restart);
    this.input.keyboard?.once("keydown-SPACE", restart);
  }

  private makeOverlayButton(
    label: string,
    ui: number,
    resolution: number,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .text(0, 0, label, {
        color: "#111827",
        backgroundColor: "#67e8f9",
        fontFamily: "system-ui, sans-serif",
        fontSize: `${Math.round(16 * Math.max(ui, 0.85))}px`,
        fontStyle: "bold",
        padding: { x: 20, y: 14 },
        resolution,
      })
      .setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setStyle({ backgroundColor: "#a5f3fc" }));
    button.on("pointerout", () => button.setStyle({ backgroundColor: "#67e8f9" }));
    return button;
  }

  private showStartScreen(): void {
    this.livesText.setVisible(false);
    const texts = RASTRO_GAME_CONFIG.texts;
    const lines = this.sys.game.device.input.touch
      ? texts.startInstructionsTouch
      : texts.startInstructions;

    const startGame = (): void => {
      if (this.isPlaying || !this.overlay) {
        return;
      }

      this.hasStarted = true;
      this.isPlaying = true;
      this.livesText.setVisible(true);
      this.overlay.destroy();
      this.overlay = undefined;
      this.rebuildOverlay = undefined;
    };

    const build = (): void => {
      this.overlay?.destroy();
      const { width, height } = this.scale;
      const ui = this.getUiScale();
      const resolution = this.getTextResolution();
      const container = this.add.container(0, 0).setDepth(20);
      this.overlay = container;
      container.add(
        this.add.rectangle(width / 2, height / 2, width, height, 0x080d20, 0.84).setInteractive(),
      );
      const make = (text: string, size: number, color: string, extra = {}) =>
        this.add.text(0, 0, text, {
          color,
          fontFamily: "system-ui, sans-serif",
          fontSize: `${Math.round(size * ui)}px`,
          fontStyle: "bold",
          resolution,
          ...extra,
        });
      const title = make(texts.title.toUpperCase(), 40, "#f9fafb");
      const header = make(texts.startInstructionsTitle.toUpperCase(), 16, "#67e8f9");
      const list = make(lines.map((line) => `•  ${line}`).join("\n"), 15, "#cbd5e1", {
        fontStyle: "normal",
        lineSpacing: Math.round(8 * ui),
        wordWrap: { width: Math.min(width - 32, 460) },
      });
      const button = this.makeOverlayButton(texts.startButton, ui, resolution);
      container.add([title, header, list, button]);
      this.stackCentered(
        [title, header, list, button],
        [14, 10, 26].map((gap) => Math.round(gap * ui)),
      );
      button.once("pointerdown", startGame);
    };

    build();
    this.rebuildOverlay = build;
    this.input.keyboard?.once("keydown-ENTER", startGame);
    this.input.keyboard?.once("keydown-SPACE", startGame);
  }

  private spawnAsteroid(
    progress = 0,
    targetLane?: number,
    targetSpeed?: number,
  ): void {
    const lanes = RASTRO_GAME_CONFIG.asteroids.lanes;
    const lane =
      targetLane ?? lanes[Math.floor(this.asteroidRandom() * lanes.length)];
    const startX = 0.5 + lane * 0.48;
    const sideDirection = startX < 0.5 ? -1 : 1;
    const edgeDistance = Math.abs(startX - 0.5) * 2;
    const straightDown =
      this.asteroidRandom() < RASTRO_GAME_CONFIG.asteroids.straightDownChance;
    const [horizontalBase, horizontalSpread] =
      RASTRO_GAME_CONFIG.asteroids.horizontalTravel;
    const horizontalTravel = straightDown
      ? 0
      : horizontalBase + edgeDistance * horizontalSpread;
    const verticalDirection =
      this.asteroidRandom() < RASTRO_GAME_CONFIG.asteroids.downwardChance ? 1 : -1;
    const [downwardBase, downwardSpread] =
      RASTRO_GAME_CONFIG.asteroids.downwardTravel;
    const [upwardBase, upwardSpread] =
      RASTRO_GAME_CONFIG.asteroids.upwardTravel;
    const verticalTravel =
      verticalDirection > 0
        ? downwardBase + edgeDistance * downwardSpread
        : upwardBase + edgeDistance * upwardSpread;
    const startY =
      RASTRO_GAME_CONFIG.perspective.horizonY +
      (this.asteroidRandom() - 0.5) *
        RASTRO_GAME_CONFIG.asteroids.verticalHorizonJitter;
    const variant = this.pickAsteroidVariant();
    const isDebris = variant >= 4;
    const image = this.add
      .image(0, 0, `${RASTRO_TEXTURE_KEYS.asteroid}-${variant}`)
      .setDepth(0.8)
      .setVisible(false);

    this.asteroids.push({
      image,
      progress,
      speed: targetSpeed ?? this.randomBetween(RASTRO_GAME_CONFIG.asteroids.speedRange),
      size: isDebris
        ? this.randomBetween([34, 66])
        : this.randomBetween(RASTRO_GAME_CONFIG.asteroids.sizeRange),
      rotationSpeed: (this.asteroidRandom() - 0.5) * 0.8,
      startX,
      startY,
      endX: startX + sideDirection * horizontalTravel,
      endY: startY + verticalDirection * verticalTravel,
    });
  }

  private spawnEnemy(
    progress = 0,
    targetLane?: number,
    settings?: EnemySpawnSettings,
  ): void {
    const lanes = RASTRO_GAME_CONFIG.enemies.lanes;
    const lane =
      targetLane ??
      settings?.lane ??
      lanes[Math.floor(this.asteroidRandom() * lanes.length)];
    const variants = this.phase.ambientVariants;
    const variant =
      settings?.variant ?? variants[Math.floor(this.asteroidRandom() * variants.length)];
    if (variant === "satelite" || variant === "sonda") {
      this.spawnDrone(variant, lane, settings?.speed, settings?.size);
      return;
    }
    const isBoss = settings?.bossName !== undefined;
    const isShooter = variant === "atirador" && !isBoss;
    const health =
      settings?.health ?? (variant === "atirador" || variant === "fantasma" ? 2 : 1);
    const startX = 0.5 + lane * 0.27;
    const startY =
      RASTRO_GAME_CONFIG.perspective.horizonY +
      (this.asteroidRandom() - 0.5) *
        RASTRO_GAME_CONFIG.enemies.verticalHorizonJitter;
    const endY = isBoss
      ? RASTRO_GAME_CONFIG.enemies.bossHoldY
      : this.randomBetween(RASTRO_GAME_CONFIG.enemies.destinationYRange);
    const holdScreenY = Phaser.Math.Clamp(
      this.getPlayerStartYProgress() - this.randomBetween([0.26, 0.38]),
      startY + 0.04,
      endY - 0.04,
    );
    const holdProjectedProgress = Phaser.Math.Clamp(
      (holdScreenY - startY) / (endY - startY),
      0.2,
      0.9,
    );
    const textureKey = isBoss
      ? `${RASTRO_TEXTURE_KEYS.bossPrefix}${settings?.bossArt ?? this.phase.id}`
      : `${RASTRO_TEXTURE_KEYS.enemyPrefix}${variant}`;
    const image = this.add
      .image(0, 0, textureKey)
      .setDepth(0.9)
      .setVisible(false);

    this.enemies.push({
      image,
      progress,
      speed:
        settings?.speed ?? this.randomBetween(RASTRO_GAME_CONFIG.enemies.speedRange),
      size: settings?.size ?? this.randomBetween(RASTRO_GAME_CONFIG.enemies.sizeRange),
      variant,
      health,
      maxHealth: health,
      isBoss,
      bossName: settings?.bossName,
      startX,
      startY,
      endX: isBoss
        ? 0.5 + lane * 0.15
        : this.randomBetween(RASTRO_GAME_CONFIG.enemies.destinationXRange),
      endY,
      movementState: isBoss ? "diving" : "approaching",
      movementTimeMs: this.randomBetween([0, 3000]),
      holdProgress: isBoss
        ? 1
        : holdProjectedProgress **
          (1 / RASTRO_GAME_CONFIG.enemies.projectionExponent),
      holdDurationMs: isShooter
        ? this.randomBetween([2800, 4200])
        : this.randomBetween([850, 2100]),
      holdElapsedMs: 0,
      holdTransitionMs: 750,
      holdX: startX,
      holdEntryX: startX,
      maneuverAmplitude: this.randomBetween([0.025, 0.07]),
      maneuverFrequency: this.randomBetween([0.0008, 0.0015]),
      maneuverPhase: this.randomBetween([0, Math.PI * 2]),
      sideExitDirection: this.asteroidRandom() < 0.5 ? -1 : 1,
      sideExitProgress: 0,
      sideExitStartX: startX,
      sideExitStartY: startY,
      diveBlendProgress: isBoss ? 1 : 0,
      diveStartX: startX,
      diveStartY: startY,
      ghost: false,
      ghostTimerMs: this.randomBetween([0, 4400]),
      fireElapsedMs: 0,
      bossArt: settings?.bossArt ?? this.phase.id,
      isFinalBoss: settings?.finalBoss ?? true,
    });
  }

  /**
   * Satélites e sondas: seguem uma trajetória fixa (reta, em perspectiva),
   * bem mais rápida que a dos asteroides. Usam a mesma mecânica dos asteroides.
   */
  private fireEnemyShot(enemy: Enemy): void {
    this.launchEnemyShot(
      enemy.image.x,
      enemy.image.y,
      this.player.x,
      this.player.y,
      RASTRO_TEXTURE_KEYS.enemyShot,
      1500,
      1,
    );
  }

  /** Lança um projétil de (startX, startY) rumo a um ponto, seguindo um pouco além. */
  private launchEnemyShot(
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    texture: string,
    durationMs: number,
    scaleFactor: number,
  ): void {
    const image = this.add
      .image(startX, startY, texture)
      .setDepth(1.3)
      .setScale(0.5 * scaleFactor);
    this.enemyShots.push({
      image,
      startX,
      startY,
      endX: startX + (targetX - startX) * 1.25,
      endY: startY + (targetY - startY) * 1.25,
      progress: 0,
      durationMs,
      scaleFactor,
    });
  }

  /** Cada chefe tem seu próprio tiro: textura, padrão e ritmo. */
  private static readonly BOSS_FIRE_INTERVAL_MS: Record<number, number> = {
    1: 2300, 2: 2500, 3: 3100, 4: 2900, 5: 2900, 6: 3300, 7: 2100,
  };

  private updateBossFire(enemy: Enemy, delta: number): void {
    if (!this.isPlaying || enemy.progress < 0.75) {
      return;
    }
    // Chefes do boss rush (fase 7) atiram um pouco mais devagar.
    const slower = enemy.isFinalBoss ? 1 : 1.3;
    enemy.fireElapsedMs += delta;
    if (
      enemy.fireElapsedMs <
      (RastroEstelarScene.BOSS_FIRE_INTERVAL_MS[enemy.bossArt] ?? 2600) * slower
    ) {
      return;
    }
    enemy.fireElapsedMs = 0;
    this.fireBossAttack(enemy);
  }

  private fireBossAttack(enemy: Enemy): void {
    const art = enemy.bossArt;
    const texture =
      art === 1
        ? RASTRO_TEXTURE_KEYS.enemyShot
        : `${RASTRO_TEXTURE_KEYS.bossShotPrefix}${art}`;
    const originX = enemy.image.x;
    const originY = enemy.image.y + enemy.image.displayHeight * 0.3;
    const aim = () => Math.atan2(this.player.y - originY, this.player.x - originX);
    const reach = () =>
      Math.max(120, Math.hypot(this.player.x - originX, this.player.y - originY));
    /** Dispara na direção `angle` (rad), alcançando a distância do jogador. */
    const shoot = (angle: number, durationMs: number, size: number, distance = reach()) =>
      this.launchEnemyShot(
        originX,
        originY,
        originX + Math.cos(angle) * distance,
        originY + Math.sin(angle) * distance,
        texture,
        durationMs,
        size,
      );
    const fan = (count: number, spread: number, durationMs: number, size: number) => {
      for (let index = 0; index < count; index += 1) {
        const t = count === 1 ? 0 : index / (count - 1) - 0.5;
        shoot(aim() + t * spread, durationMs, size);
      }
    };

    switch (art) {
      case 1: // Bastião Órion: um tiro mirado.
        fan(1, 0, 1700, 1.2);
        break;
      case 2: // Almirante Espectro: três lâminas em leque.
        fan(3, 0.7, 1600, 1);
        break;
      case 3: // Colosso de Titã: dois orbes grandes e lentos, com vão no meio.
        shoot(aim() - 0.28, 2300, 1.7);
        shoot(aim() + 0.28, 2300, 1.7);
        break;
      case 4: // Arauto Solar: leque de cinco estrelas de fogo.
        fan(5, 1.2, 1900, 1);
        break;
      case 5: // Matriarca de Carina: rajada de três esporos, cada um mirado.
        for (let burst = 0; burst < 3; burst += 1) {
          this.time.delayedCall(burst * 260, () => {
            if (this.isPlaying && this.enemies.includes(enemy)) {
              shoot(aim(), 1500, 1);
            }
          });
        }
        break;
      case 6: // Guardião do Horizonte: leque largo de anéis (sete).
        fan(7, 1.9, 2100, 1);
        break;
      default: {
        // Sentinela: alterna leque curto mirado e leque largo de estrelas.
        this.bossVolleyCount += 1;
        if (this.bossVolleyCount % 2 === 0) {
          fan(7, 1.7, 1700, 1);
        } else {
          fan(3, 0.45, 1400, 1.1);
        }
      }
    }
  }

  private updateEnemyShots(delta: number): void {
    for (let index = this.enemyShots.length - 1; index >= 0; index -= 1) {
      const shot = this.enemyShots[index];
      shot.progress += delta / shot.durationMs;
      if (shot.progress >= 1) {
        shot.image.destroy();
        this.enemyShots.splice(index, 1);
        continue;
      }

      shot.image
        .setPosition(
          Phaser.Math.Linear(shot.startX, shot.endX, shot.progress),
          Phaser.Math.Linear(shot.startY, shot.endY, shot.progress),
        )
        .setScale((0.5 + shot.progress * 1.1) * shot.scaleFactor);

      const hitX = shot.image.displayWidth * 0.5 + this.player.displayWidth * 0.3;
      const hitY = shot.image.displayHeight * 0.5 + this.player.displayHeight * 0.3;
      if (
        !this.debugDamageDisabled &&
        this.isPlaying &&
        !this.isColliding &&
        this.invulnerabilityMsRemaining === 0 &&
        ((shot.image.x - this.player.x) / hitX) ** 2 +
          ((shot.image.y - this.player.y) / hitY) ** 2 <=
          1
      ) {
        this.triggerCollision();
        return;
      }
    }
  }

  private spawnDrone(
    kind: "satelite" | "sonda",
    lane: number,
    speed?: number,
    size?: number,
  ): void {
    const startX = 0.5 + lane * 0.48;
    const startY = RASTRO_GAME_CONFIG.perspective.horizonY;
    const isSatellite = kind === "satelite";
    // Satélite cruza a tela na diagonal; sonda desce quase reta rumo ao jogador.
    const endX = isSatellite ? 1 - startX : 0.5 + (startX - 0.5) * 0.35;
    const image = this.add
      .image(
        0,
        0,
        isSatellite ? RASTRO_TEXTURE_KEYS.satellite : RASTRO_TEXTURE_KEYS.probe,
      )
      .setDepth(0.85)
      .setVisible(false);

    this.asteroids.push({
      image,
      progress: 0,
      speed: speed ?? (isSatellite ? 0.34 : 0.44),
      size: size ?? (isSatellite ? 76 : 64),
      rotationSpeed: isSatellite ? 0.9 : 0,
      startX,
      startY,
      endX,
      endY: startY + 1.05,
    });
  }

  /**
   * Sprites de asteroide/destroço: 0 cinza, 1 marrom, 2 gelo, 3 carbono,
   * 4 placa de casco, 5 asa partida, 6 tanque. O setor atual define quais.
   */
  private pickAsteroidVariant(): number {
    const options = this.asteroidVariants;
    return options[Math.floor(this.asteroidRandom() * options.length)];
  }

  /** Aplica as regras do setor: minions, asteroides e perigos de cenário. */
  private applySectorEnvironment(event: RastroLevelEvent): void {
    if (event.minionRate !== undefined) {
      this.minionRate = event.minionRate;
    }
    if (event.asteroids) {
      this.asteroidVariants = event.asteroids.variants;
      this.asteroidIntervalMs =
        event.asteroids.intervalMs ?? RASTRO_GAME_CONFIG.asteroids.spawnIntervalMs;
    }
    if (event.hazards) {
      this.ionStorm.intervalMs = event.hazards.ionStormMs ?? 0;
      this.plasmaWaves.intervalMs = event.hazards.plasmaWaveMs ?? 0;
    }
  }

  private updateAsteroids(delta: number): void {
    if (delta <= 0) {
      return;
    }

    this.crateElapsedMs += delta;
    if (
      this.crateElapsedMs >= this.nextCrateMs &&
      !this.enemies.some((enemy) => enemy.isBoss)
    ) {
      this.crateElapsedMs = 0;
      this.nextCrateMs = 18000 + this.asteroidRandom() * 8000;
      this.spawnCrate();
    }

    this.asteroidSpawnElapsed += delta;
    if (
      this.asteroidVariants.length > 0 &&
      this.asteroidSpawnElapsed >= this.asteroidIntervalMs &&
      this.asteroids.length < RASTRO_GAME_CONFIG.asteroids.maxCount
    ) {
      this.asteroidSpawnElapsed = 0;
      this.spawnAsteroid();
    }

    for (let index = this.asteroids.length - 1; index >= 0; index -= 1) {
      const asteroid = this.asteroids[index];
      asteroid.progress += asteroid.speed * (delta / 1000);

      const perspective = this.getProjectedProgress(
        asteroid.progress,
        RASTRO_GAME_CONFIG.asteroids.projectionExponent,
      );
      const x =
        Phaser.Math.Linear(asteroid.startX, asteroid.endX, perspective) *
        this.scale.width;
      const y =
        Phaser.Math.Linear(asteroid.startY, asteroid.endY, perspective) *
        this.scale.height;
      const [minScale, scaleRange] = RASTRO_GAME_CONFIG.asteroids.scaleRange;
      const visibleProgress = Phaser.Math.Clamp(perspective, 0, 1);
      // Nunca passa de 100%: continua colidindo até sair da tela.
      const scale = Math.min(
        1,
        (asteroid.size / 96) * (minScale + visibleProgress * scaleRange),
      );
      asteroid.image
        .setPosition(x, y)
        .setScale(scale)
        .setDepth(perspective >= 1 ? 1.4 : 0.8 + visibleProgress * 0.4)
        .setVisible(true)
        .setTint(this.getPerspectiveTint(visibleProgress));
      asteroid.image.rotation += asteroid.rotationSpeed * (delta / 1000);

      const halfWidth = asteroid.image.displayWidth / 2;
      const halfHeight = asteroid.image.displayHeight / 2;
      if (
        x + halfWidth < -RASTRO_GAME_CONFIG.asteroids.removeMargin ||
        x - halfWidth > this.scale.width + RASTRO_GAME_CONFIG.asteroids.removeMargin ||
        y + halfHeight < -RASTRO_GAME_CONFIG.asteroids.removeMargin ||
        y - halfHeight > this.scale.height + RASTRO_GAME_CONFIG.asteroids.removeMargin
      ) {
        this.createTargetExplosion(asteroid);
        asteroid.image.destroy();
        this.asteroids.splice(index, 1);
      }
    }
  }

  /**
   * Escolhe onde o inimigo vai pairar: o ponto livre mais distante dos outros
   * inimigos que já estão parados, para as naves não se sobreporem.
   */
  private pickHoldX(enemy: Enemy): number {
    const others = this.enemies.filter(
      (other) =>
        other !== enemy &&
        !other.isBoss &&
        (other.movementState === "holding" ||
          other.movementState === "approaching"),
    );
    let bestX = 0.5;
    let bestGap = -1;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = this.randomBetween([0.12, 0.88]);
      const gap = Math.min(
        1,
        ...others.map((other) =>
          Math.abs(
            candidate -
              (other.movementState === "holding"
                ? other.holdX
                : other.image.x / this.scale.width),
          ),
        ),
      );
      if (gap > bestGap) {
        bestGap = gap;
        bestX = candidate;
      }
    }
    return bestX;
  }

  private updateEnemies(delta: number): void {
    this.enemySpawnElapsed += delta;
    if (
      this.phase.ambientVariants.length > 0 &&
      this.minionRate > 0 &&
      this.enemySpawnElapsed >=
        RASTRO_GAME_CONFIG.enemies.spawnIntervalMs / this.minionRate &&
      this.enemies.length < RASTRO_GAME_CONFIG.enemies.maxCount
    ) {
      this.enemySpawnElapsed = 0;
      this.spawnEnemy();
    }

    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      enemy.movementTimeMs += delta;
      if (enemy.isBoss || enemy.movementState === "diving") {
        enemy.progress = enemy.isBoss
          ? Math.min(1, enemy.progress + enemy.speed * (delta / 1000))
          : enemy.progress + enemy.speed * (delta / 1000);
      } else if (enemy.movementState === "approaching") {
        enemy.progress += enemy.speed * (delta / 1000);
        if (enemy.progress >= enemy.holdProgress) {
          enemy.progress = enemy.holdProgress;
          enemy.movementState = "holding";
          enemy.holdElapsedMs = 0;
          const approachProgress = this.getProjectedProgress(
            enemy.progress,
            RASTRO_GAME_CONFIG.enemies.projectionExponent,
          );
          const approachX =
            Phaser.Math.Linear(enemy.startX, enemy.endX, approachProgress) +
            this.getEnemyManeuver(enemy);
          enemy.holdEntryX = approachX;
          enemy.holdX =
            enemy.variant === "atirador" && !enemy.isBoss
              ? Phaser.Math.Clamp(
                  this.player.x / this.scale.width +
                    this.randomBetween([-0.1, 0.1]),
                  0.12,
                  0.88,
                )
              : this.pickHoldX(enemy);
        }
      } else if (enemy.movementState === "holding") {
        enemy.holdElapsedMs += delta;
        if (enemy.variant === "atirador" && !enemy.isBoss) {
          // Acompanha o jogador devagar e dispara a cada ~1,1 s.
          const targetX = Phaser.Math.Clamp(
            this.player.x / this.scale.width,
            0.12,
            0.88,
          );
          enemy.holdX += (targetX - enemy.holdX) * Math.min(1, delta / 900);
          if (enemy.holdElapsedMs > enemy.holdTransitionMs) {
            enemy.fireElapsedMs += delta;
            if (enemy.fireElapsedMs >= 1100) {
              enemy.fireElapsedMs = 0;
              this.fireEnemyShot(enemy);
            }
          }
        }
        if (enemy.holdElapsedMs >= enemy.holdDurationMs) {
          const holdBlend = Phaser.Math.Clamp(
            enemy.holdElapsedMs / enemy.holdTransitionMs,
            0,
            1,
          );
          const holdPositionX =
            Phaser.Math.Linear(enemy.holdEntryX, enemy.holdX, holdBlend) +
            this.getEnemyManeuver(enemy);
          const projected = this.getProjectedProgress(
            enemy.progress,
            RASTRO_GAME_CONFIG.enemies.projectionExponent,
          );
          const holdPositionY =
            Phaser.Math.Linear(enemy.startY, enemy.endY, projected) +
            Math.sin(enemy.movementTimeMs * 0.0015) * 0.012;
          const [minScale, scaleRange] = RASTRO_GAME_CONFIG.enemies.scaleRange;
          const projectedScale =
            enemy.size *
            (minScale + Phaser.Math.Clamp(projected, 0, 1) * scaleRange);

          if (projectedScale > 1 || this.asteroidRandom() < 0.46) {
            enemy.sideExitStartX = holdPositionX;
            enemy.sideExitStartY = holdPositionY;
            enemy.sideExitProgress = 0;
            enemy.movementState = "side-exit";
          } else {
            enemy.diveStartX = holdPositionX;
            enemy.diveStartY = holdPositionY;
            enemy.diveBlendProgress = 0;
            enemy.movementState = "diving";
          }
        }
      } else {
        enemy.sideExitProgress = Math.min(
          1,
          enemy.sideExitProgress + delta / 2800,
        );
      }

      const perspective = this.getProjectedProgress(
        enemy.progress,
        RASTRO_GAME_CONFIG.enemies.projectionExponent,
      );
      if (enemy.movementState === "diving" && !enemy.isBoss) {
        enemy.diveBlendProgress = Math.min(1, enemy.diveBlendProgress + delta / 1200);
      }
      const maneuver =
        this.getEnemyManeuver(enemy);
      const pathX = Phaser.Math.Linear(enemy.startX, enemy.endX, perspective) + maneuver;
      const pathY = Phaser.Math.Linear(enemy.startY, enemy.endY, perspective);
      const diveBlend =
        enemy.diveBlendProgress ** 2 * (3 - 2 * enemy.diveBlendProgress);
      const x =
        enemy.movementState === "side-exit"
          ? Phaser.Math.Linear(
              enemy.sideExitStartX,
              enemy.sideExitDirection < 0 ? -0.25 : 1.25,
              enemy.sideExitProgress ** 2 * (3 - 2 * enemy.sideExitProgress),
            ) * this.scale.width
          : (enemy.movementState === "holding"
                ? Phaser.Math.Linear(
                    enemy.holdEntryX,
                    enemy.holdX,
                    Phaser.Math.Clamp(
                      enemy.holdElapsedMs / enemy.holdTransitionMs,
                      0,
                      1,
                    ),
                  ) + maneuver
                : enemy.movementState === "diving" && !enemy.isBoss
                  ? Phaser.Math.Linear(enemy.diveStartX, pathX, diveBlend)
                  : pathX) * this.scale.width;
      const y =
        enemy.movementState === "side-exit"
          ? enemy.sideExitStartY * this.scale.height
          : (enemy.movementState === "diving" && !enemy.isBoss
              ? Phaser.Math.Linear(enemy.diveStartY, pathY, diveBlend)
              : pathY +
                (enemy.movementState === "holding"
                  ? Math.sin(enemy.movementTimeMs * 0.0015) * 0.012
                  : 0)) * this.scale.height;
      const [minScale, scaleRange] = enemy.isBoss
        ? RASTRO_GAME_CONFIG.enemies.bossScaleRange
        : RASTRO_GAME_CONFIG.enemies.scaleRange;
      const visibleProgress = Phaser.Math.Clamp(perspective, 0, 1);
      const uncappedScale = enemy.size * (minScale + visibleProgress * scaleRange);
      // Inimigos comuns nunca passam de 100%: seguem colidindo até saírem da tela.
      const scale = enemy.isBoss ? uncappedScale : Math.min(1, uncappedScale);
      const renderScale = scale * (enemy.isBoss ? 100 / 320 : 1);

      if (enemy.variant === "fantasma" && !enemy.isBoss) {
        // 2,4 s sólido e vulnerável; 2 s translúcido, só contorno e invulnerável.
        enemy.ghostTimerMs += delta;
        const ghost = enemy.ghostTimerMs % 4400 >= 2400;
        if (ghost !== enemy.ghost || enemy.ghostTimerMs === delta) {
          enemy.ghost = ghost;
          const key = `${RASTRO_TEXTURE_KEYS.enemyPrefix}fantasma`;
          enemy.image.setTexture(ghost ? `${key}-contorno` : key);
        }
      }

      enemy.image
        .setPosition(x, y)
        .setScale(renderScale)
        .setDepth(perspective >= 1 ? 1.4 : 0.9 + visibleProgress * 0.4)
        .setVisible(true)
        .setAlpha(enemy.ghost ? 0.55 : 1)
        .setTint(this.getPerspectiveTint(visibleProgress));

      if (enemy.isBoss) {
        this.updateBossFire(enemy, delta);
      }

      const halfWidth = enemy.image.displayWidth / 2;
      const halfHeight = enemy.image.displayHeight / 2;
      const outsideScreen =
        x + halfWidth < -RASTRO_GAME_CONFIG.enemies.removeMargin ||
        x - halfWidth > this.scale.width + RASTRO_GAME_CONFIG.enemies.removeMargin ||
        y + halfHeight < -RASTRO_GAME_CONFIG.enemies.removeMargin ||
        y - halfHeight > this.scale.height + RASTRO_GAME_CONFIG.enemies.removeMargin;
      if (!enemy.isBoss && (outsideScreen || enemy.sideExitProgress >= 1)) {
        this.createTargetExplosion(enemy);
        enemy.image.destroy();
        this.enemies.splice(index, 1);
      }
    }
  }

  private updatePlayerShots(delta: number): void {
    this.shotCooldownElapsed += delta;
    if (
      this.isFiring &&
      this.shotCooldownElapsed >= this.getShotCooldownMs() &&
      this.playerShots.length <
        (this.weaponKind === "normal" ? RASTRO_GAME_CONFIG.weapon.maxShots : 30)
    ) {
      this.firePlayerShot();
      this.shotCooldownElapsed = 0;
    }

    for (let shotIndex = this.playerShots.length - 1; shotIndex >= 0; shotIndex -= 1) {
      const shot = this.playerShots[shotIndex];
      shot.progress += shot.speed * (delta / 1000);

      if (shot.progress >= 1) {
        shot.image.destroy();
        this.playerShots.splice(shotIndex, 1);
        continue;
      }

      const depth = 1 - shot.progress;
      const perspective = this.getProjectedProgress(
        depth,
        RASTRO_GAME_CONFIG.weapon.projectionExponent,
      );
      let x = Phaser.Math.Linear(shot.endX, shot.startX, perspective);
      const y = Phaser.Math.Linear(
        this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY,
        shot.startY,
        perspective,
      );
      if (shot.kind === "foguete") {
        // Persegue o alvo mais próximo à frente, deslocando-se de lado.
        let best: { x: number } | undefined;
        let bestScore = Infinity;
        for (const target of [...this.enemies, ...this.asteroids]) {
          if (
            ("ghost" in target && target.ghost) ||
            !target.image.visible ||
            target.image.y > y + 30
          ) {
            continue;
          }
          const score =
            Math.abs(target.image.x - (x + shot.homingOffset)) +
            Math.abs(target.image.y - y) * 0.4;
          if (score < bestScore) {
            bestScore = score;
            best = target.image;
          }
        }
        if (best) {
          const wanted = best.x - x;
          const step = 620 * (delta / 1000);
          shot.homingOffset += Phaser.Math.Clamp(wanted - shot.homingOffset, -step, step);
        }
        x += shot.homingOffset;
      }
      const scale = RASTRO_GAME_CONFIG.weapon.initialScale * perspective;
      shot.image
        .setPosition(x, y)
        .setScale(scale * (shot.kind === "foguete" ? 1.1 : shot.kind === "laser" ? 0.9 : 1))
        .setAlpha(perspective)
        .setBlendMode(shot.kind === "foguete" ? Phaser.BlendModes.NORMAL : Phaser.BlendModes.ADD)
        .setDepth(1.05 + shot.progress * 0.5);

      let hit = false;
      for (const target of [...this.asteroids, ...this.enemies]) {
        if (("ghost" in target && target.ghost) || shot.hitTargets?.has(target)) {
          continue;
        }
        const horizontalGap = Math.abs(target.image.x - x);
        const verticalGap = Math.abs(target.image.y - y);
        if (
          horizontalGap <=
            target.image.displayWidth *
              RASTRO_GAME_CONFIG.weapon.targetWidthFactor +
            shot.image.displayWidth * 0.5 &&
          verticalGap <=
            target.image.displayHeight *
              RASTRO_GAME_CONFIG.weapon.targetHeightFactor +
            shot.image.displayHeight * 0.5
        ) {
          this.showShotImpact(x, y);
          if (shot.hitTargets) {
            // Laser: atravessa e segue, uma vez por alvo.
            shot.hitTargets.add(target);
            this.removeShotTarget(target);
            continue;
          }
          this.removeShotTarget(target);
          hit = true;
          break;
        }
      }

      if (hit) {
        shot.image.destroy();
        this.playerShots.splice(shotIndex, 1);
      }
    }
  }

  private firePlayerShot(): void {
    const startY = this.player.y - 20 * this.player.scaleY;
    const centerX = this.scale.width / 2;
    const lateralOffset = this.player.x - centerX;
    const lateralAim =
      RASTRO_GAME_CONFIG.weapon.aimOffset -
      Math.sin(this.player.rotation) * RASTRO_GAME_CONFIG.weapon.rotationInfluence;
    const baseEndX = centerX + lateralOffset * lateralAim;
    const weapon = RASTRO_GAME_CONFIG.weapon;

    const add = (
      kind: WeaponKind,
      startX: number,
      endX: number,
      texture: string,
      scale: number,
      speed: number,
    ): void => {
      const image = this.add.image(startX, startY, texture).setScale(scale);
      this.playerShots.push({
        image,
        progress: 0,
        speed,
        startX,
        startY,
        endX,
        kind,
        homingOffset: 0,
        hitTargets: kind === "laser" ? new Set() : undefined,
      });
    };
    const x = this.player.x;
    const side = this.scale.width * 0.12;

    switch (this.weaponKind) {
      case "duplo":
        // Dois tiros paralelos, um de cada lado da nave.
        add("duplo", x - 16, baseEndX - 5, RASTRO_TEXTURE_KEYS.shot, weapon.initialScale, weapon.speed);
        add("duplo", x + 16, baseEndX + 5, RASTRO_TEXTURE_KEYS.shot, weapon.initialScale, weapon.speed);
        break;
      case "triplo":
        // Leque: um central e dois abertos para os lados.
        add("triplo", x, baseEndX, RASTRO_TEXTURE_KEYS.shot, weapon.initialScale, weapon.speed);
        add("triplo", x - 6, baseEndX - side, RASTRO_TEXTURE_KEYS.shot, weapon.initialScale, weapon.speed);
        add("triplo", x + 6, baseEndX + side, RASTRO_TEXTURE_KEYS.shot, weapon.initialScale, weapon.speed);
        break;
      case "laser":
        // Raio rápido que atravessa tudo no caminho.
        add("laser", x, baseEndX, RASTRO_TEXTURE_KEYS.laserShot, weapon.initialScale * 0.9, weapon.speed * 1.7);
        break;
      case "foguete":
        // Dois foguetes que perseguem os alvos.
        add("foguete", x - 14, baseEndX - 4, RASTRO_TEXTURE_KEYS.missileShot, weapon.initialScale * 1.1, weapon.speed * 0.8);
        add("foguete", x + 14, baseEndX + 4, RASTRO_TEXTURE_KEYS.missileShot, weapon.initialScale * 1.1, weapon.speed * 0.8);
        break;
      default:
        add("normal", x, baseEndX, RASTRO_TEXTURE_KEYS.shot, weapon.initialScale, weapon.speed);
    }
  }

  /** Tempo entre disparos: cada arma tem seu ritmo. */
  private getShotCooldownMs(): number {
    const base = RASTRO_GAME_CONFIG.weapon.cooldownMs;
    switch (this.weaponKind) {
      case "duplo":
        return base * 1.1;
      case "triplo":
        return base * 1.2;
      case "laser":
        return base * 0.6;
      case "foguete":
        return base * 2;
      default:
        return base;
    }
  }

  private setWeapon(kind: WeaponKind): void {
    this.weaponKind = kind;
    this.weaponMsRemaining =
      kind === "normal" ? 0 : RastroEstelarScene.WEAPON_DURATION_MS;
    this.updateWeaponText();
  }

  private updateWeaponText(): void {
    if (this.weaponKind === "normal") {
      this.weaponText.setVisible(false);
      return;
    }
    const info = RastroEstelarScene.WEAPONS[this.weaponKind];
    this.weaponText
      .setText(`${info.label} · ${Math.ceil(this.weaponMsRemaining / 1000)}s`)
      .setColor(info.color)
      .setVisible(true);
  }

  /** Caixa de metal: muito mais lenta que os outros obstáculos. */
  private spawnCrate(): void {
    const lanes = RASTRO_GAME_CONFIG.asteroids.lanes;
    const lane = lanes[Math.floor(this.asteroidRandom() * lanes.length)] * 0.8;
    const startX = 0.5 + lane * 0.48;
    const startY = RASTRO_GAME_CONFIG.perspective.horizonY;
    const image = this.add
      .image(0, 0, RASTRO_TEXTURE_KEYS.crate)
      .setDepth(0.85)
      .setVisible(false);
    this.asteroids.push({
      image,
      progress: 0,
      speed: 0.055,
      size: 76,
      rotationSpeed: 0,
      crateHealth: 3,
      startX,
      startY,
      endX: startX + (0.5 - startX) * 0.35,
      endY: startY + 1.1,
    });
  }

  private dropPowerUp(x: number, y: number): void {
    const kinds = Object.keys(RastroEstelarScene.WEAPONS) as Array<
      Exclude<WeaponKind, "normal">
    >;
    const kind = kinds[Math.floor(this.asteroidRandom() * kinds.length)];
    const image = this.add
      .image(x, y, `${RASTRO_TEXTURE_KEYS.powerUpPrefix}${kind}`)
      .setDepth(1.2);
    this.powerUps.push({ image, kind, ageMs: 0 });
  }

  private updatePowerUps(delta: number): void {
    if (this.weaponKind !== "normal") {
      this.weaponMsRemaining -= delta;
      if (this.weaponMsRemaining <= 0) {
        this.setWeapon("normal");
      } else {
        this.updateWeaponText();
      }
    }

    const fall = (this.scale.height * 0.16 * delta) / 1000;
    for (let index = this.powerUps.length - 1; index >= 0; index -= 1) {
      const item = this.powerUps[index];
      item.ageMs += delta;
      item.image.y += fall;
      item.image.setScale(1 + Math.sin(item.ageMs * 0.008) * 0.1);
      const reach = 28 + this.player.displayWidth * 0.4;
      const near =
        Math.hypot(item.image.x - this.player.x, item.image.y - this.player.y) < reach;
      if (near && !this.isColliding) {
        this.setWeapon(item.kind);
        this.showWeaponPickup(item.kind);
        item.image.destroy();
        this.powerUps.splice(index, 1);
      } else if (item.image.y > this.scale.height + 40) {
        item.image.destroy();
        this.powerUps.splice(index, 1);
      }
    }
  }

  private showWeaponPickup(kind: Exclude<WeaponKind, "normal">): void {
    const info = RastroEstelarScene.WEAPONS[kind];
    const label = this.add
      .text(this.player.x, this.player.y - 50, info.label, {
        color: info.color,
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        fontStyle: "bold",
        stroke: "#080d20",
        strokeThickness: 4,
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setDepth(12);
    this.tweens.add({
      targets: label,
      y: label.y - 40,
      alpha: 0,
      duration: 1100,
      onComplete: () => label.destroy(),
    });
  }

  private startFiring(): void {
    this.isFiring = true;
    if (this.isPlaying && !this.isColliding) {
      this.firePlayerShot();
      this.shotCooldownElapsed = 0;
    }
  }

  private stopFiring(): void {
    this.isFiring = false;
  }

  private removeShotTarget(target: Asteroid | Enemy): void {
    const asteroidIndex = this.asteroids.findIndex((asteroid) => asteroid === target);
    if (asteroidIndex >= 0) {
      const asteroid = this.asteroids[asteroidIndex];
      if (asteroid.crateHealth !== undefined && asteroid.crateHealth > 1) {
        // A caixa de metal aguenta alguns tiros; pisca ao ser atingida.
        asteroid.crateHealth -= 1;
        asteroid.image.setTintFill(0xffffff);
        this.time.delayedCall(70, () => asteroid.image.clearTint());
        return;
      }
      if (asteroid.crateHealth !== undefined) {
        this.dropPowerUp(asteroid.image.x, asteroid.image.y);
      }
      this.createTargetExplosion(asteroid);
      asteroid.image.destroy();
      this.asteroids.splice(asteroidIndex, 1);
      return;
    }

    const enemyIndex = this.enemies.findIndex((enemy) => enemy === target);
    if (enemyIndex >= 0) {
      const enemy = this.enemies[enemyIndex];
      enemy.health -= 1;
      if (enemy.health > 0) {
        this.updateBossHud();
        return;
      }

      const isBoss = enemy.isBoss;
      this.createTargetExplosion(enemy, isBoss);
      enemy.image.destroy();
      this.enemies.splice(enemyIndex, 1);
      if (isBoss && enemy.isFinalBoss) {
        // Recompensa: +1 vida ao derrotar o chefe da fase.
        if (this.lives < RastroEstelarScene.MAX_LIVES) {
          this.lives += 1;
          this.livesText.setText(`${RASTRO_GAME_CONFIG.texts.livesLabel}: ${this.lives}`);
          this.showStageAnnouncement("+1 VIDA", true);
        }
        this.isPlaying = false;
        this.isFiring = false;
        this.updateBossHud();
        this.time.delayedCall(2850, () => this.completePhase());
      } else if (isBoss) {
        this.updateBossHud();
      }
    }
  }

  private createTargetExplosion(target: Asteroid | Enemy, dramatic = false): void {
    createExplosion(
      this,
      target.image.x,
      target.image.y,
      Math.max(target.image.displayWidth, target.image.displayHeight),
      dramatic,
    );
  }

  /**
   * Fim de fase: sem tela de texto. A nave acelera em direção ao horizonte,
   * encolhendo e sumindo; depois a próxima fase começa (ou o jogo reinicia).
   */
  private completePhase(): void {
    this.isPlaying = false;
    this.isFiring = false;
    this.bossStatusText.setVisible(false);
    this.bossHealthBar.setVisible(false);
    this.playerShots.forEach(({ image }) => image.destroy());
    this.playerShots = [];

    const nextPhaseIndex = this.phaseIndex + 1;
    const horizonY = this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY;
    const startX = this.player.x;
    const startY = this.player.y;
    const startScale = this.player.scaleX;
    const targetY = horizonY + this.scale.height * 0.02;

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 2200,
      ease: "Cubic.easeIn",
      onUpdate: (tween) => {
        const t = tween.getValue() ?? 0;
        const y = Phaser.Math.Linear(startY, targetY, t);
        const perspective = Phaser.Math.Clamp(
          (y - horizonY) / (this.scale.height - horizonY),
          0,
          1,
        );
        this.player
          .setPosition(Phaser.Math.Linear(startX, this.scale.width / 2, t), y)
          .setScale(Phaser.Math.Linear(startScale, 0.03, t))
          .setRotation(0);
        updatePlayerShipVisuals(this.playerVisuals, perspective, this.time.now, -1);
        const alpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        this.player.setAlpha(alpha);
        this.playerVisuals.shadow.setAlpha(alpha);
      },
      onComplete: () => {
        this.time.delayedCall(350, () => {
          if (nextPhaseIndex >= RASTRO_LEVELS.length) {
            // Última fase concluída: tela de vitória (inimigos, chefes e parabéns).
            this.showVictoryPageScene(0);
            return;
          }
          this.scene.restart({
            lives: this.lives,
            hasStarted: true,
            phaseIndex: nextPhaseIndex,
          });
        });
      },
    });
  }

  private showVictoryPageScene(page: number): void {
    this.scene.restart({
      lives: RASTRO_GAME_CONFIG.lives,
      hasStarted: true,
      phaseIndex: getVictoryPhaseIndex(page),
      victoryPage: page,
    });
  }

  private showVictory(page: number): void {
    this.isPlaying = false;
    showVictoryPage(
      this,
      page,
      this.getTextResolution(),
      () => this.showVictoryPageScene(Math.min(page + 1, VICTORY_PAGE_COUNT - 1)),
      () =>
        this.scene.restart({
          lives: RASTRO_GAME_CONFIG.lives,
          hasStarted: false,
          phaseIndex: 0,
        }),
    );
  }

  private showShotImpact(x: number, y: number): void {
    const impact = this.add.circle(x, y, 4, 0xa5f3fc, 1).setDepth(3);
    this.tweens.add({
      targets: impact,
      scale: 0,
      duration: 180,
      onComplete: () => impact.destroy(),
    });
  }

  private drawSpaceBackground(): void {
    renderSpaceBackground(
      this.background,
      this.scale.width,
      this.scale.height,
      RASTRO_GAME_CONFIG.perspective.horizonY,
      RASTRO_GAME_CONFIG.weapon.projectionExponent,
      this.phase,
    );
  }

  private getPlayerStartYProgress(): number {
    return this.phase.id === 7 ? 0.72 : RASTRO_GAME_CONFIG.player.startY;
  }

  private getPlayerStartY(): number {
    return this.scale.height * this.getPlayerStartYProgress();
  }

  private randomBetween([min, max]: number[]): number {
    return min + this.asteroidRandom() * (max - min);
  }

  private getPerspectiveTint(progress: number): number {
    const amount = Phaser.Math.Clamp(progress, 0, 1);
    const distant = Phaser.Display.Color.IntegerToColor(
      RASTRO_GAME_CONFIG.perspective.distantTint,
    );
    const near = Phaser.Display.Color.IntegerToColor(
      RASTRO_GAME_CONFIG.perspective.nearTint,
    );

    return Phaser.Display.Color.GetColor(
      Phaser.Math.Linear(distant.red, near.red, amount),
      Phaser.Math.Linear(distant.green, near.green, amount),
      Phaser.Math.Linear(distant.blue, near.blue, amount),
    );
  }

  private getEnemyManeuver(enemy: Enemy): number {
    const time = enemy.movementTimeMs * enemy.maneuverFrequency;
    return (
      Math.sin(time + enemy.maneuverPhase) +
      Math.sin(time * 0.43 + enemy.maneuverPhase * 1.71) * 0.35
    ) * enemy.maneuverAmplitude;
  }

  private getProjectedProgress(progress: number, exponent: number): number {
    return Math.max(0, progress) ** exponent;
  }

  private createRandom(seed: number): () => number {
    let state = seed;

    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }

  private getTextResolution(): number {
    return Math.min(Math.max(Math.ceil(window.devicePixelRatio || 1), 2), 3);
  }
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
