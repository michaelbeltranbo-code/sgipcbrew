export type FermenterStatus =
  | "sucio"
  | "limpio"
  | "sanitizado"
  | "en_fermentacion"
  | "disponible";

export type Fermenter = {
  id: number;
  code: string;
  capacityLiters: string; // viene como string decimal
  status: FermenterStatus;
  currentProduction: any | null; // en tu respuesta viene null (luego lo tipamos mejor)
  fermentationStartedAt: string | null;
  fermentationEndedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type FermentationReading = {
  id: number;
  ph: string | number | null;
  density: string | number | null;
  temperatureC: string | number | null;
  note: string | null;
  takenBy: string | null;
  takenAt: string; // ISO
};

export type CreateReadingBody = {
  ph?: number | null;
  density?: number | null;
  temperatureC?: number | null;
  note?: string | null;
  takenBy: string;
  takenAt?: string; // opcional, backend puede poner default
};

export type PatchStatusBody = {
  status: FermenterStatus;
  performedBy: string;
};