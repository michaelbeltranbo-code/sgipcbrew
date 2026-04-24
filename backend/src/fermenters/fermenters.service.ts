import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Fermenter } from './fermenter.entity';
import { FermenterStatus } from './fermenter-status.enum';
import { FermenterStatusHistory } from './fermenter-status-history.entity';
import { Transfer } from '../transfers/transfer.entity';
import { StartFermentationDto } from './dto/start-fermentation.dto';
import { StartTransferDto } from './dto/start-transfer.dto';
import { FinishTransferDto } from './dto/finish-transfer.dto';
import { UpdateFermenterStatusDto } from './dto/update-fermenter-status.dto';
import { FermenterReading } from './fermentation-reading.entity';
import { CreateReadingDto } from './dto/create-reading.dto';
import { Production } from '../production/production.entity';
import { ProductionStatus } from '../production/production-status.enum';
import { ColdRoomKeg } from './cold-room-keg.entity';
import { BottlingOrder } from './bottling-order.entity';
import { CreateKegDownDto } from './dto/create-keg-down.dto';
import { CreateBottlingOrderDto } from './dto/create-bottling-order.dto';
import { In } from 'typeorm';
import { CreateKegBottlingOrderDto } from './dto/create-keg-bottling-order.dto';
import { StartBottlingDto } from './dto/start-bottling.dto';
import { FinishBottlingDto } from './dto/finish-bottling.dto';
import { CreateLegacyColdRoomKegDto } from './dto/create-legacy-cold-room-keg.dto';
import { ColdRoomPackagedStock } from './cold-room-packaged-stock.entity';
import { ColdRoomOutput } from './cold-room-output.entity';
import { ColdRoomOutputItem } from './cold-room-output-item.entity';
import { CreateColdRoomOutputDto } from './dto/create-cold-room-output.dto';


