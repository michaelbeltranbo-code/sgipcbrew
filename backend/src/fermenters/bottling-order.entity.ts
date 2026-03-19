import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Transfer } from '../transfers/transfer.entity';
import { Fermenter } from './fermenter.entity';
import { Production } from '../production/production.entity';

@Entity('bottling_orders')
export class BottlingOrder {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Transfer, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'transferId' })
  transfer?: Transfer | null;

  @Column({ type: 'int', nullable: true })
  transferId: number | null;

  @ManyToOne(() => Fermenter, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fermenterId' })
  fermenter?: Fermenter | null;

  @Column({ type: 'int', nullable: true })
  fermenterId: number | null;

  @ManyToOne(() => Production, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productionId' })
  production?: Production | null;

  @Column({ type: 'int', nullable: true })
  productionId: number | null;

  @Column({ type: 'varchar' })
  beerName: string;

  @Column({ type: 'varchar', nullable: true })
  clientName: string | null;

  @Column({ type: 'varchar', default: 'FERMENTER' })
  sourceType:'FERMENTER' | 'KEG' | 'BBT';

    @Column({ type: 'int', nullable: true })
    sourceBbtId: number | null; 


  @Column({ type: 'int', nullable: true })
  sourceFermenterId: number | null;

  @Column({ type: 'int', nullable: true })
  sourceColdRoomKegId: number | null;

  @Column({ type: 'int', nullable: true })
  sourceKegSizeLiters: number | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  requestedLiters: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  remainingLiters: number;

  @Column({ type: 'varchar', default: 'PENDIENTE' })
  status: 'PENDIENTE' | 'EN_PROCESO' | 'FINALIZADA';

  @Column({ type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  startedByUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  startedByName: string | null;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date | null;

  @Column({ type: 'int', nullable: true })
  finishedByUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  finishedByName: string | null;

  @Column({ type: 'int', default: 0 })
  units330: number;

  @Column({ type: 'int', default: 0 })
  units269: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  litersFrom330: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  litersFrom269: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  processLossLiters: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalProcessedLiters: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  createdByUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  createdByName: string | null;

  @CreateDateColumn()
  createdAt: Date;
}