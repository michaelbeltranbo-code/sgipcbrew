import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  createBrewBatch,
  listRawMaterials,
  type BrewBatchHop,
  type KitchenStatus,
} from "../api/production";
import { listClients } from "../api/clients";

function num(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

type MaltRow = {
  rawMaterialId: number;
  quantityKg: number;
  lot?: string;
};

type AdjunctRow = {
  rawMaterialId: string;
  quantityKg: string;
  additionMoment: string;
  notes: string;
};

export default function ProductionPage() {
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  const [beerName, setBeerName] = useState("");
  
  const [clientId, setClientId] = useState(0);
  const [selectedFermenterId, setSelectedFermenterId] = useState(0);
  const [producedAt, setProducedAt] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  const [kitchenStatus, setKitchenStatus] = useState<KitchenStatus>("limpia");
  const navigate = useNavigate();
  const [initialPh, setInitialPh] = useState("");
  const [initialDensity, setInitialDensity] = useState("");
  const [postBoilLiters, setPostBoilLiters] = useState("");

  const [malts, setMalts] = useState<MaltRow[]>([
    { rawMaterialId: 0, quantityKg: 0, lot: "" },
  ]);

  const [hops, setHops] = useState<BrewBatchHop[]>([
    { rawMaterialId: 0, quantityGrams: 0, boilMinute: 60 } as BrewBatchHop,
  ]);

  const [adjuncts, setAdjuncts] = useState<AdjunctRow[]>([
    { rawMaterialId: "", quantityKg: "", additionMoment: "", notes: "" },
  ]);

  const rawQ = useQuery({
    queryKey: ["raw-materials"],
    queryFn: listRawMaterials,
  });

  const clientsQ = useQuery({
    queryKey: ["clients"],
    queryFn: listClients,
  });

  const rawMaterials = rawQ.data ?? [];

  const maltOptions = useMemo(() => {
    return rawMaterials.filter((r: any) => r.type === "malta");
  }, [rawMaterials]);

  const hopOptions = useMemo(() => {
    return rawMaterials.filter((r: any) => r.type === "lupulo");
  }, [rawMaterials]);

  const adjunctOptions = useMemo(() => {
    return rawMaterials.filter((r: any) => r.type === "adjuntos");
  }, [rawMaterials]);

  const canEditBrewData = kitchenStatus === "sanitizada";

  const fermentersMock = [
    { id: 1, name: "Fermentador 1", status: "" },
    { id: 2, name: "Fermentador 2", status: "" },
    { id: 3, name: "Fermentador 3", status: "" },
  ];

  function addAdjunctRow() {
    setAdjuncts((prev) => [
      ...prev,
      { rawMaterialId: "", quantityKg: "", additionMoment: "", notes: "" },
    ]);
  }

  function removeAdjunctRow(index: number) {
    setAdjuncts((prev) => prev.filter((_, i) => i !== index));
  }

  function updateAdjunctRow(
    index: number,
    field: keyof AdjunctRow,
    value: string,
  ) {
    setAdjuncts((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  }

  const createM = useMutation({
    mutationFn: async () => {
      if (!beerName.trim()) {
        throw new Error("beerName es obligatorio");
      }   

      if (kitchenStatus !== "sanitizada") {
        throw new Error(
          "Solo puedes registrar la cocción cuando la cocina está sanitizada",
        );
      }

      if (!clientId || clientId <= 0) {
        throw new Error("Debes seleccionar un cliente");
      }

      if (!selectedFermenterId || selectedFermenterId <= 0) {
        throw new Error("Debes seleccionar un fermentador destino");
      }

      const ph = num(initialPh);
      if (!(ph >= 3.5 && ph <= 5.8)) {
        throw new Error("pH inicial debe estar entre 3.5 y 5.8");
      }

      const dens = num(initialDensity);
      if (!(dens >= 1.03 && dens <= 1.08)) {
        throw new Error("Densidad inicial debe estar entre 1.030 y 1.080");
      }

      const litersToProduce = num(postBoilLiters);
      if (!(litersToProduce > 0)) {
        throw new Error(
          "Litros a producir debe ser un número válido mayor que 0",
        );
      }

      for (const m of malts) {
        if (!m.rawMaterialId) throw new Error("Selecciona una malta");
        if (!(m.quantityKg > 0)) {
          throw new Error("Cantidad de malta debe ser > 0");
        }
      }

      for (const h of hops) {
        if (!h.rawMaterialId) throw new Error("Selecciona un lúpulo");
        if (!(h.quantityGrams > 0)) {
          throw new Error("Cantidad de lúpulo debe ser > 0");
        }
      }

      const validAdjuncts = adjuncts
        .filter((a) => a.rawMaterialId !== "" || a.quantityKg !== "")
        .map((a) => ({
          rawMaterialId: Number(a.rawMaterialId),
          quantityKg: Number(a.quantityKg),
          additionMoment: a.additionMoment.trim() || undefined,
          notes: a.notes.trim() || undefined,
        }));

      for (const a of validAdjuncts) {
        if (!a.rawMaterialId || a.rawMaterialId <= 0) {
          throw new Error("Selecciona un adjunto válido");
        }
        if (!(a.quantityKg > 0)) {
          throw new Error("Cantidad de adjunto debe ser > 0");
        }
      }

      return createBrewBatch({
      beerName: beerName.trim(),
      clientId,
      kitchenStatus,
      producedAt,
      initialPh: ph,
      initialDensity: dens,
      boilLiters: litersToProduce,
      postBoilLiters: litersToProduce,
      plannedFermenterId: selectedFermenterId,
      malts,
      hops,
      adjuncts: validAdjuncts,
    });
    },

    onSuccess: () => {
      setMsg({ type: "ok", text: "Cocción registrada y stock descontado ✅" });

      setBeerName("");
      setClientId(0);
      setSelectedFermenterId(0);
      setInitialPh("");
      setInitialDensity("");
      setPostBoilLiters("");
      setMalts([{ rawMaterialId: 0, quantityKg: 0, lot: "" }]);
      setHops([{ rawMaterialId: 0, quantityGrams: 0, boilMinute: 60 } as BrewBatchHop]);
      setAdjuncts([
        { rawMaterialId: "", quantityKg: "", additionMoment: "", notes: "" },
      ]);
    },

    onError: (err: any) => {
      const apiMsg =
        err?.response?.data?.message ??
        err?.message ??
        "Error registrando cocción";
      setMsg({ type: "err", text: String(apiMsg) });
    },
  });

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, flex: 1 }}>
          Producción / Cocción (Brew Batch)
        </h1>
        <button
          onClick={() => navigate("/plant")}
          type="button"
          style={{
            border: "1px solid #cbd5e1",
            borderRadius: 10,
            padding: "8px 16px",
            background: "white",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          ← Volver al mapa
        </button>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 12,
            padding: 10,
            borderRadius: 12,
            border: "1px solid",
            borderColor: msg.type === "ok" ? "#86efac" : "#fecaca",
            background: msg.type === "ok" ? "#dcfce7" : "#fee2e2",
            color: msg.type === "ok" ? "#166534" : "#991b1b",
            fontWeight: 800,
          }}
        >
          {msg.text}
        </div>
      )}

      <div style={card}>
        <h2 style={h2}>Estado de la cocina</h2>

        <div style={grid1}>
          <Field label="Estado de cocina">
            <select
              value={kitchenStatus}
              onChange={(e) => setKitchenStatus(e.target.value as KitchenStatus)}
              style={input}
            >
              <option value="en_produccion">en_produccion</option>
              <option value="sucia">sucia</option>
              <option value="limpia">limpia</option>
              <option value="sanitizada">sanitizada</option>
            </select>
          </Field>
        </div>
      </div>

      <div style={card}>
        <h2 style={h2}>Datos de cocción</h2>

        {!canEditBrewData && (
          <div style={warningBox}>
            Esta sección solo se habilita cuando la cocina está en estado{" "}
            <b>sanitizada</b>.
          </div>
        )}

        <div style={grid2}>
          <Field label="Cerveza nombre *">
            <input
              value={beerName}
              onChange={(e) => setBeerName(e.target.value)}
              style={input}
              disabled={!canEditBrewData}
            />
          </Field>

          

          <Field label="Cliente *">
            <select
              value={clientId}
              onChange={(e) => setClientId(Number(e.target.value))}
              style={input}
              disabled={!canEditBrewData}
            >
              <option value={0}>-- seleccionar cliente --</option>
              {(clientsQ.data ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Fecha producción">
            <input
              type="date"
              value={producedAt}
              onChange={(e) => setProducedAt(e.target.value)}
              style={input}
              disabled={!canEditBrewData}
            />
          </Field>

          <Field label="pH inicial (3.5-5.8)">
            <input
              value={initialPh}
              onChange={(e) => setInitialPh(e.target.value)}
              style={input}
              disabled={!canEditBrewData}
            />
          </Field>

          <Field label="Densidad inicial (1.030-1.080)">
            <input
              value={initialDensity}
              onChange={(e) => setInitialDensity(e.target.value)}
              style={input}
              disabled={!canEditBrewData}
            />
          </Field>

          <Field label="Litros a producir">
            <input
              value={postBoilLiters}
              onChange={(e) => setPostBoilLiters(e.target.value)}
              style={input}
              disabled={!canEditBrewData}
            />
          </Field>

          <Field label="Fermentador destino">
            <select
              value={selectedFermenterId}
              onChange={(e) => setSelectedFermenterId(Number(e.target.value))}
              style={input}
              disabled={!canEditBrewData}
            >
              <option value={0}>-- seleccionar fermentador --</option>
              {fermentersMock.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} - {f.status}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2 style={h2}>Maltas utilizadas</h2>
          <button
            style={btnGhost}
            onClick={() =>
              setMalts((prev) => [...prev, { rawMaterialId: 0, quantityKg: 0, lot: "" }])
            }
            disabled={!canEditBrewData}
            type="button"
          >
            + Agregar malta
          </button>
        </div>

        {malts.map((m, idx) => (
          <div key={idx} style={row3}>
            <Field label="Tipo de malta">
              <select
                value={m.rawMaterialId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMalts((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, rawMaterialId: v } : x,
                    ),
                  );
                }}
                style={input}
                disabled={!canEditBrewData}
              >
                <option value={0}>-- seleccionar --</option>
                {maltOptions.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (stock: {r.quantity} {r.unit})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cantidad (kg)">
              <input
                value={String(m.quantityKg)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMalts((prev) =>
                    prev.map((x, i) =>
                      i === idx ? { ...x, quantityKg: v } : x,
                    ),
                  );
                }}
                style={input}
                disabled={!canEditBrewData}
              />
            </Field>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                style={btnDanger}
                onClick={() =>
                  setMalts((prev) => prev.filter((_, i) => i !== idx))
                }
                disabled={!canEditBrewData || malts.length === 1}
                title={
                  malts.length === 1
                    ? "Debe existir al menos 1 malta"
                    : "Eliminar"
                }
                type="button"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2 style={h2}>Lúpulos utilizados</h2>
          <button
            style={btnGhost}
            onClick={() =>
              setHops((prev) => [
                ...prev,
                { rawMaterialId: 0, quantityGrams: 0, boilMinute: 60 } as BrewBatchHop,
              ])
            }
            disabled={!canEditBrewData}
            type="button"
          >
            + Agregar lúpulo
          </button>
        </div>

        {hops.map((h, idx) => (
          <div key={idx} style={row3}>
            <Field label="Tipo de lúpulo">
              <select
                value={h.rawMaterialId}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setHops((prev) =>
                    prev.map((x, i) =>
                      i === idx ? ({ ...x, rawMaterialId: v } as BrewBatchHop) : x,
                    ),
                  );
                }}
                style={input}
                disabled={!canEditBrewData}
              >
                <option value={0}>-- seleccionar --</option>
                {hopOptions.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (stock: {r.quantity} {r.unit})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cantidad (gramos)">
              <input
                value={String(h.quantityGrams)}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setHops((prev) =>
                    prev.map((x, i) =>
                      i === idx
                        ? ({ ...x, quantityGrams: v } as BrewBatchHop)
                        : x,
                    ),
                  );
                }}
                style={input}
                disabled={!canEditBrewData}
              />
            </Field>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                style={btnDanger}
                onClick={() =>
                  setHops((prev) => prev.filter((_, i) => i !== idx))
                }
                disabled={!canEditBrewData || hops.length === 1}
                type="button"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <h2 style={h2}>Adjuntos utilizados</h2>
          <button
            style={btnGhost}
            onClick={addAdjunctRow}
            disabled={!canEditBrewData}
            type="button"
          >
            + Agregar adjunto
          </button>
        </div>

        {adjuncts.map((a, idx) => (
          <div key={idx} style={row4}>
            <Field label="Adjunto">
              <select
                value={a.rawMaterialId}
                onChange={(e) =>
                  updateAdjunctRow(idx, "rawMaterialId", e.target.value)
                }
                style={input}
                disabled={!canEditBrewData}
              >
                <option value="">-- seleccionar --</option>
                {adjunctOptions.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (stock: {r.quantity} {r.unit})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cantidad (kg)">
              <input
                value={a.quantityKg}
                onChange={(e) =>
                  updateAdjunctRow(idx, "quantityKg", e.target.value)
                }
                style={input}
                disabled={!canEditBrewData}
              />
            </Field>

            <Field label="Momento de adición">
              <input
                value={a.additionMoment}
                onChange={(e) =>
                  updateAdjunctRow(idx, "additionMoment", e.target.value)
                }
                style={input}
                placeholder="Mash / hervor / whirlpool / fermentación"
                disabled={!canEditBrewData}
              />
            </Field>

            <Field label="Notas">
              <input
                value={a.notes}
                onChange={(e) => updateAdjunctRow(idx, "notes", e.target.value)}
                style={input}
                disabled={!canEditBrewData}
              />
            </Field>

            <div style={{ display: "flex", alignItems: "end" }}>
              <button
                style={btnDanger}
                onClick={() => removeAdjunctRow(idx)}
                disabled={!canEditBrewData || adjuncts.length === 1}
                type="button"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button
          style={btnPrimary}
          onClick={() => createM.mutate()}
          disabled={createM.isPending || !canEditBrewData}
        >
          Registrar cocción
        </button>

        <button
          style={btnGhost}
           onClick={() => navigate("/production/history")}
                >
                   Ir al historial de producción
          </button>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const card: React.CSSProperties = {
  marginTop: 14,
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
};

const h2: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 12,
};

const grid1: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 12,
  marginTop: 12,
};

const warningBox: React.CSSProperties = {
  marginTop: 12,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #fde68a",
  background: "#fffbeb",
  color: "#92400e",
  fontWeight: 700,
};

const row3: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr auto",
  gap: 12,
  marginTop: 12,
  alignItems: "end",
};

const row4: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "2fr 1fr 1fr 1fr auto",
  gap: 12,
  marginTop: 12,
  alignItems: "end",
};

const input: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 12,
  padding: "10px 12px",
  outline: "none",
  fontSize: 14,
};

const btnPrimary: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: 0,
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 900,
};

const btnGhost: React.CSSProperties = {
  background: "transparent",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 900,
};

const btnDanger: React.CSSProperties = {
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 12,
  padding: "10px 14px",
  cursor: "pointer",
  fontWeight: 900,
};