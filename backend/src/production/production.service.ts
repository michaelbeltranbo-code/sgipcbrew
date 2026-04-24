import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, MoreThan, Repository } from 'typeorm';
import { RawMaterial } from '../raw-materials/raw-material.entity';
import { Production } from './production.entity';
import { ProductionMaterial } from './production-material.entity';
import { Client } from '../clients/client.entity';
import { ProductionMalt } from './production-malt.entity';
import { ProductionHop } from './production-hop.entity';
import { CreateBrewBatchDto } from './dto/create-brew-batch.dto';
import { ProductionAdjunct } from './production-adjunct.entity';
import { Fermenter } from '../fermenters/fermenter.entity';
import { ProductionStatus } from './production-status.enum';


type ProductionFilters = {
  clientId?: number;
  fromDate?: string;
  toDate?: string;
};

@Injectable()
export class ProductionService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Production)
    private readonly productionRepo: Repository<Production>,

    @InjectRepository(ProductionMaterial)
    private readonly productionMaterialRepo: Repository<ProductionMaterial>,

    @InjectRepository(RawMaterial)
    private readonly rawMaterialRepo: Repository<RawMaterial>,

    @InjectRepository(ProductionAdjunct)
    private readonly productionAdjunctRepo: Repository<ProductionAdjunct>,

    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,

    @InjectRepository(Fermenter)
    private readonly fermenterRepo: Repository<Fermenter>,
  ) {}

  async createProduction(input: CreateBrewBatchDto, user: any) {
    if (input.initialPh < 3.5 || input.initialPh > 5.8) {
      throw new BadRequestException('pH inicial debe estar entre 3.5 y 5.8');
    }

    if (input.initialDensity < 1.03 || input.initialDensity > 1.08) {
      throw new BadRequestException(
        'Densidad inicial debe estar entre 1.030 y 1.080',
      );
    }

    if (input.postBoilLiters > input.boilLiters) {
      throw new BadRequestException(
        'Litros finales no pueden ser mayores que litros en hervor',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const client = await manager.findOne(Client, {
        where: { id: input.clientId },
      });

      if (!client) {
        throw new NotFoundException(`Cliente no encontrado (id=${input.clientId})`);
      }

      let plannedFermenter: Fermenter | null = null;

      if (input.plannedFermenterId) {
        plannedFermenter = await manager.findOne(Fermenter, {
          where: { id: input.plannedFermenterId },
        });

        if (!plannedFermenter) {
          throw new NotFoundException(
            `Fermentador no encontrado (id=${input.plannedFermenterId})`,
          );
        }
      }

      const production = manager.create(Production, {
          beerName: input.beerName,
          client,
          kitchenStatus: input.kitchenStatus,
          initialPh: input.initialPh,
          initialDensity: input.initialDensity,
          boilLiters: input.boilLiters,
          postBoilLiters: input.postBoilLiters,
          producedAt: input.producedAt
            ? input.producedAt.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
          volumeLiters: input.postBoilLiters,
          plannedFermenter,
          actualFermenter: null,
          status: plannedFermenter
            ? ProductionStatus.BREWED
            : ProductionStatus.WAITING_FOR_FERMENTER,
          responsibleUserId: user.userId,
          responsibleName: user.fullName,
        });

      await manager.save(Production, production);

      for (const m of input.malts ?? []) {
        const rm = await manager.findOne(RawMaterial, {
          where: { id: m.rawMaterialId },
        });

        if (!rm) {
          throw new NotFoundException(
            `Materia prima no encontrada (id=${m.rawMaterialId})`,
          );
        }

        if (rm.type !== 'malta') {
          throw new BadRequestException(`Materia prima id=${rm.id} no es malta`);
        }

        const availableKg = Number(rm.quantity);
        const requiredKg = Number(m.quantityKg);

        if (Number.isNaN(availableKg) || Number.isNaN(requiredKg)) {
          throw new BadRequestException(`Cantidad inválida en malta ${rm.name}`);
        }

        if (requiredKg <= 0) {
          throw new BadRequestException('La cantidad de malta debe ser mayor a 0');
        }

        if (requiredKg > availableKg) {
          throw new BadRequestException(
            `Stock insuficiente de malta "${rm.name}". Disponible=${availableKg}kg, requerido=${requiredKg}kg`,
          );
        }

        rm.quantity = Number((availableKg - requiredKg).toFixed(3));
        await manager.save(RawMaterial, rm);

        const maltUse = manager.create(ProductionMalt, {
          production,
          rawMaterial: rm,
          quantityKg: requiredKg,
          lot: m.lot ?? null,
        });

        await manager.save(ProductionMalt, maltUse);
      }

      for (const h of input.hops ?? []) {
        const rm = await manager.findOne(RawMaterial, {
          where: { id: h.rawMaterialId },
        });

        if (!rm) {
          throw new NotFoundException(
            `Materia prima no encontrada (id=${h.rawMaterialId})`,
          );
        }

        if (rm.type !== 'lupulo') {
          throw new BadRequestException(`Materia prima id=${rm.id} no es lúpulo`);
        }

        const unit = String(rm.unit).toLowerCase().trim();
        const qty = Number(rm.quantity);
        const requiredGrams = Number(h.quantityGrams);

        let availableGrams = 0;

        if (unit === 'kg') availableGrams = qty * 1000;
        else if (unit === 'g') availableGrams = qty;
        else {
          throw new BadRequestException(
            `Unidad no soportada para lúpulo "${rm.name}": ${rm.unit}`,
          );
        }

        if (Number.isNaN(requiredGrams) || requiredGrams <= 0) {
          throw new BadRequestException(`Cantidad inválida de lúpulo para ${rm.name}`);
        }

        if (requiredGrams > availableGrams) {
          throw new BadRequestException(
            `Stock insuficiente de lúpulo "${rm.name}". Disponible=${availableGrams}g, requerido=${requiredGrams}g`,
          );
        }

        const newAvailableGrams = availableGrams - requiredGrams;

        rm.quantity =
          unit === 'kg'
            ? Number((newAvailableGrams / 1000).toFixed(3))
            : Number(newAvailableGrams.toFixed(3));

        await manager.save(RawMaterial, rm);

        const hopUse = manager.create(ProductionHop, {
          production,
          rawMaterial: rm,
          quantityGrams: requiredGrams,
          boilMinute: h.boilMinute ?? null,
        });

        await manager.save(ProductionHop, hopUse);
      }

      for (const a of input.adjuncts ?? []) {
        const rm = await manager.findOne(RawMaterial, {
          where: { id: a.rawMaterialId },
        });

        if (!rm) {
          throw new NotFoundException(
            `Adjunto no encontrado (id=${a.rawMaterialId})`,
          );
        }

        if (rm.type !== 'adjuntos') {
          throw new BadRequestException(`Materia prima id=${rm.id} no es un adjunto`);
        }

        const unit = String(rm.unit).toLowerCase().trim();
        const qty = Number(rm.quantity);
        const requiredKg = Number(a.quantityKg);

        if (Number.isNaN(requiredKg) || requiredKg <= 0) {
          throw new BadRequestException(`Cantidad inválida de adjunto para ${rm.name}`);
        }

        let availableKg = 0;

        if (unit === 'kg') availableKg = qty;
        else if (unit === 'g') availableKg = qty / 1000;
        else {
          throw new BadRequestException(
            `Unidad no soportada para adjunto "${rm.name}": ${rm.unit}`,
          );
        }

        if (requiredKg > availableKg) {
          throw new BadRequestException(
            `Stock insuficiente de adjunto "${rm.name}". Disponible=${availableKg}kg, requerido=${requiredKg}kg`,
          );
        }

        const newAvailableKg = availableKg - requiredKg;

        rm.quantity =
          unit === 'kg'
            ? Number(newAvailableKg.toFixed(3))
            : Number((newAvailableKg * 1000).toFixed(3));

        await manager.save(RawMaterial, rm);

        const adjunctUse = manager.create(ProductionAdjunct, {
          production,
          rawMaterial: rm,
          quantityKg: requiredKg,
          additionMoment: a.additionMoment ?? null,
          notes: a.notes ?? null,
        });

        await manager.save(ProductionAdjunct, adjunctUse);
      }

      const full = await manager.findOne(Production, {
        where: { id: production.id },
        relations: [
          'client',
          'plannedFermenter',
          'actualFermenter',
          'malts',
          'malts.rawMaterial',
          'hops',
          'hops.rawMaterial',
          'adjuncts',
          'adjuncts.rawMaterial',
        ],
      });

      return full;
    });
  }

  async findAllWithFilters(filters: ProductionFilters) {
    const qb = this.productionRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.client', 'client')
      .leftJoinAndSelect('p.plannedFermenter', 'plannedFermenter')
      .leftJoinAndSelect('p.actualFermenter', 'actualFermenter')
      .leftJoinAndSelect('p.malts', 'malts')
      .leftJoinAndSelect('malts.rawMaterial', 'maltRawMaterial')
      .leftJoinAndSelect('p.hops', 'hops')
      .leftJoinAndSelect('hops.rawMaterial', 'hopRawMaterial')
      .leftJoinAndSelect('p.adjuncts', 'adjuncts')
      .leftJoinAndSelect('adjuncts.rawMaterial', 'adjunctRawMaterial')
      .orderBy('p.producedAt', 'DESC')
      .addOrderBy('p.id', 'DESC');

    if (filters.clientId) {
      qb.andWhere('client.id = :clientId', { clientId: filters.clientId });
    }

    if (filters.fromDate) {
      qb.andWhere('p.producedAt >= :fromDate', { fromDate: filters.fromDate });
    }

    if (filters.toDate) {
      qb.andWhere('p.producedAt <= :toDate', { toDate: filters.toDate });
    }

    return qb.getMany();
  }

  async getProduction(id: number) {
    const production = await this.productionRepo.findOne({
      where: { id },
      relations: [
        'client',
        'plannedFermenter',
        'actualFermenter',
        'malts',
        'malts.rawMaterial',
        'hops',
        'hops.rawMaterial',
        'adjuncts',
        'adjuncts.rawMaterial',
      ],
    });

    if (!production) {
      throw new NotFoundException(`Producción no encontrada (id=${id})`);
    }

    return production;
  }

  async listRawMaterials() {
    return this.rawMaterialRepo.find({
      where: { quantity: MoreThan(0) },
      order: { name: 'ASC' },
      relations: {
        client: true,
      },
    });
  }
}