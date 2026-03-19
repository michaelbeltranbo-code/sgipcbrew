import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Production } from '../production/production.entity';
import { Transfer } from '../transfers/transfer.entity';
import { FermenterReading } from '../fermenters/fermentation-reading.entity';
import { BbtTransfer } from '../bbts/bbt-transfer.entity';
import { ColdRoomKeg } from '../fermenters/cold-room-keg.entity';
import { BottlingOrder } from '../fermenters/bottling-order.entity';
import { BbtMovement } from '../bbts/bbt-movement.entity';
import { BbtStatusHistory } from '../bbts/bbt-status-history.entity';
import { Fermenter } from '../fermenters/fermenter.entity';
import { Bbt } from '../bbts/bbt.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Production,
      Transfer,
      FermenterReading,
      BbtTransfer,
      ColdRoomKeg,
      BottlingOrder,
      BbtMovement,
      BbtStatusHistory,
      Fermenter,
      Bbt,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}