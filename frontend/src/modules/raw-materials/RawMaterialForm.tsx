import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateRawMaterialBody, RawMaterialType, Unit } from "./rawMaterial.types";
import { createRawMaterial, fetchClients } from "./rawMaterial.service";

const typeOptions: { value: RawMaterialType; label: string }[] = [
  { value: "malta", label: "Malta" },
  { value: "lupulo", label: "Lúpulo" },
  { value: "levadura", label: "Levadura" },
  { value: "adjuntos", label: "Adjuntos" },
  { value: "sales", label: "Sales" },
];

const unitOptions: Unit[] = ["kg", "g", ];

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function RawMaterialForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<CreateRawMaterialBody>({
    name: "",
    type: "malta",
    clientId: 0,
    supplier: "",
    lot: "",
    quantity: 0,
    unit: "kg",
    receivedAt: todayISO(),
  });

  const [uiError, setUiError] = useState<string | null>(null);
  const [uiOk, setUiOk] = useState<string | null>(null);

  const clientsQuery = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const clientOptions = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data]);

  const mutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: async () => {
      setUiError(null);
      setUiOk("Materia prima guardada correctamente.");
      await qc.invalidateQueries({ queryKey: ["raw-materials"] });

      // reset parcial (mantiene fecha y unidad)
      setForm((prev) => ({
        ...prev,
        name: "",
        supplier: "",
        lot: "",
        quantity: 0,
      }));
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? err?.message ?? "Error guardando materia prima";
      setUiOk(null);
      setUiError(String(msg));
    },
  });

  function update<K extends keyof CreateRawMaterialBody>(key: K, value: CreateRawMaterialBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): string | null {
    if (!form.name.trim()) return "Nombre es obligatorio.";
    if (!form.type) return "Tipo es obligatorio.";
    if (!form.clientId || form.clientId <= 0) return "Cliente es obligatorio.";
    if (!form.supplier.trim()) return "Proveedor es obligatorio.";
    if (!form.lot.trim()) return "Lote es obligatorio.";
    if (Number.isNaN(Number(form.quantity)) || Number(form.quantity) <= 0) return "Cantidad debe ser mayor a 0.";
    if (!form.unit) return "Unidad es obligatoria.";
    if (!form.receivedAt) return "Fecha de ingreso es obligatoria.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUiOk(null);

    const v = validate();
    if (v) {
      setUiError(v);
      return;
    }
    setUiError(null);
    mutation.mutate(form);
  }

  return (
    <div className="min-h-[calc(100vh-0px)] flex justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <h1 className="text-2xl font-bold text-center">Registro de Materia Prima</h1>
          <p className="text-sm text-slate-600 text-center mt-1">
            Registra maltas, lúpulos, levaduras, adjuntos y sales con trazabilidad.
          </p>

          {uiError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {uiError}
            </div>
          )}
          {uiOk && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {uiOk}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {/* fila 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nombre *</label>
                <input
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Ej: Pilsen Weyermann"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Tipo *</label>
                <select
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.type}
                  onChange={(e) => update("type", e.target.value as RawMaterialType)}
                >
                  {typeOptions.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* fila 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Cliente *</label>
                <select
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.clientId}
                  onChange={(e) => update("clientId", Number(e.target.value))}
                  disabled={clientsQuery.isLoading}
                >
                  <option value={0}>
                    {clientsQuery.isLoading ? "Cargando clientes..." : "Seleccione un cliente"}
                  </option>
                  {clientOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {clientsQuery.isError && (
                  <p className="text-xs text-red-600 mt-1">
                    Error cargando clientes. Revisa que exista GET /clients.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Proveedor *</label>
                <input
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.supplier}
                  onChange={(e) => update("supplier", e.target.value)}
                  placeholder="Ej: Weyermann"
                />
              </div>
            </div>

            {/* fila 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Lote *</label>
                <input
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.lot}
                  onChange={(e) => update("lot", e.target.value)}
                  placeholder="Ej: LOT-001"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Cantidad *</label>
                <input
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  type="number"
                  value={form.quantity}
                  onChange={(e) => update("quantity", Number(e.target.value))}
                  min={0}
                  step="0.01"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Unidad *</label>
                <select
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={form.unit}
                  onChange={(e) => update("unit", e.target.value as Unit)}
                >
                  {unitOptions.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* fila 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Fecha de ingreso *</label>
                <input
                  className="mt-1 w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  type="date"
                  value={form.receivedAt}
                  onChange={(e) => update("receivedAt", e.target.value)}
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full md:w-auto px-5 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {mutation.isPending ? "Guardando..." : "Guardar materia prima"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/raw-materials/inventory")}
                  className="w-full md:w-auto px-5 py-2 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800"
                >
                  Ver inventario
                </button>
              </div>
            </div>
          </form>
        </div>

        <p className="text-xs text-slate-500 text-center mt-4">
          * Campos obligatorios
        </p>
      </div>
    </div>
  );
}