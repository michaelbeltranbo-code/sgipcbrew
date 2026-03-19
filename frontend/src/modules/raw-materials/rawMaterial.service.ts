import { http } from "../../api/http";
import type { Client, CreateRawMaterialBody, RawMaterial } from "./rawMaterial.types";

export async function fetchRawMaterials(): Promise<RawMaterial[]> {
  const res = await http.get<RawMaterial[]>("/raw-materials");
  return res.data;
}

export async function createRawMaterial(body: CreateRawMaterialBody): Promise<RawMaterial> {
  const payload = {
    name: body.name,
    type: body.type,
    clientId: body.clientId,
    supplier: body.supplier,
    lot: body.lot,
    quantity: body.quantity,
    unit: body.unit,
    receivedAt: body.receivedAt,
  };

  const res = await http.post<RawMaterial>("/raw-materials", payload);
  return res.data;
}

export async function fetchClients(): Promise<Client[]> {
  const res = await http.get<Client[]>("/clients");
  return res.data;
}