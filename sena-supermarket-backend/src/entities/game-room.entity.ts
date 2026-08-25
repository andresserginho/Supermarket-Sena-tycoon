import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('salas_juego')
export class GameRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'codigo', unique: true, length: 8 })
  code!: string;

  @Column({ name: 'id_instructor', type: 'uuid' })
  instructorId!: string;

  @Column({ name: 'nombre', length: 120 })
  name!: string;

  @Column({ name: 'activa', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt!: Date;
}