import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listProductionReports } from "../api/reports";

export default function ReportsPage() {
  const navigate = useNavigate();

  const [productionId, setProductionId] = useState("");
  const [clientName, setClientName] = useState("");
  const [beerName, setBeerName] = useState("");

  const [appliedFilters, setAppliedFilters] = useState<{
    productionId?: number;
    clientName?: string;
    beerName?: string;
  }>({});

  const reportsQ = useQuery({
    queryKey: ["production-reports", appliedFilters],
    queryFn: () => listProductionReports(appliedFilters),
  });

  const allRows = reportsQ.data ?? [];

  const clientOptions = useMemo(() => {
    return [...new Set(allRows.map((x) => x.clientName).filter(Boolean))].sort();
  }, [allRows]);

  const beerOptions = useMemo(() => {
    return [...new Set(allRows.map((x) => x.beerName).filter(Boolean))].sort();
  }, [allRows]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Reportes de Producción</h1>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Filtros</h2>

        <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <input
            type="number"
            placeholder="ID de la cerveza / producción"
            value={productionId}
            onChange={(e) => setProductionId(e.target.value)}
            style={fieldStyle}
          />

          <select
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={fieldStyle}
          >
            <option value="">Todos los clientes</option>
            {clientOptions.map((x) => (
              <option key={x!} value={x!}>{x}</option>
            ))}
          </select>

          <select
            value={beerName}
            onChange={(e) => setBeerName(e.target.value)}
            style={fieldStyle}
          >
            <option value="">Todas las cervezas</option>
            {beerOptions.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={primaryBtn}
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
              style={secondaryBtn}
              onClick={() => {
                setProductionId("");
                setClientName("");
                setBeerName("");
                setAppliedFilters({});
              }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Resultados</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Cerveza</th>
                <th style={thStyle}>Cliente</th>
                <th style={thStyle}>Fecha</th>
                <th style={thStyle}>Estado</th>
                <th style={thStyle}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.id}</td>
                  <td style={tdStyle}>{item.beerName}</td>
                  <td style={tdStyle}>{item.clientName ?? "-"}</td>
                  <td style={tdStyle}>{item.producedAt ?? "-"}</td>
                  <td style={tdStyle}>{item.status ?? "-"}</td>
                  <td style={tdStyle}>
                    <button
                      style={primaryBtn}
                      onClick={() => navigate(`/reports/${item.id}`)}
                    >
                      Ver informe
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryBtn: React.CSSProperties = {
  background: "#475569",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 700,
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 900,
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  background: "#f8fafc",
  borderBottom: "2px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #e2e8f0",
};