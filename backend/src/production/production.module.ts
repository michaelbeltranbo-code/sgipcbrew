import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Production } from './production.entity';
import { ProductionMaterial } from './production-material.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';
import { ProductionService } from './production.service';
import { ProductionController } from './production.controller';
import { ProductionMalt } from './production-malt.entity';
import { ProductionHop } from './production-hop.entity';
import { ProductionAdjunct } from './production-adjunct.entity';
import { Client } from '../clients/client.entity';
import { Fermenter } from '../fermenters/fermenter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Production,
      ProductionMaterial,
      RawMaterial,
      ProductionMalt,
      ProductionHop,
      ProductionAdjunct,
      Client,
      Fermenter,
    ]),
  ],
  controllers: [ProductionController],
  providers: [ProductionService],
  exports: [ProductionService],
})
export class ProductionModule {}