@Injectable()
export class FermentersService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Fermenter)
    private readonly fermenterRepo: Repository<Fermenter>,

    @InjectRepository(FermenterStatusHistory)
    private readonly historyRepo: Repository<FermenterStatusHistory>,

    @InjectRepository(Production)
    private readonly productionRepo: Repository<Production>,

    @InjectRepository(FermenterReading)
    private readonly readingRepo: Repository<FermenterReading>,

    @InjectRepository(Transfer)
    private readonly transferRepo: Repository<Transfer>,

    @InjectRepository(ColdRoomKeg)
    private readonly coldRoomKegRepo: Repository<ColdRoomKeg>,

    @InjectRepository(BottlingOrder)
    private readonly bottlingOrderRepo: Repository<BottlingOrder>,


    @InjectRepository(ColdRoomPackagedStock)
    private readonly packagedStockRepo: Repository<ColdRoomPackagedStock>,

    @InjectRepository(ColdRoomOutput)
    private readonly coldRoomOutputRepo: Repository<ColdRoomOutput>,

    @InjectRepository(ColdRoomOutputItem)
    private readonly coldRoomOutputItemRepo: Repository<ColdRoomOutputItem>,
 ) {}

  async findAll() {
  return this.fermenterRepo.find({
    relations: ['currentProduction', 'currentProduction.client'],
    order: { id: 'ASC' },
  });
}

  async findOne(id: number) {
  const fermenter = await this.fermenterRepo.findOne({
    where: { id },
    relations: [
      'currentProduction',
      'currentProduction.client',
      'history',
      'transfers',
    ],
  });

  if (!fermenter) {
    throw new NotFoundException('Fermentador no encontrado');
  }

  const enrichProduction = async (production: any) => {
    const readings = await this.readingRepo.find({
      where: {
        fermenter: { id },
        production: { id: production.id },
      },
      order: { recordedAt: 'ASC', createdAt: 'ASC' },
    });

    const adjunctMap = new Map<string, { name: string; quantityKg?: number | null }>();

    let dryHopApplied = false;
    let dryHopDescription: string | null = production.dryHopDescription ?? null;
    let purgesCount = 0;
    let purgeWeightKg = 0;
    let fermentationNotes: string | null = production.fermentationNotes ?? null;

    for (const r of readings) {
      if (r.dryHop) {
        dryHopApplied = true;
        if (!dryHopDescription && r.additions) {
          dryHopDescription = r.additions;
        }
      }

      if (r.additions) {
        const key = r.additions.trim();
        if (key) {
          adjunctMap.set(key, { name: key, quantityKg: null });
        }
      }

      if (r.purges && Number(r.purges) > 0) {
        purgesCount += 1;
        purgeWeightKg += Number(r.purges);
      }

      if (r.note) {
        fermentationNotes = r.note;
      }
    }

    return {
      ...production,
      dryHopApplied: production.dryHopApplied || dryHopApplied,
      dryHopDescription,
      fermentationAdjuncts: Array.from(adjunctMap.values()),
      purgesCount: Number(production.purgesCount ?? purgesCount),
      purgeWeightKg: Number(production.purgeWeightKg ?? purgeWeightKg),
      fermentationNotes,
    };
  };

  if (fermenter.currentProduction) {
    fermenter.currentProduction = await enrichProduction(
      fermenter.currentProduction,
    ) as any;
  }

  return fermenter;
}
  async listReadings(fermenterId: number) {
  const fermenter = await this.fermenterRepo.findOne({
    where: { id: fermenterId },
  });

  if (!fermenter) {
    throw new NotFoundException('Fermentador no encontrado');
  }

  if (!fermenter.currentProductionId) {
    return [];
  }

  return this.readingRepo.find({
    where: {
      production: { id: fermenter.currentProductionId },
      fermenter: { id: fermenterId },
    },
    order: { recordedAt: 'ASC', createdAt: 'ASC' },
  });
}

  async listReadingsByProduction(productionId: number) {
  const production = await this.productionRepo.findOne({
    where: { id: productionId },
  });

  if (!production) {
    throw new NotFoundException('Producción no encontrada');
  }

  return this.readingRepo.find({
    where: {
      production: { id: productionId },
    },
    relations: ['fermenter', 'production'],
    order: { recordedAt: 'ASC', createdAt: 'ASC' },
  });
}

  async createReading(fermenterId: number, dto: CreateReadingDto, user: any) {
  const fermenter = await this.fermenterRepo.findOne({
    where: { id: fermenterId },
  });

  if (!fermenter) {
    throw new NotFoundException('Fermentador no encontrado');
  }

  const production = await this.productionRepo.findOne({
    where: { id: dto.productionId },
    relations: ['actualFermenter'],
  });

  if (!production) {
    throw new NotFoundException('Producción no encontrada');
  }

  if (!production.actualFermenter || production.actualFermenter.id !== fermenterId) {
    throw new BadRequestException(
      'Esta producción no está activa en este fermentador',
    );
  }

  const reading = this.readingRepo.create({
    fermenter,
    production,
    ph: dto.ph ?? null,
    density: dto.density ?? null,
    temperature: dto.temperature ?? null,
    purges: dto.purges ?? null,
    purgeUnit: dto.purgeUnit ?? null,
    dryHop: dto.dryHop ?? false,
    additions: dto.additions ?? null,
    hasClarifier: dto.hasClarifier ?? false,
    isCarbonated: dto.isCarbonated ?? false,
    note: dto.note ?? null,
    recordedAt: dto.recordedAt ? new Date(dto.recordedAt) : new Date(),
    recordedByUserId: user.userId,
    recordedByName: user.fullName,
  });

  const saved = await this.readingRepo.save(reading);

  if (dto.dryHop) {
    production.dryHopApplied = true;
    production.dryHopDescription =
      dto.additions?.trim() ||
      production.dryHopDescription ||
      'Dry hop aplicado';
  }

  if (dto.purges && Number(dto.purges) > 0) {
    production.purgesCount = Number(production.purgesCount ?? 0) + 1;
    production.purgeWeightKg =
      Number(production.purgeWeightKg ?? 0) + Number(dto.purges);
  }

  if (dto.note?.trim()) {
    production.fermentationNotes = dto.note.trim();
  }

  await this.productionRepo.save(production);

  return saved;
}
  async startFermentation(dto: StartFermentationDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const productionRepo = manager.getRepository(Production);
    const fermenterRepo = manager.getRepository(Fermenter);
    const historyRepo = manager.getRepository(FermenterStatusHistory);

    const production = await productionRepo.findOne({
      where: { id: dto.batchId },
      relations: ['actualFermenter', 'plannedFermenter'],
    });

    if (!production) {
      throw new NotFoundException('Producción no encontrada');
    }

    const fermenter = await fermenterRepo.findOne({
      where: { id: dto.fermenterId },
    });

    if (!fermenter) {
      throw new NotFoundException('Fermentador no encontrado');
    }

    if (
      ![FermenterStatus.AVAILABLE, FermenterStatus.SANITIZED].includes(
        fermenter.status,
      )
    ) {
      throw new BadRequestException(
        `El fermentador no está listo. Estado actual: ${fermenter.status}`,
      );
    }

    if (production.actualFermenter) {
      throw new BadRequestException(
        'La producción ya está asignada a un fermentador real',
      );
    }

    const previousStatus = fermenter.status;
    const now = new Date();

    await fermenterRepo.save({
      id: fermenter.id,
      status: FermenterStatus.FERMENTING,
      currentBatchStartedAt: now,
      availableAt: null,
      currentProductionId: production.id,
      currentProduction: { id: production.id } as Production,
      currentVolumeLiters: dto.brewedLiters,
    });

    await productionRepo.save({
      id: production.id,
      actualFermenter: { id: fermenter.id } as Fermenter,
      plannedFermenter: null,
      status: ProductionStatus.TRANSFERRED_TO_FERMENTER,
      volumeLiters: dto.brewedLiters,
      fermentationStartedAt: now,
    });

    const history = historyRepo.create({
      fermenter: { id: fermenter.id } as Fermenter,
      fromStatus: previousStatus,
      toStatus: FermenterStatus.FERMENTING,
      changedBy: user.fullName,
      note: `Inicio de fermentación para producción ${production.id}`,
    });

    await historyRepo.save(history);

    return productionRepo.findOne({
      where: { id: production.id },
      relations: ['client', 'actualFermenter'],
    });
  }); 

}


  async startTransfer(dto: StartTransferDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const productionRepo = manager.getRepository(Production);
    const fermenterRepo = manager.getRepository(Fermenter);
    const transferRepo = manager.getRepository(Transfer);
    const historyRepo = manager.getRepository(FermenterStatusHistory);

    const production = await productionRepo.findOne({
      where: { id: dto.batchId },
      relations: ['actualFermenter'],
    });

    if (!production) {
      throw new NotFoundException('Producción no encontrada');
    }

    const fermenter = await fermenterRepo.findOne({
      where: { id: dto.fermenterId },
    });

    if (!fermenter) {
      throw new NotFoundException('Fermentador no encontrado');
    }

    if (!production.actualFermenter || production.actualFermenter.id !== fermenter.id) {
      throw new BadRequestException(
        'Esa producción no pertenece a ese fermentador',
      );
    }

    if (fermenter.status !== FermenterStatus.FERMENTING) {
      throw new BadRequestException(
        `No se puede iniciar trasiego desde estado ${fermenter.status}`,
      );
    }

    const previousStatus = fermenter.status;
    const now = new Date();
    const currentLiters = Number(fermenter.currentVolumeLiters ?? 0);
    const purgeLossLiters = Number(production.purgeWeightKg ?? 0); // 1 kg ≈ 1 L

    if (purgeLossLiters > currentLiters) {
      throw new BadRequestException(
        'El peso total de purgas no puede ser mayor que los litros actuales del fermentador',
      );
    }

    const litersAfterPurges = Number(
      Math.max(0, currentLiters - purgeLossLiters).toFixed(2),
    );

      await fermenterRepo.save({
        id: fermenter.id,
        status: FermenterStatus.TRANSFERRING,
        currentBatchStartedAt: fermenter.currentBatchStartedAt,
        currentProductionId: production.id,
        currentProduction: { id: production.id } as Production,
        currentVolumeLiters:litersAfterPurges ,
      });

      await productionRepo.save({
        id: production.id,
        status: ProductionStatus.TRANSFERRING,
        transferStartedAt: now,
});

    const transfer = new Transfer();
      transfer.fermenter = fermenter;
      transfer.production = production;
      transfer.startedBy = user.fullName;
      transfer.startedByUserId = user.userId;
      transfer.startedByName = user.fullName;
      transfer.startedAt = now;
      transfer.finishedAt = null;
      transfer.finishedBy = null;
      transfer.destinationType = dto.destinationType ?? null;
      transfer.note = dto.note ?? null;
      transfer.litersTransferred = 0;

     await transferRepo.save(transfer);

     
    const history = historyRepo.create({
      fermenter,
      fromStatus: previousStatus,
      toStatus: FermenterStatus.TRANSFERRING,
      changedBy: user.fullName,
      note: `Inicio de trasiego de producción ${production.id}`,
    });

    await historyRepo.save(history);

    return transfer;
  });

}

  async finishTransfer(dto: FinishTransferDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const transferRepo = manager.getRepository(Transfer);
    const fermenterRepo = manager.getRepository(Fermenter);
    const productionRepo = manager.getRepository(Production);
    const historyRepo = manager.getRepository(FermenterStatusHistory);

    const transfer = await transferRepo.findOne({
      where: { id: dto.transferId },
      relations: ['fermenter', 'production'],
    });

    if (!transfer) {
      throw new NotFoundException('Trasiego no encontrado');
    }

    if (transfer.finishedAt) {
      throw new BadRequestException('Ese trasiego ya fue cerrado');
    }

    const fermenter = transfer.fermenter;
    const production = transfer.production;

    if (fermenter.status !== FermenterStatus.TRANSFERRING) {
      throw new BadRequestException(
        `El fermentador no está en trasiego. Estado actual: ${fermenter.status}`,
      );
    }

    if (Number(fermenter.currentVolumeLiters ?? 0) > 0) {
      throw new BadRequestException(
        'No puedes finalizar el trasiego porque aún quedan litros en el fermentador',
      );
    }

    const now = new Date();

    await transferRepo.save({
      id: transfer.id,
      finishedBy: user.fullName,
      finishedByUserId: user.userId,
      finishedByName: user.fullName,
      finishedAt: now,
      note: dto.note ?? transfer.note,
    });

    const previousStatus = fermenter.status;

    await fermenterRepo.save({
      id: fermenter.id,
      status: FermenterStatus.DIRTY_EMPTY,
      currentBatchStartedAt: null,
      currentProduction: null,
      currentProductionId: null,
      currentVolumeLiters: 0,
      availableAt: null,
    });

    await productionRepo.save({
      id: production.id,
      status: ProductionStatus.FINISHED,
      actualFermenter: null,
      plannedFermenter: null,
      transferFinishedAt: now,
      finishedAt: now,
    });

    const history = historyRepo.create({
      fermenter: { id: fermenter.id } as Fermenter,
      fromStatus: previousStatus,
      toStatus: FermenterStatus.DIRTY_EMPTY,
      changedBy: user.fullName,
      note: `Fin de trasiego de producción ${production.id}`,
    });

    await historyRepo.save(history);

    return transferRepo.findOne({
      where: { id: transfer.id },
      relations: ['fermenter', 'production'],
    });
  });



}

  async updateOperationalStatus(dto: UpdateFermenterStatusDto, user: any) {
  const fermenter = await this.fermenterRepo.findOne({
    where: { id: dto.fermenterId },
  });

  if (!fermenter) {
    throw new NotFoundException('Fermentador no encontrado');
  }

  const allowedTransitions: Record<FermenterStatus, FermenterStatus[]> = {
    [FermenterStatus.AVAILABLE]: [],
    [FermenterStatus.RESERVED]: [
      FermenterStatus.AVAILABLE,
      FermenterStatus.FERMENTING,
    ],
    [FermenterStatus.FERMENTING]: [FermenterStatus.TRANSFERRING],
    [FermenterStatus.TRANSFERRING]: [FermenterStatus.DIRTY_EMPTY],
    [FermenterStatus.DIRTY_EMPTY]: [FermenterStatus.CLEAN],
    [FermenterStatus.CLEAN]: [FermenterStatus.SANITIZED],
    [FermenterStatus.SANITIZED]: [
      FermenterStatus.AVAILABLE,
      FermenterStatus.FERMENTING,
    ],
  };

  const targetStatus = dto.status as FermenterStatus;

  if (!allowedTransitions[fermenter.status]?.includes(targetStatus)) {
    throw new BadRequestException(
      `No se puede pasar de ${fermenter.status} a ${targetStatus}`,
    );
  }

  const fromStatus = fermenter.status;
  fermenter.status = targetStatus;

 if (targetStatus === FermenterStatus.AVAILABLE) {
  fermenter.availableAt = new Date();
  fermenter.currentBatchStartedAt = null;
  fermenter.currentProduction = null;
  fermenter.currentProductionId = null;
  fermenter.currentVolumeLiters = 0;
}

  await this.fermenterRepo.save(fermenter);

  const history = this.historyRepo.create({
    fermenter,
    fromStatus,
    toStatus: targetStatus,
    changedBy: user.fullName,
    note: dto.note ?? null,
  });

  await this.historyRepo.save(history);

  return fermenter;
}
async listColdRoomKegs() {
  return this.coldRoomKegRepo.find({
    order: { storedAt: 'DESC' },
  });
}

