// src/domain/interfaces/IInputProvider.ts

export interface IMovementVector {
  x: number;
  y: number;
  z: number;
}

export interface IInputProvider {
  getMovementVector(): IMovementVector;
  isActionPressed(): boolean;
}