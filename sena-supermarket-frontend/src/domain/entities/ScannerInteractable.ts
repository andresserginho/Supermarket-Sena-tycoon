import { Product } from './Product';

// Renombrado de InteractionContext a ScanContext — el ScannerInteractable
// se usa por grab/release/scan, con forma distinta al InteractionContext
// de domain/interfaces/IInteractable.ts. Tener dos tipos con el mismo
// nombre y distinta forma generaba conflictos de tipos confusos.
export interface ScanContext {
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

  public grab(_context: ScanContext): void {
    this.isHeld = true;
  }

  public release(_context: ScanContext): void {
    this.isHeld = false;
  }

  public scan(targetProduct: Product, _context: ScanContext): void {
    if (!targetProduct) {
      throw new Error('Scan target is undefined.');
    }
    this.onScanCallback(targetProduct);
  }

  public getIsHeld(): boolean {
    return this.isHeld;
  }
}