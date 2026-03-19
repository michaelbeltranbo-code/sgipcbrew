import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './client.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly repo: Repository<Client>,
  ) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(data: Partial<Client>) {
    if (!data?.name?.trim()) {
      throw new BadRequestException('name es obligatorio');
    }
    const client = this.repo.create({ ...data, name: data.name.trim() });
    return this.repo.save(client);
  }
}

