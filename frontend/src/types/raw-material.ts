export type RawMaterialType = "malta" | "lupulo" | "levadura" | "aditivo";

export type RawMaterial = {
  id: number;
  type: RawMaterialType;
  name: string;
  quantity: string; // TypeORM suele devolver decimal como string
  unit: string;
  lot: string;
  supplier: string;
  createdAt: string;
};
