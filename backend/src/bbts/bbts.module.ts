import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bbt } from './bbt.entity';
import { BbtTransfer } from './bbt-transfer.entity';
import { BbtsService } from './bbts.service';
import { BbtsController } from './bbts.controller';
import { Fermenter } from '../fermenters/fermenter.entity';
import { Production } from '../production/production.entity';
import { Transfer } from '../transfers/transfer.entity';
import { BbtStatusHistory } from './bbt-status-history.entity';
import { BottlingOrder } from '../fermenters/bottling-order.entity';
import { ColdRoomKeg } from '../fermenters/cold-room-keg.entity';
import { BbtMovement } from './bbt-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Bbt,
      BbtTransfer,
      Fermenter,
      Production,
      Transfer,
      BbtStatusHistory,
      BottlingOrder,
      ColdRoomKeg,
      BbtMovement,
    ]),
  ],
  controllers: [BbtsController],
  providers: [BbtsService],
  exports: [BbtsService],
})
export class BbtsModule {}