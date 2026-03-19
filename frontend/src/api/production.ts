import { http } from "./http";

export type KitchenStatus =
  | "en_produccion"
  | "sucia"
  | "limpia"
  | "sanitizada";

export type BrewBatchMaltInput = {
  rawMaterialId: number;
  quantityKg: number;
  lot?: string;
};

export type BrewBatchHopInput = {
  rawMaterialId: number;
  quantityGrams: number;
  boilMinute: number;
};

export type BrewBatchAdjunct = {
  rawMaterialId: number;
  quantityKg: number;
  additionMoment?: string;
  notes?: string;
};

export type CreateBrewBatchInput = {
  beerName: string;
  clientId: number;
  kitchenStatus: KitchenStatus;
  initialPh: number;
  initialDensity: number;
  boilLiters: number;
  postBoilLiters: number;
  producedAt: string;
  plannedFermenterId?: number;
  malts: BrewBatchMaltInput[];
  hops: BrewBatchHopInput[];
  adjuncts?: BrewBatchAdjunct[];
};

export async function createBrewBatch(input: CreateBrewBatchInput) {
  const { data } = await http.post("/productions", input);
  return data;
}

export async function listProductions() {
  const { data } = await http.get("/productions");
  return data;
}

export async function listRawMaterials() {
  const { data } = await http.get("/productions/raw-materials");
  return data;
}

export type ProductionInventoryItem = {
  id: number;
  beerName: string;
  responsible: string;
  responsibleUserId?: number | null;
  responsibleName?: string | null;
  producedAt: string | null;
  kitchenStatus: string;
  initialPh: number | null;
  initialDensity: number | null;
  postBoilLiters: number | null;
  volumeLiters: number | null;
  client?: {
    id: number;
    name: string;
  } | null;
  malts?: {
    id: number;
    quantityKg: number;
    rawMaterial?: {
      id: number;
      name: string;
    } | null;
  }[];
  hops?: {
    id: number;
    quantityGrams: number;
    boilMinute?: number | null;
    rawMaterial?: {
      id: number;
      name: string;
    } | null;
  }[];
  adjuncts?: {
    id: number;
    quantityKg: number;
    additionMoment?: string | null;
    notes?: string | null;
    rawMaterial?: {
      id: number;
      name: string;
    } | null;
  }[];
};

export type ProductionInventoryFilters = {
  clientId?: number;
  fromDate?: string;
  toDate?: string;
};

export async function listProductionInventory(
  filters: ProductionInventoryFilters,
) {
  const params: Record<string, string> = {};

  if (filters.clientId) params.clientId = String(filters.clientId);
  if (filters.fromDate) params.fromDate = filters.fromDate;
  if (filters.toDate) params.toDate = filters.toDate;

  const { data } = await http.get("/productions", { params });
  return data;
}