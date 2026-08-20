import { Product } from './Product';

export type CheckoutStatus = 'IDLE' | 'SCANNING' | 'COMPLETED';

export interface ScannedItem {
  product: Product;
  scannedAt: Date;
}

export class Checkout {
  private items: ScannedItem[] = [];
  private status: CheckoutStatus = 'IDLE';

  public addItem(product: Product): void {
    if (this.status === 'COMPLETED') {
      throw new Error('Cannot append items to a finalized transaction.');
    }
    this.items.push({
      product,
      scannedAt: new Date(),
    });
    this.status = 'SCANNING';
  }

  public getItems(): readonly ScannedItem[] {
    return [...this.items];
  }

  public calculateTotal(): number {
    return this.items.reduce((total, item) => total + item.product.price, 0);
  }

  public getStatus(): CheckoutStatus {
    return this.status;
  }

  public completeTransaction(): number {
    if (this.items.length === 0) {
      throw new Error('Cannot process payment for an empty transaction.');
    }
    const total = this.calculateTotal();
    this.status = 'COMPLETED';
    return total;
  }

  public reset(): void {
    this.items = [];
    this.status = 'IDLE';
  }
}