const API_URL = "http://localhost:3000";


import { getToken } from "../auth/authStorage";
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}`);
  }

  return res.json();
}

export type PackagedStock = {
  id: number;
  productionId: number | null;
  beerName: string | null;
  clientName: string | null;
  sourceBottlingOrderId: number | null;
  sourceType: "FERMENTER" | "KEG" | "BBT";
  units330Available: number;
  units269Available: number;
  liters330Available: number;
  liters269Available: number;
  totalPackagedLitersAvailable: number;
  note?: string | null;
  storedAt: string;
};

export type ColdRoomKegStock = {
  id: number;
  productionId: number | null;
  beerName: string | null;
  clientName: string | null;
  sourceType?: string | null;
  kegs60: number;
  kegs50: number;
  kegs30: number;
  totalKegLiters: number;
  storedAt: string;
};

export type ColdRoomOutputItem = {
  id: number;
  outputId: number;
  itemType: "KEG" | "PACKAGE";
  productionId: number | null;
  beerName: string | null;
  clientName: string | null;
  sourceColdRoomKegId: number | null;
  sourcePackagedStockId: number | null;
  kegSizeLiters: number | null;
  kegQuantity: number | null;
  units330: number;
  units269: number;
  litersDelivered: number;
  note?: string | null;
  createdAt: string;
};

export type ColdRoomOutput = {
  id: number;
  outputDate: string;
  destinationName: string;
  destinationType: "CLIENTE" | "EVENTO" | "BAR" | "INTERNO";
  status: "CONFIRMADA" | "ANULADA";
  note?: string | null;
  responsibleUserId?: number | null;
  responsibleName?: string | null;
  createdAt: string;
  updatedAt: string;
  items: ColdRoomOutputItem[];
};

export type CreateColdRoomOutputPayload = {
  outputDate: string;
  destinationName: string;
  destinationType: "CLIENTE" | "EVENTO" | "BAR" | "INTERNO";
  note?: string;
  items: Array<{
    itemType: "KEG" | "PACKAGE";
    sourceColdRoomKegId?: number;
    sourcePackagedStockId?: number;
    kegSizeLiters?: number;
    kegQuantity?: number;
    units330?: number;
    units269?: number;
    note?: string;
  }>;
};

export async function getColdRoomKegs() {
  return request<ColdRoomKegStock[]>("/fermenters/cold-room-kegs");
}

export async function getPackagedStock() {
  return request<PackagedStock[]>("/fermenters/cold-room-packaged-stock");
}

export async function getColdRoomOutputs() {
  return request<ColdRoomOutput[]>("/fermenters/cold-room-outputs");
}

export async function createColdRoomOutput(payload: CreateColdRoomOutputPayload) {
  return request<ColdRoomOutput>("/fermenters/cold-room-outputs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}