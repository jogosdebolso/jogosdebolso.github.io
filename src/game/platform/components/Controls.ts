import Phaser from "phaser";

/** Teclas do jogo: andar (A/D, setas), correr (Shift), pular (W, ↑, Espaço) e confirmar (Enter, Espaço). */
export class Controls {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly enter: Phaser.Input.Keyboard.Key;
  private readonly space: Phaser.Input.Keyboard.Key;
  private readonly shift: Phaser.Input.Keyboard.Key;
  private readonly up: Phaser.Input.Keyboard.Key;
  private readonly left: Phaser.Input.Keyboard.Key;
  private readonly right: Phaser.Input.Keyboard.Key;

  constructor(keyboard: Phaser.Input.Keyboard.KeyboardPlugin) {
    const codes = Phaser.Input.Keyboard.KeyCodes;
    this.cursors = keyboard.createCursorKeys();
    this.enter = keyboard.addKey(codes.ENTER);
    this.space = keyboard.addKey(codes.SPACE);
    this.shift = keyboard.addKey(codes.SHIFT);
    this.up = keyboard.addKey(codes.W);
    this.left = keyboard.addKey(codes.A);
    this.right = keyboard.addKey(codes.D);
  }

  /** -1 (esquerda), 0 ou 1 (direita). */
  get direction(): number {
    const left = this.cursors.left.isDown || this.left.isDown;
    const right = this.cursors.right.isDown || this.right.isDown;
    return Number(right) - Number(left);
  }

  get running(): boolean {
    return this.shift.isDown;
  }

  jumpPressed(): boolean {
    return (
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.up) ||
      Phaser.Input.Keyboard.JustDown(this.space)
    );
  }

  /** Verdadeiro enquanto qualquer tecla de pulo estiver pressionada (para altura variável). */
  get jumpHeld(): boolean {
    return this.cursors.up.isDown || this.up.isDown || this.space.isDown;
  }

  confirmPressed(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.enter) || Phaser.Input.Keyboard.JustDown(this.space);
  }
}
