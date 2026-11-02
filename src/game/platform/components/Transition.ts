import Phaser from "phaser";
import { DEPTH } from "../constants";
import { uiText } from "./uiText";

export interface TransitionContent {
  title: string;
  lines: string[];
}

/**
 * Tela preta de transição entre fases. Desenha o próprio retângulo (e não o fade da
 * câmera) para que o texto fique por cima e possa ser lido antes de a próxima fase abrir.
 */
export class Transition {
  private readonly cover: Phaser.GameObjects.Rectangle;
  private readonly texts: Phaser.GameObjects.Text[] = [];
  private readonly title: Phaser.GameObjects.Text;

  constructor(
    private readonly scene: Phaser.Scene,
    content: TransitionContent,
  ) {
    this.cover = scene.add
      .rectangle(0, 0, 10, 10, 0x000000, 1)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(DEPTH.PANEL + 1)
      .setAlpha(0);
    this.title = uiText(scene, 0, 0, content.title, {
      color: "#fefce8",
      fontSize: "52px",
      fontStyle: "bold",
      stroke: "#14532d",
      strokeThickness: 8,
    })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.PANEL + 2)
      .setAlpha(0);
    content.lines.forEach((line, index) => {
      this.texts.push(
        uiText(scene, 0, 0, line, {
          color: index === content.lines.length - 1 ? "#fde68a" : "#dcfce7",
          fontSize: "24px",
          fontStyle: index === content.lines.length - 1 ? "bold" : "normal",
          stroke: "#052e16",
          strokeThickness: 3,
        })
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(DEPTH.PANEL + 2)
          .setAlpha(0),
      );
    });
  }

  /** Escurece a tela e, em seguida, revela o texto do status. */
  play(fadeMs: number): void {
    this.scene.tweens.add({ targets: this.cover, alpha: 1, duration: fadeMs });
    this.scene.tweens.add({
      targets: [this.title, ...this.texts],
      alpha: 1,
      duration: 350,
      delay: fadeMs,
    });
  }

  /** Some só o texto, mantendo a tela preta (usado antes de voltar ao início). */
  fadeOutText(ms: number): void {
    this.scene.tweens.add({ targets: [this.title, ...this.texts], alpha: 0, duration: ms });
  }

  layout(width: number, height: number): void {
    const cx = width / 2;
    const top = this.texts.length > 0 ? height / 2 - 40 - this.texts.length * 18 : height / 2;
    this.cover.setSize(width, height);
    this.title.setPosition(cx, top);
    this.texts.forEach((text, i) => text.setPosition(cx, top + 70 + i * 40));
  }
}
