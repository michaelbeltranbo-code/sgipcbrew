import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ColdRoomOutput } from './cold-room-output.entity';

@Entity('cold_room_output_items')
export class ColdRoomOutputItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  outputId: number;

  @ManyToOne(() => ColdRoomOutput, (output) => output.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'outputId' })
  output: ColdRoomOutput;

  @Column({ type: 'varchar' })
  itemType: 'KEG' | 'PACKAGE';

  @Column({ type: 'int', nullable: true })
  productionId: number | null;

  @Column({ type: 'varchar', nullable: true })
  beerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  clientName: string | null;

  @Column({ type: 'int', nullable: true })
  sourceColdRoomKegId: number | null;

  @Column({ type: 'int', nullable: true })
  sourcePackagedStockId: number | null;

  @Column({ type: 'int', nullable: true })
  kegSizeLiters: number | null;

  @Column({ type: 'int', nullable: true })
  kegQuantity: number | null;

  @Column({ type: 'int', default: 0 })
  units330: number;

  @Column({ type: 'int', default: 0 })
  units269: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  litersDelivered: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}