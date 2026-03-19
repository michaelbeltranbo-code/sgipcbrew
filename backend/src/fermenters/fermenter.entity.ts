import {
  Column,
  Entity,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
} from 'typeorm';
import { Production } from '../production/production.entity';
import { FermenterStatusHistory } from './fermenter-status-history.entity';
import { Transfer } from '../transfers/transfer.entity';
import { FermenterStatus } from './fermenter-status.enum';

@Entity('fermenters')
export class Fermenter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column('float', { nullable: true })
capacityLiters: number | null;

  @Column({
    type: 'enum',
    enum: FermenterStatus,
    default: FermenterStatus.AVAILABLE,
  })
  status: FermenterStatus;

  @Column({ type: 'timestamp', nullable: true })
  currentBatchStartedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  availableAt: Date | null;

  @OneToMany(() => Production, (production) => production.plannedFermenter)
  plannedProductions: Production[];

  @OneToMany(() => Production, (production) => production.actualFermenter)
  actualProductions: Production[];

  @OneToMany(() => FermenterStatusHistory, (history) => history.fermenter)
  history: FermenterStatusHistory[];

  @OneToMany(() => Transfer, (transfer) => transfer.fermenter)
  transfers: Transfer[];

  @ManyToOne(() => Production, { nullable: true,  })

  @JoinColumn({ name: 'currentProductionId' })
  currentProduction: Production | null;

  @Column({ nullable: true })
  currentProductionId: number | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  currentVolumeLiters: number;
}