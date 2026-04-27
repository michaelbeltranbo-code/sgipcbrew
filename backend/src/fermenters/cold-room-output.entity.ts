import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ColdRoomOutputItem } from './cold-room-output-item.entity';

@Entity('cold_room_outputs')
export class ColdRoomOutput {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date' })
  outputDate: string;

  @Column({ type: 'varchar', nullable: true })
  destinationName: string | null;

  @Column({ type: 'varchar', length: 20 })
  destinationType: 'CLIENTE' | 'EVENTO' | 'BAR' | 'INTERNO';

  @Column({ type: 'varchar', length: 20, default: 'CONFIRMADA' })
  status: 'CONFIRMADA' | 'ANULADA';

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  responsibleUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  responsibleName: string | null;

  @OneToMany(() => ColdRoomOutputItem, (item) => item.output)
  items: ColdRoomOutputItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}