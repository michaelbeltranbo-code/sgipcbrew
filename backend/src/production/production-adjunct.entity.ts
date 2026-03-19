import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Production } from './production.entity';
import { RawMaterial } from '../raw-materials/raw-material.entity';

@Entity('production_adjuncts')
export class ProductionAdjunct {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Production, (production) => production.adjuncts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productionId' })
  production: Production;

  @ManyToOne(() => RawMaterial, { nullable: false, eager: false })
  @JoinColumn({ name: 'rawMaterialId' })
  rawMaterial: RawMaterial;

  @Column('decimal', { precision: 10, scale: 3 })
  quantityKg: number;

  @Column('varchar', { length: 120, nullable: true })
  additionMoment: string | null;

  @Column('text', { nullable: true })
  notes: string | null;
}