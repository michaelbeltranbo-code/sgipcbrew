import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('productions')
  list(
    @Query('productionId') productionId?: string,
    @Query('clientName') clientName?: string,
    @Query('beerName') beerName?: string,
  ) {
    return this.reportsService.list(
      productionId ? Number(productionId) : undefined,
      clientName?.trim() || undefined,
      beerName?.trim() || undefined,
    );
  }

  @Get('productions/:id')
  getOne(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.getOne(id);
  }
}