async listBottlingOrders() {
  return this.bottlingOrderRepo.find({
    order: { createdAt: 'DESC' },
  });
}
async deleteOpenBottlingOrder(id: number) {
  const order = await this.bottlingOrderRepo.findOne({
    where: { id },
  });

  if (!order) {
    throw new NotFoundException('Orden de embotellado no encontrada');
  }

  if (!['PENDIENTE', 'EN_PROCESO'].includes(order.status)) {
    throw new BadRequestException(
      'Solo se pueden eliminar órdenes PENDIENTE o EN_PROCESO',
    );
  }

  await this.bottlingOrderRepo.delete(order.id);

  return {
    message: `Orden #${order.id} eliminada correctamente`,
  };
}

async kegDown(dto: CreateKegDownDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const transferRepo = manager.getRepository(Transfer);
    const fermenterRepo = manager.getRepository(Fermenter);
    const kegRepo = manager.getRepository(ColdRoomKeg);

    const transfer = await transferRepo.findOne({
      where: { id: dto.transferId },
      relations: ['fermenter', 'production', 'production.client'],
    });

    if (!transfer) {
      throw new NotFoundException('Trasiego no encontrado');
    }

    if (transfer.finishedAt) {
      throw new BadRequestException('El trasiego ya fue finalizado');
    }

    const fermenter = await fermenterRepo.findOne({
      where: { id: transfer.fermenter.id },
      relations: ['currentProduction', 'currentProduction.client'],
    });

    if (!fermenter) {
      throw new NotFoundException('Fermentador no encontrado');
    }

    if (fermenter.status !== FermenterStatus.TRANSFERRING) {
      throw new BadRequestException('El fermentador no está en trasiego');
    }

    const kegs60 = Number(dto.kegs60 ?? 0);
    const kegs50 = Number(dto.kegs50 ?? 0);
    const kegs30 = Number(dto.kegs30 ?? 0);
    const partialLiters = Number(dto.partialLiters ?? 0);
    const lossLiters = Number(dto.lossLiters ?? 0);

    const litersInKegs = kegs60 * 60 + kegs50 * 50 + kegs30 * 30 + partialLiters;
    const totalOutLiters = litersInKegs + lossLiters;
    const availableLiters = Number(fermenter.currentVolumeLiters ?? 0);

    if (litersInKegs <= 0) {
      throw new BadRequestException(
        'Debes registrar al menos un barril o cantidad de cerveza',
      );
    }

    if (totalOutLiters > availableLiters) {
      throw new BadRequestException(
        `No hay suficientes litros en el fermentador. Disponibles: ${availableLiters} L, solicitados: ${totalOutLiters} L`,
      );
    }

    const record = kegRepo.create({
      transfer,
      transferId: transfer.id,
      fermenter,
      fermenterId: fermenter.id,
      production: transfer.production,
      productionId: transfer.production.id,
      beerName: transfer.production.beerName,
      clientName: transfer.production.client?.name ?? null,
      kegs60,
      kegs50,
      kegs30,
      partialLiters,
      totalKegLiters: litersInKegs,
      lossLiters,
      note: dto.note ?? null,
      storedByUserId: user.userId,
      storedByName: user.fullName,
    });

    await kegRepo.save(record);

    await fermenterRepo.save({
      id: fermenter.id,
      currentVolumeLiters: availableLiters - totalOutLiters,
    });

    await transferRepo.save({
      id: transfer.id,
      litersTransferred:
        Number(transfer.litersTransferred ?? 0) + totalOutLiters,
    });

    return {
      message: 'Barriles registrados en cuarto frío',
      litersInKegs,
      totalOutLiters,
      remainingLiters: availableLiters - totalOutLiters,
    };
  });
}

