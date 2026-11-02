import Phaser from "phaser";

type Firefly = Phaser.GameObjects.Arc;

export class ForestScene extends Phaser.Scene {
  private background!: Phaser.GameObjects.Graphics;
  private player!: Phaser.GameObjects.Container;
  private lanternGlow!: Phaser.GameObjects.Image;
  private leftWing!: Phaser.GameObjects.Ellipse;
  private rightWing!: Phaser.GameObjects.Ellipse;
  private fairyBody!: Phaser.GameObjects.Arc;
  private fairyCore!: Phaser.GameObjects.Arc;
  private magicSparkles: Phaser.GameObjects.Star[] = [];
  private fireflies: Firefly[] = [];
  private score = 0;
  private remainingTime = 45;
  private lives = 3;
  private hasStarted = false;
  private hasFinished = false;
  private isGameOver = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private startKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private movementKeys!: Record<"up" | "down" | "left" | "right", Phaser.Input.Keyboard.Key>;
  private scoreLabel!: Phaser.GameObjects.Text;
  private livesLabel!: Phaser.GameObjects.Text;
  private timerLabel!: Phaser.GameObjects.Text;
  private startScreen?: Phaser.GameObjects.Container;
  private startOverlay?: Phaser.GameObjects.Rectangle;

  constructor() {
    super("ForestScene");
  }

  init(data: { lives?: number }): void {
    this.lives = data.lives ?? 3;
  }

  create(): void {
    // A reinicialização reutiliza a mesma instância da cena; restaure o estado
    // da rodada antes de criar os novos objetos visuais.
    this.fireflies = [];
    this.score = 0;
    this.remainingTime = 45;
    this.hasStarted = false;
    this.hasFinished = false;
    this.isGameOver = false;
    this.magicSparkles = [];

    this.background = this.add.graphics().setDepth(-1);
    this.drawForest();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawForest, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawForest, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.positionHud, this);
    });

    this.player = this.createFairy(this.scale.width / 2, this.scale.height * 0.68);
    this.createAuraTexture();
    this.lanternGlow = this.add.image(this.player.x, this.player.y, "fairy-aura").setDisplaySize(96, 96);
    this.lanternGlow.setDepth(0.7);
    this.createMagicSparkles();

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("O teclado não está disponível nesta cena.");
    }

    this.cursors = keyboard.createCursorKeys();
    this.startKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.movementKeys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.scoreLabel = this.add.text(24, 22, "Luzes: 0", this.labelStyle());
    this.livesLabel = this.add
      .text(this.scale.width / 2, 22, this.getLivesText(), this.labelStyle())
      .setOrigin(0.5, 0);
    this.timerLabel = this.add.text(this.scale.width - 24, 22, "45s", this.labelStyle()).setOrigin(1, 0);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.positionHud, this);

    for (let index = 0; index < 8; index += 1) {
      this.spawnFirefly();
    }

    this.showStartScreen();
  }

  update(time: number, delta: number): void {
    if (this.isGameOver) {
      if (
        Phaser.Input.Keyboard.JustDown(this.startKey) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)
      ) {
        this.scene.restart({ lives: 3 });
      }
      return;
    }

    if (this.hasFinished) {
      return;
    }

    this.animateFairy(time);
    if (!this.hasStarted) {
      if (
        Phaser.Input.Keyboard.JustDown(this.startKey) ||
        Phaser.Input.Keyboard.JustDown(this.spaceKey)
      ) {
        this.startRound();
      }
      return;
    }

    this.remainingTime = Math.max(0, this.remainingTime - delta / 1000);
    this.timerLabel.setText(`${Math.ceil(this.remainingTime)}s`);
    if (this.remainingTime === 0) {
      this.loseLife();
      return;
    }

    const horizontal =
      Number(this.cursors.right.isDown || this.movementKeys.right.isDown) -
      Number(this.cursors.left.isDown || this.movementKeys.left.isDown);
    const vertical =
      Number(this.cursors.down.isDown || this.movementKeys.down.isDown) -
      Number(this.cursors.up.isDown || this.movementKeys.up.isDown);
    const direction = new Phaser.Math.Vector2(horizontal, vertical).normalize();
    const distance = 260 * (delta / 1000);

    this.player.x = Phaser.Math.Clamp(this.player.x + direction.x * distance, 30, this.scale.width - 30);
    this.player.y = Phaser.Math.Clamp(this.player.y + direction.y * distance, 78, this.scale.height - 30);
    this.lanternGlow.setPosition(this.player.x, this.player.y);

    for (const firefly of this.fireflies) {
      firefly.setAlpha(0.65 + Math.sin((Date.now() + firefly.x * 9) * 0.008) * 0.35);
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, firefly.x, firefly.y) < 32) {
        firefly.destroy();
        this.fireflies = this.fireflies.filter((item) => item !== firefly);
        this.score += 1;
        this.scoreLabel.setText(`Luzes: ${this.score}`);
        this.spawnFirefly();

        if (this.score >= 12) {
          this.finish("O bosque voltou a brilhar!");
          return;
        }
      }
    }
  }

  private spawnFirefly(): void {
    const padding = 56;
    const firefly = this.add.circle(
      Phaser.Math.Between(padding, Math.max(padding, this.scale.width - padding)),
      Phaser.Math.Between(96, Math.max(96, this.scale.height - padding)),
      6,
      0xfde68a,
    );
    firefly
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(0.5)
      .setStrokeStyle(2, 0xfffbeb, 0.8);
    this.fireflies.push(firefly);
  }

  private createFairy(x: number, y: number): Phaser.GameObjects.Container {
    const fairy = this.add.container(x, y).setDepth(1);
    const leftWing = this.add
      .ellipse(-11, 0, 14, 23, 0xc4b5fd, 0.44)
      .setAngle(-22);
    const rightWing = this.add
      .ellipse(11, 0, 14, 23, 0xc4b5fd, 0.44)
      .setAngle(22);
    const body = this.add.circle(0, 0, 11, 0xfde68a);
    const heart = this.add.circle(0, 0, 5, 0xffffff, 0.85);

    fairy.add([leftWing, rightWing, body, heart]);
    this.leftWing = leftWing;
    this.rightWing = rightWing;
    this.fairyBody = body;
    this.fairyCore = heart;

    return fairy;
  }

  private showStartScreen(): void {
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x071713, 0.72)
      .setOrigin(0.5);
    const title = this.add
      .text(0, -60, "Bosque das\nLanternas", this.crispTextStyle({
        color: "#fef3c7",
        fontFamily: "system-ui, sans-serif",
        fontSize: "48px",
        fontStyle: "bold",
        align: "center",
        stroke: "#17352a",
        strokeThickness: 7,
      }))
      .setOrigin(0.5);
    const description = this.add
      .text(0, 38, "Encontre 12 vagalumes antes\nda noite terminar.", this.crispTextStyle({
        color: "#d9f99d",
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        align: "center",
        lineSpacing: 6,
      }))
      .setOrigin(0.5);
    const start = this.add
      .text(0, 112, "Pressione Enter ou Espaço para começar", this.crispTextStyle({
        color: "#fef3c7",
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        fontStyle: "bold",
      }))
      .setOrigin(0.5);

    this.startOverlay = overlay;
    this.startScreen = this.add
      .container(this.scale.width / 2, this.scale.height / 2, [overlay, title, description, start])
      .setDepth(4);
  }

  private startRound(): void {
    this.hasStarted = true;
    this.startScreen?.destroy();
    this.startScreen = undefined;
    this.startOverlay = undefined;
  }

  private loseLife(): void {
    this.hasFinished = true;
    this.lives -= 1;
    this.livesLabel.setText(this.getLivesText());

    if (this.lives === 0) {
      this.isGameOver = true;
      this.showGameOver();
      return;
    }

    this.add
      .text(this.scale.width / 2, this.scale.height * 0.45, "Uma luz se apagou...", this.crispTextStyle({
        color: "#fef3c7",
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        fontStyle: "bold",
        stroke: "#1c1917",
        strokeThickness: 6,
      }))
      .setOrigin(0.5)
      .setDepth(3);
    this.time.delayedCall(1300, () => this.scene.restart({ lives: this.lives }));
  }

  private showGameOver(): void {
    const overlay = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x120c18, 0.78)
      .setOrigin(0.5);
    const title = this.add
      .text(0, -34, "Game Over", this.crispTextStyle({
        color: "#fda4af",
        fontFamily: "system-ui, sans-serif",
        fontSize: "48px",
        fontStyle: "bold",
        stroke: "#3f1720",
        strokeThickness: 7,
      }))
      .setOrigin(0.5);
    const prompt = this.add
      .text(0, 42, "A floresta espera por uma nova luz.\nPressione Enter ou Espaço para recomeçar", this.crispTextStyle({
        color: "#fef3c7",
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        align: "center",
        lineSpacing: 8,
      }))
      .setOrigin(0.5);

    this.startOverlay = overlay;
    this.startScreen = this.add
      .container(this.scale.width / 2, this.scale.height / 2, [overlay, title, prompt])
      .setDepth(5);
  }

  private getLivesText(): string {
    return `Vidas: ${"♥ ".repeat(this.lives)}${"○ ".repeat(3 - this.lives)}`.trim();
  }

  private animateFairy(time: number): void {
    const wingBeat = (Math.sin(time * 0.032) + 1) / 2;
    const lightPulse = (Math.sin(time * 0.007) + 1) / 2;
    this.leftWing
      .setPosition(-12 * wingBeat, 0)
      .setScale(0.28 + wingBeat * 0.72, 0.9 + wingBeat * 0.1);
    this.rightWing
      .setPosition(12 * wingBeat, 0)
      .setScale(0.28 + wingBeat * 0.72, 0.9 + wingBeat * 0.1);
    this.fairyBody.setScale(0.9 + lightPulse * 0.14).setAlpha(0.75 + lightPulse * 0.25);
    this.fairyCore.setScale(0.7 + lightPulse * 0.32).setAlpha(0.65 + lightPulse * 0.3);
    this.lanternGlow.setScale(0.94 + lightPulse * 0.08).setAlpha(0.72 + lightPulse * 0.12);
    this.updateMagicSparkles(time);
  }

  private createMagicSparkles(): void {
    for (let index = 0; index < 5; index += 1) {
      const sparkle = this.add.star(this.player.x, this.player.y, 4, 2, 6, 0xfef3c7, 0.9);
      sparkle.setBlendMode(Phaser.BlendModes.ADD).setDepth(0.9);
      this.magicSparkles.push(sparkle);
    }
  }

  private createAuraTexture(): void {
    if (this.textures.exists("fairy-aura")) {
      return;
    }

    const texture = this.textures.createCanvas("fairy-aura", 160, 160);
    if (!texture) {
      throw new Error("Não foi possível criar a textura da aura.");
    }
    const context = texture.context;
    const radius = 80;
    const gradient = context.createRadialGradient(radius, radius, 4, radius, radius, radius);

    gradient.addColorStop(0, "rgba(255, 250, 205, 0.6)");
    gradient.addColorStop(0.25, "rgba(253, 230, 138, 0.42)");
    gradient.addColorStop(0.58, "rgba(251, 191, 36, 0.15)");
    gradient.addColorStop(1, "rgba(251, 191, 36, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, radius * 2, radius * 2);
    texture.refresh();
  }

  private updateMagicSparkles(time: number): void {
    this.magicSparkles.forEach((sparkle, index) => {
      const angle = time * 0.0014 + (Math.PI * 2 * index) / this.magicSparkles.length;
      const radius = 25 + Math.sin(time * 0.004 + index) * 7;
      sparkle.setPosition(
        this.player.x + Math.cos(angle) * radius,
        this.player.y + Math.sin(angle * 1.4) * radius * 0.7,
      );
      sparkle.setScale(0.55 + Math.sin(time * 0.006 + index) * 0.2);
      sparkle.setAlpha(0.45 + Math.sin(time * 0.005 + index) * 0.35);
    });
  }

  private finish(message: string): void {
    this.hasFinished = true;
    this.add
      .text(this.scale.width / 2, this.scale.height / 2, message, this.crispTextStyle({
        color: "#fef3c7",
        fontFamily: "system-ui, sans-serif",
        fontSize: "30px",
        fontStyle: "bold",
        stroke: "#1c1917",
        strokeThickness: 6,
      }))
      .setOrigin(0.5)
      .setDepth(2);
    this.time.delayedCall(1800, () => this.scene.restart({ lives: 3 }));
  }

  private drawForest(): void {
    const graphics = this.background;
    const width = this.scale.width;
    const height = this.scale.height;

    graphics.clear();
    graphics.fillStyle(0x0c211e, 1).fillRect(0, 0, width, height);
    graphics.fillStyle(0x173d35, 1).fillCircle(width * 0.5, height * 0.08, height * 0.68);
    graphics.fillStyle(0x235242, 0.7).fillCircle(width * 0.16, height * 0.32, height * 0.32);
    graphics.fillStyle(0x204b3b, 0.7).fillCircle(width * 0.86, height * 0.26, height * 0.4);

    const moonRadius = Phaser.Math.Clamp(Math.min(width, height) * 0.065, 26, 56);
    graphics.fillStyle(0xfef3c7, 0.95).fillCircle(width * 0.76, height * 0.16, moonRadius);
    graphics.fillStyle(0xd6d3a5, 0.48).fillCircle(width * 0.78, height * 0.14, moonRadius * 0.55);
    graphics.fillStyle(0x0c211e, 1).fillCircle(width * 0.785, height * 0.14, moonRadius * 0.75);

    const starRandom = this.createRandom(47);
    for (let index = 0; index < Math.floor(width / 18); index += 1) {
      const x = starRandom() * width;
      const y = 14 + starRandom() * height * 0.42;
      const radius = starRandom() > 0.8 ? 1.5 : 0.7;
      graphics.fillStyle(starRandom() > 0.72 ? 0xfef3c7 : 0x9ee9bc, 0.3 + starRandom() * 0.55);
      graphics.fillCircle(x, y, radius);
    }

    const pathTop = height * 0.49;
    graphics.fillStyle(0x8a704f, 0.46);
    graphics.fillPoints(
      [
        { x: width * 0.45, y: pathTop },
        { x: width * 0.58, y: pathTop },
        { x: width * 0.82, y: height },
        { x: width * 0.12, y: height },
      ],
      true,
    );
    graphics.fillStyle(0xc7a76a, 0.12);
    graphics.fillPoints(
      [
        { x: width * 0.49, y: pathTop },
        { x: width * 0.54, y: pathTop },
        { x: width * 0.62, y: height },
        { x: width * 0.34, y: height },
      ],
      true,
    );

    for (let x = -20; x < width + 30; x += 58) {
      const treeHeight = height * (0.28 + ((x * 13) % 5) * 0.025);
      graphics.fillStyle(0x102b24, 1).fillRect(x + 21, height - treeHeight, 12, treeHeight);
      graphics.fillStyle(0x15382c, 1).fillTriangle(x - 22, height - treeHeight * 0.58, x + 28, height - treeHeight * 1.22, x + 76, height - treeHeight * 0.58);
      graphics.fillStyle(0x1c4936, 0.9).fillTriangle(x - 13, height - treeHeight * 0.78, x + 28, height - treeHeight * 1.42, x + 67, height - treeHeight * 0.78);
    }

    graphics.fillStyle(0x47754b, 0.5);
    for (let x = 0; x < width; x += 18) {
      graphics.fillTriangle(x, height, x + 6, height - 13, x + 12, height);
    }
  }

  private labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return {
      color: "#ecfccb",
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      stroke: "#172217",
      strokeThickness: 4,
      resolution: this.getTextResolution(),
    };
  }

  private crispTextStyle(
    style: Phaser.Types.GameObjects.Text.TextStyle,
  ): Phaser.Types.GameObjects.Text.TextStyle {
    return { ...style, resolution: this.getTextResolution() };
  }

  private getTextResolution(): number {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  private positionHud(): void {
    this.livesLabel.setPosition(this.scale.width / 2, 22);
    this.timerLabel.setPosition(this.scale.width - 24, 22);
    this.startScreen?.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.startOverlay?.setSize(this.scale.width, this.scale.height);
  }

  private createRandom(seed: number): () => number {
    let state = seed;

    return () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
  }
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
