import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLegacyColdRoomKeg,
  getFermenter,
  kegDown,
  listColdRoomKegs,
} from "../api/fermenters";

export default function ColdRoomPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fermenterId = Number(params.get("fermenterId") || 0);
  const transferId = Number(params.get("transferId") || 0);

  const [form, setForm] = useState({
    kegs60: "",
    kegs50: "",
    kegs30: "",
    partialLiters: "",
    lossLiters: "",
    note: "",
  });

  const [legacyForm, setLegacyForm] = useState({
    beerName: "",
    clientName: "",
    kegs60: "",
    kegs50: "",
    kegs30: "",
    totalKegLiters: "",
    lossLiters: "",
    note: "",
  });

  const fermenterQ = useQuery({
    queryKey: ["fermenter", fermenterId],
    queryFn: () => getFermenter(fermenterId),
    enabled: fermenterId > 0,
  });

  const kegsQ = useQuery({
    queryKey: ["cold-room-kegs"],
    queryFn: listColdRoomKegs,
  });

  const saveM = useMutation({
    mutationFn: kegDown,
    onSuccess: async () => {
      setForm({ kegs60: "", kegs50: "", kegs30: "", partialLiters: "", lossLiters: "", note: "" });
      await qc.invalidateQueries({ queryKey: ["cold-room-kegs"] });
      await qc.invalidateQueries({ queryKey: ["fermenter", fermenterId] });
      alert("Barriles guardados en cuarto frío");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || "Error guardando barriles");
    },
  });

  const saveLegacyM = useMutation({
    mutationFn: createLegacyColdRoomKeg,
    onSuccess: async () => {
      setLegacyForm({
        beerName: "",
        clientName: "",
        kegs60: "",
        kegs50: "",
        kegs30: "",
        totalKegLiters: "",
        lossLiters: "",
        note: "",
      });
      await qc.invalidateQueries({ queryKey: ["cold-room-kegs"] });
      alert("Barriles antiguos registrados correctamente");
    },
    onError: (err: any) => {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Error registrando barriles antiguos",
      );
    },
  });

  const fermenter = fermenterQ.data;

  const litersInKegs = useMemo(() => {
    return (
      Number(form.kegs60 || 0) * 60 +
      Number(form.kegs50 || 0) * 50 +
      Number(form.kegs30 || 0) * 30 +
      Number(form.partialLiters || 0)
    );
  }, [form]);

  const legacyLitersInKegs = useMemo(() => {
    return (
      Number(legacyForm.kegs60 || 0) * 60 +
      Number(legacyForm.kegs50 || 0) * 50 +
      Number(legacyForm.kegs30 || 0) * 30
    );
  }, [legacyForm]);

  return (
    <div style={{ padding: 24 }}>
        <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 20,
    }}
  >
    <h1 style={{ margin: 0 }}>Cuarto Frío / Barriles</h1>

    <button
      style={blueButtonStyle}
      onClick={() => navigate("/cold-room/inventory")}
    >
      Ver inventario del cuarto frío
    </button>
  </div>
      
      {fermenter && (
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Bajar cerveza desde fermentador</h2>
          <p><strong>Fermentador:</strong> {fermenter.name}</p>
          <p><strong>ID producción:</strong> {fermenter.currentProduction?.id ?? "-"}</p>
          <p><strong>Cerveza:</strong> {fermenter.currentProduction?.beerName ?? "-"}</p>
          <p><strong>Cliente:</strong> {fermenter.currentProduction?.client?.name ?? "-"}</p>
          <p><strong>Litros disponibles:</strong> {fermenter.currentVolumeLiters ?? 0} L</p>
          <p><strong>Transfer ID:</strong> {transferId || "-"}</p>

          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <p style={{ margin: "0 0 6px 0" }}>
              <strong>Instrucción para el operario:</strong>
            </p>
            <p style={{ margin: 0, color: "#475569" }}>
              Escribe la cantidad de barriles llenos de <strong>60 L</strong>,{" "}
              <strong>50 L</strong> y <strong>30 L</strong>. Si hubo pérdida de cerveza,
              regístrala en <strong>Merma (L)</strong>.
            </p>
          </div>

          <div style={{ display: "grid", gap: 14, maxWidth: 520 }}>
            <div>
              <label style={labelStyle}>Cantidad de barriles de 60 litros</label>
              <input
                type="number"
                min="0"
                placeholder="Ejemplo: 2"
                value={form.kegs60}
                onChange={(e) => setForm((p) => ({ ...p, kegs60: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Cantidad de barriles de 50 litros</label>
              <input
                type="number"
                min="0"
                placeholder="Ejemplo: 1"
                value={form.kegs50}
                onChange={(e) => setForm((p) => ({ ...p, kegs50: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Cantidad de barriles de 30 litros</label>
              <input
                type="number"
                min="0"
                placeholder="Ejemplo: 4"
                value={form.kegs30}
                onChange={(e) => setForm((p) => ({ ...p, kegs30: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div style={{
              background: "#faf5ff",
              border: "1px dashed #c4b5fd",
              borderRadius: 10,
              padding: 12,
            }}>
              <label style={{ ...labelStyle, color: "#6d28d9" }}>
                Barril parcial — cantidad exacta (L)
              </label>
              <p style={{ margin: "0 0 8px", fontSize: 13, color: "#7c3aed" }}>
                Usa este campo si queda cerveza que no alcanza para un barril completo.
                Ej: quedan 18 L → escribe 18.
              </p>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Ej: 18"
                value={form.partialLiters}
                onChange={(e) => setForm((p) => ({ ...p, partialLiters: e.target.value }))}
                style={{ ...fieldStyle, borderColor: "#c4b5fd" }}
              />
            </div>

            <div>
              <label style={labelStyle}>Merma del proceso (litros perdidos)</label>
              <input
                type="number"
                min="0"
                placeholder="Ejemplo: 3"
                value={form.lossLiters}
                onChange={(e) => setForm((p) => ({ ...p, lossLiters: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Observaciones</label>
              <textarea
                placeholder="Ejemplo: 2 barriles de 60 L + 1 barril parcial de 18 L"
                value={form.note}
                onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }}
              />
            </div>

            <div style={summaryBoxStyle}>
              <div><strong>Resumen automático</strong></div>
              <div>Barriles completos: {Number(form.kegs60||0)*60 + Number(form.kegs50||0)*50 + Number(form.kegs30||0)*30} L</div>
              {Number(form.partialLiters || 0) > 0 && (
                <div>Barril parcial: <strong>{form.partialLiters} L</strong></div>
              )}
              <div>Merma registrada: {Number(form.lossLiters || 0)} L</div>
              <div style={{ marginTop: 6, fontWeight: 700 }}>
                Total que saldrá del fermentador:{" "}
                {litersInKegs + Number(form.lossLiters || 0)} L
              </div>
            </div>

            <button
              style={greenButtonStyle}
              onClick={() => {
                if (!transferId) {
                  alert("No hay transferId disponible");
                  return;
                }

                saveM.mutate({
                  transferId,
                  kegs60: Number(form.kegs60 || 0),
                  kegs50: Number(form.kegs50 || 0),
                  kegs30: Number(form.kegs30 || 0),
                  partialLiters: Number(form.partialLiters || 0),
                  lossLiters: Number(form.lossLiters || 0),
                  note: form.note || undefined,
                });
              }}
            >
              Guardar barriles en cuarto frío
            </button>
          </div>
        </div>
      )}

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Registrar barriles ya existentes en cuarto frío</h2>

        <p style={{ color: "#475569", marginTop: 0 }}>
          Usa este formulario para ingresar cerveza antigua que ya estaba en el cuarto frío
          antes de implementar el sistema.
        </p>

        <div
          style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: 10,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <p style={{ margin: "0 0 6px 0" }}>
            <strong>Instrucción para el operario:</strong>
          </p>
          <p style={{ margin: 0, color: "#7c2d12" }}>
            Aquí debes registrar los barriles antiguos que ya estaban guardados en el
            cuarto frío y que no tienen relación con un fermentador o con una producción
            del sistema.
          </p>
        </div>

        <div style={{ display: "grid", gap: 14, maxWidth: 520 }}>
          <div>
            <label style={labelStyle}>Nombre de la cerveza</label>
            <input
              type="text"
              placeholder="Ejemplo: Rubia Especial"
              value={legacyForm.beerName}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, beerName: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cliente (opcional)</label>
            <input
              type="text"
              placeholder="Ejemplo: Bar La Esquina"
              value={legacyForm.clientName}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, clientName: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cantidad de barriles de 60 litros</label>
            <input
              type="number"
              min="0"
              placeholder="Ejemplo: 2"
              value={legacyForm.kegs60}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, kegs60: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cantidad de barriles de 50 litros</label>
            <input
              type="number"
              min="0"
              placeholder="Ejemplo: 1"
              value={legacyForm.kegs50}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, kegs50: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Cantidad de barriles de 30 litros</label>
            <input
              type="number"
              min="0"
              placeholder="Ejemplo: 3"
              value={legacyForm.kegs30}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, kegs30: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Litros totales estimados en esos barriles</label>
            <input
              type="number"
              min="0"
              placeholder={`Sugerido: ${legacyLitersInKegs}`}
              value={legacyForm.totalKegLiters}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, totalKegLiters: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Merma estimada (si aplica)</label>
            <input
              type="number"
              min="0"
              placeholder="Ejemplo: 0"
              value={legacyForm.lossLiters}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, lossLiters: e.target.value }))
              }
              style={fieldStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Observaciones</label>
            <textarea
              placeholder="Ejemplo: Cerveza producida antes del sistema"
              value={legacyForm.note}
              onChange={(e) =>
                setLegacyForm((p) => ({ ...p, note: e.target.value }))
              }
              style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }}
            />
          </div>

          <div style={legacySummaryBoxStyle}>
            <div><strong>Resumen automático</strong></div>
            <div>Litros calculados por barriles: {legacyLitersInKegs} L</div>
            <div>Litros totales escritos: {Number(legacyForm.totalKegLiters || 0)} L</div>
            <div>Merma estimada: {Number(legacyForm.lossLiters || 0)} L</div>
          </div>

          <button
            style={orangeButtonStyle}
            onClick={() => {
              if (!legacyForm.beerName.trim()) {
                alert("Debes escribir el nombre de la cerveza");
                return;
              }

              saveLegacyM.mutate({
                beerName: legacyForm.beerName.trim(),
                clientName: legacyForm.clientName.trim() || undefined,
                kegs60: Number(legacyForm.kegs60 || 0),
                kegs50: Number(legacyForm.kegs50 || 0),
                kegs30: Number(legacyForm.kegs30 || 0),
                totalKegLiters: Number(
                  legacyForm.totalKegLiters || legacyLitersInKegs || 0,
                ),
                lossLiters: Number(legacyForm.lossLiters || 0),
                note: legacyForm.note.trim() || undefined,
              });
            }}
          >
            Registrar barriles antiguos en cuarto frío
          </button>
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

const greenButtonStyle: React.CSSProperties = {
  background: "#0f766e",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const orangeButtonStyle: React.CSSProperties = {
  background: "#c2410c",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const summaryBoxStyle: React.CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 10,
  padding: 12,
};

const legacySummaryBoxStyle: React.CSSProperties = {
  background: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: 10,
  padding: 12,
};

const inventoryRowStyle: React.CSSProperties = {
  borderBottom: "1px solid #eee",
  padding: "10px 0",
};

const blueButtonStyle: React.CSSProperties = {
  background: "#1d4ed8",
  color: "white",
  border: "none",
  borderRadius: 10,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

