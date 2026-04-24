import { http } from "./http";

export type FermenterStatus =
  | "disponible"
  | "reservado"
  | "en_fermentacion"
  | "en_trasiego"
  | "vacio_sucio"
  | "limpio"
  | "sanitizado";

export type ProductionStatus =
  | "brewed"
  | "waiting_for_fermenter"
  | "transferred_to_fermenter"
  | "transferring"
  | "finished";

export function productionStatusLabel(status?: string | null): string {
  switch (status) {
    case "brewed":              return "Elaborada";
    case "waiting_for_fermenter": return "En espera de fermentador";
    case "transferred_to_fermenter": return "En fermentación";
    case "transferring":        return "En trasiego";
    case "finished":            return "Finalizada";
    default:                    return status ?? "-";
  }
}

export type ProductionSummary = {
  id: number;
  beerName: string;
  status: ProductionStatus;
  volumeLiters: number | null;
  postBoilLiters: number | null;
  producedAt?: string | null;
  fermentationStartedAt?: string | null;
  client?: {
    id: number;
    name: string;
  } | null;
  dryHopApplied?: boolean | null;
  dryHopDescription?: string | null;
  fermentationAdjuncts?: {
    name: string;
    quantityKg?: number | null;
  }[];
  purgesCount?: number | null;
  purgeWeightKg?: number | null;
  fermentationNotes?: string | null;
};

export type Fermenter = {
  id: number;
  name: string;
  capacityLiters: number | string;
  status: FermenterStatus;
  currentBatchStartedAt?: string | null;
  availableAt?: string | null;
  currentProduction?: ProductionSummary | null;
  currentProductionId?: number | null;
  currentVolumeLiters?: number | null;
  plannedProductions?: ProductionSummary[];
  actualProductions?: ProductionSummary[];
  transfers?: {
    id: number;
    startedAt?: string | null;
    finishedAt?: string | null;
    destinationType?: string | null;
  }[];
};

export type FermenterReading = {
  id: number;
  ph: number | null;
  density: number | null;
  temperature: number | null;
  purges: number | null;
  purgeUnit?: "kg" | "l" | null;
  dryHop?: boolean;
  additions?: string | null;
  hasClarifier?: boolean;
  isCarbonated?: boolean;
  note?: string | null;
  createdAt?: string;
  recordedAt?: string;
  production?: {
    id: number;
    beerName: string;
    status: string;
  } | null;
};

export type CreateReadingPayload = {
  productionId: number;
  ph?: number | null;
  density?: number | null;
  temperature?: number | null;
  purges?: number | null;
  purgeUnit?: "kg" | "l";
  dryHop?: boolean;
  additions?: string;
  hasClarifier?: boolean;
  isCarbonated?: boolean;
  note?: string;
  recordedAt?: string;
};

export type StartFermentationPayload = {
  batchId: number;
  fermenterId: number;
  brewedLiters: number;
};

export type StartTransferPayload = {
  batchId: number;
  fermenterId: number;
  destinationType?: string;
  note?: string;
};

export type FinishTransferPayload = {
  transferId: number;
  litersTransferred: number;
  note?: string;
};

export type CreateKegDownPayload = {
  transferId: number;
  kegs60: number;
  kegs50: number;
  kegs30: number;
  partialLiters?: number;
  lossLiters: number;
  note?: string;
};

export type CreateBottlingOrderPayload = {
  transferId: number;
  note?: string;
};
export type CreateKegBottlingOrderPayload = {
  coldRoomKegId: number;
  kegSizeLiters: 60 | 50 | 30;
  kegQuantity?: number;
  note?: string;
};

export type StartBottlingPayload = {
  orderId: number;
};

export type FinishBottlingPayload = {
  orderId: number;
  units330: number;
  units269: number;
  lossLiters: number;
  note?: string;
};

