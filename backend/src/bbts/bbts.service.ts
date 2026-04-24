import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In,DataSource, IsNull } from 'typeorm';
import { Bbt } from './bbt.entity';
import { BbtTransfer } from './bbt-transfer.entity';
import { Fermenter } from '../fermenters/fermenter.entity';
import { Production } from '../production/production.entity';
import { Transfer } from '../transfers/transfer.entity';
import { CreateBbtTransferDto } from './dto/create-bbt-transfer.dto';
import { UpdateBbtStatusDto } from './dto/update-bbt-status.dto';
import { BbtStatus } from './bbt-status.enum';
import { BbtProcessType } from './bbt-process-type.enum';
import { FermenterStatus } from '../fermenters/fermenter-status.enum';
import { BbtStatusHistory } from './bbt-status-history.entity';

import { BottlingOrder } from '../fermenters/bottling-order.entity';
import { ColdRoomKeg } from '../fermenters/cold-room-keg.entity';
import { BbtMovement } from './bbt-movement.entity';

import { CreateBbtBottlingOrderDto } from './dto/create-bbt-bottling-order.dto';
import { CreateBbtKegDownDto } from './dto/create-bbt-keg-down.dto';

import { StartBottlingDto } from '../fermenters/dto/start-bottling.dto';
import { FinishBottlingDto } from '../fermenters/dto/finish-bottling.dto';











@Injectable()
export class BbtsService {
  constructor(
    private readonly dataSource: DataSource,


  @InjectRepository(Bbt)
  private readonly bbtRepo: Repository<Bbt>,

  @InjectRepository(BbtTransfer)
  private readonly bbtTransferRepo: Repository<BbtTransfer>,

  @InjectRepository(Fermenter)
  private readonly fermenterRepo: Repository<Fermenter>,

  @InjectRepository(Production)
  private readonly productionRepo: Repository<Production>,

  @InjectRepository(Transfer)
  private readonly transferSessionRepo: Repository<Transfer>,

  @InjectRepository(BbtStatusHistory)
  private readonly bbtStatusHistoryRepo: Repository<BbtStatusHistory>,

  @InjectRepository(BottlingOrder)
  private readonly bottlingOrderRepo: Repository<BottlingOrder>,

  @InjectRepository(ColdRoomKeg)
  private readonly coldRoomKegRepo: Repository<ColdRoomKeg>,

  @InjectRepository(BbtMovement)
  private readonly bbtMovementRepo: Repository<BbtMovement>,




) {}




  async findAll() {
    return this.bbtRepo.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const bbt = await this.bbtRepo.findOne({
      where: { id },
      relations: {
        transfers: {
          production: {
            client: true,
          },
        },
        statusHistory: true,
        movements: true,
      },
    });

    if (!bbt) {
      throw new NotFoundException('BBT no encontrado');
    }

    return bbt;
  }

  async getAvailableFermentersForTransfer() {
  const fermenters = await this.fermenterRepo.find({
    where: {
      status: FermenterStatus.TRANSFERRING,
    },
    relations: ['currentProduction', 'currentProduction.client'],
    order: { id: 'ASC' },
  });

  return fermenters
    .filter(
      (f: any) =>
        !!f.currentProduction && Number(f.currentVolumeLiters ?? 0) > 0,
    )
    .map((f: any) => ({
      fermenterId: f.id,
      fermenterName: f.name,
      productionId: f.currentProduction?.id ?? null,
      beerName: f.currentProduction?.beerName ?? null,
      clientId: f.currentProduction?.client?.id ?? null,
      clientName: f.currentProduction?.client?.name ?? null,
      volumeLiters: Number(f.currentVolumeLiters ?? 0),
    }));
  }

  async getAvailableBbts() {
    return this.bbtRepo.find({
      where: {
        status: In([BbtStatus.DISPONIBLE, BbtStatus.SANITIZADO]),
      },
      order: { id: 'ASC' },
    });
  }

