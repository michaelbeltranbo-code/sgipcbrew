import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';
import { Fermenter } from './fermenter.entity';
import { FermenterStatus } from './fermenter-status.enum';

@Entity('fermenter_status_history')
export class FermenterStatusHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Fermenter, (fermenter) => fermenter.history, {
    onDelete: 'CASCADE',
  })
  fermenter: Fermenter;

  @Column({
    type: 'enum',
    enum: FermenterStatus,
  })
  fromStatus: FermenterStatus;

  @Column({
    type: 'enum',
    enum: FermenterStatus,
  })
  toStatus: FermenterStatus;

  @Column()
  changedBy: string;

  @Column({ type: 'text', nullable: true })
note: string | null;

  @CreateDateColumn()
  changedAt: Date;
}