import Phaser from "phaser";
import { DEPTH } from "../constants";
import { uiText } from "./uiText";

/** Aviso curto no topo da tela que some sozinho (não interrompe o jogo). */
export function showToast(scene: Phaser.Scene, message: string, row = 0): void {
  const baseY = 96 + row * 52;
  const text = uiText(scene, scene.scale.width / 2, baseY, message, {
    color: "#fefce8",
    fontSize: "26px",
    fontStyle: "bold",
    stroke: "#14532d",
    strokeThickness: 5,
    backgroundColor: "rgba(15, 41, 31, 0.62)",
    padding: { x: 16, y: 8 },
  })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(DEPTH.PANEL - 1)
    .setAlpha(0);
  scene.tweens.add({
    targets: text,
    alpha: 1,
    y: baseY - 8,
    duration: 250,
    hold: 1300,
    yoyo: true,
    onComplete: () => text.destroy(),
  });
}
