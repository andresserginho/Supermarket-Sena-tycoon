import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { Apprentice } from '../entities/apprentice.entity';
import { GameRoom } from '../entities/game-room.entity';
import { Instructor } from '../entities/instructor.entity';
import { ApprenticeSession } from '../entities/apprentice-session.entity';
import { ApprenticeProgress } from '../entities/apprentice-progress.entity';
import { GAME_DEFAULTS } from '../config/game-defaults';
import { ApprenticeWarehouse } from '../entities/apprentice-warehouse.entity';

const hashPassword = (password: string) => createHash('sha256').update(password).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Apprentice) private readonly apprentices: Repository<Apprentice>,
    @InjectRepository(Instructor) private readonly instructors: Repository<Instructor>,
    @InjectRepository(GameRoom) private readonly rooms: Repository<GameRoom>,
    @InjectRepository(ApprenticeSession) private readonly sessions: Repository<ApprenticeSession>,
    @InjectRepository(ApprenticeProgress) private readonly progress: Repository<ApprenticeProgress>,
    @InjectRepository(ApprenticeWarehouse) private readonly warehouses: Repository<ApprenticeWarehouse>,
  ) {}

  async registerInstructor(name: string, email: string, password: string, instructorKey: string) {
    const validKey = this.configService.get<string>('CLAVE_REGISTRO_INSTRUCTOR');
    if (!validKey || instructorKey !== validKey) throw new ForbiddenException('La clave de registro de instructor no es válida.');
    const normalizedEmail = email.trim().toLowerCase();
    if (await this.instructors.findOne({ where: { email: normalizedEmail } })) throw new ConflictException('El correo del instructor ya está registrado.');
    const instructor = await this.instructors.save({ name: name.trim(), email: normalizedEmail, passwordHash: hashPassword(password) });
    return { id: instructor.id, name: instructor.name, email: instructor.email };
  }

  async loginInstructor(email: string, password: string) {
    const instructor = await this.instructors.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!instructor || instructor.passwordHash !== hashPassword(password)) throw new UnauthorizedException('Correo o contraseña incorrectos.');
    return { id: instructor.id, name: instructor.name, email: instructor.email };
  }

  async createRoom(instructorId: string, name: string) {
    const instructor = await this.instructors.findOne({ where: { id: instructorId } });
    if (!instructor) throw new UnauthorizedException('Instructor no válido.');
    let code = '';
    do { code = randomBytes(3).toString('hex').toUpperCase(); } while (await this.rooms.findOne({ where: { code, active: true } }));
    const room = await this.rooms.save({ code, instructorId, name: name.trim() || 'Sala de entrenamiento', active: true });
    return { id: room.id, code: room.code, name: room.name, active: room.active };
  }

  async closeRoom(instructorId: string, roomCode: string) {
    const room = await this.rooms.findOne({ where: { code: roomCode.trim().toUpperCase(), instructorId, active: true } });
    if (!room) throw new UnauthorizedException('La sala no existe, ya está cerrada o no pertenece a este instructor.');
    room.active = false;
    await this.rooms.save(room);
    await this.sessions.update({ roomCode: room.code, status: 'activa' }, { status: 'finalizada' });
    return { code: room.code, active: false, message: 'La sala fue cerrada para todos los aprendices.' };
  }

  async getRoomStatus(roomCode: string) {
    const room = await this.rooms.findOne({ where: { code: roomCode.trim().toUpperCase() } });
    return { code: roomCode.trim().toUpperCase(), active: Boolean(room?.active) };
  }

  async registerApprentice(name: string, ficha: string, gender: 'masculino' | 'femenino', password: string, roomCode: string) {
    const normalizedName = name.trim();
    const normalizedFicha = ficha.trim();
    if (!/^\d{7}$/.test(normalizedFicha)) throw new BadRequestException('La ficha debe tener exactamente 7 números.');

    const room = await this.rooms.findOne({ where: { code: roomCode.trim().toUpperCase(), active: true } });
    if (!room) throw new UnauthorizedException('El código de sala no existe o está cerrado.');

    const existing = await this.apprentices.findOne({ where: { name: normalizedName, ficha: normalizedFicha } });
    if (existing) throw new ConflictException('Ya tienes una cuenta registrada. Usa "Ya tengo una cuenta" para iniciar sesión.');

    const apprentice = await this.apprentices.save({ name: normalizedName, ficha: normalizedFicha, gender, passwordHash: hashPassword(password) });
    await this.progress.save({ apprenticeId: apprentice.id, ...GAME_DEFAULTS });
    await this.warehouses.save({ apprenticeId: apprentice.id });
    const session = await this.sessions.save({ apprenticeId: apprentice.id, roomCode: room.code, status: 'activa' });

    return { id: apprentice.id, name: apprentice.name, ficha: apprentice.ficha, gender: apprentice.gender, roomCode: room.code, sessionId: session.id };
  }

  async loginApprentice(name: string, ficha: string, password: string, roomCode: string) {
    const normalizedName = name.trim();
    const normalizedFicha = ficha.trim();
    if (!/^\d{7}$/.test(normalizedFicha)) throw new BadRequestException('La ficha debe tener exactamente 7 números.');

    const room = await this.rooms.findOne({ where: { code: roomCode.trim().toUpperCase(), active: true } });
    if (!room) throw new UnauthorizedException('El código de sala no existe o está cerrado.');

    const apprentice = await this.apprentices.findOne({ where: { name: normalizedName, ficha: normalizedFicha } });
    if (!apprentice || apprentice.passwordHash !== hashPassword(password)) throw new UnauthorizedException('Ficha, contraseña o código de sala incorrectos.');

    // Cierra cualquier sesión activa anterior (de otra sala) y abre una nueva en esta sala.
    await this.sessions.update({ apprenticeId: apprentice.id, status: 'activa' }, { status: 'finalizada' });
    const session = await this.sessions.save({ apprenticeId: apprentice.id, roomCode: room.code, status: 'activa' });

    return { id: apprentice.id, name: apprentice.name, ficha: apprentice.ficha, gender: apprentice.gender, roomCode: room.code, sessionId: session.id };
  }
}