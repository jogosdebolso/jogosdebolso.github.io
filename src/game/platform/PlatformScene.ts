import Phaser from "phaser";
import { Background } from "./components/Background";
import { Coins } from "./components/Coins";
import { Controls } from "./components/Controls";
import { createDecoration } from "./components/Decoration";
import { Enemies } from "./components/Enemies";
import { ExtraLives } from "./components/ExtraLives";
import { Goal } from "./components/Goal";
import { Hero, NO_INPUT, type HeroInput } from "./components/Hero";
import { Hud } from "./components/Hud";
import { EXIT_MARGIN } from "./constants";
import { Obstacles } from "./components/Obstacles";
import { Panel, type PanelContent } from "./components/Panel";
import { Secrets } from "./components/Secrets";
import { showToast } from "./components/Toast";
import { Transition } from "./components/Transition";
import { createTerrain } from "./components/Terrain";
import { formatText, levels, type LevelConfig } from "./levelConfig";
import { buildAllTextures } from "./textures";

type GameState = "intro" | "playing" | "dying" | "won" | "over";

/** Atraso curto evita reiniciar sem querer com o Espaço do último pulo. */
const RESTART_DELAY_MS = 700;
/** Tempo entre tocar a bandeira e iniciar a próxima fase. */
const AUTO_ADVANCE_MS = 4300;
/** Quando a tela preta começa a escurecer (o herói corre para fora nesse intervalo). */
const FADE_START_MS = 1100;
const FADE_DURATION_MS = 600;
/** Na última fase, o painel final aparece depois da corrida para fora da tela. */
const FINAL_PANEL_DELAY_MS = 1300;

/** GAME OVER: tela preta, texto com fade in, pausa, fade out e volta ao início. */
const GAME_OVER_FADE_MS = 700;
const GAME_OVER_HOLD_MS = 1400;

/** Impulso do herói ao pisar num inimigo. */
const ENEMY_BOUNCE_SPEED = 460;

/** Quantas moedas valem uma vida extra. */
const COINS_PER_LIFE = 100;

const RUN_OUT: HeroInput = { direction: 1, running: true, jumpPressed: false, jumpHeld: false };

/** Dados recebidos ao reiniciar a cena (para avançar de fase). */
interface SceneData {
  levelIndex?: number;
  /** Mostra a tela de início (padrão: sim, só na primeira vez). */
  intro?: boolean;
  /** Vidas e moedas guardadas que acompanham o jogador entre as fases. */
  lives?: number;
  wallet?: number;
  /** Abre a cena com um fade a partir do preto (após o GAME OVER). */
  fadeIn?: boolean;
}

/** Salto das Nuvens: cena de plataforma que orquestra os componentes da pasta `platform/`. */
export class PlatformScene extends Phaser.Scene {
  private controls!: Controls;
  private background!: Background;
  private hero!: Hero;
  private coins!: Coins;
  private goal!: Goal;
  private enemies!: Enemies;
  private obstacles!: Obstacles;
  private secrets!: Secrets;
  private extraLives!: ExtraLives;
  private hud!: Hud;
  private panel?: Panel;
  private state: GameState = "intro";
  private levelIndex = 0;
  private level: LevelConfig = levels[0] as LevelConfig;
  private showIntro = true;
  private fadeInOnStart = false;
  private autoAdvance = false;
  private transition?: Transition;
  private lives = 0;
  /** Moedas rumo à próxima vida: a cada 100 o jogador ganha uma vida. */
  private wallet = 0;
  private carriedLives?: number;
  private endedAt = 0;

  constructor() {
    super("PlatformScene");
  }

  init(data: SceneData): void {
    const index = data.levelIndex ?? 0;
    this.levelIndex = index >= 0 && index < levels.length ? index : 0;
    this.level = levels[this.levelIndex] ?? (levels[0] as LevelConfig);
    this.showIntro = data.intro ?? true;
    this.fadeInOnStart = data.fadeIn ?? false;
    this.carriedLives = data.lives;
    this.wallet = data.wallet ?? 0;
  }

  create(): void {
    // A cena é reutilizada ao reiniciar; restaure o estado antes de recriar objetos.
    const { level } = this;
    this.state = "intro";
    this.lives = this.carriedLives ?? level.player.lives;
    this.panel = undefined;
    this.transition = undefined;
    this.autoAdvance = false;

    const { world, player, background } = level;
    buildAllTextures(this, level);
    this.physics.world.setBounds(0, 0, world.width + EXIT_MARGIN, world.height * 2);

    this.background = new Background(this, level);
    const solids = createTerrain(this, level);
    createDecoration(this, level);
    this.goal = new Goal(this, level.goal.x, world.groundY);
    this.coins = new Coins(this, level.coins);
    this.secrets = new Secrets(this, level.secrets, world.groundY);
    this.extraLives = new ExtraLives(this, level.extraLives);
    this.obstacles = new Obstacles(this, level.obstacles, world.groundY);
    this.enemies = new Enemies(this, level.enemies, world.groundY);

    this.hero = new Hero(this, player);
    solids.forEach((block) => this.physics.add.collider(this.hero.collider, block));

    const camera = this.cameras.main;
    camera.setBounds(0, 0, world.width, world.height);
    camera.setBackgroundColor(background.cameraColor);
    camera.startFollow(this.hero.collider, true, 0.1, 0.1);

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("O teclado não está disponível nesta cena.");
    }
    this.controls = new Controls(keyboard);

