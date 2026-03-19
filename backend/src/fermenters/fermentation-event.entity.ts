import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Production } from '../production/production.entity';

@Entity('fermentation_events')
export class FermentationEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  type: string;

  @Column({ type: 'timestamp' })
  performedAt: Date;

  @Column({ type: 'varchar' })
  responsible: string;

  @Column({ type: 'varchar', nullable: true })
  productName: string | null;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  quantity: number | null;

  @Column({ type: 'varchar', nullable: true })
  unit: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @ManyToOne(() => Production, { nullable: false, onDelete: 'CASCADE' })
 batch: Production;
}