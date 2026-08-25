import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { WarehouseInventory } from './warehouse-inventory.entity';
import { WarehouseBox } from './warehouse-box.entity';

@Entity('bodegas_aprendices')
export class ApprenticeWarehouse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_aprendiz', type: 'uuid', unique: true })
  apprenticeId!: string;

  @OneToMany(() => WarehouseInventory, (inventory) => inventory.warehouse)
  inventory!: WarehouseInventory[];

  @OneToMany(() => WarehouseBox, (box) => box.warehouse)
  boxes!: WarehouseBox[];
}