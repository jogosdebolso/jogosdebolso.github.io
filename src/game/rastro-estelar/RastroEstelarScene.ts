import Phaser from "phaser";
import {
  createPlayerShip,
  getPlayerShipObjects,
  updatePlayerShipVisuals,
} from "./components/PlayerShip";
import type { PlayerShipVisuals } from "./components/PlayerShip";
import { createRastroTextures } from "./components/ShipTextures";
import { drawSpaceBackground as renderSpaceBackground } from "./components/SpaceBackground";
import { createExplosion } from "./components/Explosion";
import { RASTRO_TEXTURE_KEYS } from "./constants";
import { RASTRO_GAME_CONFIG } from "./gameConfig";
import { RASTRO_LEVELS } from "./levelConfig";
import type { RastroLevel } from "./levelConfig";
import type { Asteroid, Enemy, EnemySpawnSettings, PlayerShot } from "./types";

export class RastroEstelarScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Container;
  private playerVisuals!: PlayerShipVisuals;
  private livesText!: Phaser.GameObjects.Text;
  private phaseText!: Phaser.GameObjects.Text;
  private stageAnnouncement!: Phaser.GameObjects.Text;
  private bossStatusText!: Phaser.GameObjects.Text;
  private bossHealthBar!: Phaser.GameObjects.Graphics;
  private background!: Phaser.GameObjects.Graphics;
  private asteroids: Asteroid[] = [];
  private enemies: Enemy[] = [];
  private playerShots: PlayerShot[] = [];
  private asteroidRandom!: () => number;
  private asteroidSpawnElapsed = 0;
  private enemySpawnElapsed = 0;
  private shotCooldownElapsed = 0;
  private invulnerabilityMsRemaining = 0;
  private isColliding = false;
  private isFiring = false;
  private hasStarted = false;
  private isPlaying = false;
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
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawSpaceBackground, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawSpaceBackground, this);
    });

    createRastroTextures(this);
    this.asteroidRandom = this.createRandom(Date.now() % 2147483647 || 1);
    this.asteroids = [];
    this.enemies = [];
    this.playerShots = [];
    this.asteroidSpawnElapsed = 0;
    this.enemySpawnElapsed = 0;
    this.shotCooldownElapsed = 0;
    this.invulnerabilityMsRemaining = 0;
    this.phaseElapsedMs = 0;
    this.nextPhaseEventIndex = 0;
    this.isFiring = false;
    this.isColliding = false;
    this.isPlaying = this.hasStarted;
    this.phase.initialAsteroids.forEach(({ progress, lane, speed }) =>
      this.spawnAsteroid(progress, lane, speed),
    );
    this.phase.initialEnemies.forEach(({ progress, lane, variant, size, speed }) =>
      this.spawnEnemy(progress, lane, { variant, size, speed }),
    );

    const textResolution = this.getTextResolution();

    this.add
      .text(24, 24, RASTRO_GAME_CONFIG.texts.title, {
        color: "#f9fafb",
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        resolution: textResolution,
      })
      .setScrollFactor(0)
      .setDepth(10);

    this.add
      .text(24, 62, RASTRO_GAME_CONFIG.texts.controls, {
        color: "#9ca3af",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        resolution: textResolution,
      })
      .setScrollFactor(0)
      .setDepth(10);

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

    this.phaseText = this.add
      .text(
        this.scale.width / 2,
        24,
        `${RASTRO_GAME_CONFIG.texts.phaseLabel} ${this.phase.id} · ${this.phase.name}`,
        {
          color: "#c4b5fd",
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          fontStyle: "bold",
          resolution: textResolution,
        },
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(10);
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
    const centerY = this.scale.height * RASTRO_GAME_CONFIG.player.startY;

    this.playerVisuals = createPlayerShip(this, centerX, centerY);
    this.player = this.playerVisuals.player;

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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      keyboard.off("keydown-SPACE", this.startFiring, this);
      keyboard.off("keyup-SPACE", this.stopFiring, this);
    });

    if (!this.hasStarted) {
      this.showStartScreen();
    }
  }

  update(time: number, delta: number): void {
    if (!this.isPlaying || this.isColliding) {
      return;
    }

    this.livesText.setX(this.scale.width - 24);
    this.phaseText.setX(this.scale.width / 2);
    this.bossStatusText.setX(this.scale.width / 2);
    this.invulnerabilityMsRemaining = Math.max(
      0,
      this.invulnerabilityMsRemaining - delta,
    );
    this.phaseElapsedMs += delta;
    this.processPhaseEvents();
    this.updateAsteroids(delta);

    const horizontal =
      Number(this.cursors.right.isDown || this.movementKeys.right.isDown) -
      Number(this.cursors.left.isDown || this.movementKeys.left.isDown);
    const vertical =
      Number(this.cursors.down.isDown || this.movementKeys.down.isDown) -
      Number(this.cursors.up.isDown || this.movementKeys.up.isDown);
    const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
    const distance = RASTRO_GAME_CONFIG.player.speed * (delta / 1000);
    const perspective = Phaser.Math.Clamp(
      (this.player.y - this.scale.height * 0.13) /
        (this.scale.height * 0.87),
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

    this.player.x = Phaser.Math.Clamp(
      this.player.x + direction.x * distance,
      halfWidth,
      this.scale.width - halfWidth,
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y + direction.y * distance,
      halfHeight,
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
      direction.lengthSq() > 0,
    );

    this.updateEnemies(delta);
    this.updateBossHud();
    this.updatePlayerShots(delta);
    if (this.isPlaying && !this.isColliding && this.invulnerabilityMsRemaining === 0) {
      this.checkAsteroidCollisions();
    }
  }

  private processPhaseEvents(): void {
    while (
      this.nextPhaseEventIndex < this.phase.events.length &&
      this.phase.events[this.nextPhaseEventIndex].atMs <= this.phaseElapsedMs
    ) {
      const event = this.phase.events[this.nextPhaseEventIndex];
      this.nextPhaseEventIndex += 1;
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
        });
      }
    }
  }

  private showStageAnnouncement(title: string, message: string): void {
    this.stageAnnouncement.setText(`${title}\n${message}`);
    this.stageAnnouncement
      .setPosition(this.scale.width / 2, this.scale.height * 0.2)
      .setAlpha(1);
    this.tweens.killTweensOf(this.stageAnnouncement);
    this.tweens.add({
      targets: this.stageAnnouncement,
      alpha: 0,
      delay: 2400,
      duration: 700,
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
    const contactY =
      this.player.y -
      this.player.displayHeight *
        RASTRO_GAME_CONFIG.collision.playerContactPointOffset;

    for (const obstacle of [...this.asteroids, ...this.enemies]) {
      const isAsteroid = "rotationSpeed" in obstacle;
      const projectionExponent = isAsteroid
        ? RASTRO_GAME_CONFIG.asteroids.projectionExponent
        : RASTRO_GAME_CONFIG.enemies.projectionExponent;
      const projectedPathPosition = Phaser.Math.Clamp(
        (contactY / this.scale.height - obstacle.startY) /
          (obstacle.endY - obstacle.startY),
        0,
        1,
      );
      const playerDepth = projectedPathPosition ** (1 / projectionExponent);
      const depthTolerance = isAsteroid
        ? RASTRO_GAME_CONFIG.collision.asteroidDepthTolerance
        : RASTRO_GAME_CONFIG.collision.depthTolerance;

      if (
        (isAsteroid &&
          obstacle.progress < RASTRO_GAME_CONFIG.collision.asteroidMinimumProgress) ||
        (!isAsteroid &&
          obstacle.progress < RASTRO_GAME_CONFIG.collision.enemyMinimumProgress) ||
        Math.abs(obstacle.progress - playerDepth) > depthTolerance
      ) {
        continue;
      }

      const horizontalRadius =
        obstacle.image.displayWidth * RASTRO_GAME_CONFIG.collision.obstacleWidthFactor +
        this.player.width * this.player.scaleX *
          RASTRO_GAME_CONFIG.collision.playerWidthFactor;
      const verticalRadius =
        obstacle.image.displayHeight * RASTRO_GAME_CONFIG.collision.obstacleHeightFactor +
        this.player.height * this.player.scaleY *
          RASTRO_GAME_CONFIG.collision.playerHeightFactor;
      const horizontalDistance = (obstacle.image.x - this.player.x) / horizontalRadius;
      const verticalDistance = (obstacle.image.y - contactY) / verticalRadius;

      if (horizontalDistance ** 2 + verticalDistance ** 2 <= 1) {
        this.triggerCollision();
        return;
      }
    }
  }

  private triggerCollision(): void {
    this.isColliding = true;
    this.isPlaying = false;
    this.isFiring = false;
    this.lives = Math.max(0, this.lives - 1);
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

    const collisionLabel = this.add
      .text(
        this.scale.width / 2,
        this.scale.height * 0.45,
        RASTRO_GAME_CONFIG.texts.collision,
        {
        color: "#f0f9ff",
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        fontStyle: "bold",
        stroke: "#172554",
        strokeThickness: 5,
        resolution: this.getTextResolution(),
        },
      )
      .setOrigin(0.5)
      .setDepth(10);
    this.tweens.add({
      targets: collisionLabel,
      alpha: 0,
      y: collisionLabel.y - 22,
      delay: 380,
      duration: 400,
      onComplete: () => collisionLabel.destroy(),
    });

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
    const startY = this.scale.height * RASTRO_GAME_CONFIG.player.startY;
    const perspective = Phaser.Math.Clamp(
      (startY - this.scale.height * 0.13) / (this.scale.height * 0.87),
      0,
      1,
    );
    const scale =
      RASTRO_GAME_CONFIG.player.minScale +
      perspective * RASTRO_GAME_CONFIG.player.scaleRange;

    this.player.setPosition(centerX, startY).setScale(scale).setRotation(0).setAlpha(1);
    this.playerVisuals.shadow.setAlpha(1);
    this.playerVisuals.propulsionGlow.setAlpha(1);
    this.playerVisuals.propulsionCore.setAlpha(1);
    this.playerVisuals.leftThruster.setAlpha(1);
    this.playerVisuals.rightThruster.setAlpha(1);
    updatePlayerShipVisuals(this.playerVisuals, perspective, this.time.now, false);

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
        .text(centerX, centerY - 78, this.phase.name.toUpperCase(), {
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
          centerY - 24,
          this.phase.description,
          {
          color: "#cbd5e1",
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          align: "center",
          wordWrap: { width: Math.min(this.scale.width - 48, 440) },
          resolution: this.getTextResolution(),
          },
        )
        .setOrigin(0.5),
    );
    overlay.add(
      this.add
        .text(
          centerX,
          centerY + 12,
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
      .text(centerX, centerY + 76, RASTRO_GAME_CONFIG.texts.startButton, {
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
      RASTRO_GAME_CONFIG.asteroids.horizonY +
      (this.asteroidRandom() - 0.5) *
        RASTRO_GAME_CONFIG.asteroids.verticalHorizonJitter;
    const image = this.add
      .image(0, 0, RASTRO_TEXTURE_KEYS.asteroid)
      .setDepth(0.8);

    this.asteroids.push({
      image,
      progress,
      speed: targetSpeed ?? this.randomBetween(RASTRO_GAME_CONFIG.asteroids.speedRange),
      size: this.randomBetween(RASTRO_GAME_CONFIG.asteroids.sizeRange),
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
    const isBoss = settings?.bossName !== undefined;
    const health = settings?.health ?? 1;
    const image = this.add
      .image(0, 0, `${RASTRO_TEXTURE_KEYS.enemyPrefix}${variant}`)
      .setDepth(0.9);

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
      startX: 0.5 + lane * 0.27,
      startY:
        RASTRO_GAME_CONFIG.enemies.horizonY +
        (this.asteroidRandom() - 0.5) *
          RASTRO_GAME_CONFIG.enemies.verticalHorizonJitter,
      endX: isBoss
        ? 0.5 + lane * 0.15
        : this.randomBetween(RASTRO_GAME_CONFIG.enemies.destinationXRange),
      endY: isBoss
        ? RASTRO_GAME_CONFIG.enemies.bossHoldY
        : this.randomBetween(RASTRO_GAME_CONFIG.enemies.destinationYRange),
    });
  }

  private updateAsteroids(delta: number): void {
    this.asteroidSpawnElapsed += delta;
    if (
      this.asteroidSpawnElapsed >= RASTRO_GAME_CONFIG.asteroids.spawnIntervalMs &&
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
      const scale = (asteroid.size / 96) * (minScale + visibleProgress * scaleRange);
      asteroid.image
        .setPosition(x, y)
        .setScale(scale)
        .setAlpha(this.getPerspectiveAlpha(visibleProgress))
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

  private updateEnemies(delta: number): void {
    this.enemySpawnElapsed += delta;
    if (
      this.enemySpawnElapsed >= RASTRO_GAME_CONFIG.enemies.spawnIntervalMs &&
      this.enemies.length < RASTRO_GAME_CONFIG.enemies.maxCount
    ) {
      this.enemySpawnElapsed = 0;
      this.spawnEnemy();
    }

    for (let index = this.enemies.length - 1; index >= 0; index -= 1) {
      const enemy = this.enemies[index];
      enemy.progress = enemy.isBoss
        ? Math.min(1, enemy.progress + enemy.speed * (delta / 1000))
        : enemy.progress + enemy.speed * (delta / 1000);

      const perspective = this.getProjectedProgress(
        enemy.progress,
        RASTRO_GAME_CONFIG.enemies.projectionExponent,
      );
      const x =
        Phaser.Math.Linear(enemy.startX, enemy.endX, perspective) *
        this.scale.width;
      const y =
        Phaser.Math.Linear(enemy.startY, enemy.endY, perspective) *
        this.scale.height;
      const [minScale, scaleRange] = RASTRO_GAME_CONFIG.enemies.scaleRange;
      const visibleProgress = Phaser.Math.Clamp(perspective, 0, 1);
      const scale = enemy.size * (minScale + visibleProgress * scaleRange);

      enemy.image
        .setPosition(x, y)
        .setScale(scale)
        .setDepth(0.9 + visibleProgress * 0.4)
        .setAlpha(this.getPerspectiveAlpha(visibleProgress))
        .setTint(this.getPerspectiveTint(visibleProgress));

      const halfWidth = enemy.image.displayWidth / 2;
      const halfHeight = enemy.image.displayHeight / 2;
      const outsideScreen =
        x + halfWidth < -RASTRO_GAME_CONFIG.enemies.removeMargin ||
        x - halfWidth > this.scale.width + RASTRO_GAME_CONFIG.enemies.removeMargin ||
        y + halfHeight < -RASTRO_GAME_CONFIG.enemies.removeMargin ||
        y - halfHeight > this.scale.height + RASTRO_GAME_CONFIG.enemies.removeMargin;
      if (!enemy.isBoss && outsideScreen) {
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

      const perspective = this.getProjectedProgress(
        shot.progress,
        RASTRO_GAME_CONFIG.weapon.projectionExponent,
      );
      const x = Phaser.Math.Linear(shot.startX, shot.endX, perspective);
      const y = Phaser.Math.Linear(shot.startY, shot.endY, perspective);
      const scale =
        RASTRO_GAME_CONFIG.weapon.initialScale -
        perspective * RASTRO_GAME_CONFIG.weapon.scaleLoss;
      shot.image
        .setPosition(x, y)
        .setScale(scale)
        .setAlpha(1 - perspective * 0.28)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1.05 + shot.progress * 0.5);

      let hit = false;
      for (const target of [...this.asteroids, ...this.enemies]) {
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
    );
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
      endY: this.scale.height * RASTRO_GAME_CONFIG.weapon.endYFactor,
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
      if (isBoss) {
        this.isPlaying = false;
        this.isFiring = false;
        this.updateBossHud();
        this.time.delayedCall(2850, () => this.completePhase());
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

  private completePhase(): void {
    this.isPlaying = false;
    this.isFiring = false;
    const nextPhaseIndex = this.phaseIndex + 1;
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    const overlay = this.add
      .rectangle(centerX, centerY, this.scale.width, this.scale.height, 0x080d20, 0.9)
      .setDepth(20);
    overlay.setInteractive();

    if (nextPhaseIndex < RASTRO_LEVELS.length) {
      this.add
        .text(centerX, centerY - 30, RASTRO_GAME_CONFIG.texts.levelCompleteTitle, {
          color: "#f9fafb",
          fontFamily: "system-ui, sans-serif",
          fontSize: "32px",
          fontStyle: "bold",
          resolution: this.getTextResolution(),
        })
        .setOrigin(0.5)
        .setDepth(21);
      this.add
        .text(
          centerX,
          centerY + 18,
          `${RASTRO_GAME_CONFIG.texts.levelCompleteDescription}\n` +
            `${RASTRO_LEVELS[nextPhaseIndex].name}`,
          {
            color: "#cbd5e1",
            fontFamily: "system-ui, sans-serif",
            fontSize: "18px",
            align: "center",
            resolution: this.getTextResolution(),
          },
        )
        .setOrigin(0.5)
        .setDepth(21);
      this.time.delayedCall(2200, () => {
        this.scene.restart({
          lives: this.lives,
          hasStarted: true,
          phaseIndex: nextPhaseIndex,
        });
      });
      return;
    }

    this.add
      .text(centerX, centerY - 44, RASTRO_GAME_CONFIG.texts.missionCompleteTitle, {
        color: "#f9fafb",
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        fontStyle: "bold",
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setDepth(21);
    this.add
      .text(centerX, centerY + 4, RASTRO_GAME_CONFIG.texts.missionCompleteDescription, {
        color: "#cbd5e1",
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        align: "center",
        wordWrap: { width: Math.min(this.scale.width - 48, 440) },
        resolution: this.getTextResolution(),
      })
      .setOrigin(0.5)
      .setDepth(21);
    const restartButton = this.add
      .text(centerX, centerY + 68, RASTRO_GAME_CONFIG.texts.restartButton, {
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
  }

  private showShotImpact(x: number, y: number): void {
    const impact = this.add.circle(x, y, 4, 0xa5f3fc, 0.95).setDepth(3);
    this.tweens.add({
      targets: impact,
      scale: 3,
      alpha: 0,
      duration: 180,
      onComplete: () => impact.destroy(),
    });
  }

  private drawSpaceBackground(): void {
    renderSpaceBackground(
      this.background,
      this.scale.width,
      this.scale.height,
      this.phase.background,
    );
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

  private getProjectedProgress(progress: number, exponent: number): number {
    return Math.max(0, progress) ** exponent;
  }

  private getPerspectiveAlpha(progress: number): number {
    return Phaser.Math.Linear(
      RASTRO_GAME_CONFIG.perspective.distantAlpha,
      1,
      Phaser.Math.Clamp(progress, 0, 1),
    );
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
