import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Production } from '../production/production.entity';
import { Transfer } from '../transfers/transfer.entity';
import { FermenterReading } from '../fermenters/fermentation-reading.entity';
import { BbtTransfer } from '../bbts/bbt-transfer.entity';
import { ColdRoomKeg } from '../fermenters/cold-room-keg.entity';
import { BottlingOrder } from '../fermenters/bottling-order.entity';
import { Fermenter } from '../fermenters/fermenter.entity';
import { Bbt } from '../bbts/bbt.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Production)
    private readonly productionRepo: Repository<Production>,

    @InjectRepository(Transfer)
    private readonly transferRepo: Repository<Transfer>,

    @InjectRepository(FermenterReading)
    private readonly readingRepo: Repository<FermenterReading>,

    @InjectRepository(BbtTransfer)
    private readonly bbtTransferRepo: Repository<BbtTransfer>,

    @InjectRepository(ColdRoomKeg)
    private readonly coldRoomKegRepo: Repository<ColdRoomKeg>,

    @InjectRepository(BottlingOrder)
    private readonly bottlingOrderRepo: Repository<BottlingOrder>,

    @InjectRepository(Fermenter)
    private readonly fermenterRepo: Repository<Fermenter>,

    @InjectRepository(Bbt)
    private readonly bbtRepo: Repository<Bbt>,
  ) {}

  async list(productionId?: number, clientName?: string, beerName?: string) {
    const where: any = {};

    if (productionId) where.id = productionId;
    if (beerName) where.beerName = ILike(`%${beerName}%`);
    if (clientName) where.client = { name: ILike(`%${clientName}%`) };

    const productions = await this.productionRepo.find({
      where,
      relations: ['client'],
      order: { id: 'DESC' },
    });

    return productions.map((p) => ({
      id: p.id,
      beerName: p.beerName,
      clientName: p.client?.name ?? null,
      producedAt: p.producedAt ?? p.startedAt ?? null,
      status: p.status ?? null,
    }));
  }

  async getOne(id: number) {
    const production = await this.productionRepo.findOne({
      where: { id },
      relations: [
        'client',
        'materials',
        'materials.rawMaterial',
        'malts',
        'malts.rawMaterial',
        'hops',
        'hops.rawMaterial',
        'adjuncts',
        'adjuncts.rawMaterial',
        'plannedFermenter',
        'actualFermenter',
      ],
    });

    if (!production) {
      throw new NotFoundException('Producción no encontrada');
    }

    const readings = await this.readingRepo.find({
      where: { production: { id } } as any,
      order: { id: 'ASC' },
    });

    const transfers = await this.transferRepo.find({
      where: { production: { id } } as any,
      order: { id: 'ASC' },
    });

    const bbtTransfers = await this.bbtTransferRepo.find({
      where: { production: { id } } as any,
      order: { id: 'ASC' },
    });

    const coldRoomKegs = await this.coldRoomKegRepo.find({
      where: { productionId: id },
      order: { id: 'ASC' },
    });

    const bottlingOrders = await this.bottlingOrderRepo.find({
      where: { productionId: id },
      order: { id: 'ASC' },
    });

    const currentFermenter = await this.fermenterRepo.findOne({
      where: { currentProductionId: id } as any,
      order: { id: 'ASC' },
    });

    const currentBbts = await this.bbtRepo.find({
      where: { currentProductionId: id } as any,
      order: { id: 'ASC' },
    });

    const materiasPrimas = {
      malts: (production.malts ?? []).map((m) => ({
        id: m.id,
        nombre: m.rawMaterial?.name ?? '-',
        lote: m.lot ?? m.rawMaterial?.lot ?? '-',
        cantidadKg: Number(m.quantityKg ?? 0),
        proveedor: m.rawMaterial?.supplier ?? '-',
      })),
      hops: (production.hops ?? []).map((h) => ({
        id: h.id,
        nombre: h.rawMaterial?.name ?? '-',
        cantidadGramos: Number(h.quantityGrams ?? 0),
        minutoHervor: h.boilMinute ?? null,
        lote: h.rawMaterial?.lot ?? '-',
        proveedor: h.rawMaterial?.supplier ?? '-',
      })),
      adjuncts: (production.adjuncts ?? []).map((a) => ({
        id: a.id,
        nombre: a.rawMaterial?.name ?? '-',
        cantidadKg: Number(a.quantityKg ?? 0),
        momentoAdicion: a.additionMoment ?? '-',
        notas: a.notes ?? '-',
        lote: a.rawMaterial?.lot ?? '-',
        proveedor: a.rawMaterial?.supplier ?? '-',
      })),
      otros: (production.materials ?? []).map((m) => ({
        id: m.id,
        nombre: m.rawMaterial?.name ?? '-',
        tipo: m.rawMaterial?.type ?? '-',
        cantidadUsada: Number(m.quantityUsed ?? 0),
        unidad: m.rawMaterial?.unit ?? '-',
        lote: m.rawMaterial?.lot ?? '-',
        proveedor: m.rawMaterial?.supplier ?? '-',
      })),
    };

    const fermentacion = {
      resumen: {
        fechaInicio: production.fermentationStartedAt ?? null,
        dryHopAplicado: production.dryHopApplied ?? false,
        descripcionDryHop: production.dryHopDescription ?? '-',
        purgas: production.purgesCount ?? 0,
        pesoPurgaKg: Number(production.purgeWeightKg ?? 0),
        notas: production.fermentationNotes ?? '-',
      },
      lecturas: readings.map((r) => ({
        id: r.id,
        ph: r.ph,
        density: r.density,
        temperature: r.temperature,
        purges: r.purges,
        purgeUnit: r.purgeUnit,
        dryHop: r.dryHop,
        additions: r.additions,
        hasClarifier: r.hasClarifier,
        isCarbonated: r.isCarbonated,
        note: r.note,
        recordedAt: r.recordedAt ?? r.createdAt ?? null,
        recordedByName: r.recordedByName ?? null,
      })),
    };

    const finalizedOrders = bottlingOrders.filter(
      (o) => o.status === 'FINALIZADA',
    );

    const botellasProductoTerminado = {
      registros: finalizedOrders.map((o) => ({
        ordenId: o.id,
        fuente: o.sourceType,
        cerveza: o.beerName,
        cliente: o.clientName,
        unidades335: Number(o.units330 ?? 0),
        unidades269: Number(o.units269 ?? 0),
        litros335: Number(o.litersFrom330 ?? 0),
        litros269: Number(o.litersFrom269 ?? 0),
        merma: Number(o.processLossLiters ?? 0),
        totalProcesado: Number(o.totalProcessedLiters ?? 0),
        fechaFinalizacion: o.finishedAt ?? null,
      })),
      totalUnidades335: finalizedOrders.reduce(
        (acc, o) => acc + Number(o.units330 ?? 0),
        0,
      ),
      totalUnidades269: finalizedOrders.reduce(
        (acc, o) => acc + Number(o.units269 ?? 0),
        0,
      ),
      totalLitrosBotella: finalizedOrders.reduce(
        (acc, o) =>
          acc + Number(o.litersFrom330 ?? 0) + Number(o.litersFrom269 ?? 0),
        0,
      ),
    };

    const barrilesCuartoFrio = {
      registros: coldRoomKegs.map((k) => ({
        id: k.id,
        cerveza: k.beerName,
        cliente: k.clientName,
        fuente: k.sourceType,
        barriles60: Number(k.kegs60 ?? 0),
        barriles50: Number(k.kegs50 ?? 0),
        barriles30: Number(k.kegs30 ?? 0),
        litrosTotales: Number(k.totalKegLiters ?? 0),
        merma: Number(k.lossLiters ?? 0),
        fechaRegistro: k.registeredAt ?? k.storedAt ?? null,
      })),
      total60: coldRoomKegs.reduce((acc, k) => acc + Number(k.kegs60 ?? 0), 0),
      total50: coldRoomKegs.reduce((acc, k) => acc + Number(k.kegs50 ?? 0), 0),
      total30: coldRoomKegs.reduce((acc, k) => acc + Number(k.kegs30 ?? 0), 0),
      totalLitros: coldRoomKegs.reduce(
        (acc, k) => acc + Number(k.totalKegLiters ?? 0),
        0,
      ),
    };

    const existenciasActuales = {
      enFermentador: currentFermenter
        ? {
            fermentador: currentFermenter.name,
            estado: currentFermenter.status,
            litros: Number(currentFermenter.currentVolumeLiters ?? 0),
          }
        : null,
      enBbt: currentBbts.map((b) => ({
        bbt: b.name,
        estado: b.status,
        proceso: b.processType,
        litros: Number(b.currentVolumeLiters ?? 0),
      })),
    };

    return {
      datosGenerales: {
        id: production.id,
        cerveza: production.beerName,
        cliente: production.client?.name ?? '-',
        responsable: production.responsibleName ?? '-',
        estado: production.status ?? '-',
        fechaProduccion: production.producedAt ?? production.startedAt ?? null,
        litrosProduccion: Number(production.volumeLiters ?? 0),
        litrosPostHervor: Number(production.postBoilLiters ?? 0),
        phInicial: production.initialPh ?? null,
        densidadInicial: production.initialDensity ?? null,
      },
      materiasPrimas,
      fermentacion,
      transferencias: transfers,
      bbtTransfers,
      existenciasActuales,
      barrilesCuartoFrio,
      botellasProductoTerminado,
    };
  }
}