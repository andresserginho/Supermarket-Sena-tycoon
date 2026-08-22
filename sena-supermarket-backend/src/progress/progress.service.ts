import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprenticeProgress } from '../entities/apprentice-progress.entity';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ApprenticeProgress) private readonly progress: Repository<ApprenticeProgress>,
  ) {}

  async get(apprenticeId: string) {
    const record = await this.progress.findOne({ where: { apprenticeId } });
    if (!record) throw new NotFoundException('No hay progreso guardado para este aprendiz.');
    return record;
  }

  async update(
    apprenticeId: string,
    data: Partial<Pick<ApprenticeProgress, 'level' | 'money' | 'sales' | 'health' | 'hunger' | 'thirst' | 'expansions'>>,
  ) {
    const record = await this.progress.findOne({ where: { apprenticeId } });
    if (!record) throw new NotFoundException('No hay progreso guardado para este aprendiz.');
    Object.assign(record, data);
    return this.progress.save(record);
  }
}
