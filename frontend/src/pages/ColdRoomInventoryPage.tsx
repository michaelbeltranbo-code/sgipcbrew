import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listColdRoomInventory } from "../api/fermenters";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function ColdRoomInventoryPage() {
  const [productionId, setProductionId] = useState("");
  const [clientName, setClientName] = useState("");
  const [beerName, setBeerName] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    productionId?: number;
    clientName?: string;
    beerName?: string;
  }>({});

  const inventoryQ = useQuery({
    queryKey: ["cold-room-inventory", appliedFilters],
    queryFn: () => listColdRoomInventory(appliedFilters),
  });

  const allInventoryQ = useQuery({
    queryKey: ["cold-room-inventory-options"],
    queryFn: () => listColdRoomInventory(),
  });

  const rows = inventoryQ.data ?? [];
  const allRows = allInventoryQ.data ?? [];

  const clientOptions = useMemo(() => {
    return [...new Set(
      allRows
        .map((item: any) => String(item.clientName ?? "").trim())
        .filter((x) => x.length > 0)
    )].sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  const beerOptions = useMemo(() => {
    return [...new Set(
      allRows
        .map((item: any) => String(item.beerName ?? "").trim())
        .filter((x) => x.length > 0)
    )].sort((a, b) => a.localeCompare(b));
  }, [allRows]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Inventario del Cuarto Frío</h1>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Filtros</h2>

        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <div>
            <label style={labelStyle}>ID del producto / producción</label>
            <input
              type="number"
              placeholder="Ejemplo: 30"
              value={productionId}
              onChange={(e) => setProductionId(e.target.value)}
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cliente</label>
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={fieldStyle}
            >
              <option value="">Todos los clientes</option>
              {clientOptions.map((client) => (
                <option key={client} value={client}>
                  {client}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Nombre de cerveza</label>
            <select
              value={beerName}
              onChange={(e) => setBeerName(e.target.value)}
              style={fieldStyle}
            >
              <option value="">Todas las cervezas</option>
              {beerOptions.map((beer) => (
                <option key={beer} value={beer}>
                  {beer}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={mainButtonStyle}
              onClick={() =>
                setAppliedFilters({
                  productionId: productionId ? Number(productionId) : undefined,
                  clientName: clientName || undefined,
                  beerName: beerName || undefined,
                })
              }
            >
              Buscar
            </button>

            <button
              style={secondaryButtonStyle}
              onClick={() => {
                setProductionId("");
                setClientName("");
                setBeerName("");
                setAppliedFilters({});
              }}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
  <h2 style={{ marginTop: 0 }}>Resultados</h2>

  {inventoryQ.isLoading && <p>Cargando inventario...</p>}
  {inventoryQ.isError && <p>Error cargando inventario.</p>}

  {!inventoryQ.isLoading && !inventoryQ.isError && rows.length === 0 && (
    <p>No hay registros para los filtros seleccionados.</p>
  )}

  {!inventoryQ.isLoading && !inventoryQ.isError && rows.length > 0 && (
    <div style={{ overflowX: "auto" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Tipo</th>
            <th style={thStyle}>Origen</th>
            <th style={thStyle}>ID producto</th>
            <th style={thStyle}>Cerveza</th>
            <th style={thStyle}>Cliente</th>
            <th style={thStyle}>Barriles 60</th>
            <th style={thStyle}>Barriles 50</th>
            <th style={thStyle}>Barriles 30</th>
            <th style={thStyle}>Litros barriles</th>
            <th style={thStyle}>Unid. 330</th>
            <th style={thStyle}>Unid. 269</th>
            <th style={thStyle}>Litros 330</th>
            <th style={thStyle}>Litros 269</th>
            <th style={thStyle}>Litros botellas</th>
            <th style={thStyle}>Fecha registro</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item) => (
            <tr key={`${item.inventoryType}-${item.id}`}>
              <td style={tdStyle}>{item.inventoryType}</td>
              <td style={tdStyle}>{item.sourceType}</td>
              <td style={tdStyle}>{item.productionId ?? "-"}</td>
              <td style={tdStyle}>{item.beerName}</td>
              <td style={tdStyle}>{item.clientName ?? "-"}</td>
              <td style={tdStyle}>{item.kegs60}</td>
              <td style={tdStyle}>{item.kegs50}</td>
              <td style={tdStyle}>{item.kegs30}</td>
              <td style={tdStyle}>{item.totalKegLiters}</td>
              <td style={tdStyle}>{item.units330}</td>
              <td style={tdStyle}>{item.units269}</td>
              <td style={tdStyle}>{item.litersFrom330}</td>
              <td style={tdStyle}>{item.litersFrom269}</td>
              <td style={tdStyle}>{item.totalBottleLiters}</td>
              <td style={tdStyle}>{formatDate(item.registeredAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  marginBottom: 24,
  padding: 16,
  border: "1px solid #ddd",
  borderRadius: 12,
  background: "white",
};


const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 700,
  marginBottom: 6,
  color: "#0f172a",
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
};

const mainButtonStyle: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  background: "#475569",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1400,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px",
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
  fontWeight: 700,
  color: "#0f172a",
  fontSize: 14,
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: 14,
  color: "#334155",
  whiteSpace: "nowrap",
};