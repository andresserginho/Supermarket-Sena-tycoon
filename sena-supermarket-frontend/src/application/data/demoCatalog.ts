// src/application/data/demoCatalog.ts
import { Product } from '../../domain/entities/Product';

export const demoCatalog: Product[] = [
  new Product({ id: 'p001', sku: 'SKU-001', barcode: '7701234560012', name: 'Jabón en barra', price: 3500, weight: 0.15 }),
  new Product({ id: 'p002', sku: 'SKU-002', barcode: '7701234560029', name: 'Leche entera 1L', price: 4200, weight: 1.03 }),
  new Product({ id: 'p003', sku: 'SKU-003', barcode: '7701234560036', name: 'Arroz 500g', price: 2800, weight: 0.5 }),
  new Product({ id: 'p004', sku: 'SKU-004', barcode: '7701234560043', name: 'Papel higiénico x4', price: 6900, weight: 0.4 }),
];