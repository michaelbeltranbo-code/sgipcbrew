import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RawMaterial } from './raw-material.entity';
import { RawMaterialsService } from './raw-materials.service';
import { RawMaterialsController } from './raw-materials.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RawMaterial])],
  controllers: [RawMaterialsController],
  providers: [RawMaterialsService],
})
export class RawMaterialsModule {}
