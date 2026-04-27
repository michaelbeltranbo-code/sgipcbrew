import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Bbt } from './bbt.entity';
import { BbtStatus } from './bbt-status.enum';

@Entity('bbt_status_history')
export class BbtStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bbt, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bbtId' })
  bbt: Bbt;

  @Column({ type: 'int' })
  bbtId: number;

  @Column({ type: 'varchar' })
  fromStatus: BbtStatus;

  @Column({ type: 'varchar' })
  toStatus: BbtStatus;

  @Column({ type: 'varchar', nullable: true })
  changedBy: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  changedAt: Date;
}