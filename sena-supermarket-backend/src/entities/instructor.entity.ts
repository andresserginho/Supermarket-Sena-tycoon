import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('instructores')
export class Instructor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'correo', unique: true, length: 120 })
  email!: string;

  @Column({ name: 'nombre', length: 120 })
  name!: string;

  @Column({ name: 'hash_contrasena', length: 255 })
  passwordHash!: string;
}