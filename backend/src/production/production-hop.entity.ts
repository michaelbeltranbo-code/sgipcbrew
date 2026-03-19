import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from "typeorm";
import { Production } from "./production.entity";
import { RawMaterial } from "../raw-materials/raw-material.entity";

@Entity("production_hops")
export class ProductionHop {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Production, (p) => p.hops, { nullable: false, onDelete: "CASCADE" })
  production: Production;

  @ManyToOne(() => RawMaterial, { nullable: false })
  rawMaterial: RawMaterial;

  // gramos usados
  @Column("decimal", { precision: 12, scale: 2 })
  quantityGrams: number;

  // minuto de hervor (0-120 típicamente)
  @Column({ type: "int", nullable: true })
boilMinute: number | null;

  @CreateDateColumn()
  createdAt: Date;
}