import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Bbt } from './bbt.entity';

@Entity('bbt_movements')
export class BbtMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Bbt, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bbtId' })
  bbt: Bbt;

  @Column({ type: 'int' })
  bbtId: number;

  @Column({ type: 'varchar', length: 50 })
  movementType:
    | 'TRANSFER_IN'
    | 'STATUS_CHANGE'
    | 'KEG_FILL'
    | 'BOTTLING_ORDER_CREATED'
    | 'BOTTLING_FINISHED'
    | 'AUTO_MARKED_DIRTY';

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  litersIn: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  litersOut: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lossLiters: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  resultingVolumeLiters: number;

  @Column({ type: 'int', nullable: true })
  productionId: number | null;

  @Column({ type: 'int', nullable: true })
  sourceFermenterId: number | null;

  @Column({ type: 'int', nullable: true })
  bottlingOrderId: number | null;

  @Column({ type: 'int', nullable: true })
  coldRoomKegId: number | null;

  @Column({ type: 'varchar', nullable: true })
  changedBy: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}