async sendToBottling(dto: CreateBottlingOrderDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const transferRepo = manager.getRepository(Transfer);
    const fermenterRepo = manager.getRepository(Fermenter);
    const bottlingRepo = manager.getRepository(BottlingOrder);

    const transfer = await transferRepo.findOne({
      where: { id: dto.transferId },
      relations: ['fermenter', 'production', 'production.client'],
    });

    if (!transfer) {
      throw new NotFoundException('Trasiego no encontrado');
    }

    if (transfer.finishedAt) {
      throw new BadRequestException('El trasiego ya fue finalizado');
    }

    const fermenter = await fermenterRepo.findOne({
      where: { id: transfer.fermenter.id },
      relations: ['currentProduction', 'currentProduction.client'],
    });

    if (!fermenter) {
      throw new NotFoundException('Fermentador no encontrado');
    }

    if (fermenter.status !== FermenterStatus.TRANSFERRING) {
      throw new BadRequestException('El fermentador no está en trasiego');
    }

    const availableLiters = Number(fermenter.currentVolumeLiters ?? 0);

    if (availableLiters <= 0) {
      throw new BadRequestException(
        'No hay litros disponibles en el fermentador para enviar a embotellado',
      );
    }

    const existingOpenOrder = await bottlingRepo.findOne({
      where: {
        transferId: transfer.id,
        sourceType: 'FERMENTER',
        status: In(['PENDIENTE', 'EN_PROCESO']),
      },
      order: { id: 'DESC' },
    });

    if (existingOpenOrder) {
      throw new BadRequestException(
        'Ya existe una orden abierta de embotellado para este fermentador',
      );
    }

    const order = bottlingRepo.create({
      transfer,
      transferId: transfer.id,
      fermenter,
      fermenterId: fermenter.id,
      production: transfer.production,
      productionId: transfer.production.id,
      beerName: transfer.production.beerName,
      clientName: transfer.production.client?.name ?? null,
      sourceType: 'FERMENTER',
      sourceFermenterId: fermenter.id,
      sourceColdRoomKegId: null,
      sourceKegSizeLiters: null,
      requestedLiters: availableLiters,
      remainingLiters: availableLiters,
      status: 'PENDIENTE',
      startedAt: null,
      startedByUserId: null,
      startedByName: null,
      finishedAt: null,
      finishedByUserId: null,
      finishedByName: null,
      units330: 0,
      units269: 0,
      litersFrom330: 0,
      litersFrom269: 0,
      processLossLiters: 0,
      totalProcessedLiters: 0,
      note: dto.note ?? null,
      createdByUserId: user.userId,
      createdByName: user.fullName,
    });

    await bottlingRepo.save(order);

    return {
      message: 'Orden de embotellado creada correctamente',
      orderId: order.id,
      availableLiters,
    };
  });
}
async createKegBottlingOrder(dto: CreateKegBottlingOrderDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const kegRepo = manager.getRepository(ColdRoomKeg);
    const bottlingRepo = manager.getRepository(BottlingOrder);

    const record = await kegRepo.findOne({
      where: { id: dto.coldRoomKegId },
      relations: ['transfer', 'fermenter', 'production'],
    });

    if (!record) {
      throw new NotFoundException('Registro de barriles no encontrado');
    }

    const quantity = dto.kegQuantity ?? 1;

    const available60 = Number(record.kegs60 ?? 0);
    const available50 = Number(record.kegs50 ?? 0);
    const available30 = Number(record.kegs30 ?? 0);

    if (dto.kegSizeLiters === 60 && available60 <= 0) {
      throw new BadRequestException('No hay barriles de 60 L disponibles');
    }
    if (dto.kegSizeLiters === 60 && quantity > available60) {
      throw new BadRequestException(`Solo hay ${available60} barril(es) de 60 L disponibles`);
    }

    if (dto.kegSizeLiters === 50 && available50 <= 0) {
      throw new BadRequestException('No hay barriles de 50 L disponibles');
    }
    if (dto.kegSizeLiters === 50 && quantity > available50) {
      throw new BadRequestException(`Solo hay ${available50} barril(es) de 50 L disponibles`);
    }

    if (dto.kegSizeLiters === 30 && available30 <= 0) {
      throw new BadRequestException('No hay barriles de 30 L disponibles');
    }
    if (dto.kegSizeLiters === 30 && quantity > available30) {
      throw new BadRequestException(`Solo hay ${available30} barril(es) de 30 L disponibles`);
    }

    const totalLiters = dto.kegSizeLiters * quantity;

    const existingOpenOrder = await bottlingRepo.findOne({
      where: {
        sourceType: 'KEG',
        sourceColdRoomKegId: record.id,
        sourceKegSizeLiters: dto.kegSizeLiters,
        status: In(['PENDIENTE', 'EN_PROCESO']),
      },
      order: { id: 'DESC' },
    });

    if (existingOpenOrder) {
      throw new BadRequestException(
        'Ya existe una orden abierta para ese barril',
      );
    }

    const order = new BottlingOrder();
    order.transfer = record.transfer;
    order.transferId = record.transferId;
    order.fermenter = record.fermenter;
    order.fermenterId = record.fermenterId;
    order.production = record.production;
    order.productionId = record.productionId;
    order.beerName = record.beerName;
    order.clientName = record.clientName ?? null;
    order.sourceType = 'KEG';
    order.sourceFermenterId = record.fermenterId;
    order.sourceColdRoomKegId = record.id;
    order.sourceKegSizeLiters = dto.kegSizeLiters;
    order.requestedLiters = totalLiters;
    order.remainingLiters = totalLiters;
    order.status = 'PENDIENTE';
    order.startedAt = null;
    order.startedByUserId = null;
    order.startedByName = null;
    order.finishedAt = null;
    order.finishedByUserId = null;
    order.finishedByName = null;
    order.units330 = 0;
    order.units269 = 0;
    order.litersFrom330 = 0;
    order.litersFrom269 = 0;
    order.processLossLiters = 0;
    order.totalProcessedLiters = 0;
    order.note = dto.note ?? null;
    order.createdByUserId = user.userId;
    order.createdByName = user.fullName;

    await bottlingRepo.save(order);

    return {
      message: 'Orden de embotellado desde barril creada correctamente',
      orderId: order.id,
    };
  });
}
async startBottling(dto: StartBottlingDto, user: any) {
  const order = await this.bottlingOrderRepo.findOne({
    where: { id: dto.orderId },
  });

  if (!order) {
    throw new NotFoundException('Orden de embotellado no encontrada');
  }
  const existingRunningOrder = await this.bottlingOrderRepo.findOne({
    where: { status: 'EN_PROCESO' },
    order: { id: 'DESC' },
  });

  if (existingRunningOrder && existingRunningOrder.id !== dto.orderId) {
    throw new BadRequestException(
      `Ya existe una orden de embotellado en proceso (#${existingRunningOrder.id}). Debes retomarla o finalizarla antes de iniciar otra.`,
    );
  }



  if (order.status !== 'PENDIENTE') {
    throw new BadRequestException(
      `La orden no se puede iniciar desde estado ${order.status}`,
    );
  }
  

  order.status = 'EN_PROCESO';
  order.startedAt = new Date();
  order.startedByUserId = user.userId;
  order.startedByName = user.fullName;

  await this.bottlingOrderRepo.save(order);

  return order;
}

