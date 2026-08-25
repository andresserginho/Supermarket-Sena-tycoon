import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApprenticeProgress } from '../entities/apprentice-progress.entity';
import { ApprenticeDebt } from '../entities/apprentice-debt.entity';
import { ApprenticeWarehouse } from '../entities/apprentice-warehouse.entity';
import { WarehouseInventory } from '../entities/warehouse-inventory.entity';
import { WarehouseBox } from '../entities/warehouse-box.entity';
import { ApprenticeProduct } from '../entities/apprentice-product.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([ApprenticeProgress, ApprenticeDebt, ApprenticeWarehouse, WarehouseInventory, WarehouseBox, ApprenticeProduct])],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