export type ColdRoomInventoryItem = {
  id: number;
  inventoryType: "BARRIL" | "BOTELLA";
  sourceType: string;
  productionId: number | null;
  beerName: string;
  clientName: string | null;
  kegs60: number;
  kegs50: number;
  kegs30: number;
  partialLiters: number;
  totalKegLiters: number;
  units330: number;
  units269: number;
  litersFrom330: number;
  litersFrom269: number;
  totalBottleLiters: number;
  registeredAt?: string | null;
  storedByName?: string | null;
  fermenterId?: number | null;
};

export type UpdateFermenterStatusPayload = {
  fermenterId: number;
  status: "limpio" | "sanitizado" | "disponible" | "vacio_sucio";
  note?: string;
};

export async function listFermenters(): Promise<Fermenter[]> {
  const { data } = await http.get("/fermenters");
  return data;
}

export async function getFermenter(id: number): Promise<Fermenter> {
  const { data } = await http.get(`/fermenters/${id}`);
  return data;
}

export async function listReadings(id: number): Promise<FermenterReading[]> {
  const { data } = await http.get(`/fermenters/${id}/readings`);
  return data;
}

export async function createReading(
  id: number,
  payload: CreateReadingPayload,
): Promise<FermenterReading> {
  const { data } = await http.post(`/fermenters/${id}/readings`, payload);
  return data;
}

export async function startFermentation(payload: StartFermentationPayload) {
  const { data } = await http.post("/fermenters/start-fermentation", payload);
  return data;
}

export async function startTransfer(payload: StartTransferPayload) {
  const { data } = await http.post("/fermenters/start-transfer", payload);
  return data;
}

export async function finishTransfer(payload: {
  transferId: number;
  note?: string;
}) {
  const { data } = await http.post("/fermenters/finish-transfer", payload);
  return data;
}

export async function updateFermenterStatus(
  payload: UpdateFermenterStatusPayload,
) {
  const { data } = await http.patch("/fermenters/status", payload);
  return data;
}

export async function kegDown(payload: CreateKegDownPayload) {
  const { data } = await http.post("/fermenters/keg-down", payload);
  return data;
}

export async function sendToBottling(payload: CreateBottlingOrderPayload) {
  const { data } = await http.post("/fermenters/send-to-bottling", payload);
  return data;
}

export async function listColdRoomKegs() {
  const { data } = await http.get("/fermenters/cold-room-kegs");
  return data;
}

export async function listBottlingOrders() {
  const { data } = await http.get("/fermenters/bottling-orders");
  return data;
}

export async function createKegBottlingOrder(
  payload: CreateKegBottlingOrderPayload,
) {
  const { data } = await http.post(
    "/fermenters/create-keg-bottling-order",
    payload,
  );
  return data;
}

export async function deleteBottlingOrder(id: number) {
  const { data } = await http.delete(`/fermenters/bottling-orders/${id}`);
  return data;
}

export async function startBottling(payload: StartBottlingPayload) {
  const { data } = await http.post("/fermenters/start-bottling", payload);
  return data;
}

export async function finishBottling(payload: FinishBottlingPayload) {
  const { data } = await http.post("/fermenters/finish-bottling", payload);
  return data;
}
export async function listColdRoomInventory(filters?: {
  productionId?: number;
  clientName?: string;
  beerName?: string;
}): Promise<ColdRoomInventoryItem[]> {
  const { data } = await http.get("/fermenters/cold-room-inventory", {
    params: filters,
  });
  return data;
}



export type CreateLegacyColdRoomKegPayload = {
  beerName: string;
  clientName?: string;
  kegs60: number;
  kegs50: number;
  kegs30: number;
  totalKegLiters: number;
  lossLiters: number;
  note?: string;
};

export async function createLegacyColdRoomKeg(
  payload: CreateLegacyColdRoomKegPayload,
) {
  const { data } = await http.post("/fermenters/cold-room-kegs/legacy", payload);
  return data;
}