async finishBottling(dto: FinishBottlingDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const bottlingRepo = manager.getRepository(BottlingOrder);
    const fermenterRepo = manager.getRepository(Fermenter);
    const kegRepo = manager.getRepository(ColdRoomKeg);

    const order = await bottlingRepo.findOne({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException('Orden de embotellado no encontrada');
    }

    if (order.status !== 'EN_PROCESO') {
      throw new BadRequestException(
        `La orden no está en proceso. Estado actual: ${order.status}`,
      );
    }

    const units330 = Number(dto.units330 ?? 0);
    const units269 = Number(dto.units269 ?? 0);
    const lossLiters = Number(dto.lossLiters ?? 0);

    const litersFrom330 = Number((units330 * 0.35).toFixed(2));
    const litersFrom269 = Number((units269 * 0.269).toFixed(2));
    const totalPackagedLiters = Number(
      (litersFrom330 + litersFrom269).toFixed(2),
    );
    const totalProcessedLiters = Number(
      (totalPackagedLiters + lossLiters).toFixed(2),
    );

    if (totalProcessedLiters <= 0) {
      throw new BadRequestException(
        'Debes registrar al menos botellas/latas o merma',
      );
    }

    if (order.sourceType === 'FERMENTER') {
      const fermenter = await fermenterRepo.findOne({
        where: { id: Number(order.sourceFermenterId) },
      });

      if (!fermenter) {
        throw new NotFoundException('Fermentador no encontrado');
      }

      const availableLiters = Number(fermenter.currentVolumeLiters ?? 0);

      if (totalProcessedLiters > availableLiters) {
        throw new BadRequestException(
          'No hay suficientes litros en el fermentador para finalizar embotellado',
        );
      }

      if (totalProcessedLiters > Number(order.remainingLiters ?? 0)) {
        throw new BadRequestException(
          'El proceso excede los litros disponibles de esta orden',
        );
      }

      const remainingAfterThisRun = Number(
        (Number(order.remainingLiters ?? 0) - totalProcessedLiters).toFixed(2),
      );

      await fermenterRepo.save({
        id: fermenter.id,
        currentVolumeLiters: Number(
          (availableLiters - totalProcessedLiters).toFixed(2),
        ),
      });

      order.units330 = units330;
      order.units269 = units269;
      order.litersFrom330 = litersFrom330;
      order.litersFrom269 = litersFrom269;
      order.processLossLiters = lossLiters;
      order.totalProcessedLiters = totalProcessedLiters;
      order.note = dto.note ?? order.note ?? null;
      order.finishedAt = new Date();
      order.finishedByUserId = user.userId;
      order.finishedByName = user.fullName;
      order.status = 'FINALIZADA';
      order.remainingLiters = 0;

      await bottlingRepo.save(order);
      await this.createPackagedStockFromFinishedOrder(manager, order, user);

      if (remainingAfterThisRun > 0) {
        const newPendingOrder = new BottlingOrder();
        newPendingOrder.transferId = order.transferId;
        newPendingOrder.fermenterId = order.fermenterId;
        newPendingOrder.productionId = order.productionId;
        newPendingOrder.beerName = order.beerName;
        newPendingOrder.clientName = order.clientName;
        newPendingOrder.sourceType = 'FERMENTER';
        newPendingOrder.sourceFermenterId = order.sourceFermenterId;
        newPendingOrder.sourceColdRoomKegId = null;
        newPendingOrder.sourceKegSizeLiters = null;
        newPendingOrder.requestedLiters = remainingAfterThisRun;
        newPendingOrder.remainingLiters = remainingAfterThisRun;
        newPendingOrder.status = 'PENDIENTE';
        newPendingOrder.startedAt = null;
        newPendingOrder.startedByUserId = null;
        newPendingOrder.startedByName = null;
        newPendingOrder.finishedAt = null;
        newPendingOrder.finishedByUserId = null;
        newPendingOrder.finishedByName = null;
        newPendingOrder.units330 = 0;
        newPendingOrder.units269 = 0;
        newPendingOrder.litersFrom330 = 0;
        newPendingOrder.litersFrom269 = 0;
        newPendingOrder.processLossLiters = 0;
        newPendingOrder.totalProcessedLiters = 0;
        newPendingOrder.note = 'Orden automática por remanente de embotellado';
        newPendingOrder.createdByUserId = user.userId;
        newPendingOrder.createdByName = user.fullName;

        await bottlingRepo.save(newPendingOrder);
      }

      return {
        message: 'Embotellado finalizado correctamente',
        totalPackagedLiters,
        totalProcessedLiters,
        remainingOrderLiters: remainingAfterThisRun,
      };
    }

    if (order.sourceType === 'KEG') {
      const kegRecord = await kegRepo.findOne({
        where: { id: Number(order.sourceColdRoomKegId) },
      });

      if (!kegRecord) {
        throw new NotFoundException('Registro de barril no encontrado');
      }

      // Use sourceKegSizeLiters for keg-type logic (always 60/50/30)
      // Use remainingLiters for the expected total (accounts for quantity > 1)
      const kegSizeLiters = Number(order.sourceKegSizeLiters ?? 0);
      const expectedTotalLiters = Number(order.remainingLiters ?? kegSizeLiters);

      if (Math.abs(totalProcessedLiters - expectedTotalLiters) > 0.05) {
        throw new BadRequestException(
          `Para embotellar desde barril debes vaciar completamente el barril seleccionado en una sola operación. Esperado: ${expectedTotalLiters} L, registrado: ${totalProcessedLiters} L`,
        );
      }

      order.units330 = units330;
      order.units269 = units269;
      order.litersFrom330 = litersFrom330;
      order.litersFrom269 = litersFrom269;
      order.processLossLiters = lossLiters;
      order.totalProcessedLiters = totalProcessedLiters;
      order.note = dto.note ?? order.note ?? null;
      order.finishedAt = new Date();
      order.finishedByUserId = user.userId;
      order.finishedByName = user.fullName;
      order.status = 'FINALIZADA';
      order.remainingLiters = 0;

      await bottlingRepo.save(order);
      await this.createPackagedStockFromFinishedOrder(manager, order, user);

      // Compute how many kegs of this size were consumed
      const kegQuantity =
        kegSizeLiters > 0 ? Math.round(expectedTotalLiters / kegSizeLiters) : 1;

      const prevTotalKegLiters = Number(kegRecord.totalKegLiters ?? 0);
      const newTotalKegLiters = Math.max(
        0,
        Number((prevTotalKegLiters - expectedTotalLiters).toFixed(2)),
      );

      const updatePayload: any = {
        id: kegRecord.id,
        totalKegLiters: newTotalKegLiters,
      };

      if (kegSizeLiters === 60) {
        updatePayload.kegs60 = Math.max(0, Number(kegRecord.kegs60 ?? 0) - kegQuantity);
      } else if (kegSizeLiters === 50) {
        updatePayload.kegs50 = Math.max(0, Number(kegRecord.kegs50 ?? 0) - kegQuantity);
      } else if (kegSizeLiters === 30) {
        updatePayload.kegs30 = Math.max(0, Number(kegRecord.kegs30 ?? 0) - kegQuantity);
      }

      // If the record is completely drained, zero out partialLiters as well
      const remaining60 = updatePayload.kegs60 ?? Number(kegRecord.kegs60 ?? 0);
      const remaining50 = updatePayload.kegs50 ?? Number(kegRecord.kegs50 ?? 0);
      const remaining30 = updatePayload.kegs30 ?? Number(kegRecord.kegs30 ?? 0);
      if (remaining60 <= 0 && remaining50 <= 0 && remaining30 <= 0 && newTotalKegLiters <= 0) {
        updatePayload.partialLiters = 0;
      }

      await kegRepo.save(updatePayload);

      return {
        message: 'Embotellado desde barril finalizado correctamente',
        totalPackagedLiters,
        totalProcessedLiters,
      };
    }

    throw new BadRequestException('Tipo de fuente de embotellado no soportado');
  });
}
async createLegacyColdRoomKeg(dto: CreateLegacyColdRoomKegDto, user: any) {
  const litersInKegs =
    Number(dto.kegs60 ?? 0) * 60 +
    Number(dto.kegs50 ?? 0) * 50 +
    Number(dto.kegs30 ?? 0) * 30;

  if (litersInKegs <= 0) {
    throw new BadRequestException(
      'Debes registrar al menos un barril existente en cuarto frío',
    );
  }

  const record = this.coldRoomKegRepo.create({
    transfer: null,
    transferId: null,
    fermenter: null,
    fermenterId: null,
    production: null,
    productionId: null,
    beerName: dto.beerName,
    clientName: dto.clientName ?? null,
    sourceType: 'LEGACY',
    kegs60: Number(dto.kegs60 ?? 0),
    kegs50: Number(dto.kegs50 ?? 0),
    kegs30: Number(dto.kegs30 ?? 0),
    totalKegLiters: Number(dto.totalKegLiters ?? litersInKegs),
    lossLiters: Number(dto.lossLiters ?? 0),
    note: dto.note ?? null,
    storedByUserId: user.userId,
    storedByName: user.fullName,
  });

  return this.coldRoomKegRepo.save(record);
}
private round2(value: number) {
  return Number(Number(value ?? 0).toFixed(2));
}

