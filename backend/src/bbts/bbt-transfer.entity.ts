import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Bbt } from './bbt.entity';
import { Fermenter } from '../fermenters/fermenter.entity';
import { Production } from '../production/production.entity';
import { BbtProcessType } from './bbt-process-type.enum';

@Entity('bbt_transfers')
export class BbtTransfer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bbt, { nullable: false })
  @JoinColumn({ name: 'bbtId' })
  bbt: Bbt;

  @ManyToOne(() => Fermenter, { nullable: false })
  @JoinColumn({ name: 'fermenterId' })
  fermenter: Fermenter;

  @ManyToOne(() => Production, { nullable: false })
  @JoinColumn({ name: 'productionId' })
  production: Production;

  @Column({
    type: 'varchar',
    length: 50,
  })
  processType: BbtProcessType;

  @Column('decimal', { precision: 10, scale: 2 })
  litersTransferred: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lossLiters: number;

  @Column('decimal', { precision: 10, scale: 2 })
  litersReceivedInBbt: number;

    @Column({ type: 'text', nullable: true })
    notes: string | null;

    @Column({ type: 'varchar', length: 150, nullable: true })
    createdBy: string | null;

  @CreateDateColumn()
  createdAt: Date;
}