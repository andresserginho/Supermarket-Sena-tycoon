import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('aprendices')
export class Apprentice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'nombre', length: 120 })
  name!: string;

  @Column({ length: 7 })
  ficha!: string;

  @Column({ name: 'genero', length: 10 })
  gender!: 'masculino' | 'femenino';

  @Column({ name: 'hash_contrasena', length: 255 })
  passwordHash!: string;
}