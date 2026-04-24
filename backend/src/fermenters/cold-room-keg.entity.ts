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

@Entity('cold_room_kegs')
export class ColdRoomKeg {
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

  @Column({ type: 'varchar', default: 'TRANSFER' })
  sourceType: 'TRANSFER' | 'LEGACY' | 'BBT';

  @Column({ type: 'int', default: 0 })
  kegs60: number;

  @Column({ type: 'int', default: 0 })
  kegs50: number;

  @Column({ type: 'int', default: 0 })
  kegs30: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0, nullable: true })
  partialLiters: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalKegLiters: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  lossLiters: number;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'int', nullable: true })
  storedByUserId: number | null;

  @Column({ type: 'varchar', nullable: true })
  storedByName: string | null;

  @CreateDateColumn()
  storedAt: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  registeredAt: Date;

  @Column({ type: 'int', nullable: true })
 sourceBbtId: number | null;
}