  async transferToBbt(dto: CreateBbtTransferDto, user: any) {
  const fermenter = await this.fermenterRepo.findOne({
    where: { id: dto.fermenterId },
    relations: ['currentProduction', 'currentProduction.client'],
  });

  if (!fermenter) {
    throw new NotFoundException('Fermentador no encontrado');
  }

  if (fermenter.status !== FermenterStatus.TRANSFERRING) {
    throw new BadRequestException(
      'El fermentador no está en estado TRASIEGO',
    );
  }

  if (!fermenter.currentProduction) {
    throw new BadRequestException(
      'El fermentador no tiene una producción actual asociada',
    );
  }

  const bbt = await this.bbtRepo.findOne({
    where: { id: dto.bbtId },
  });

  if (!bbt) {
    throw new NotFoundException('BBT no encontrado');
  }

  const litersTransferred = Number(dto.litersTransferred);
  const lossLiters = Number(dto.lossLiters);
  const fermenterVolume = Number(fermenter.currentVolumeLiters ?? 0);
  const currentBbtVolume = Number(bbt.currentVolumeLiters ?? 0);
  const bbtCapacity = Number(bbt.capacityLiters ?? 0);

  if (litersTransferred <= 0) {
    throw new BadRequestException(
      'Los litros transferidos deben ser mayores a 0',
    );
  }

  if (lossLiters < 0) {
    throw new BadRequestException('La merma no puede ser negativa');
  }

  if (lossLiters > litersTransferred) {
    throw new BadRequestException(
      'La merma no puede ser mayor que los litros transferidos',
    );
  }

  if (litersTransferred > fermenterVolume) {
    throw new BadRequestException(
      'No puedes transferir más litros de los que tiene el fermentador',
    );
  }

  const litersReceivedInBbt = litersTransferred - lossLiters;

  if (litersReceivedInBbt <= 0) {
    throw new BadRequestException(
      'Los litros netos recibidos en el BBT deben ser mayores a 0',
    );
  }

  const bbtIsEmpty =
    !bbt.currentProductionId &&
    currentBbtVolume === 0 &&
    [BbtStatus.DISPONIBLE, BbtStatus.SANITIZADO].includes(bbt.status);

  const bbtHasSameProduction =
    !!bbt.currentProductionId &&
    bbt.currentProductionId === fermenter.currentProduction.id;

  if (!bbtIsEmpty && !bbtHasSameProduction) {
    throw new BadRequestException(
      'El BBT ya está ocupado con otra cerveza o no está listo para recibir',
    );
  }

  if (currentBbtVolume + litersReceivedInBbt > bbtCapacity) {
    throw new BadRequestException(
      'Los litros netos exceden la capacidad disponible del BBT',
    );
  }

  const transfer = this.bbtTransferRepo.create({
    bbt,
    fermenter,
    production: fermenter.currentProduction,
    processType: dto.processType,
    litersTransferred,
    lossLiters,
    litersReceivedInBbt,
    notes: dto.notes ?? null,
    createdBy: user?.fullName ?? user?.username ?? user?.email ?? 'sistema',
  });

  const savedTransfer = await this.bbtTransferRepo.save(transfer);

  await this.bbtRepo.save({
    id: bbt.id,
    currentBeerName: fermenter.currentProduction.beerName ?? null,
    currentClientName: fermenter.currentProduction.client?.name ?? null,
    currentProductionId: fermenter.currentProduction.id ?? null,
    sourceFermenterId: fermenter.id,
    currentVolumeLiters: currentBbtVolume + litersReceivedInBbt,
    processType: dto.processType,
    occupiedAt: bbt.occupiedAt ?? new Date(),
    availableAt: null,
    status:
      dto.processType === BbtProcessType.CLARIFICAR
        ? BbtStatus.EN_MADURACION
        : BbtStatus.EN_CARBONATACION,
  });

  const nextStatus =
  dto.processType === BbtProcessType.CLARIFICAR
    ? BbtStatus.EN_MADURACION
    : BbtStatus.EN_CARBONATACION;

if (bbt.status !== nextStatus) {
  await this.bbtStatusHistoryRepo.save(
    this.bbtStatusHistoryRepo.create({
      bbt: { id: bbt.id } as Bbt,
      bbtId: bbt.id,
      fromStatus: bbt.status,
      toStatus: nextStatus,
      changedBy: user?.fullName ?? user?.username ?? user?.email ?? 'sistema',
      note: `Ingreso desde fermentador ${fermenter.id}`,
    }),
  );
}

await this.createMovement({
  bbt: { id: bbt.id } as Bbt,
  bbtId: bbt.id,
  movementType: 'TRANSFER_IN',
  litersIn: litersReceivedInBbt,
  lossLiters,
  resultingVolumeLiters: Number(
    (currentBbtVolume + litersReceivedInBbt).toFixed(2),
  ),
  productionId: fermenter.currentProduction.id,
  sourceFermenterId: fermenter.id,
  changedBy: user?.fullName ?? user?.username ?? user?.email ?? 'sistema',
  note: dto.notes ?? null,
});

  const remainingLiters = fermenterVolume - litersTransferred;

  await this.fermenterRepo.save({
    id: fermenter.id,
    currentVolumeLiters: remainingLiters,
  });

  const openTransfer = await this.transferSessionRepo.findOne({
    where: {
      fermenter: { id: fermenter.id },
      production: { id: fermenter.currentProduction.id },
      finishedAt: IsNull(),
    },
    order: { id: 'DESC' },
  });

  if (openTransfer) {
    await this.transferSessionRepo.save({
      id: openTransfer.id,
      litersTransferred:
        Number(openTransfer.litersTransferred ?? 0) + litersTransferred,
    });
  }

  return {
    message: 'Transferencia al BBT registrada correctamente',
    transferId: savedTransfer.id,
    bbtId: bbt.id,
    bbtStatus:
      dto.processType === BbtProcessType.CLARIFICAR
        ? BbtStatus.EN_MADURACION
        : BbtStatus.EN_CARBONATACION,
    litersReceivedInBbt,
    fermenterRemainingLiters: remainingLiters,
  };
}
  async updateStatus(id: number, dto: UpdateBbtStatusDto, user: any) {
  const bbt = await this.bbtRepo.findOne({
    where: { id },
  });

  if (!bbt) {
    throw new NotFoundException('BBT no encontrado');
  }

  const previousStatus = bbt.status;
  const nextStatus = dto.status as BbtStatus;
  const currentVolume = Number(bbt.currentVolumeLiters ?? 0);

  if (previousStatus === nextStatus) {
    return bbt;
  }

  if (
    [BbtStatus.SUCIO, BbtStatus.LIMPIO, BbtStatus.SANITIZADO, BbtStatus.DISPONIBLE].includes(nextStatus) &&
    currentVolume > 0
  ) {
    throw new BadRequestException(
      'No puedes poner el BBT en un estado de tanque vacío mientras aún tiene litros',
    );
  }

  bbt.status = nextStatus;

  if (nextStatus === BbtStatus.DISPONIBLE) {
    bbt.availableAt = new Date();
    bbt.currentBeerName = null;
    bbt.currentClientName = null;
    bbt.currentProductionId = null;
    bbt.sourceFermenterId = null;
    bbt.currentVolumeLiters = 0;
    bbt.processType = null;
    bbt.occupiedAt = null;
  }

  if (
    nextStatus === BbtStatus.EN_MADURACION ||
    nextStatus === BbtStatus.EN_CARBONATACION ||
    nextStatus === BbtStatus.LISTO_PARA_EMPAQUE
  ) {
    bbt.availableAt = null;
  }

  const savedBbt = await this.bbtRepo.save(bbt);

  const history = this.bbtStatusHistoryRepo.create({
    bbt: savedBbt,
    bbtId: savedBbt.id,
    fromStatus: previousStatus,
    toStatus: nextStatus,
    changedBy: user?.fullName ?? user?.username ?? user?.email ?? 'sistema',
    note: null,
  });

  await this.bbtStatusHistoryRepo.save(history);

  await this.createMovement({
    bbt: { id: savedBbt.id } as Bbt,
    bbtId: savedBbt.id,
    movementType: 'STATUS_CHANGE',
    resultingVolumeLiters: Number(savedBbt.currentVolumeLiters ?? 0),
    productionId: savedBbt.currentProductionId ?? null,
    sourceFermenterId: savedBbt.sourceFermenterId ?? null,
    changedBy: user?.fullName ?? user?.username ?? user?.email ?? 'sistema',
    note: `Cambio de ${previousStatus} a ${nextStatus}`,
  });

  return savedBbt;
}

private async createMovement(payload: Partial<BbtMovement>) {
  const movement = this.bbtMovementRepo.create({
    litersIn: 0,
    litersOut: 0,
    lossLiters: 0,
    resultingVolumeLiters: 0,
    productionId: null,
    sourceFermenterId: null,
    bottlingOrderId: null,
    coldRoomKegId: null,
    changedBy: null,
    note: null,
    ...payload,
  });

  return this.bbtMovementRepo.save(movement);
}

private async markBbtDirtyIfEmpty(bbtId: number, user: any, note?: string) {
  const bbt = await this.bbtRepo.findOne({ where: { id: bbtId } });
  if (!bbt) return;

  const volume = Number(bbt.currentVolumeLiters ?? 0);
  if (volume > 0) return;

  const previousStatus = bbt.status;

  await this.bbtRepo.save({
    id: bbt.id,
    status: BbtStatus.SUCIO,
    currentVolumeLiters: 0,
    currentBeerName: null,
    currentClientName: null,
    currentProductionId: null,
    sourceFermenterId: null,
    processType: null,
    occupiedAt: null,
    availableAt: null,
  });

  if (previousStatus !== BbtStatus.SUCIO) {
    await this.bbtStatusHistoryRepo.save(
      this.bbtStatusHistoryRepo.create({
        bbt: { id: bbt.id } as Bbt,
        bbtId: bbt.id,
        fromStatus: previousStatus,
        toStatus: BbtStatus.SUCIO,
        changedBy: user?.fullName ?? user?.username ?? user?.email ?? 'sistema',
        note: note ?? 'BBT marcado automáticamente como SUCIO por quedar en 0 L',
      }),
    );
  }

  
}
async sendToBottlingFromBbt(id: number, dto: CreateBbtBottlingOrderDto, user: any) {
  const bbt = await this.bbtRepo.findOne({ where: { id } });

  if (!bbt) throw new NotFoundException('BBT no encontrado');

  if (bbt.status !== BbtStatus.LISTO_PARA_EMPAQUE) {
    throw new BadRequestException('El BBT no está listo para empaque');
  }

  const availableLiters = Number(bbt.currentVolumeLiters ?? 0);

  if (availableLiters <= 0) {
    throw new BadRequestException('No hay litros disponibles en el BBT');
  }

  const existingOpenOrder = await this.bottlingOrderRepo.findOne({
    where: {
      sourceType: 'BBT',
      sourceBbtId: bbt.id,
      status: In(['PENDIENTE', 'EN_PROCESO']),
    },
    order: { id: 'DESC' },
  });

  if (existingOpenOrder) {
    throw new BadRequestException('Ya existe una orden abierta para este BBT');
  }

  const order = this.bottlingOrderRepo.create({
    transfer: null,
    transferId: null,
    fermenter: null,
    fermenterId: bbt.sourceFermenterId ?? null,
    production: null,
    productionId: bbt.currentProductionId ?? null,
    beerName: bbt.currentBeerName ?? 'Sin nombre',
    clientName: bbt.currentClientName ?? null,
    sourceType: 'BBT',
    sourceBbtId: bbt.id,
    sourceFermenterId: bbt.sourceFermenterId ?? null,
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

  const savedOrder = await this.bottlingOrderRepo.save(order);

  await this.createMovement({
    bbt: { id: bbt.id } as Bbt,
    bbtId: bbt.id,
    movementType: 'BOTTLING_ORDER_CREATED',
    resultingVolumeLiters: availableLiters,
    productionId: bbt.currentProductionId ?? null,
    sourceFermenterId: bbt.sourceFermenterId ?? null,
    bottlingOrderId: savedOrder.id,
    changedBy: user.fullName,
    note: dto.note ?? null,
  });

  return {
    message: 'Orden de embotellado desde BBT creada correctamente',
    orderId: savedOrder.id,
    availableLiters,
  };
}

async kegDownFromBbt(id: number, dto: CreateBbtKegDownDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const bbtRepo = manager.getRepository(Bbt);
    const kegRepo = manager.getRepository(ColdRoomKeg);
    const movementRepo = manager.getRepository(BbtMovement);

    const bbt = await bbtRepo.findOne({ where: { id } });

    if (!bbt) throw new NotFoundException('BBT no encontrado');

    if (bbt.status !== BbtStatus.LISTO_PARA_EMPAQUE) {
      throw new BadRequestException('El BBT no está listo para empaque');
    }

    const partialLiters = Number(dto.partialLiters ?? 0);
    const litersInKegs =
      Number(dto.kegs60 ?? 0) * 60 +
      Number(dto.kegs50 ?? 0) * 50 +
      Number(dto.kegs30 ?? 0) * 30 +
      partialLiters;

    const lossLiters = Number(dto.lossLiters ?? 0);
    const totalOutput = Number((litersInKegs + lossLiters).toFixed(2));
    const available = Number(bbt.currentVolumeLiters ?? 0);

    if (totalOutput <= 0) {
      throw new BadRequestException('Debes registrar al menos barriles, litros parciales o merma');
    }

    if (totalOutput > available) {
      throw new BadRequestException(
        `No hay litros suficientes en el BBT. Disponibles: ${available} L, solicitados: ${totalOutput} L`,
      );
    }

    const record = kegRepo.create({
      transfer: null,
      transferId: null,
      fermenter: null,
      fermenterId: bbt.sourceFermenterId ?? null,
      production: null,
      productionId: bbt.currentProductionId ?? null,
      beerName: bbt.currentBeerName ?? 'Sin nombre',
      clientName: bbt.currentClientName ?? null,
      sourceType: 'BBT',
      sourceBbtId: bbt.id,
      kegs60: Number(dto.kegs60 ?? 0),
      kegs50: Number(dto.kegs50 ?? 0),
      kegs30: Number(dto.kegs30 ?? 0),
      partialLiters,
      totalKegLiters: litersInKegs,
      lossLiters,
      note: dto.note ?? null,
      storedByUserId: user.userId,
      storedByName: user.fullName,
    });

    const savedRecord = await kegRepo.save(record);

    const resultingVolume = Number((available - totalOutput).toFixed(2));

    await bbtRepo.save({
      id: bbt.id,
      currentVolumeLiters: resultingVolume,
    });

    await movementRepo.save(
      movementRepo.create({
        bbt: { id: bbt.id } as Bbt,
        bbtId: bbt.id,
        movementType: 'KEG_FILL',
        litersOut: litersInKegs,
        lossLiters,
        resultingVolumeLiters: resultingVolume,
        productionId: bbt.currentProductionId ?? null,
        sourceFermenterId: bbt.sourceFermenterId ?? null,
        coldRoomKegId: savedRecord.id,
        changedBy: user.fullName,
        note: dto.note ?? null,
      }),
    );

    await this.markBbtDirtyIfEmpty(
      bbt.id,
      user,
      'BBT quedó vacío después de llenado de barriles',
    );

    return {
      message: 'Barriles registrados desde BBT correctamente',
      coldRoomKegId: savedRecord.id,
      resultingVolume,
    };
  });
}

async startBbtBottling(dto: StartBottlingDto, user: any) {
  const order = await this.bottlingOrderRepo.findOne({
    where: { id: dto.orderId, sourceType: 'BBT' as any },
  });

  if (!order) {
    throw new NotFoundException('Orden de embotellado BBT no encontrada');
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

  return this.bottlingOrderRepo.save(order);
}

async listBbtBottlingOrders() {
  return this.bottlingOrderRepo.find({
    where: { sourceType: 'BBT' as any },
    order: { id: 'DESC' },
  });
}

async finishBbtBottling(dto: FinishBottlingDto, user: any) {
  return this.dataSource.transaction(async (manager) => {
    const bottlingRepo = manager.getRepository(BottlingOrder);
    const bbtRepo = manager.getRepository(Bbt);
    const movementRepo = manager.getRepository(BbtMovement);

    const order = await bottlingRepo.findOne({ where: { id: dto.orderId } });

    if (!order) throw new NotFoundException('Orden de embotellado no encontrada');
    if (order.sourceType !== 'BBT') {
      throw new BadRequestException('La orden no pertenece a un BBT');
    }
    if (order.status !== 'EN_PROCESO') {
      throw new BadRequestException(`La orden no está en proceso. Estado actual: ${order.status}`);
    }

    const bbt = await bbtRepo.findOne({
      where: { id: Number(order.sourceBbtId) },
    });

    if (!bbt) throw new NotFoundException('BBT no encontrado');

    const units330 = Number(dto.units330 ?? 0);
    const units269 = Number(dto.units269 ?? 0);
    const lossLiters = Number(dto.lossLiters ?? 0);

    const litersFrom330 = Number((units330 * 0.35).toFixed(2));
    const litersFrom269 = Number((units269 * 0.269).toFixed(2));
    const totalPackagedLiters = Number((litersFrom330 + litersFrom269).toFixed(2));
    const totalProcessedLiters = Number((totalPackagedLiters + lossLiters).toFixed(2));

    if (totalProcessedLiters <= 0) {
      throw new BadRequestException('Debes registrar al menos botellas/latas o merma');
    }

    const availableLiters = Number(bbt.currentVolumeLiters ?? 0);

    if (totalProcessedLiters > availableLiters) {
      throw new BadRequestException('No hay suficientes litros en el BBT');
    }

    if (totalProcessedLiters > Number(order.remainingLiters ?? 0)) {
      throw new BadRequestException('El proceso excede los litros disponibles de esta orden');
    }

    const remainingAfterThisRun = Number(
      (Number(order.remainingLiters ?? 0) - totalProcessedLiters).toFixed(2),
    );
    const resultingVolume = Number((availableLiters - totalProcessedLiters).toFixed(2));

    await bbtRepo.save({
      id: bbt.id,
      currentVolumeLiters: resultingVolume,
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

    await movementRepo.save(
      movementRepo.create({
        bbt: { id: bbt.id } as Bbt,
        bbtId: bbt.id,
        movementType: 'BOTTLING_FINISHED',
        litersOut: totalPackagedLiters,
        lossLiters,
        resultingVolumeLiters: resultingVolume,
        productionId: bbt.currentProductionId ?? null,
        sourceFermenterId: bbt.sourceFermenterId ?? null,
        bottlingOrderId: order.id,
        changedBy: user.fullName,
        note: dto.note ?? null,
      }),
    );

    if (remainingAfterThisRun > 0) {
      const newPendingOrder = bottlingRepo.create({
        transfer: null,
        transferId: null,
        fermenter: null,
        fermenterId: order.fermenterId ?? null,
        production: null,
        productionId: order.productionId ?? null,
        beerName: order.beerName,
        clientName: order.clientName,
        sourceType: 'BBT',
        sourceBbtId: order.sourceBbtId,
        sourceFermenterId: order.sourceFermenterId,
        sourceColdRoomKegId: null,
        sourceKegSizeLiters: null,
        requestedLiters: remainingAfterThisRun,
        remainingLiters: remainingAfterThisRun,
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
        note: 'Orden automática por remanente de embotellado desde BBT',
        createdByUserId: user.userId,
        createdByName: user.fullName,
      });

      await bottlingRepo.save(newPendingOrder);
    }

    await this.markBbtDirtyIfEmpty(
      bbt.id,
      user,
      'BBT quedó vacío después de embotellado',
    );

    return {
      message: 'Embotellado desde BBT finalizado correctamente',
      totalPackagedLiters,
      totalProcessedLiters,
      remainingOrderLiters: remainingAfterThisRun,
      resultingVolume,
    };
  });
}
}