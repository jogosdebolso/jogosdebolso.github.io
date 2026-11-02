import Phaser from "phaser";
import { DEPTH } from "../constants";
import type { LevelConfig } from "../levelConfig";
import { uiText } from "./uiText";

const PILL_HEIGHT = 46;
const PILL_PAD = 14;

/**
 * HUD: controles (embaixo), nome da fase (canto superior esquerdo) e, no canto superior
 * direito, um coração com o número de vidas e uma moeda com o número de moedas.
 */
export class Hud {
  private readonly controls: Phaser.GameObjects.Text;
  private readonly label: Phaser.GameObjects.Text;
  private readonly pill: Phaser.GameObjects.Graphics;
  private readonly heart: Phaser.GameObjects.Image;
  private readonly livesText: Phaser.GameObjects.Text;
  private readonly coinIcon: Phaser.GameObjects.Image;
  private readonly coinText: Phaser.GameObjects.Text;
  private size = { width: 0, height: 0 };

  constructor(
    private readonly scene: Phaser.Scene,
    texts: LevelConfig["texts"]["hud"],
    levelName: string,
  ) {
    const base: Phaser.Types.GameObjects.Text.TextStyle = {
      color: "#f8fafc",
      fontSize: "16px",
      fontStyle: "bold",
      backgroundColor: "rgba(15, 41, 31, 0.62)",
      padding: { x: 12, y: 7 },
      stroke: "#0f291f",
      strokeThickness: 1,
    };
    const make = (content: string, originY: number): Phaser.GameObjects.Text =>
      uiText(scene, 0, 0, content, base).setOrigin(0, originY).setScrollFactor(0).setDepth(DEPTH.HUD);
    const number = (): Phaser.GameObjects.Text =>
      uiText(scene, 0, 0, "0", {
        color: "#f8fafc",
        fontSize: "24px",
        fontStyle: "bold",
        stroke: "#0f291f",
        strokeThickness: 4,
      })
        .setOrigin(0, 0.5)
        .setScrollFactor(0)
        .setDepth(DEPTH.HUD + 1);

    this.controls = make(texts.controls, 1);
    this.label = make(levelName, 0);
    this.pill = scene.add.graphics().setScrollFactor(0).setDepth(DEPTH.HUD);
    this.heart = scene.add.image(0, 0, "heart").setScrollFactor(0).setDepth(DEPTH.HUD + 1);
    this.livesText = number();
    // Moeda parada: sempre o quadro de frente, sem a animação de giro.
    this.coinIcon = scene.add.image(0, 0, "coin-0").setScale(1.2).setScrollFactor(0).setDepth(DEPTH.HUD + 1);
    this.coinText = number();
    this.setVisible(false);
  }

  private setVisible(visible: boolean): void {
    [this.controls, this.label, this.pill, this.heart, this.livesText, this.coinIcon, this.coinText].forEach(
      (item) => item.setVisible(visible),
    );
  }

  show(): void {
    this.setVisible(true);
  }

  /** Número de vidas (sem limite). `pulse` destaca o coração ao ganhar ou perder uma vida. */
  setLives(lives: number, pulse?: "lost" | "gained"): void {
    this.livesText.setText(String(lives));
    this.layout(this.size.width, this.size.height);
    if (pulse) {
      this.scene.tweens.add({
        targets: this.heart,
        scale: { from: pulse === "gained" ? 1.9 : 1.6, to: 1 },
        duration: 350,
        ease: "Back.easeOut",
      });
    }
  }

  /** Moedas guardadas rumo à próxima vida (de 0 a 99). */
  setCoins(coins: number, bump = false): void {
    this.coinText.setText(String(coins));
    this.layout(this.size.width, this.size.height);
    if (bump) {
      this.scene.tweens.add({
        targets: this.coinIcon,
        scale: { from: 1.6, to: 1.2 },
        duration: 180,
      });
    }
  }

  layout(width: number, height: number): void {
    this.size = { width, height };
    this.controls.setPosition(16, height - 16);
    this.label.setPosition(16, 16);

    const heartW = this.heart.width;
    const coinW = this.coinIcon.displayWidth;
    const gap = 8;
    const between = 22;
    const contentW =
      heartW + gap + this.livesText.width + between + coinW + gap + this.coinText.width;
    const pillW = contentW + PILL_PAD * 2;
    const left = width - 16 - pillW;
    const cy = 16 + PILL_HEIGHT / 2;

    this.pill.clear();
    this.pill.fillStyle(0x0f291f, 0.62);
    this.pill.fillRoundedRect(left, 16, pillW, PILL_HEIGHT, 14);

    let x = left + PILL_PAD;
    this.heart.setPosition(x + heartW / 2, cy);
    x += heartW + gap;
    this.livesText.setPosition(x, cy);
    x += this.livesText.width + between;
    this.coinIcon.setPosition(x + coinW / 2, cy);
    x += coinW + gap;
    this.coinText.setPosition(x, cy);
  }
}
