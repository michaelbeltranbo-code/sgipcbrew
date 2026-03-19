export type RawMaterialType =
  | "malta"
  | "lupulo"
  | "levadura"
  | "adjuntos"
  | "sales";

export type Unit = "kg" | "g" ;

export type RawMaterial = {
  id: number;
  name: string;
  type: RawMaterialType;
  quantity: string | number;
  unit: string; // "kg" | "g" etc
  lot: string;
  supplier: string;
  createdAt: string; 
  lowStockThreshold?: string | number | null;
  client?:RawMaterialClient|null
};

export type RawMaterialClient = {
  id: number;
  name: string;
};

export type CreateRawMaterialBody = {
  name: string;
  type: RawMaterialType;
  clientId: number;
  supplier: string;
  lot: string;
  quantity: number;
  unit: Unit;
  receivedAt: string; // YYYY-MM-DD (date input)
};