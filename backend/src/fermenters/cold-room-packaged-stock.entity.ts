import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cold_room_packaged_stock')
export class ColdRoomPackagedStock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  productionId: number | null;

  @Column({ type: 'varchar', nullable: true })
  beerName: string | null;

  @Column({ type: 'varchar', nullable: true })
  clientName: string | null;

  @Column({ type: 'int', nullable: true })
  sourceBottlingOrderId: number | null;

  @Column({ type: 'varchar', default: 'FERMENTER' })
  sourceType: 'FERMENTER' | 'KEG' | 'BBT';

  @Column({ type: 'int', default: 0 })
  units330Available: number;

  @Column({ type: 'int', default: 0 })
  units269Available: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  liters330Available: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  liters269Available: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPackagedLitersAvailable: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  storedByUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  storedByName: string | null;

  @CreateDateColumn()
  storedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}