import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fermenter } from './fermenter.entity';
import { FermenterStatusHistory } from './fermenter-status-history.entity';
import { Transfer } from '../transfers/transfer.entity';
import { Production } from '../production/production.entity';
import { FermentersService } from './fermenters.service';
import { FermentersController } from './fermenters.controller';
import { FermenterReading } from './fermentation-reading.entity';
import { FermentationEvent } from './fermentation-event.entity';
import { ColdRoomKeg } from './cold-room-keg.entity';
import { BottlingOrder } from './bottling-order.entity';
import { ColdRoomPackagedStock } from './cold-room-packaged-stock.entity';
import { ColdRoomOutput } from './cold-room-output.entity';
import { ColdRoomOutputItem } from './cold-room-output-item.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Fermenter,
      FermenterStatusHistory,
      Transfer,
      Production,
     FermenterReading,
      FermentationEvent,
      ColdRoomKeg,
      BottlingOrder,
      ColdRoomPackagedStock,
     ColdRoomOutput,
     ColdRoomOutputItem,
      
    ]),
  ],
  controllers: [FermentersController],
  providers: [FermentersService],
  exports: [FermentersService],
})
export class FermentersModule {}