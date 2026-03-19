import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BbtsService } from './bbts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateBbtTransferDto } from './dto/create-bbt-transfer.dto';
import { UpdateBbtStatusDto } from './dto/update-bbt-status.dto';
import { CreateBbtKegDownDto } from './dto/create-bbt-keg-down.dto';
import { CreateBbtBottlingOrderDto } from './dto/create-bbt-bottling-order.dto';
import { StartBottlingDto } from '../fermenters/dto/start-bottling.dto';
import { FinishBottlingDto } from '../fermenters/dto/finish-bottling.dto';




@Controller('bbt')
@UseGuards(JwtAuthGuard)
export class BbtsController {
  constructor(private readonly bbtsService: BbtsService) {}

  @Get()
  findAll() {
    return this.bbtsService.findAll();
  }

  @Get('available')
  getAvailableBbts() {
    return this.bbtsService.getAvailableBbts();
  }

  @Get('available-from-fermenters')
  getAvailableFermentersForTransfer() {
    return this.bbtsService.getAvailableFermentersForTransfer();
  }

  @Get('bottling-orders')
listBbtBottlingOrders() {
  return this.bbtsService.listBbtBottlingOrders();
}

@Post(':id/keg-down')
kegDownFromBbt(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CreateBbtKegDownDto,
  @CurrentUser() user: any,
) {
  return this.bbtsService.kegDownFromBbt(id, dto, user);
}

@Post(':id/send-to-bottling')
sendToBottlingFromBbt(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: CreateBbtBottlingOrderDto,
  @CurrentUser() user: any,
) {
  return this.bbtsService.sendToBottlingFromBbt(id, dto, user);
}

@Post('start-bottling')
startBbtBottling(
  @Body() dto: StartBottlingDto,
  @CurrentUser() user: any,
) {
  return this.bbtsService.startBbtBottling(dto, user);
}

@Post('finish-bottling')
finishBbtBottling(
  @Body() dto: FinishBottlingDto,
  @CurrentUser() user: any,
) {
  return this.bbtsService.finishBbtBottling(dto, user);
}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bbtsService.findOne(id);
  }

  @Post('transfer')
  transferToBbt(
    @Body() dto: CreateBbtTransferDto,
    @CurrentUser() user: any,
  ) {
    return this.bbtsService.transferToBbt(dto, user);
  }

  @Patch(':id/status')
updateStatus(
  @Param('id', ParseIntPipe) id: number,
  @Body() dto: UpdateBbtStatusDto,
  @CurrentUser() user: any,
) {
  return this.bbtsService.updateStatus(id, dto, user);
}
}