import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Query,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FermentersService } from './fermenters.service';
import { StartFermentationDto } from './dto/start-fermentation.dto';
import { StartTransferDto } from './dto/start-transfer.dto';
import { FinishTransferDto } from './dto/finish-transfer.dto';
import { UpdateFermenterStatusDto } from './dto/update-fermenter-status.dto';
import { CreateReadingDto } from './dto/create-reading.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateKegDownDto } from './dto/create-keg-down.dto';
import { CreateBottlingOrderDto } from './dto/create-bottling-order.dto';
import { CreateKegBottlingOrderDto } from './dto/create-keg-bottling-order.dto';
import { StartBottlingDto } from './dto/start-bottling.dto';
import { FinishBottlingDto } from './dto/finish-bottling.dto';
import { CreateLegacyColdRoomKegDto } from './dto/create-legacy-cold-room-keg.dto';
import { CreateColdRoomOutputDto } from './dto/create-cold-room-output.dto';


@Controller('fermenters')
@UseGuards(JwtAuthGuard)
export class FermentersController {
  constructor(private readonly fermentersService: FermentersService) {}

  @Get()
  findAll() {
    return this.fermentersService.findAll();
  }
  @Get('cold-room-kegs')
    listColdRoomKegs() {
    return this.fermentersService.listColdRoomKegs();
  }

  @Get('bottling-orders')
    listBottlingOrders() {
    return this.fermentersService.listBottlingOrders();
  }

  @Post('keg-down')
    kegDown(@Body() dto: CreateKegDownDto, @CurrentUser() user: any) {
    return this.fermentersService.kegDown(dto, user);
  }

  @Post('send-to-bottling')
  sendToBottling(
  @Body() dto: CreateBottlingOrderDto,
  @CurrentUser() user: any,
  ) {
  return this.fermentersService.sendToBottling(dto, user);
  }

  @Post('create-keg-bottling-order')
    createKegBottlingOrder(
    @Body() dto: CreateKegBottlingOrderDto,
  @CurrentUser() user: any,
  ) {
    return this.fermentersService.createKegBottlingOrder(dto, user);
  }

  @Delete('bottling-orders/:id')
deleteOpenBottlingOrder(@Param('id', ParseIntPipe) id: number) {
  return this.fermentersService.deleteOpenBottlingOrder(id);
}

  @Post('cold-room-kegs/legacy')
createLegacyColdRoomKeg(
  @Body() dto: CreateLegacyColdRoomKegDto,
  @CurrentUser() user: any,
) {
  return this.fermentersService.createLegacyColdRoomKeg(dto, user);
}

  @Post('start-bottling')
  startBottling(@Body() dto: StartBottlingDto, @CurrentUser() user: any) {
    return this.fermentersService.startBottling(dto, user);
  }

  @Post('finish-bottling')
  finishBottling(@Body() dto: FinishBottlingDto, @CurrentUser() user: any) {
    return this.fermentersService.finishBottling(dto, user);
  }

  @Get('cold-room-inventory')
listColdRoomInventory(
  @Query('productionId') productionId?: string,
  @Query('clientName') clientName?: string,
  @Query('beerName') beerName?: string,
) {
  return this.fermentersService.listColdRoomInventory(
    productionId ? Number(productionId) : undefined,
    clientName?.trim() || undefined,
    beerName?.trim() || undefined,
  );

}

@Get('cold-room-packaged-stock')
listPackagedStock() {
  return this.fermentersService.listPackagedStock();
}

@Get('cold-room-outputs')
listColdRoomOutputs() {
  return this.fermentersService.listColdRoomOutputs();
}

@Post('cold-room-outputs')
createColdRoomOutput(
  @Body() dto: CreateColdRoomOutputDto,
  @CurrentUser() user: any,
) {
  return this.fermentersService.createColdRoomOutput(dto, user);
}



  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fermentersService.findOne(id);
  }

  @Get(':id/readings')
  listReadings(@Param('id', ParseIntPipe) id: number) {
    return this.fermentersService.listReadings(id);
  }

  @Get('history/production/:productionId')
  listReadingsByProduction(
    @Param('productionId', ParseIntPipe) productionId: number,
  ) {
    return this.fermentersService.listReadingsByProduction(productionId);
  }

  @Post(':id/readings')
  createReading(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateReadingDto,
    @CurrentUser() user: any,
  ) {
    return this.fermentersService.createReading(id, dto, user);
  }

  @Post('start-fermentation')
  startFermentation(
    @Body() dto: StartFermentationDto,
    @CurrentUser() user: any,
  ) {
    return this.fermentersService.startFermentation(dto, user);
  }

  @Post('start-transfer')
  startTransfer(@Body() dto: StartTransferDto, @CurrentUser() user: any) {
    return this.fermentersService.startTransfer(dto, user);
  }

  @Post('finish-transfer')
  finishTransfer(@Body() dto: FinishTransferDto, @CurrentUser() user: any) {
    return this.fermentersService.finishTransfer(dto, user);
  }

  @Patch('status')
  updateStatus(
    @Body() dto: UpdateFermenterStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.fermentersService.updateOperationalStatus(dto, user);
  }
}