import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('sesiones_aprendiz')
export class ApprenticeSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'id_aprendiz', type: 'uuid', unique: true })
  apprenticeId!: string;

  @Column({ name: 'codigo_sala', length: 8 })
  roomCode!: string;

  @Column({ name: 'estado', length: 20, default: 'activa' })
  status!: 'activa' | 'finalizada';

  @CreateDateColumn({ name: 'creada_en' })
  createdAt!: Date;
}