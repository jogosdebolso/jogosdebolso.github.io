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
import type {
  Asteroid,
  Enemy,
  EnemyShot,
  EnemySpawnSettings,
  PlayerShot,
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
  private isPlaying = false;
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

  constructor() {
    super("RastroEstelarScene");
  }

  init(data?: {
    lives?: number;
    hasStarted?: boolean;
    phaseIndex?: number;
  }): void {
    this.lives = RASTRO_GAME_CONFIG.lives;
    if (data?.lives !== undefined) {
      this.lives = data.lives;
    }

    if (data?.hasStarted !== undefined) {
      this.hasStarted = data.hasStarted;
    }
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
          ? new MovingStarfield(this, 36, true)
          : new MovingStarfield(this);
    }
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawSpaceBackground, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawSpaceBackground, this);
      this.input.off("pointerup", this.stopDebugAdvance, this);
    });

    createRastroTextures(this);
    this.asteroidRandom = this.createRandom(Date.now() % 2147483647 || 1);
    this.asteroids = [];
    this.enemies = [];
    this.playerShots = [];
    this.enemyShots = [];
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

    this.createDebugPanel();

    this.stageAnnouncement = this.add
      .text(this.scale.width / 2, this.scale.height * 0.2, "", {
        color: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        fontStyle: "bold",
        align: "center",
        stroke: "#111827",
        strokeThickness: 4,
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
      return;
    }

    this.livesText.setX(this.scale.width - 24);
    this.bossStatusText.setX(this.scale.width / 2);
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

    const horizontal =
      Number(this.cursors.right.isDown || this.movementKeys.right.isDown) -
      Number(this.cursors.left.isDown || this.movementKeys.left.isDown);
    const vertical =
      Number(this.cursors.down.isDown || this.movementKeys.down.isDown) -
      Number(this.cursors.up.isDown || this.movementKeys.up.isDown);
    const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
    const distanceX =
      RASTRO_GAME_CONFIG.player.speed *
      (this.scale.width / RASTRO_REFERENCE_VIEWPORT.width) *
      (delta / 1000);
    const distanceY =
      RASTRO_GAME_CONFIG.player.speed *
      (this.scale.height / RASTRO_REFERENCE_VIEWPORT.height) *
      (delta / 1000);
    const horizonY = this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY;
    const perspective = Phaser.Math.Clamp(
      (this.player.y - horizonY) / (this.scale.height - horizonY),
      0,
      1,
    );
    const targetScale =
      RASTRO_GAME_CONFIG.player.minScale +
      perspective * RASTRO_GAME_CONFIG.player.scaleRange;
    const targetRotation = horizontal * RASTRO_GAME_CONFIG.player.rotation;
    const motionBlend =
      1 - Math.exp(-delta / RASTRO_GAME_CONFIG.player.rotationSmoothingMs);
    const halfWidth = (this.player.width * targetScale) / 2;
    const halfHeight = (this.player.height * targetScale) / 2;
    const minimumY = horizonY + halfHeight;

    this.player.x = Phaser.Math.Clamp(
      this.player.x + direction.x * distanceX,
      halfWidth,
      this.scale.width - halfWidth,
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y + direction.y * distanceY,
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
    const debugBossButton = makeButton("Chefe", "#fda4af", "#3f1d2b");
    this.debugBar = [
      this.debugDamageToggle,
      this.debugFreezeToggle,
      this.debugLivesToggle,
      this.debugAdvanceButton,
      previousPhaseButton,
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
    for (const button of this.debugBar) {
      button.setPosition(x, 8).setDepth(30).setScrollFactor(0);
      x += button.width + 4;
    }
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
    this.showStageAnnouncement(bossEvent.title, bossEvent.message);
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
        (this.enemies.length > 0 || this.asteroids.length > 0)
      ) {
        break;
      }
      this.nextPhaseEventIndex += 1;
      this.applySectorEnvironment(event);
      this.showStageAnnouncement(event.title, event.message);
      event.wave?.forEach((spawn) =>
        this.spawnEnemy(0, spawn.lane, {
          variant: spawn.variant,
          size: spawn.size,
          speed: spawn.speed,
        }),
      );
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

  private showStageAnnouncement(title: string, message: string): void {
    // Anúncio de início de fase ("FASE n — ..."): só o título, sem subtítulo.
    this.stageAnnouncement.setText(title.startsWith("FASE") ? title : `${title}\n${message}`);
    this.stageAnnouncement
      .setPosition(this.scale.width / 2, this.scale.height * 0.2)
      .setAlpha(1);
    this.tweens.killTweensOf(this.stageAnnouncement);
    this.tweens.add({
      targets: this.stageAnnouncement,
      alpha: 0,
      delay: 5200,
      duration: 900,
      ease: "Sine.easeIn",
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
      .setText(
        `${boss.bossName ?? RASTRO_GAME_CONFIG.texts.bossHealthLabel} · ` +
          `${RASTRO_GAME_CONFIG.texts.bossHealthLabel}: ${boss.health}/${boss.maxHealth}`,
      )
      .setVisible(true);
    this.bossHealthBar.setVisible(true).clear();
    const barWidth = Math.min(this.scale.width * 0.36, 280);
    const barX = (this.scale.width - barWidth) / 2;
    const barY = 100;
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
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const overlay = this.add
      .rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x080d20, 0.88)
      .setDepth(20);

    this.add
      .text(centerX, centerY - 58, RASTRO_GAME_CONFIG.texts.gameOverTitle, {
        color: "#f9fafb",
        fontFamily: "system-ui, sans-serif",
        fontSize: "36px",
        fontStyle: "bold",
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setDepth(21);

    this.add
      .text(centerX, centerY - 12, RASTRO_GAME_CONFIG.texts.gameOverDescription, {
        color: "#cbd5e1",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setDepth(21);

    const restartButton = this.add
      .text(centerX, centerY + 48, RASTRO_GAME_CONFIG.texts.restartButton, {
        color: "#111827",
        backgroundColor: "#67e8f9",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        padding: { x: 18, y: 12 },
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    restartButton.on("pointerover", () =>
      restartButton.setStyle({ backgroundColor: "#a5f3fc" }),
    );
    restartButton.on("pointerout", () =>
      restartButton.setStyle({ backgroundColor: "#67e8f9" }),
    );

    const restart = (): void => {
      this.scene.restart({
        lives: RASTRO_GAME_CONFIG.lives,
        hasStarted: true,
        phaseIndex: 0,
      });
    };

    restartButton.once("pointerdown", restart);
    this.input.keyboard?.once("keydown-ENTER", restart);
    this.input.keyboard?.once("keydown-SPACE", restart);
    overlay.setInteractive();
  }

  private showStartScreen(): void {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const overlay = this.add
      .container(0, 0)
      .setDepth(20);

    overlay.add(
      this.add
        .rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x080d20, 0.84)
        .setInteractive(),
    );
    overlay.add(
      this.add
        .text(centerX, centerY - 64, this.phase.name.toUpperCase(), {
          color: "#f9fafb",
          fontFamily: "system-ui, sans-serif",
          fontSize: "36px",
          fontStyle: "bold",
          resolution: this.getTextResolution(),
        })
        .setOrigin(0.5),
    );
    overlay.add(
      this.add
        .text(
          centerX,
          centerY - 22,
          RASTRO_GAME_CONFIG.texts.startControls,
          {
          color: "#94a3b8",
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          align: "center",
          wordWrap: { width: Math.min(this.scale.width - 48, 440) },
          resolution: this.getTextResolution(),
          },
        )
        .setOrigin(0.5),
    );

    const startButton = this.add
      .text(centerX, centerY + 40, RASTRO_GAME_CONFIG.texts.startButton, {
        color: "#111827",
        backgroundColor: "#67e8f9",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        fontStyle: "bold",
        padding: { x: 18, y: 12 },
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    startButton.on("pointerover", () =>
      startButton.setStyle({ backgroundColor: "#a5f3fc" }),
    );
    startButton.on("pointerout", () =>
      startButton.setStyle({ backgroundColor: "#67e8f9" }),
    );
    overlay.add(startButton);

    const startGame = (): void => {
      if (this.isPlaying) {
        return;
      }

      this.hasStarted = true;
      this.isPlaying = true;
      overlay.destroy();
    };

    startButton.once("pointerdown", startGame);
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
      isFinalBoss: settings?.finalBoss ?? true,
    });
  }

  /**
   * Satélites e sondas: seguem uma trajetória fixa (reta, em perspectiva),
   * bem mais rápida que a dos asteroides. Usam a mesma mecânica dos asteroides.
   */
  private fireEnemyShot(enemy: Enemy): void {
    const image = this.add
      .image(enemy.image.x, enemy.image.y, RASTRO_TEXTURE_KEYS.enemyShot)
      .setDepth(1.3)
      .setScale(0.5);
    const startX = enemy.image.x;
    const startY = enemy.image.y;
    // Mira na posição do jogador no momento do disparo e segue um pouco além.
    this.enemyShots.push({
      image,
      startX,
      startY,
      endX: startX + (this.player.x - startX) * 1.25,
      endY: startY + (this.player.y - startY) * 1.25,
      progress: 0,
      durationMs: 1500,
    });
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
        .setScale(0.5 + shot.progress * 1.1);

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
      this.shotCooldownElapsed >= RASTRO_GAME_CONFIG.weapon.cooldownMs &&
      this.playerShots.length < RASTRO_GAME_CONFIG.weapon.maxShots
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
      const x = Phaser.Math.Linear(shot.endX, shot.startX, perspective);
      const y = Phaser.Math.Linear(
        this.scale.height * RASTRO_GAME_CONFIG.perspective.horizonY,
        shot.startY,
        perspective,
      );
      const scale = RASTRO_GAME_CONFIG.weapon.initialScale * perspective;
      shot.image
        .setPosition(x, y)
        .setScale(scale)
        .setAlpha(perspective)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1.05 + shot.progress * 0.5);

      let hit = false;
      for (const target of [...this.asteroids, ...this.enemies]) {
        if ("ghost" in target && target.ghost) {
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
          this.removeShotTarget(target);
          this.showShotImpact(x, y);
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
    const image = this.add.image(
      this.player.x,
      startY,
      RASTRO_TEXTURE_KEYS.shot,
    ).setScale(RASTRO_GAME_CONFIG.weapon.initialScale);
    const centerX = this.scale.width / 2;
    const lateralOffset = this.player.x - centerX;
    const lateralAim =
      RASTRO_GAME_CONFIG.weapon.aimOffset -
      Math.sin(this.player.rotation) * RASTRO_GAME_CONFIG.weapon.rotationInfluence;

    this.playerShots.push({
      image,
      progress: 0,
      speed: RASTRO_GAME_CONFIG.weapon.speed,
      startX: this.player.x,
      startY,
      endX: centerX + lateralOffset * lateralAim,
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
          const finished = nextPhaseIndex >= RASTRO_LEVELS.length;
          this.scene.restart({
            lives: finished ? RASTRO_GAME_CONFIG.lives : this.lives,
            // Depois da última fase o jogo volta à tela inicial.
            hasStarted: !finished,
            phaseIndex: finished ? 0 : nextPhaseIndex,
          });
        });
      },
    });
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
