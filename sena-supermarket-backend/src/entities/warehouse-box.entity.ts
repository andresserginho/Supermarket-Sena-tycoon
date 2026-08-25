import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ApprenticeWarehouse } from './apprentice-warehouse.entity';

@Entity('cajas_bodega')
export class WarehouseBox {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_bodega', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => ApprenticeWarehouse, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bodega' })
  warehouse!: ApprenticeWarehouse;

  @Column({ name: 'id_producto', length: 120 })
  productId!: string;

  @Column({ name: 'nombre_producto', length: 160 })
  productName!: string;

  @Column({ name: 'unidades_por_caja', type: 'int' })
  unitsPerBox!: number;

  @Column({ name: 'cajas_disponibles', type: 'int', default: 0 })
  boxesAvailable!: number;

  @Column({ name: 'costo_total_caja', type: 'numeric', precision: 12, scale: 2 })
  boxCost!: number;

  @Column({ name: 'precio_venta_unidad', type: 'numeric', precision: 12, scale: 2, default: 0 })
  unitSalePrice!: number;
}