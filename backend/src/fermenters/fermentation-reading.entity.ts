import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Fermenter } from './fermenter.entity';
import { Production } from '../production/production.entity';

@Entity('fermenter_readings')
export class FermenterReading {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Fermenter, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'fermenterId' })
  fermenter: Fermenter;

  @ManyToOne(() => Production, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productionId' })
  production: Production;

  @Column('float', { nullable: true })
  ph: number | null;

  @Column('float', { nullable: true })
  density: number | null;

  @Column('float', { nullable: true })
  temperature: number | null;

  @Column('float', { nullable: true })
  purges: number | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  purgeUnit: 'kg'|'l' | null;

  @Column({ type: 'boolean', default: false })
  dryHop: boolean;

  @Column({ type: 'text', nullable: true })
  additions: string | null;

   @Column({ type: 'boolean', default: false })
  hasClarifier: boolean;

  @Column({ type: 'boolean', default: false })
  isCarbonated: boolean;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({ type: 'timestamp', nullable: true })
  recordedAt: Date | null;

    @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  recordedByUserId: number | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  recordedByName: string | null;

 
}
