import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from "typeorm";
import { Production } from "./production.entity";
import { RawMaterial } from "../raw-materials/raw-material.entity";

@Entity("production_malts")
export class ProductionMalt {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Production, (p) => p.malts, { nullable: false, onDelete: "CASCADE" })
  production: Production;

  @ManyToOne(() => RawMaterial, { nullable: false })
  rawMaterial: RawMaterial;

  // kg usados
  @Column("decimal", { precision: 12, scale: 3 })
  quantityKg: number;

  // lote que reporta operario (trazabilidad)
  @Column({ type: "varchar", nullable: true })
lot: string | null;

  @CreateDateColumn()
  createdAt: Date;
}