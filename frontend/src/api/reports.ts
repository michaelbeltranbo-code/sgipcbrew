import { http } from "./http";

export type ProductionReportRow = {
  id: number;
  beerName: string;
  clientName: string | null;
  producedAt?: string | null;
  status?: string | null;
};

export type ReportDatosGenerales = {
  id: number;
  cerveza: string;
  cliente: string;
  responsable: string;
  estado: string;
  fechaProduccion?: string | null;
  litrosProduccion: number;
  litrosPostHervor: number;
  phInicial?: number | null;
  densidadInicial?: number | null;
};

export type ReportMateriaPrimaItem = {
  id?: number;
  nombre: string;
  lote?: string;
  cantidadKg?: number;
  cantidadGramos?: number;
  cantidadUsada?: number;
  unidad?: string;
  tipo?: string;
  proveedor?: string;
  minutoHervor?: number | null;
  momentoAdicion?: string;
  notas?: string;
};

export type ReportMateriasPrimas = {
  malts: ReportMateriaPrimaItem[];
  hops: ReportMateriaPrimaItem[];
  adjuncts: ReportMateriaPrimaItem[];
  otros: ReportMateriaPrimaItem[];
};

export type ReportFermentacionLectura = {
  id: number;
  ph?: number | null;
  density?: number | null;
  temperature?: number | null;
  purges?: number | null;
  purgeUnit?: string | null;
  dryHop?: boolean | null;
  additions?: string | null;
  hasClarifier?: boolean | null;
  isCarbonated?: boolean | null;
  note?: string | null;
  recordedAt?: string | null;
  recordedByName?: string | null;
};

export type ReportFermentacion = {
  resumen: {
    fechaInicio?: string | null;
    dryHopAplicado?: boolean | null;
    descripcionDryHop?: string | null;
    purgas?: number | null;
    pesoPurgaKg?: number | null;
    notas?: string | null;
  };
  lecturas: ReportFermentacionLectura[];
};

export type ReportTransferencia = any;
export type ReportBbtTransfer = any;

export type ReportExistenciaFermentador = {
  fermentador: string;
  estado: string;
  litros: number;
} | null;

export type ReportExistenciaBbt = {
  bbt: string;
  estado: string;
  proceso?: string | null;
  litros: number;
};

export type ReportExistenciasActuales = {
  enFermentador: ReportExistenciaFermentador;
  enBbt: ReportExistenciaBbt[];
};

export type ReportBarrilRegistro = {
  id: number;
  cerveza: string;
  cliente?: string | null;
  fuente: string;
  barriles60: number;
  barriles50: number;
  barriles30: number;
  litrosTotales: number;
  merma: number;
  fechaRegistro?: string | null;
};

export type ReportBarrilesCuartoFrio = {
  registros: ReportBarrilRegistro[];
  total60: number;
  total50: number;
  total30: number;
  totalLitros: number;
};

export type ReportBotellaRegistro = {
  ordenId: number;
  fuente: string;
  cerveza: string;
  cliente?: string | null;
  unidades335: number;
  unidades269: number;
  litros335: number;
  litros269: number;
  merma: number;
  totalProcesado: number;
  fechaFinalizacion?: string | null;
};

export type ReportBotellasProductoTerminado = {
  registros: ReportBotellaRegistro[];
  totalUnidades335: number;
  totalUnidades269: number;
  totalLitrosBotella: number;
};

export type ProductionFullReport = {
  datosGenerales: ReportDatosGenerales;
  materiasPrimas: ReportMateriasPrimas;
  fermentacion: ReportFermentacion;
  transferencias: ReportTransferencia[];
  bbtTransfers: ReportBbtTransfer[];
  existenciasActuales: ReportExistenciasActuales;
  barrilesCuartoFrio: ReportBarrilesCuartoFrio;
  botellasProductoTerminado: ReportBotellasProductoTerminado;
};

export async function listProductionReports(filters?: {
  productionId?: number;
  clientName?: string;
  beerName?: string;
}) {
  const { data } = await http.get("/reports/productions", { params: filters });
  return data as ProductionReportRow[];
}

export async function getProductionReport(id: number) {
  const { data } = await http.get(`/reports/productions/${id}`);
  return data as ProductionFullReport;
}