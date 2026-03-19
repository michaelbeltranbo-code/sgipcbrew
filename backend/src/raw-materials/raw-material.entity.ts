import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Client } from "../clients/client.entity";

export enum RawMaterialType {
  MALTA = "malta",
  LUPULO = "lupulo",
  LEVADURA = "levadura",
  ADJUNTOS = "adjuntos",
  SALES = "sales",
}

@Entity("raw_materials")
export class RawMaterial {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: RawMaterialType,
  })
  type: RawMaterialType;

  @Column()
  name: string;

  @Column("decimal", { precision: 10, scale: 2 })
  quantity: number;

  @Column()
  unit: string;

  @Column()
  lot: string;

  @Column()
  supplier: string;

  // ✅ nuevo: FK
  @Column({ type: "int", nullable: true })
  clientId: number | null;

  // ✅ nuevo: relación
  @ManyToOne(() => Client, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "clientId" })
  client?: Client | null;

  @CreateDateColumn()
  createdAt: Date;
}