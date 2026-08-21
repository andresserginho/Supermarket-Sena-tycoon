import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprenticeProgress } from '../entities/apprentice-progress.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApprenticeProgress])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
