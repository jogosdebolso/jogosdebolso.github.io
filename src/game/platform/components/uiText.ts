import Phaser from "phaser";
import { UI_FONT } from "../constants";

/** Resolução do texto: ≥ 2 (até 3) para manter a nitidez em telas de alta densidade. */
export function textResolution(): number {
  return Math.min(Math.max(Math.ceil(window.devicePixelRatio || 1), 2), 3);
}

export function uiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  style: Phaser.Types.GameObjects.Text.TextStyle,
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, content, {
    fontFamily: UI_FONT,
    resolution: textResolution(),
    ...style,
  });
}