private async createPackagedStockFromFinishedOrder(
  manager: any,
  order: BottlingOrder,
  user: any,
) {
  const packagedRepo = manager.getRepository(ColdRoomPackagedStock);

  const units330 = Number(order.units330 ?? 0);
  const units269 = Number(order.units269 ?? 0);

  if (units330 <= 0 && units269 <= 0) {
    return null;
  }

  const existing = await packagedRepo.findOne({
    where: { sourceBottlingOrderId: order.id },
  });

  if (existing) {
    return existing;
  }

  const stock = packagedRepo.create({
    productionId: order.productionId ?? null,
    beerName: order.beerName ?? null,
    clientName: order.clientName ?? null,
    sourceBottlingOrderId: order.id,
    sourceType: order.sourceType ?? 'FERMENTER',
    units330Available: units330,
    units269Available: units269,
    liters330Available: this.round2(order.litersFrom330 ?? 0),
    liters269Available: this.round2(order.litersFrom269 ?? 0),
    totalPackagedLitersAvailable: this.round2(
      Number(order.litersFrom330 ?? 0) + Number(order.litersFrom269 ?? 0),
    ),
    note: `Stock creado desde orden de embotellado #${order.id}`,
    storedByUserId: user.userId,
    storedByName: user.fullName,
  });

  return packagedRepo.save(stock);
}

