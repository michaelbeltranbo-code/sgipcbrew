import {Entity, PrimaryGeneratedColumn,Column, ManyToOne,} from 'typeorm';
import { Production } from './production.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

@Entity('production_materials')
export class ProductionMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Production, (p) => p.materials)
  production: Production;

  @ManyToOne(() => RawMaterial)
  rawMaterial: RawMaterial;

  @Column('decimal', { precision: 10, scale: 1 })
  quantityUsed: number;
  
}
