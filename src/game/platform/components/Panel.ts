import Phaser from "phaser";
import { DEPTH } from "../constants";
import { uiText } from "./uiText";

export interface PanelContent {
  title: string;
  subtitle: string;
  hint: string;
  controls: string;
  titleColor?: string;
  stroke?: string;
}

/** Painel central com título, subtítulo, dica piscante e linha de controles. */
export class Panel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly overlay: Phaser.GameObjects.Rectangle;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly controls: Phaser.GameObjects.Text;
  private readonly hintTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, content: PanelContent) {
    this.overlay = scene.add.rectangle(0, 0, 10, 10, 0x0b2a22, 0.45).setOrigin(0);
    this.background = scene.add.graphics();
    this.title = uiText(scene, 0, 0, content.title, {
      color: content.titleColor ?? "#fefce8",
      fontSize: "60px",
      fontStyle: "bold",
      stroke: content.stroke ?? "#14532d",
      strokeThickness: 8,
      shadow: { offsetX: 0, offsetY: 5, color: "#052e16", blur: 0, fill: true },
    }).setOrigin(0.5);
    this.subtitle = uiText(scene, 0, 0, content.subtitle, {
      color: "#dcfce7",
      fontSize: "22px",
      stroke: "#14532d",
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.hint = uiText(scene, 0, 0, content.hint, {
      color: "#fde68a",
      fontSize: "24px",
      fontStyle: "bold",
      stroke: "#422006",
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.controls = uiText(scene, 0, 0, content.controls, {
      color: "#f0fdf4",
      fontSize: "17px",
      stroke: "#14532d",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.container = scene.add
      .container(0, 0, [
        this.overlay,
        this.background,
        this.title,
        this.subtitle,
        this.hint,
        this.controls,
      ])
      .setScrollFactor(0)
      .setDepth(DEPTH.PANEL);

    this.hintTween = scene.tweens.add({
      targets: this.hint,
      alpha: 0.45,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  layout(width: number, height: number): void {
    const cx = width / 2;
    const cy = height / 2;
    this.overlay.setSize(width, height);
    this.background.clear();
    this.background.fillStyle(0x0f291f, 0.62);
    this.background.fillRoundedRect(cx - 400, cy - 130, 800, 270, 28);
    this.background.lineStyle(3, 0x4ade80, 0.8);
    this.background.strokeRoundedRect(cx - 400, cy - 130, 800, 270, 28);
    this.title.setPosition(cx, cy - 66);
    this.subtitle.setPosition(cx, cy - 8);
    this.hint.setPosition(cx, cy + 56);
    this.controls.setPosition(cx, cy + 102);
  }

  destroy(): void {
    this.hintTween.stop();
    this.container.destroy();
  }
}