async listPackagedStock() {
  return this.packagedStockRepo.find({
    order: { storedAt: 'DESC' },
  });
}

async listColdRoomOutputs() {
  return this.coldRoomOutputRepo.find({
    relations: ['items'],
    order: { createdAt: 'DESC' },
  });
}

async createColdRoomOutput(dto: CreateColdRoomOutputDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const outputRepo = manager.getRepository(ColdRoomOutput);
    const itemRepo = manager.getRepository(ColdRoomOutputItem);
    const kegRepo = manager.getRepository(ColdRoomKeg);
    const packagedRepo = manager.getRepository(ColdRoomPackagedStock);

    const output = outputRepo.create({
      outputDate: dto.outputDate,
      destinationName: dto.destinationName,
      destinationType: dto.destinationType,
      status: 'CONFIRMADA',
      note: dto.note ?? null,
      responsibleUserId: user.userId,
      responsibleName: user.fullName,
    });

    const savedOutput = await outputRepo.save(output);

    for (const row of dto.items) {
      if (row.itemType === 'KEG') {
        if (!row.sourceColdRoomKegId) {
          throw new BadRequestException(
            'Para salida de barriles debes enviar sourceColdRoomKegId',
          );
        }

        if (![30, 50, 60].includes(Number(row.kegSizeLiters))) {
          throw new BadRequestException(
            'kegSizeLiters debe ser 30, 50 o 60',
          );
        }

        if (!row.kegQuantity || Number(row.kegQuantity) <= 0) {
          throw new BadRequestException(
            'kegQuantity debe ser mayor a 0',
          );
        }

        const record = await kegRepo.findOne({
          where: { id: Number(row.sourceColdRoomKegId) },
        });

        if (!record) {
          throw new NotFoundException('Registro de barriles no encontrado');
        }

        const size = Number(row.kegSizeLiters);
        const qty = Number(row.kegQuantity);
        const litersDelivered = this.round2(size * qty);

        let available = 0;
        let patch: any = {
          id: record.id,
        };

        if (size === 60) {
          available = Number(record.kegs60 ?? 0);
          if (qty > available) {
            throw new BadRequestException(
              `No hay suficientes barriles de 60L. Disponibles: ${available}`,
            );
          }
          patch.kegs60 = available - qty;
        }

        if (size === 50) {
          available = Number(record.kegs50 ?? 0);
          if (qty > available) {
            throw new BadRequestException(
              `No hay suficientes barriles de 50L. Disponibles: ${available}`,
            );
          }
          patch.kegs50 = available - qty;
        }

        if (size === 30) {
          available = Number(record.kegs30 ?? 0);
          if (qty > available) {
            throw new BadRequestException(
              `No hay suficientes barriles de 30L. Disponibles: ${available}`,
            );
          }
          patch.kegs30 = available - qty;
        }

        const currentLiters = Number(record.totalKegLiters ?? 0);
        if (litersDelivered > currentLiters) {
          throw new BadRequestException(
            'La salida excede los litros disponibles en barriles',
          );
        }

        patch.totalKegLiters = this.round2(currentLiters - litersDelivered);

        await kegRepo.save(patch);

        const item = itemRepo.create({
          outputId: savedOutput.id,
          itemType: 'KEG',
          productionId: record.productionId ?? null,
          beerName: record.beerName ?? null,
          clientName: record.clientName ?? null,
          sourceColdRoomKegId: record.id,
          sourcePackagedStockId: null,
          kegSizeLiters: size,
          kegQuantity: qty,
          units330: 0,
          units269: 0,
          litersDelivered,
          note: row.note ?? null,
        });

        await itemRepo.save(item);
      }

      if (row.itemType === 'PACKAGE') {
        if (!row.sourcePackagedStockId) {
          throw new BadRequestException(
            'Para salida de botellas/latas debes enviar sourcePackagedStockId',
          );
        }

        const units330 = Number(row.units330 ?? 0);
        const units269 = Number(row.units269 ?? 0);

        if (units330 <= 0 && units269 <= 0) {
          throw new BadRequestException(
            'Debes enviar al menos units330 o units269',
          );
        }

        const stock = await packagedRepo.findOne({
          where: { id: Number(row.sourcePackagedStockId) },
        });

        if (!stock) {
          throw new NotFoundException('Stock empacado no encontrado');
        }

        const available330 = Number(stock.units330Available ?? 0);
        const available269 = Number(stock.units269Available ?? 0);

        if (units330 > available330) {
          throw new BadRequestException(
            `No hay suficientes unidades 330. Disponibles: ${available330}`,
          );
        }

        if (units269 > available269) {
          throw new BadRequestException(
            `No hay suficientes unidades 269. Disponibles: ${available269}`,
          );
        }

        const liters330 = this.round2(units330 * 0.33);
        const liters269 = this.round2(units269 * 0.269);
        const litersDelivered = this.round2(liters330 + liters269);

        await packagedRepo.save({
          id: stock.id,
          units330Available: available330 - units330,
          units269Available: available269 - units269,
          liters330Available: this.round2(
            Number(stock.liters330Available ?? 0) - liters330,
          ),
          liters269Available: this.round2(
            Number(stock.liters269Available ?? 0) - liters269,
          ),
          totalPackagedLitersAvailable: this.round2(
            (Number(stock.liters330Available ?? 0) - liters330) +
              (Number(stock.liters269Available ?? 0) - liters269),
          ),
        });

        const item = itemRepo.create({
          outputId: savedOutput.id,
          itemType: 'PACKAGE',
          productionId: stock.productionId ?? null,
          beerName: stock.beerName ?? null,
          clientName: stock.clientName ?? null,
          sourceColdRoomKegId: null,
          sourcePackagedStockId: stock.id,
          kegSizeLiters: null,
          kegQuantity: null,
          units330,
          units269,
          litersDelivered,
          note: row.note ?? null,
        });

        await itemRepo.save(item);
      }
    }

    return outputRepo.findOne({
      where: { id: savedOutput.id },
      relations: ['items'],
    });
  });
}
async listColdRoomInventory(
  productionId?: number,
  clientName?: string,
  beerName?: string,
) {
  const kegRows = await this.coldRoomKegRepo.find({
    order: { storedAt: 'DESC' },
  });

  const packagedRows = await this.packagedStockRepo.find({
    order: { storedAt: 'DESC' },
  });

  const kegInventory = kegRows
    .filter(
      (item) =>
        Number(item.kegs60 ?? 0) > 0 ||
        Number(item.kegs50 ?? 0) > 0 ||
        Number(item.kegs30 ?? 0) > 0 ||
        Number(item.partialLiters ?? 0) > 0,
    )
    .map((item) => ({
    id: item.id,
    inventoryType: 'BARRIL',
    sourceType: item.sourceType ?? 'TRANSFER',
    productionId: item.productionId ?? null,
    beerName: item.beerName,
    clientName: item.clientName ?? null,
    kegs60: Number(item.kegs60 ?? 0),
    kegs50: Number(item.kegs50 ?? 0),
    kegs30: Number(item.kegs30 ?? 0),
    partialLiters: Number(item.partialLiters ?? 0),
    totalKegLiters: Number(item.totalKegLiters ?? 0),
    units330: 0,
    units269: 0,
    litersFrom330: 0,
    litersFrom269: 0,
    totalBottleLiters: 0,
    registeredAt: item.storedAt,
    storedByName: item.storedByName ?? null,
    fermenterId: item.fermenterId ?? null,
  }));

  const bottleInventory = packagedRows
    .filter(
      (item) =>
        Number(item.units330Available ?? 0) > 0 ||
        Number(item.units269Available ?? 0) > 0,
    )
    .map((item) => ({
      id: item.id,
      inventoryType: 'BOTELLA',
      sourceType: item.sourceType ?? 'FERMENTER',
      productionId: item.productionId ?? null,
      beerName: item.beerName,
      clientName: item.clientName ?? null,
      kegs60: 0,
      kegs50: 0,
      kegs30: 0,
      totalKegLiters: 0,
      units330: Number(item.units330Available ?? 0),
      units269: Number(item.units269Available ?? 0),
      litersFrom330: Number(item.liters330Available ?? 0),
      litersFrom269: Number(item.liters269Available ?? 0),
      totalBottleLiters: Number(item.totalPackagedLitersAvailable ?? 0),
      registeredAt: item.storedAt,
    }));

  let inventory = [...kegInventory, ...bottleInventory];

  if (productionId) {
    inventory = inventory.filter(
      (item) => Number(item.productionId ?? 0) === Number(productionId),
    );
  }

  if (clientName) {
    const normalized = clientName.toLowerCase();
    inventory = inventory.filter((item) =>
      String(item.clientName ?? '').toLowerCase().includes(normalized),
    );
  }

  if (beerName) {
    const normalizedBeer = beerName.toLowerCase();
    inventory = inventory.filter((item) =>
      String(item.beerName ?? '').toLowerCase().includes(normalizedBeer),
    );
  }

  inventory.sort((a, b) => {
    const dateA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
    const dateB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
    return dateB - dateA;
  });

  return inventory;
}

}
