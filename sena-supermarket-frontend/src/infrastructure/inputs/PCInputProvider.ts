// src/infrastructure/inputs/PCInputProvider.ts
import type { IInputProvider, IMovementVector } from '../../domain/interfaces/IInputProvider';

export class PCInputProvider implements IInputProvider {
  private keys: { [key: string]: boolean } = {};

  constructor() {
    window.addEventListener('keydown', (e) => this.keys[e.code] = true);
    window.addEventListener('keyup', (e) => this.keys[e.code] = false);
  }

  public getMovementVector(): IMovementVector {
    let x = 0;
    let z = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;

    return { x, y: 0, z };
  }

  public isActionPressed(): boolean {
    return !!this.keys['Space'] || !!this.keys['KeyE'];
  }
}