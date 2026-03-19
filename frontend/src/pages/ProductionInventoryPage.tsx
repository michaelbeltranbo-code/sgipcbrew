import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listClients } from "../api/clients";
import {
  listProductionInventory,
  type ProductionInventoryItem,
} from "../api/production";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatMalts(item: ProductionInventoryItem) {
  if (!item.malts?.length) return "-";
  return item.malts
    .map((m) => `${m.rawMaterial?.name ?? "Malta"} (${m.quantityKg} kg)`)
    .join(", ");
}

function formatHops(item: ProductionInventoryItem) {
  if (!item.hops?.length) return "-";
  return item.hops
    .map((h) => `${h.rawMaterial?.name ?? "Lúpulo"} (${h.quantityGrams} g)`)
    .join(", ");
}

function formatAdjuncts(item: ProductionInventoryItem) {
  if (!item.adjuncts?.length) return "-";
  return item.adjuncts
    .map((a) => `${a.rawMaterial?.name ?? "Adjunto"} (${a.quantityKg} kg)`)
    .join(", ");
}

export default function ProductionInventoryPage() {
  const [clientId, setClientId] = useState<number | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    clientId?: number;
    fromDate?: string;
    toDate?: string;
  }>({});

  const clientsQ = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const productionsQ = useQuery({
    queryKey: ["production-inventory", appliedFilters],
    queryFn: () => listProductionInventory(appliedFilters),
  });

  const rows = productionsQ.data ?? [];

  const totalLiters = useMemo(() => {
    return rows.reduce((acc, row) => {
      const liters = Number(row.postBoilLiters ?? row.volumeLiters ?? 0);
      return acc + (Number.isFinite(liters) ? liters : 0);
    }, 0);
  }, [rows]);

  function applyFilters() {
    setAppliedFilters({
      clientId: clientId === "all" ? undefined : clientId,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
    });
  }

  function clearFilters() {
    setClientId("all");
    setFromDate("");
    setToDate("");
    setAppliedFilters({});
  }

  return (
    <div className="p-6">
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-slate-900">
            Inventario de Producción
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Consulta de producciones registradas por cliente y rango de fechas.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cliente
              </label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={clientId}
                onChange={(e) =>
                  setClientId(
                    e.target.value === "all" ? "all" : Number(e.target.value),
                  )
                }
              >
                <option value="all">Todos</option>
                {(clientsQ.data ?? []).map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button
                className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-semibold"
                onClick={applyFilters}
              >
                Buscar
              </button>

              <button
                className="rounded-md border px-4 py-2 text-sm font-semibold"
                onClick={clearFilters}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <div className="mb-3 text-sm text-slate-600">
          <span className="font-medium">Registros:</span> {rows.length}{" "}
          <span className="ml-4 font-medium">Litros:</span> {totalLiters}
        </div>

        {productionsQ.isLoading && (
          <div className="rounded-xl border bg-white p-6 text-slate-600">
            Cargando inventario de producción...
          </div>
        )}

        {productionsQ.isError && (
          <div className="rounded-xl border bg-white p-6">
            <p className="text-red-600 font-medium">
              Error cargando inventario de producción.
            </p>
            <p className="text-sm text-slate-600 mt-1">
              Revisa el backend o la conexión del endpoint.
            </p>
          </div>
        )}

        {!productionsQ.isLoading && !productionsQ.isError && (
          <div className="overflow-auto rounded-xl border bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="text-left px-4 py-3">ID</th>
                  <th className="text-left px-4 py-3">Cerveza</th>
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Responsable</th>
                  <th className="text-left px-4 py-3">Litros</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Estado cocina</th>
                  <th className="text-left px-4 py-3">pH inicial</th>
                  <th className="text-left px-4 py-3">Densidad inicial</th>
                  <th className="text-left px-4 py-3">Maltas</th>
                  <th className="text-left px-4 py-3">Lúpulos</th>
                  <th className="text-left px-4 py-3">Adjuntos</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => (
                  <tr key={item.id} className="border-t align-top">
                    <td className="px-4 py-3">{item.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {item.beerName}
                    </td>
                    <td className="px-4 py-3">{item.client?.name ?? "-"}</td>
                    <td className="px-4 py-3">{item.responsibleName ?? item.responsible ?? "-"}</td>
                    <td className="px-4 py-3">
                      {item.postBoilLiters ?? item.volumeLiters ?? "-"}
                    </td>
                    <td className="px-4 py-3">{formatDate(item.producedAt)}</td>
                    <td className="px-4 py-3 capitalize">
                      {item.kitchenStatus ?? "-"}
                    </td>
                    <td className="px-4 py-3">{item.initialPh ?? "-"}</td>
                    <td className="px-4 py-3">{item.initialDensity ?? "-"}</td>
                    <td className="px-4 py-3 min-w-[220px]">
                      {formatMalts(item)}
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      {formatHops(item)}
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      {formatAdjuncts(item)}
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr className="border-t">
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                      No hay producciones para los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}