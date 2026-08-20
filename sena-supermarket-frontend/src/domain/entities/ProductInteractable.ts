import type { IInteractable, InteractionContext } from '../interfaces/IInteractable';
import type { Product } from './Product';

export class ProductInteractable implements IInteractable {
  public readonly id: string;
  public readonly product: Product;
  private onInteractCallback?: (product: Product) => void;

  constructor(product: Product, onInteractCallback?: (product: Product) => void) {
    this.id = `interactable-${product.id}`;
    this.product = product;
    this.onInteractCallback = onInteractCallback;
  }

  public canInteract(_context: InteractionContext): boolean {
    return true;
  }

  public interact(_context: InteractionContext): void {
    if (this.onInteractCallback) {
      this.onInteractCallback(this.product);
    }
  }
}