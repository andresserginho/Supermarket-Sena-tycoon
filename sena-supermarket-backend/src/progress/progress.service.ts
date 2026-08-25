import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApprenticeProgress } from '../entities/apprentice-progress.entity';
import { ApprenticeDebt } from '../entities/apprentice-debt.entity';
import { ApprenticeWarehouse } from '../entities/apprentice-warehouse.entity';
import { WarehouseInventory } from '../entities/warehouse-inventory.entity';
import { WarehouseBox } from '../entities/warehouse-box.entity';
import { ApprenticeSession } from '../entities/apprentice-session.entity';
import { Apprentice } from '../entities/apprentice.entity';
import { GameRoom } from '../entities/game-room.entity';
import { ApprenticeProduct } from '../entities/apprentice-product.entity';
import { DEFAULT_HEALTH_RECOVERY_COST } from '../config/game-defaults';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(ApprenticeProgress) private readonly progress: Repository<ApprenticeProgress>,
    @InjectRepository(ApprenticeDebt) private readonly debts: Repository<ApprenticeDebt>,
    @InjectRepository(ApprenticeWarehouse) private readonly warehouses: Repository<ApprenticeWarehouse>,
    @InjectRepository(WarehouseInventory) private readonly inventory: Repository<WarehouseInventory>,
    @InjectRepository(WarehouseBox) private readonly boxes: Repository<WarehouseBox>,
    @InjectRepository(ApprenticeSession) private readonly sessions: Repository<ApprenticeSession>,
    @InjectRepository(Apprentice) private readonly apprentices: Repository<Apprentice>,
    @InjectRepository(GameRoom) private readonly rooms: Repository<GameRoom>,
    @InjectRepository(ApprenticeProduct) private readonly products: Repository<ApprenticeProduct>,
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

  async recoverHealth(apprenticeId: string) {
    const record = await this.progress.findOne({ where: { apprenticeId } });
    if (!record) throw new NotFoundException('No hay progreso guardado para este aprendiz.');

    const recoveryCost = Number(process.env.COSTO_RECUPERACION_VIDA) || DEFAULT_HEALTH_RECOVERY_COST;
    const currentMoney = Number(record.money);
    const canPay = currentMoney >= recoveryCost;
    record.money = canPay ? currentMoney - recoveryCost : 0;
    record.health = 100;
    await this.progress.save(record);

    if (!canPay) {
      const debt = await this.debts.findOne({ where: { apprenticeId } });
      if (debt) {
        debt.amount = Number(debt.amount) + recoveryCost;
        await this.debts.save(debt);
      } else {
        await this.debts.save({ apprenticeId, amount: recoveryCost });
      }
    }

    return { health: record.health, money: record.money, charged: canPay ? recoveryCost : 0, debt: canPay ? 0 : recoveryCost, recoveryCost };
  }

  async getWarehouse(apprenticeId: string) {
    let warehouse = await this.warehouses.findOne({ where: { apprenticeId }, relations: { inventory: true, boxes: true } });
    if (!warehouse) warehouse = await this.warehouses.save({ apprenticeId, inventory: [], boxes: [] });
    return warehouse;
  }

  async updateWarehouse(apprenticeId: string, items: Array<Partial<Pick<WarehouseInventory, 'productId' | 'productName' | 'quantity' | 'unitPrice'>>>) {
    const warehouse = await this.getWarehouse(apprenticeId);
    await this.inventory.delete({ warehouseId: warehouse.id });
    const validItems = items.filter((item) => item.productId && item.productName && Number(item.quantity) >= 0).map((item) => ({
      warehouseId: warehouse.id,
      productId: item.productId!,
      productName: item.productName!,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice) || 0,
    }));
    if (validItems.length) await this.inventory.save(validItems);
    return this.getWarehouse(apprenticeId);
  }

  async updateBoxes(apprenticeId: string, items: Array<Partial<Pick<WarehouseBox, 'productId' | 'productName' | 'unitsPerBox' | 'boxesAvailable' | 'boxCost' | 'unitSalePrice'>>>) {
    const warehouse = await this.getWarehouse(apprenticeId);
    await this.boxes.delete({ warehouseId: warehouse.id });
    const validBoxes = items.filter((item) => item.productId && item.productName && Number(item.unitsPerBox) > 0 && Number(item.boxesAvailable) >= 0).map((item) => ({
      warehouseId: warehouse.id,
      productId: item.productId!,
      productName: item.productName!,
      unitsPerBox: Number(item.unitsPerBox),
      boxesAvailable: Number(item.boxesAvailable),
      boxCost: Number(item.boxCost) || 0,
      unitSalePrice: Number(item.unitSalePrice) || 0,
    }));
    if (validBoxes.length) await this.boxes.save(validBoxes);
    return this.getWarehouse(apprenticeId);
  }

  async getRoomProgress(roomCode: string, instructorId: string) {
    const room = await this.rooms.findOne({ where: { code: roomCode.trim().toUpperCase(), instructorId, active: true } });
    if (!room) throw new NotFoundException('La sala no existe, está cerrada o no pertenece a este instructor.');
    const sessions = await this.sessions.find({ where: { roomCode: room.code, status: 'activa' } });
    const players = await Promise.all(sessions.map(async (session) => {
      const apprentice = await this.apprentices.findOne({ where: { id: session.apprenticeId } });
      const progress = await this.progress.findOne({ where: { apprenticeId: session.apprenticeId } });
      const debt = await this.debts.findOne({ where: { apprenticeId: session.apprenticeId } });
      return { id: session.apprenticeId, name: apprentice?.name ?? 'Aprendiz', ficha: apprentice?.ficha ?? '', level: progress?.level ?? 1, money: Number(progress?.money ?? 0), sales: Number(progress?.sales ?? 0), health: progress?.health ?? 0, hunger: progress?.hunger ?? 0, thirst: progress?.thirst ?? 0, debt: Number(debt?.amount ?? 0), updatedAt: progress?.updatedAt ?? null };
    }));
    return { roomCode: room.code, roomName: room.name, players };
  }

  getProducts(apprenticeId: string) {
    return this.products.find({ where: { apprenticeId }, order: { name: 'ASC' } });
  }

  async updateProducts(apprenticeId: string, items: Array<Partial<Pick<ApprenticeProduct, 'productId' | 'name' | 'salePrice'>>>) {
    await this.products.delete({ apprenticeId });
    const validProducts = items.filter((item) => item.productId && item.name && Number(item.salePrice) >= 0).map((item) => ({ apprenticeId, productId: item.productId!, name: item.name!, salePrice: Number(item.salePrice) }));
    if (validProducts.length) await this.products.save(validProducts);
    return this.getProducts(apprenticeId);
  }
}
