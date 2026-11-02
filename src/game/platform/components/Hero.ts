import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { LevelConfig } from "../levelConfig";

export interface HeroInput {
  direction: number;
  running: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
}

export const NO_INPUT: HeroInput = {
  direction: 0,
  running: false,
  jumpPressed: false,
  jumpHeld: false,
};

/** Altura do pulinho e empurrão para trás quando o herói é machucado. */
const DEATH_HOP_SPEED = 520;
const DEATH_PUSH_SPEED = 110;
/** Quanto tempo o herói fica sentado e zonzo antes de reaparecer. */
const DAZE_MS = 1500;

function moveToward(value: number, target: number, maxDelta: number): number {
  if (Math.abs(target - value) <= maxDelta) {
    return target;
  }
  return value + Math.sign(target - value) * maxDelta;
}

/**
 * Explorador: sprite animado sincronizado a um retângulo físico invisível.
 *
 * O movimento usa aceleração/atrito (em vez de velocidade instantânea), tempo de
 * coiote, buffer de pulo, altura de pulo variável, gravidade maior na queda, meia
 * gravidade no ápice e squash/stretch na decolagem e no pouso.
 */
export class Hero {
  readonly collider: Phaser.GameObjects.Rectangle;
  readonly sprite: Phaser.GameObjects.Sprite;
  private facing: 1 | -1 = 1;
  private dustTimer = 0;
  private coyote = 0;
  private jumpBuffer = 0;
  private isJumping = false;
  private wasOnGround = true;
  private lastFallSpeed = 0;
  /** Positivo = achatado (pouso); negativo = esticado (pulo). */
  private squash = 0;
  private dying = false;
  private deathPhase: "air" | "daze" = "air";
  private deathElapsed = 0;
  private dazeLeft = 0;
  private onDeathDone?: () => void;
  private stars: Phaser.GameObjects.Image[] = [];
  private starAngle = 0;
  private readonly spawn: LevelConfig["player"]["spawn"];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: LevelConfig["player"],
  ) {
    this.spawn = player.spawn;
    this.collider = scene.add.rectangle(
      player.spawn.x,
      player.spawn.y,
      player.size.width,
      player.size.height,
      0xfde68a,
    );
    this.collider.setVisible(false);
    scene.physics.add.existing(this.collider);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(player.runSpeed * 1.25, player.movement.maxFallSpeed);

    this.sprite = scene.add
      .sprite(player.spawn.x, player.spawn.y, "hero-idle-0")
      .setDepth(DEPTH.HERO);
    this.sprite.play("hero-idle");
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.collider.body as Phaser.Physics.Arcade.Body;
  }

  get x(): number {
    return this.collider.x;
  }

  get y(): number {
    return this.collider.y;
  }

  setPhysicsEnabled(enabled: boolean): void {
    this.body.enable = enabled;
  }

  /**
   * Animação de dano (estilo Donkey Kong Country): o herói fica de frente, dá um
   * pulinho para trás, cai no chão e fica sentado e zonzo, com estrelas girando.
   */
  playDeath(onDone: () => void): void {
    this.dying = true;
    this.deathPhase = "air";
    this.deathElapsed = 0;
    this.onDeathDone = onDone;
    this.sprite.anims.stop();
    this.sprite.setTexture("hero-hurt");
    this.sprite.setFlipX(false).setAngle(0).setScale(1);
    this.squash = 0;
    this.isJumping = false;
    this.body.setGravityY(0);
    this.body.setVelocity(-this.facing * DEATH_PUSH_SPEED, -DEATH_HOP_SPEED);
  }

  private updateDeath(delta: number): void {
    const { body, sprite } = this;
    this.deathElapsed += delta;
    const onGround = body.blocked.down;

    if (this.deathPhase === "air") {
      sprite.setPosition(this.collider.x, this.collider.y);
      sprite.setAngle(Math.sin(this.deathElapsed / 90) * 6);
      if (this.deathElapsed > 150 && onGround) {
        this.deathPhase = "daze";
        this.dazeLeft = DAZE_MS;
        body.setVelocityX(0);
        sprite.setTexture("hero-dazed").setAngle(0);
        this.squash = 0.7;
        this.puff(4, 0.8);
        this.createStars();
      }
      return;
    }

    // Sentado e zonzo: acomoda o corpo e faz as estrelas orbitarem a cabeça.
    this.squash = moveToward(this.squash, 0, (delta / 1000) * 4);
    sprite.setScale(1 + 0.2 * this.squash, 1 - 0.2 * this.squash);
    sprite.setPosition(
      this.collider.x,
      this.collider.y + (1 - sprite.scaleY) * this.player.size.height * 0.5,
    );
    sprite.setAngle(Math.sin(this.deathElapsed / 260) * 3);
    this.starAngle += delta / 220;
    this.stars.forEach((star, i) => {
      const a = this.starAngle + (i / this.stars.length) * Math.PI * 2;
      star.setPosition(sprite.x + 2 + Math.cos(a) * 17, sprite.y - 24 + Math.sin(a) * 5);
      star.setDepth(DEPTH.HERO + (Math.sin(a) > 0 ? 0.1 : -0.1));
      star.setAngle(star.angle + delta * 0.3);
    });

    this.dazeLeft -= delta;
    if (this.dazeLeft <= 0) {
      this.clearStars();
      this.dying = false;
      sprite.setAngle(0).setScale(1);
      const done = this.onDeathDone;
      this.onDeathDone = undefined;
      done?.();
    }
  }

  private createStars(): void {
    this.clearStars();
    for (let i = 0; i < 3; i += 1) {
      this.stars.push(
        this.scene.add.image(this.sprite.x, this.sprite.y, "spark").setTint(0xfde047).setScale(1.3),
      );
    }
  }

  private clearStars(): void {
    this.stars.forEach((star) => star.destroy());
    this.stars = [];
  }

  /** Impulso para cima ao pisar num inimigo. */
  bounce(speed: number): void {
    this.body.setVelocityY(-speed);
    this.isJumping = false;
    this.squash = -0.5;
  }

  /** Verdadeiro quando caiu abaixo do mundo (buraco). */
  hasFallen(worldHeight: number): boolean {
    return this.collider.y > worldHeight + 200;
  }

  respawn(): void {
    this.collider.setPosition(this.spawn.x, this.spawn.y);
    this.body.setVelocity(0, 0);
    this.facing = 1;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.isJumping = false;
    this.squash = 0;
    this.dying = false;
    this.clearStars();
  }

  /** Pisca brevemente após reaparecer. */
  blink(): void {
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.35,
      duration: 120,
      yoyo: true,
      repeat: 5,
      onComplete: () => this.sprite.setAlpha(1),
    });
  }

  /** Aplica a entrada, o movimento e a animação do quadro atual. */
  update(input: HeroInput, delta: number): void {
    if (!this.body.enable) {
      return;
    }
    if (this.dying) {
      this.updateDeath(delta);
      return;
    }
    const dt = delta / 1000;
    const { body } = this;
    const onGround = body.blocked.down;

    this.updateHorizontal(input, onGround, dt);
    this.updateJump(input, onGround, delta);
    this.updateGravity(input, onGround);
    this.updateLanding(onGround);
    this.syncSprite(input, onGround, delta);
  }

  // ------------------------------------------------------------- movimento

  private updateHorizontal(input: HeroInput, onGround: boolean, dt: number): void {
    const { movement, walkSpeed, runSpeed } = this.player;
    const { body } = this;
    const speed = input.running ? runSpeed : walkSpeed;
    const target = input.direction * speed;
    const velocity = body.velocity.x;

    let accel: number;
    if (input.direction === 0) {
      accel = onGround ? movement.groundDecel : movement.airDecel;
    } else if (Math.abs(velocity) > 10 && Math.sign(velocity) !== input.direction) {
      // Inverter o sentido: freia mais forte no chão para a virada ser ágil, mas com peso.
      accel = onGround ? movement.turnAccel : movement.airAccel * 1.6;
    } else if (Math.abs(velocity) > Math.abs(target)) {
      accel = onGround ? movement.groundDecel * 0.6 : movement.airDecel;
    } else {
      accel = onGround ? movement.groundAccel : movement.airAccel;
    }

    body.setVelocityX(moveToward(velocity, target, accel * dt));
    if (input.direction !== 0) {
      this.facing = input.direction > 0 ? 1 : -1;
    }
  }

  private updateJump(input: HeroInput, onGround: boolean, delta: number): void {
    const { movement, jumpSpeed } = this.player;
    const { body } = this;

    this.coyote = onGround ? movement.coyoteMs : Math.max(0, this.coyote - delta);
    this.jumpBuffer = input.jumpPressed ? movement.jumpBufferMs : Math.max(0, this.jumpBuffer - delta);

    if (this.jumpBuffer > 0 && this.coyote > 0) {
      body.setVelocityY(-jumpSpeed);
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.isJumping = true;
      this.squash = -0.7;
      this.puff(2, 0.7);
    }

    // Soltar o botão cedo corta o impulso: toque = salto curto, segurar = salto alto.
    if (this.isJumping && !input.jumpHeld && body.velocity.y < 0) {
      body.setVelocityY(body.velocity.y * movement.jumpCutFactor);
      this.isJumping = false;
    }
    if (body.velocity.y >= 0) {
      this.isJumping = false;
    }
  }

  private updateGravity(input: HeroInput, onGround: boolean): void {
    const { movement } = this.player;
    const { body } = this;
    const world = this.scene.physics.world.gravity.y;
    let extra = 0;
    if (!onGround) {
      const nearApex = Math.abs(body.velocity.y) < movement.apexSpeedThreshold;
      if (nearApex && input.jumpHeld) {
        extra = -world * movement.apexGravityFactor; // flutua um instante no topo
      } else if (body.velocity.y > 0) {
        extra = world * (movement.fallGravityMultiplier - 1); // cai mais rápido do que sobe
      }
    }
    body.setGravityY(extra);
  }

  private updateLanding(onGround: boolean): void {
    if (!onGround) {
      this.lastFallSpeed = Math.max(this.lastFallSpeed, this.body.velocity.y);
    } else if (!this.wasOnGround) {
      if (this.lastFallSpeed > 220) {
        this.squash = Phaser.Math.Clamp(this.lastFallSpeed / 800, 0.3, 1);
        this.puff(this.lastFallSpeed > 500 ? 4 : 2, 0.8);
      }
      this.lastFallSpeed = 0;
    }
    if (onGround) {
      this.lastFallSpeed = 0;
    }
    this.wasOnGround = onGround;
  }

  // -------------------------------------------------------------- aparência

  private syncSprite(input: HeroInput, onGround: boolean, delta: number): void {
    const { walkSpeed, runSpeed } = this.player;
    const { body } = this;
    const speed = Math.abs(body.velocity.x);

    let animation = "hero-idle";
    let timeScale = 1;
    if (!onGround) {
      animation = body.velocity.y < 0 ? "hero-jump" : "hero-fall";
    } else if (speed > 25) {
      const running = speed > walkSpeed * 1.15;
      animation = running ? "hero-run" : "hero-walk";
      // A cadência dos passos acompanha a velocidade real (acelera e desacelera junto).
      timeScale = Phaser.Math.Clamp(speed / (running ? runSpeed : walkSpeed), 0.55, 1.2);
    }
    this.sprite.anims.play(animation, true);
    this.sprite.anims.timeScale = timeScale;

    this.squash = moveToward(this.squash, 0, (delta / 1000) * 5);
    let scaleX = 1 + 0.28 * this.squash;
    let scaleY = 1 - 0.28 * this.squash;
    if (!onGround) {
      const stretch = Phaser.Math.Clamp(Math.abs(body.velocity.y) / 1800, 0, 0.1);
      scaleX *= 1 - stretch * 0.6;
      scaleY *= 1 + stretch;
    }
    // Os pés ficam plantados: o centro desce quando o sprite achata.
    this.sprite.setPosition(
      this.collider.x,
      this.collider.y + (1 - scaleY) * this.player.size.height * 0.5,
    );
    this.sprite.setScale(scaleX, scaleY);
    this.sprite.setFlipX(this.facing < 0);
    // Inclina levemente para o lado em que acelera.
    this.sprite.setAngle(onGround ? (body.velocity.x / runSpeed) * 3 : 0);

    // Poeira nos pés: passos e, mais forte, ao frear numa virada brusca.
    this.dustTimer -= delta;
    const skidding =
      onGround &&
      input.direction !== 0 &&
      speed > 140 &&
      Math.sign(body.velocity.x) !== input.direction;
    if (onGround && (speed > 60 || skidding) && this.dustTimer <= 0) {
      this.dustTimer = skidding ? 55 : speed > walkSpeed * 1.15 ? 70 : 170;
      this.spawnDust(skidding || speed > walkSpeed * 1.15, skidding ? -Math.sign(body.velocity.x) : -this.facing);
    }
  }

  private puff(count: number, strength: number): void {
    for (let i = 0; i < count; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      this.spawnDust(strength > 0.6, side);
    }
  }

  /** Nuvenzinha de poeira que se afasta no sentido `side` (-1 esquerda, 1 direita). */
  private spawnDust(strong: boolean, side: number): void {
    const puff = this.scene.add
      .image(
        this.collider.x + side * 10,
        this.collider.y + this.player.size.height / 2 - 2,
        "dust",
      )
      .setDepth(DEPTH.DUST)
      .setAlpha(strong ? 0.75 : 0.5)
      .setScale(strong ? 0.7 : 0.5);
    this.scene.tweens.add({
      targets: puff,
      x: puff.x + side * (strong ? 22 : 10),
      y: puff.y - (strong ? 12 : 6),
      alpha: 0,
      scale: strong ? 1.3 : 0.9,
      duration: strong ? 380 : 300,
      onComplete: () => puff.destroy(),
    });
  }
}
