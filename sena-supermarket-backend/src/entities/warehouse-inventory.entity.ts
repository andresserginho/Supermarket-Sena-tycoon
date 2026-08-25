import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApprenticeWarehouse } from './apprentice-warehouse.entity';

@Entity('inventario_bodegas')
@Unique('uq_inventario_bodega_producto', ['warehouseId', 'productId'])
export class WarehouseInventory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_bodega', type: 'uuid' })
  warehouseId!: string;

  @ManyToOne(() => ApprenticeWarehouse, (warehouse) => warehouse.inventory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_bodega' })
  warehouse!: ApprenticeWarehouse;

  @Column({ name: 'id_producto', length: 120 })
  productId!: string;

  @Column({ name: 'nombre_producto', length: 160 })
  productName!: string;

  @Column({ name: 'cantidad', type: 'int', default: 0 })
  quantity!: number;

  @Column({ name: 'precio_unitario', type: 'numeric', precision: 12, scale: 2, default: 0 })
  unitPrice!: number;
}