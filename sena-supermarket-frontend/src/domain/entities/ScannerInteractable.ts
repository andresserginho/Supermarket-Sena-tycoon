import { Product } from './Product';

export interface InteractionContext {
  source: 'PC' | 'VR';
  timestamp: number;
}

export class ScannerInteractable {
  public readonly id: string;
  private isHeld: boolean = false;
  private onScanCallback: (product: Product) => void;

  constructor(id: string, onScanCallback: (product: Product) => void) {
    this.id = id;
    this.onScanCallback = onScanCallback;
  }

  public grab(_context: InteractionContext): void {
    this.isHeld = true;
  }

  public release(_context: InteractionContext): void {
    this.isHeld = false;
  }

  public scan(targetProduct: Product, _context: InteractionContext): void {
    if (!targetProduct) {
      throw new Error('Scan target is undefined.');
    }
    this.onScanCallback(targetProduct);
  }

  public getIsHeld(): boolean {
    return this.isHeld;
  }
}