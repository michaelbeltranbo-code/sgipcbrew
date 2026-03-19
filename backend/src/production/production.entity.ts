import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ProductionMaterial } from './production-material.entity';
import { Client } from '../clients/client.entity';
import { ProductionMalt } from './production-malt.entity';
import { ProductionHop } from './production-hop.entity';
import { KitchenStatus } from './production-kitchen-status.enum';
import { ProductionAdjunct } from './production-adjunct.entity';
import { ProductionStatus } from './production-status.enum';
import { Fermenter } from '../fermenters/fermenter.entity';
import { FermenterReading } from '../fermenters/fermentation-reading.entity';

@Entity('productions')
export class Production {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  beerName: string;

  @Column({ nullable: true })
  responsibleUserId: number;

  @Column({ nullable: true })
  responsibleName: string;

  @Column({ type: 'timestamp', nullable: true })
  fermentationStartedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  transferStartedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  transferFinishedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date | null;

  @ManyToOne(() => Client, { nullable: false, eager: false })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @CreateDateColumn()
  startedAt: Date;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  volumeLiters: number | null;

  @Column({
    type: 'enum',
    enum: KitchenStatus,
    default: KitchenStatus.LIMPIA,
  })
  kitchenStatus: KitchenStatus;

  @Column({
    type: 'enum',
    enum: ProductionStatus,
    default: ProductionStatus.BREWED,
  })
  status: ProductionStatus;

  @ManyToOne(() => Fermenter, (fermenter) => fermenter.plannedProductions, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'plannedFermenterId' })
  plannedFermenter: Fermenter | null;

  @ManyToOne(() => Fermenter, (fermenter) => fermenter.actualProductions, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'actualFermenterId' })
  actualFermenter: Fermenter | null;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  initialPh: number | null;

  @Column('decimal', { precision: 6, scale: 3, nullable: true })
  initialDensity: number | null;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  boilLiters: number | null;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  postBoilLiters: number | null;

  @Column({ type: 'date', nullable: true })
  producedAt: string | null;

  @OneToMany(() => ProductionMaterial, (material) => material.production, {
    cascade: true,
  })
  materials: ProductionMaterial[];

  @OneToMany(() => ProductionMalt, (m) => m.production, { cascade: true })
  malts: ProductionMalt[];

  @OneToMany(() => ProductionHop, (h) => h.production, { cascade: true })
  hops: ProductionHop[];

  @OneToMany(() => ProductionAdjunct, (adj) => adj.production, {
    cascade: true,
  })
  adjuncts: ProductionAdjunct[];

  @OneToMany(() => FermenterReading, (reading) => reading.production)
  readings: FermenterReading[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'boolean', default: false })
  dryHopApplied: boolean;

  @Column({ type: 'text', nullable: true })
  dryHopDescription: string | null;

  @Column({ type: 'int', default: 0 })
  purgesCount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  purgeWeightKg: number;

  @Column({ type: 'text', nullable: true })
  fermentationNotes: string | null;

  
}