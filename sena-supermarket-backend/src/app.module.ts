import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { Apprentice } from './entities/apprentice.entity';
import { GameRoom } from './entities/game-room.entity';
import { Instructor } from './entities/instructor.entity';
import { ApprenticeSession } from './entities/apprentice-session.entity';
import { ApprenticeProgress } from './entities/apprentice-progress.entity';
import { ApprenticeDebt } from './entities/apprentice-debt.entity';
import { ApprenticeWarehouse } from './entities/apprentice-warehouse.entity';
import { WarehouseInventory } from './entities/warehouse-inventory.entity';
import { WarehouseBox } from './entities/warehouse-box.entity';
import { ApprenticeProduct } from './entities/apprentice-product.entity';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    // Carga de variables de entorno (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conexión dinámica a PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_DATABASE', 'sena_supermarket_db'),
        entities: [Instructor, GameRoom, Apprentice, ApprenticeSession, ApprenticeProgress, ApprenticeDebt, ApprenticeWarehouse, WarehouseInventory, WarehouseBox, ApprenticeProduct],
        synchronize: false, // Usamos las tablas que ya creamos en pgAdmin
      }),
    }),
    TypeOrmModule.forFeature([Instructor, GameRoom, Apprentice, ApprenticeSession, ApprenticeProgress, ApprenticeDebt, ApprenticeWarehouse, WarehouseInventory, WarehouseBox, ApprenticeProduct]),
    ProgressModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule {}