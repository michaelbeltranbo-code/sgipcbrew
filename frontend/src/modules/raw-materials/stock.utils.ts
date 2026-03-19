// frontend/src/modules/raw-materials/stock.utils.ts
import type { RawMaterial, RawMaterialType } from "./rawMaterial.types";

/**
 * Thresholds por tipo (ajústalos a tu planta).
 * OJO: aquí se compara contra "quantity" tal como lo guardas (kg o g según unidad).
 */
const DEFAULT_THRESHOLDS: Record<RawMaterialType, number> = {
  malta: 25,      // kg
  lupulo: 1,      // kg (si manejas g, ajusta abajo)
  levadura: 1,    // kg / unidades
  adjuntos: 5,     // kg
  sales: 1,       // kg
};

/**
 * Convierte quantity a una referencia comparable.
 * Si unit es "g", lo pasamos a kg para comparar con thresholds en kg.
 */
function normalizeToKg(quantity: number, unit: string): number {
  const u = (unit || "").toLowerCase().trim();
  if (u === "g") return quantity / 1000;
  if (u === "lb") return quantity * 0.453592;
  return quantity; // kg o lo que uses como base
}

export function isLowStock(rm: RawMaterial): boolean {
  const qty = Number(rm.quantity ?? 0);
  const qtyKg = normalizeToKg(qty, rm.unit);
  const threshold = DEFAULT_THRESHOLDS[rm.type] ?? 0;
  return qtyKg <= threshold;
}

export function lowStockLabel(rm: RawMaterial): string {
  const qty = Number(rm.quantity ?? 0);
  const qtyKg = normalizeToKg(qty, rm.unit);
  const threshold = DEFAULT_THRESHOLDS[rm.type] ?? 0;
  return `Stock bajo (≤ ${threshold} kg). Actual: ${qtyKg.toFixed(2)} kg`;
}