    this.hud = new Hud(this, level.texts.hud, level.name);
    this.hud.setCoins(this.wallet);
    this.hud.setLives(this.lives);

    if (this.showIntro) {
      const { texts } = level;
      this.showPanel({
        title: texts.title,
        subtitle: formatText(texts.start.subtitle, {
          maxLives: level.player.lives,
          levelName: level.name,
        }),
        hint: texts.start.hint,
        controls: texts.start.controls,
      });
    } else {
      // Fases seguintes (e novas tentativas) começam direto, sem tela de início.
      this.beginPlay();
      this.cameras.main.fadeIn(400, 0, 0, 0);
    }

    if (this.fadeInOnStart && this.showIntro) {
      this.cameras.main.fadeIn(GAME_OVER_FADE_MS, 0, 0, 0);
    }

    this.layout();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.layout, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.layout, this);
      this.panel?.destroy();
      this.panel = undefined;
    });
  }

  update(_time: number, delta: number): void {
    this.background.update(delta);
    this.enemies.update(delta);

    if (this.state === "intro") {
      this.hero.update(NO_INPUT, delta);
      if (this.controls.confirmPressed()) {
        this.beginPlay();
      }
      return;
    }

    if (this.state === "dying") {
      this.hero.update(NO_INPUT, delta);
      return;
    }

    if (this.state !== "playing") {
      // Ao vencer, o herói segue correndo para fora da tela.
      this.hero.update(this.state === "won" ? RUN_OUT : NO_INPUT, delta);
      if (
        this.panel &&
        !this.autoAdvance &&
        this.time.now - this.endedAt > RESTART_DELAY_MS &&
        this.controls.confirmPressed()
      ) {
        this.scene.restart(this.nextSceneData());
      }
      return;
    }

    this.hero.update(
      {
        direction: this.controls.direction,
        running: this.controls.running,
        jumpPressed: this.controls.jumpPressed(),
        jumpHeld: this.controls.jumpHeld,
      },
      delta,
    );

    if (this.hero.hasFallen(this.level.world.height)) {
      this.loseLife();
      if (this.state !== "playing") {
        return;
      }
    }

    this.checkEnemies();

    if (this.state !== "playing") {
      return;
    }

    if (this.secrets.update(this.hero.x, this.hero.y) > 0) {
      showToast(this, this.level.texts.secret);
    }
    if (this.extraLives.collect(this.hero.x, this.hero.y) > 0) {
      this.lives += 1;
      this.hud.setLives(this.lives, "gained");
      showToast(this, this.level.texts.extraLife, 1);
    }

    const gained = this.coins.collect(this.hero.x, this.hero.y);
    if (gained > 0) {
      this.addCoins(gained);
    }
    if (this.goal.reached(this.hero.x)) {
      this.finish("won");
    }
  }

  // ------------------------------------------------------------------ fluxo

  private checkEnemies(): void {
    const { size } = this.level.player;
    if (this.obstacles.touches(this.hero.x, this.hero.y, size.width / 2, size.height / 2)) {
      this.hurtByEnemy();
      return;
    }
    const contact = this.enemies.checkContact(
      this.hero.x,
      this.hero.y,
      size.width / 2,
      size.height / 2,
      this.hero.body.velocity.y,
    );
    if (contact === "stomp") {
      this.hero.bounce(ENEMY_BOUNCE_SPEED);
    } else if (contact === "hit") {
      this.hurtByEnemy();
    }
  }

  private beginPlay(): void {
    this.state = "playing";
    this.panel?.destroy();
    this.panel = undefined;
    this.hud.show();
  }

  /** Cair num buraco: perde a vida e reaparece direto. */
  private loseLife(): void {
    this.takeLife();
    this.afterHurt();
  }

  /** Tocar num inimigo: o herói toca a animação de dano e só depois reaparece. */
  private hurtByEnemy(): void {
    this.state = "dying";
    this.takeLife();
    this.hero.playDeath(() => this.afterHurt());
  }

  /** Soma moedas à carteira; a cada 100 vira uma vida e o contador recomeça. */
  private addCoins(amount: number): void {
    this.wallet += amount;
    let lifeGained = false;
    while (this.wallet >= COINS_PER_LIFE) {
      this.wallet -= COINS_PER_LIFE;
      this.lives += 1;
      lifeGained = true;
    }
    this.hud.setCoins(this.wallet, true);
    if (lifeGained) {
      this.hud.setLives(this.lives, "gained");
      showToast(this, this.level.texts.hundredCoins, 2);
    }
  }

  private takeLife(): void {
    this.lives -= 1;
    this.hud.setLives(this.lives, "lost");
  }

  private afterHurt(): void {
    this.state = "playing";
    if (this.lives <= 0) {
      this.hero.body.setVelocity(0, 0);
      this.hero.setPhysicsEnabled(false);
      this.hero.sprite.setVisible(false);
      this.finish("over");
      return;
    }
    this.hero.respawn();
    this.cameras.main.flash(260, 220, 38, 38);
    this.hero.blink();
  }

  private finish(kind: "won" | "over"): void {
    if (this.state === "won" || this.state === "over") {
      return;
    }
    this.state = kind;
    this.endedAt = this.time.now;

    const { texts } = this.level;
    const values = {
      coins: this.coins.count,
      total: this.coins.total,
      lives: this.lives,
      maxLives: this.level.player.lives,
      levelCount: levels.length,
      level: this.levelIndex + 1,
    };
    const isLast = this.levelIndex === levels.length - 1;

    if (kind === "won") {
      this.goal.celebrate();
      if (!isLast) {
        this.advanceAutomatically(values);
      } else {
        this.time.delayedCall(FINAL_PANEL_DELAY_MS, () => {
          this.endedAt = this.time.now;
          this.showPanel(this.panelFor(texts.finished, values));
          this.layout();
        });
      }
      return;
    }

    this.playGameOver(texts.over.title);
  }

  private panelFor(
    source: { title: string; subtitle: string; hint: string; controls: string },
    values: Record<string, string | number>,
  ): PanelContent {
    return {
      title: source.title,
      subtitle: formatText(source.subtitle, values),
      hint: source.hint,
      controls: formatText(source.controls, values),
    };
  }

  /** Fim de jogo: sem painel nem instruções, só a tela preta com o título e voltar ao início. */
  private playGameOver(title: string): void {
    this.autoAdvance = true;
    this.transition = new Transition(this, { title, lines: [] });
    this.layout();
    this.transition.play(GAME_OVER_FADE_MS);
    const holdEnd = GAME_OVER_FADE_MS * 2 + GAME_OVER_HOLD_MS;
    this.time.delayedCall(holdEnd, () => this.transition?.fadeOutText(GAME_OVER_FADE_MS));
    this.time.delayedCall(holdEnd + GAME_OVER_FADE_MS + 200, () =>
      this.scene.restart(this.nextSceneData()),
    );
  }

  /**
   * Fase concluída: o herói corre para fora da tela, a tela escurece e mostra o status
   * (com tempo para ler) e a próxima fase abre sozinha, sem pedir tecla.
   */
  private advanceAutomatically(values: Record<string, string | number>): void {
    this.autoAdvance = true;
    const { won } = this.level.texts;
    const next = levels[this.levelIndex + 1];
    const all = { ...values, nextName: next?.name ?? "" };
    this.transition = new Transition(this, {
      title: formatText(won.title, all),
      lines: [formatText(won.subtitle, all), formatText(won.detail, all), formatText(won.next, all)],
    });
    this.layout();
    this.time.delayedCall(FADE_START_MS, () => this.transition?.play(FADE_DURATION_MS));
    this.time.delayedCall(AUTO_ADVANCE_MS, () => this.scene.restart(this.nextSceneData()));
  }

  /** Vitória avança de fase (ou volta à primeira após a última); fim de jogo volta ao início. */
  private nextSceneData(): SceneData {
    if (this.state === "won") {
      const next = (this.levelIndex + 1) % levels.length;
      // Só volta à tela de início ao recomeçar a aventura pela primeira fase.
      if (next === 0) {
        return { levelIndex: 0, intro: true };
      }
      // As vidas e as moedas acumuladas acompanham o jogador para a próxima fase.
      return { levelIndex: next, intro: false, lives: this.lives, wallet: this.wallet };
    }
    // Fim de jogo volta ao início da aventura (fase 1, com a tela de início).
    return { levelIndex: 0, intro: true, fadeIn: true };
  }

  // --------------------------------------------------------------------- UI

  private showPanel(content: PanelContent): void {
    this.panel?.destroy();
    this.panel = new Panel(this, content);
  }

  // O modo RESIZE altera o tamanho do canvas; reposicione tudo que é fixo na tela.
  private layout(): void {
    const { width, height } = this.scale;
    this.background.layout(width, height);
    this.hud.layout(width, height);
    this.panel?.layout(width, height);
    this.transition?.layout(width, height);
  }
}

if (import.meta.hot) {
  import.meta.hot.accept();
}
