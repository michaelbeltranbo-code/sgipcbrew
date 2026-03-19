import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listReadings, getFermenter } from "../api/fermenters";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function FermenterHistoryPage() {
  const { id } = useParams();
  const fermenterId = Number(id);
  const navigate = useNavigate();

  const fermenterQuery = useQuery({
    queryKey: ["fermenter", fermenterId],
    queryFn: () => getFermenter(fermenterId),
    enabled: Number.isFinite(fermenterId),
  });

  const readingsQuery = useQuery({
    queryKey: ["fermenter-readings", fermenterId],
    queryFn: () => listReadings(fermenterId),
    enabled: Number.isFinite(fermenterId),
  });

  const fermenter = fermenterQuery.data;
  const readings = readingsQuery.data ?? [];

  if (fermenterQuery.isLoading || readingsQuery.isLoading) {
    return <div style={{ padding: 24 }}>Cargando historial...</div>;
  }

  if (!fermenter) {
    return <div style={{ padding: 24 }}>No se encontró el fermentador.</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0 }}>{fermenter.name} - Historial completo</h1>
            <p style={{ color: "#64748b" }}>
              Todas las lecturas registradas del fermentador
            </p>
          </div>

          <button onClick={() => navigate(`/fermenters/${fermenterId}`)} style={ghostBtn}>
            Volver al detalle
          </button>
        </div>

        {readings.length === 0 ? (
          <div style={cardStyle}>No hay lecturas registradas.</div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {[...readings].reverse().map((r: any) => (
              <div key={r.id} style={cardStyle}>
                <div style={grid2}>
                  <div><strong>Fecha:</strong> {formatDate(r.recordedAt || r.createdAt)}</div>
                  <div><strong>Producción:</strong> {r.production?.beerName ?? "-"}</div>
                  <div><strong>pH:</strong> {r.ph ?? "-"}</div>
                  <div><strong>Densidad:</strong> {r.density ?? "-"}</div>
                  <div><strong>Temperatura:</strong> {r.temperature ?? "-"}</div>
                  <div><strong>Purgas:</strong> {r.purges ?? "-"}</div>
                  <div><strong>Unidad purga:</strong> {r.purgeUnit ?? "-"}</div>
                  <div><strong>Dry hop:</strong> {r.dryHop ? "Sí" : "No"}</div>
                  <div><strong>Adjuntos:</strong> {r.additions || "-"}</div>
                  <div><strong>Clarificante:</strong> {r.hasClarifier ? "Sí" : "No"}</div>
                  <div><strong>Carbonatada:</strong> {r.isCarbonated ? "Sí" : "No"}</div>
                  <div><strong>Nota:</strong> {r.note || "-"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 10,
};

const ghostBtn: React.CSSProperties = {
  background: "white",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};