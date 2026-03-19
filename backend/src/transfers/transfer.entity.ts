import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Fermenter } from '../fermenters/fermenter.entity';
import { Production } from '../production/production.entity';

@Entity('transfers')
export class Transfer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Fermenter, (fermenter) => fermenter.transfers, {
  onDelete: 'CASCADE',
})
fermenter: Fermenter;

  @ManyToOne(() => Production, { nullable: false })
  production: Production;

  @Column({ type: 'varchar' })
  startedBy: string;

  @Column({ type: 'varchar', nullable: true })
  finishedBy: string | null;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  finishedAt: Date | null;

  @Column('float', { default: 0 })
  litersTransferred: number;

  @Column({ type: 'varchar', nullable: true })
  destinationType: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ nullable: true })
  startedByUserId: number;

  @Column({ nullable: true })
  startedByName: string;

  @Column({ nullable: true })
  finishedByUserId: number;

  @Column({ nullable: true })
  finishedByName: string;
}