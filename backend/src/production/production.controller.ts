import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductionService } from './production.service';
import { CreateBrewBatchDto } from './dto/create-brew-batch.dto';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('productions')
@UseGuards(JwtAuthGuard)
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  @Post()
  create(@Body() body: CreateBrewBatchDto, @CurrentUser() user: any) {
    return this.service.createProduction(body, user);
  }

  @Get()
  findAll(
    @Query('clientId') clientId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.service.findAllWithFilters({
      clientId: clientId ? Number(clientId) : undefined,
      fromDate,
      toDate,
    });
  }

  @Get('raw-materials')
  listRawMaterials() {
    return this.service.listRawMaterials();
  }

  @Get(':id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.getProduction(id);
  }
}