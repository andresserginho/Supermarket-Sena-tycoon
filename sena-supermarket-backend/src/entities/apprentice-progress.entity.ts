import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('progreso_aprendices')
export class ApprenticeProgress {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_aprendiz', type: 'uuid', unique: true })
  apprenticeId!: string;

  @Column({ name: 'nivel', type: 'int' })
  level!: number;

  @Column({ name: 'dinero', type: 'numeric', precision: 12, scale: 2 })
  money!: number;

  @Column({ name: 'ventas', type: 'numeric', precision: 12, scale: 2 })
  sales!: number;

  @Column({ name: 'salud', type: 'int' })
  health!: number;

  @Column({ name: 'hambre', type: 'int' })
  hunger!: number;

  @Column({ name: 'sed', type: 'int' })
  thirst!: number;

  @Column({ name: 'expansiones', type: 'jsonb' })
  expansions!: string[];

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt!: Date;
}
