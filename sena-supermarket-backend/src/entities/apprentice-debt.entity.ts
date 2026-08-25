import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('deudas_aprendices')
export class ApprenticeDebt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_aprendiz', type: 'uuid', unique: true })
  apprenticeId!: string;

  @Column({ name: 'monto', type: 'numeric', precision: 12, scale: 2, default: 0 })
  amount!: number;

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt!: Date;
}