import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('productos_aprendices')
@Unique('uq_producto_aprendiz_codigo', ['apprenticeId', 'productId'])
export class ApprenticeProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_aprendiz', type: 'uuid' })
  apprenticeId!: string;

  @Column({ name: 'id_producto', length: 120 })
  productId!: string;

  @Column({ name: 'nombre', length: 160 })
  name!: string;

  @Column({ name: 'precio_venta_unidad', type: 'numeric', precision: 12, scale: 2, default: 0 })
  salePrice!: number;
}