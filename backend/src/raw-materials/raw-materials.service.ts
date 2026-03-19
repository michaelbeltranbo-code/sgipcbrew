import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RawMaterial } from './raw-material.entity';

@Injectable()
export class RawMaterialsService {
  constructor(
    @InjectRepository(RawMaterial)
    private readonly rawMaterialRepo: Repository<RawMaterial>,
  ) {}

  findAll() {
  return this.rawMaterialRepo.find({
  relations: { client: true },
  order: { createdAt: "DESC" },
});
  }

  create(data: Partial<RawMaterial>) {
    const material = this.rawMaterialRepo.create(data);
    return this.rawMaterialRepo.save(material);
  }
  


}
