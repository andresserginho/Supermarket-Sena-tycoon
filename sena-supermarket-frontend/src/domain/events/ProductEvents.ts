// src/domain/events/ProductEvents.ts
export interface ProductScannedEvent {
  type: 'PRODUCT_SCANNED';
  productId: string;
  barcode: string;
  timestamp: number;
}