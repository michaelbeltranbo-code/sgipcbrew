import { Controller, Get, Post, Body } from '@nestjs/common';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterial } from './raw-material.entity';

@Controller('raw-materials')
export class RawMaterialsController {
  constructor(private readonly service: RawMaterialsService) {}

  @Get()
  findAll(): Promise<RawMaterial[]> {
    return this.service.findAll();
  }

  @Post()
  create(@Body() body: Partial<RawMaterial>) {
    return this.service.create(body);
  }
}
