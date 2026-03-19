import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { BbtStatus } from './bbt-status.enum';
import { BbtTransfer } from './bbt-transfer.entity';
import { BbtMovement } from './bbt-movement.entity';
import { BbtStatusHistory } from './bbt-status-history.entity';

@Entity('bbt')
export class Bbt {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', name: 'name' })
  name: string;

  @Column('decimal', {
    name: 'capacity_liters',
    precision: 10,
    scale: 2,
    default: 0,
  })
  capacityLiters: number;

  @Column({
    type: 'enum',
    enum: BbtStatus,
    name: 'status',
    default: BbtStatus.DISPONIBLE,
  })
  status: BbtStatus;

  @OneToMany(() => BbtStatusHistory, (history) => history.bbt)
  statusHistory: BbtStatusHistory[];

  @OneToMany(() => BbtMovement, (movement) => movement.bbt)
  movements: BbtMovement[];

  @Column({ type: 'varchar', name: 'current_beer_name', nullable: true })
  currentBeerName: string | null;

  @Column({ type: 'varchar', name: 'current_client_name', nullable: true })
  currentClientName: string | null;

  @Column({ type: 'int', name: 'current_production_id', nullable: true })
  currentProductionId: number | null;

  @Column({ type: 'int', name: 'source_fermenter_id', nullable: true })
  sourceFermenterId: number | null;

  @Column('decimal', {
    name: 'current_volume_liters',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  currentVolumeLiters: number | null;

  @Column({ type: 'varchar', name: 'process_type', nullable: true })
  processType: string | null;

  @Column({ type: 'timestamp', name: 'occupied_at', nullable: true })
  occupiedAt: Date | null;

  @Column({ type: 'timestamp', name: 'available_at', nullable: true })
  availableAt: Date | null;

  @OneToMany(() => BbtTransfer, (transfer) => transfer.bbt)
  transfers: BbtTransfer[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}