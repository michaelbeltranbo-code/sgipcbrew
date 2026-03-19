import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { fetchRawMaterials } from "./rawMaterial.service";
import type { RawMaterialType } from "./rawMaterial.types";
import { isLowStock, lowStockLabel } from "./stock.utils";

export default function RawMaterialsInventoryPage() {
  // 1) hooks primero
  const q = useQuery({
    queryKey: ["raw-materials"],
    queryFn: fetchRawMaterials,
  });

  const data = q.data ?? [];

  // 2) filtros
  const [typeFilter, setTypeFilter] = useState<RawMaterialType | "all">("all");
  const [clientFilter, setClientFilter] = useState<number | "all">("all");

  // lista de clientes disponibles (para el select)
  const clients = useMemo(() => {
    const map = new Map<number, string>();
    for (const rm of data) {
      if (rm.client?.id && rm.client?.name) map.set(rm.client.id, rm.client.name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((rm) => {
      const byType = typeFilter === "all" ? true : rm.type === typeFilter;
      const byClient =
        clientFilter === "all" ? true : (rm.client?.id ?? -1) === clientFilter;
      return byType && byClient;
    });
  }, [data, typeFilter, clientFilter]);

  // 3) renders seguros
  if (q.isLoading) return <div className="p-6">Cargando inventario...</div>;

  if (q.isError) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-medium">Error cargando inventario.</p>
        <p className="text-sm text-slate-600">Revisa consola o el backend.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-slate-900">
            Inventario de Materias Primas
          </h1>

          <div className="flex flex-wrap items-center gap-3">
            {/* filtro tipo */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Tipo:</label>
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
              >
                <option value="all">Todos</option>
                <option value="malta">Malta</option>
                <option value="lupulo">Lúpulo</option>
                <option value="levadura">Levadura</option>
                <option value="adjuntos">Adjuntos</option>
                <option value="sales">Sales</option>
              </select>
            </div>

            {/* filtro cliente */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-600">Cliente:</label>
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={clientFilter}
                onChange={(e) =>
                  setClientFilter(e.target.value === "all" ? "all" : Number(e.target.value))
                }
              >
                <option value="all">Todos</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-auto rounded-lg border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Cantidad</th>
                <th className="text-left px-4 py-3">Unidad</th>
                <th className="text-left px-4 py-3">Lote</th>
                <th className="text-left px-4 py-3">Proveedor</th>
                <th className="text-left px-4 py-3">Fecha ingreso</th>
                <th className="text-left px-4 py-3">Alerta</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((rm) => {
                const low = isLowStock(rm);
                return (
                  <tr key={rm.id} className="border-t">
                    <td className="px-4 py-3">{rm.name}</td>
                    <td className="px-4 py-3 capitalize">{rm.type}</td>
                    <td className="px-4 py-3">{rm.client?.name ?? "-"}</td>
                    <td className="px-4 py-3">{rm.quantity}</td>
                    <td className="px-4 py-3">{rm.unit}</td>
                    <td className="px-4 py-3">{rm.lot}</td>
                    <td className="px-4 py-3">{rm.supplier}</td>
                    <td className="px-4 py-3">
                      {rm.createdAt ? new Date(rm.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {low ? (
                        <span
                          className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-3 py-1 text-xs font-medium"
                          title={lowStockLabel(rm)}
                        >
                          STOCK BAJO
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr className="border-t">
                  <td className="px-4 py-6 text-slate-500" colSpan={9}>
                    No hay materias primas para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500 mt-3">
          * La alerta “stock bajo” se calcula en  <b>kg</b> (se convierte automáticamente).
        </p>
      </div>
    </div>
  );
}