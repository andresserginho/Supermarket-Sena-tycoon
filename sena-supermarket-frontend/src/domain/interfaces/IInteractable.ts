export interface InteractionContext {
  interactorId?: string;
  payload?: Record<string, unknown>;
}

export interface IInteractable {
  id: string;
  canInteract(context: InteractionContext): boolean;
  interact(context: InteractionContext): void;
}