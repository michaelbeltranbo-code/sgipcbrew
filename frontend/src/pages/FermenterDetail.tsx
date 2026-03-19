import { useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createReading,
  getFermenter,
  listReadings,
  startFermentation,
  startTransfer,
  finishTransfer,
  updateFermenterStatus,
  type FermenterStatus,
} from "../api/fermenters";
import { listProductions } from "../api/production";

function getFermentationDays(production: any) {
  const baseDate = production?.fermentationStartedAt || production?.producedAt || null;
  if (!baseDate) return "-";

  const start = new Date(baseDate);
  if (Number.isNaN(start.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days >= 0 ? days : 0;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function statusLabel(status: FermenterStatus) {
  switch (status) {
    case "disponible":
      return "Disponible";
    case "reservado":
      return "Reservado";
    case "en_fermentacion":
      return "En fermentación";
    case "en_trasiego":
      return "En trasiego";
    case "vacio_sucio":
      return "Vacío sucio";
    case "limpio":
      return "Limpio";
    case "sanitizado":
      return "Sanitizado";
    default:
      return status;
  }
}

function badgeStyle(status: FermenterStatus): React.CSSProperties {
  const map: Record<FermenterStatus, React.CSSProperties> = {
    disponible: { background: "#dcfce7", color: "#166534" },
    reservado: { background: "#fef3c7", color: "#92400e" },
    en_fermentacion: { background: "#dbeafe", color: "#1d4ed8" },
    en_trasiego: { background: "#ffedd5", color: "#c2410c" },
    vacio_sucio: { background: "#fee2e2", color: "#b91c1c" },
    limpio: { background: "#cffafe", color: "#0f766e" },
    sanitizado: { background: "#d1fae5", color: "#047857" },
  };

  return {
    ...map[status],
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 700,
    fontSize: 13,
    display: "inline-block",
  };
}

export default function FermenterDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const id = Number(params.id);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [readingForm, setReadingForm] = useState({
    productionId: "",
    ph: "",
    density: "",
    temperature: "",
    purges: "",
    purgeUnit: "kg" as "kg" | "l",
    dryHop: false,
    additions: "",
    hasClarifier: false,
    isCarbonated: false,
    note: "",
    recordedAt: "",
  });

  const [fermentationForm, setFermentationForm] = useState({
    batchId: "",
    brewedLiters: "",
  });

  const [transferForm, setTransferForm] = useState({
    batchId: "",
    destinationType: "mixto",
    note: "",
  });

  const [finishTransferForm, setFinishTransferForm] = useState({
    transferId: "",
    note: "",
  });

  const [statusForm, setStatusForm] = useState({
    note: "",
  });

  const fermenterQuery = useQuery({
    queryKey: ["fermenter", id],
    queryFn: () => getFermenter(id),
    enabled: Number.isFinite(id),
  });

  const readingsQuery = useQuery({
    queryKey: ["fermenter-readings", id],
    queryFn: () => listReadings(id),
    enabled: Number.isFinite(id),
  });

  const productionsQuery = useQuery({
    queryKey: ["productions"],
    queryFn: listProductions,
  });

  const refreshAll = async () => {
    await qc.invalidateQueries({ queryKey: ["fermenter", id] });
    await qc.invalidateQueries({ queryKey: ["fermenter-readings", id] });
    await qc.invalidateQueries({ queryKey: ["fermenters"] });
    await qc.invalidateQueries({ queryKey: ["productions"] });
  };

  const createReadingMutation = useMutation({
    mutationFn: (payload: {
      productionId?: number;
      ph?: number;
      density?: number;
      temperature?: number;
      purges?: number;
      purgeUnit?: "kg" | "l";
      dryHop?: boolean;
      additions?: string;
      hasClarifier?: boolean;
      isCarbonated?: boolean;
      note?: string;
      recordedAt?: string;
    }) => createReading(id, payload),
    onSuccess: async () => {
      setMsg({ type: "ok", text: "Lectura guardada correctamente." });
      setReadingForm({
        productionId: "",
        ph: "",
        density: "",
        temperature: "",
        purges: "",
        purgeUnit: "kg",
        dryHop: false,
        additions: "",
        hasClarifier: false,
        isCarbonated: false,
        note: "",
        recordedAt: "",
      });
      await refreshAll();
    },
    onError: (error: any) => {
      setMsg({
        type: "err",
        text: error?.response?.data?.message || "No se pudo guardar la lectura.",
      });
    },
  });

  const startFermentationMutation = useMutation({
    mutationFn: startFermentation,
    onSuccess: async () => {
      setMsg({ type: "ok", text: "Fermentación iniciada correctamente." });
      setFermentationForm({ batchId: "", brewedLiters: "" });
      await refreshAll();
    },
    onError: (error: any) => {
      setMsg({
        type: "err",
        text: error?.response?.data?.message || "No se pudo iniciar la fermentación.",
      });
    },
  });

  const startTransferMutation = useMutation({
    mutationFn: startTransfer,
    onSuccess: async () => {
      setMsg({ type: "ok", text: "Trasiego iniciado correctamente." });
      setTransferForm({ batchId: "", destinationType: "barril", note: "" });
      await refreshAll();
    },
    onError: (error: any) => {
      setMsg({
        type: "err",
        text: error?.response?.data?.message || "No se pudo iniciar el trasiego.",
      });
    },
  });

  const finishTransferMutation = useMutation({
    mutationFn: finishTransfer,
    onSuccess: async () => {
      setMsg({ type: "ok", text: "Trasiego finalizado correctamente." });
      setFinishTransferForm({ transferId: "", note: "" });
      await refreshAll();
    },
    onError: (error: any) => {  
      setMsg({
        type: "err",
        text: error?.response?.data?.message || "No se pudo finalizar el trasiego.",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: updateFermenterStatus,
    onSuccess: async () => {
      setMsg({ type: "ok", text: "Estado actualizado correctamente." });
      setStatusForm({ note: "" });
      await refreshAll();
    },
    onError: (error: any) => {
      setMsg({
        type: "err",
        text: error?.response?.data?.message || "No se pudo actualizar el estado.",
      });
    },
  });

  const fermenter = fermenterQuery.data;
  const readings = readingsQuery.data ?? [];
  const productions = productionsQuery.data ?? [];

  const currentProduction = useMemo(() => {
  return fermenter?.currentProduction ?? null;
}, [fermenter]);

  const openTransfer = useMemo(() => {
  const transfers = fermenter?.transfers ?? [];
  const open = [...transfers].reverse().find((t: any) => !t.finishedAt);
  return open ?? null;
}, [fermenter]);

  const availableProductions = useMemo(() => {
    return productions.filter(
      (p: any) => p.status === "brewed" || p.status === "waiting_for_fermenter",
    );
  }, [productions]);

  if (fermenterQuery.isLoading) {
    return <div style={{ padding: 24 }}>Cargando fermentador...</div>;
  }

  if (fermenterQuery.isError || !fermenter) {
    return <div style={{ padding: 24, color: "#b91c1c" }}>No se pudo cargar el fermentador.</div>;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800 }}>{fermenter.name}</h1>
            <p style={{ margin: "8px 0 0 0", color: "#475569" }}>
              Vista general, lecturas, acciones y conexión con producción
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={ghostBtn} onClick={() => navigate("/plant")}>
              Volver al mapa
            </button>
            <Link to={`/fermenters/${id}/history`} style={linkBtn}>
              Ver historial completo
            </Link>
          </div>
        </div>

        {msg && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 12,
              border: msg.type === "ok" ? "1px solid #bbf7d0" : "1px solid #fecaca",
              background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2",
              color: msg.type === "ok" ? "#166534" : "#b91c1c",
              fontWeight: 600,
            }}
          >
            {msg.text}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            marginBottom: 20,
          }}
        >
          <Card title="Estado actual">
            <span style={badgeStyle(fermenter.status)}>{statusLabel(fermenter.status)}</span>
          </Card>

          <Card title="Capacidad">
            <Strong>{fermenter.capacityLiters} L</Strong>
          </Card>

          <Card title="Inicio lote actual">
            <Strong>{formatDate(fermenter.currentBatchStartedAt)}</Strong>
          </Card>

          <Card title="Disponible desde">
            <Strong>{formatDate(fermenter.availableAt)}</Strong>
          </Card>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr",
            gap: 20,
          }}
        >
          
          <div style={{ display: "grid", gap: 20 }}>
            <Section title="Seguimiento del lote en fermentación">
              {currentProduction ? (
                <div style={{ display: "grid", gap: 16 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: 12,
                    }}
                    
                  >
                    <MiniBox label="ID producción" value={String(currentProduction.id)} />
                    <MiniBox label="Cerveza" value={currentProduction.beerName ?? "-"} />
                    <MiniBox label="Cliente" value={currentProduction.client?.name ?? "-"} />
                    <MiniBox label="Estado" value={currentProduction.status ?? "-"} />
                    <MiniBox
                      label="Volumen en fermentación"
                      value={`${fermenter.currentVolumeLiters ?? currentProduction.volumeLiters ?? "-"} L`}
                      />
                      <MiniBox label="Días en fermentación" value={String(getFermentationDays(currentProduction))}/>
                    
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 12,
                    }}
                  >
                    <InfoCard
                      title="Dry hop"
                      value={
                        currentProduction.dryHopApplied
                          ? `Sí${
                              currentProduction.dryHopDescription
                                ? ` - ${currentProduction.dryHopDescription}`
                                : ""
                            }`
                          : "No registrado"
                      }
                    />

                    <InfoCard
                      title="Adjuntos en fermentación"
                      value={
                        currentProduction.fermentationAdjuncts?.length
                          ? currentProduction.fermentationAdjuncts
                              .map((a: any) =>
                                `${a.name}${a.quantityKg ? ` (${a.quantityKg} kg)` : ""}`,
                              )
                              .join(", ")
                          : "Sin registro"
                      }
                    />

                    <InfoCard
                      title="Purgas realizadas"
                      value={
                        currentProduction.purgesCount != null
                          ? String(currentProduction.purgesCount)
                          : "Sin registro"
                      }
                    />

                    <InfoCard
                      title="Peso total de purgas"
                      value={
                        currentProduction.purgeWeightKg != null
                          ? `${currentProduction.purgeWeightKg} kg`
                          : "Sin registro"
                      }
                    />
                  </div>

                  <div
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      background: "#f8fafc",
                      padding: 14,
                    }}
                  >
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>
                      Observaciones de fermentación
                    </div>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>
                      {currentProduction.fermentationNotes ?? "Sin observaciones registradas."}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={mutedP}>Este fermentador no tiene producción asociada actualmente.</p>
              )}
            </Section>

            <Section title="Registrar lectura">
              <div style={{ display: "grid", gap: 12 }}>
                <input
                  style={inputStyle}
                  placeholder="ID de producción"
                  value={readingForm.productionId}
                  onChange={(e) =>
                    setReadingForm((prev) => ({ ...prev, productionId: e.target.value }))
                  }
                />

                <div style={grid2}>
                  <input
                    style={inputStyle}
                    placeholder="pH"
                    value={readingForm.ph}
                    onChange={(e) =>
                      setReadingForm((prev) => ({ ...prev, ph: e.target.value }))
                    }
                  />

                  <input
                    style={inputStyle}
                    placeholder="Densidad"
                    value={readingForm.density}
                    onChange={(e) =>
                      setReadingForm((prev) => ({ ...prev, density: e.target.value }))
                    }
                  />

                  <input
                    style={inputStyle}
                    placeholder="Temperatura"
                    value={readingForm.temperature}
                    onChange={(e) =>
                      setReadingForm((prev) => ({ ...prev, temperature: e.target.value }))
                    }
                  />

                  <input
                    style={inputStyle}
                    placeholder="Purgas"
                    value={readingForm.purges}
                    onChange={(e) =>
                      setReadingForm((prev) => ({ ...prev, purges: e.target.value }))
                    }
                  />

                  <select
                    style={inputStyle}
                    value={readingForm.purgeUnit}
                    onChange={(e) =>
                      setReadingForm((prev) => ({
                        ...prev,
                        purgeUnit: e.target.value as "kg" | "l",
                      }))
                    }
                  >
                    <option value="kg">kg</option>
                    <option value="l">l</option>
                  </select>

                  <input
                    style={inputStyle}
                    placeholder="Adiciones / Dry hop"
                    value={readingForm.additions}
                    onChange={(e) =>
                      setReadingForm((prev) => ({ ...prev, additions: e.target.value }))
                    }
                  />

                  <input
                    style={inputStyle}
                    type="datetime-local"
                    value={readingForm.recordedAt}
                    onChange={(e) =>
                      setReadingForm((prev) => ({ ...prev, recordedAt: e.target.value }))
                    }
                  />
                </div>

                <div style={{ display: "grid", gap: 10 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={readingForm.dryHop}
                      onChange={(e) =>
                        setReadingForm((prev) => ({ ...prev, dryHop: e.target.checked }))
                      }
                    />
                    Tiene dry hop
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={readingForm.hasClarifier}
                      onChange={(e) =>
                        setReadingForm((prev) => ({
                          ...prev,
                          hasClarifier: e.target.checked,
                        }))
                      }
                    />
                    Tiene clarificante
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={readingForm.isCarbonated}
                      onChange={(e) =>
                        setReadingForm((prev) => ({
                          ...prev,
                          isCarbonated: e.target.checked,
                        }))
                      }
                    />
                    Está carbonatada
                  </label>
                </div>

                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
                  placeholder="Observaciones"
                  value={readingForm.note}
                  onChange={(e) =>
                    setReadingForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                />

                <button
                  type="button"
                  onClick={() => {
                    const productionId = Number(readingForm.productionId);
                    if (!Number.isFinite(productionId) || productionId <= 0) {
                      setMsg({ type: "err", text: "Escribe un ID de producción válido." });
                      return;
                    }

                    createReadingMutation.mutate({
                      productionId,
                      ph: readingForm.ph ? Number(readingForm.ph) : undefined,
                      density: readingForm.density ? Number(readingForm.density) : undefined,
                      temperature: readingForm.temperature
                        ? Number(readingForm.temperature)
                        : undefined,
                      purges: readingForm.purges ? Number(readingForm.purges) : undefined,
                      purgeUnit: readingForm.purgeUnit,
                      dryHop: readingForm.dryHop,
                      additions: readingForm.additions || undefined,
                      hasClarifier: readingForm.hasClarifier,
                      isCarbonated: readingForm.isCarbonated,
                      note: readingForm.note || undefined,
                      recordedAt: readingForm.recordedAt || undefined,
                    });
                  }}
                >
                  Guardar lectura
                </button>
              </div>
            </Section>

            <Section title="Últimas lecturas">
              {readingsQuery.isLoading ? (
                <p style={mutedP}>Cargando lecturas...</p>
              ) : readings.length === 0 ? (
                <p style={mutedP}>No hay lecturas registradas todavía.</p>
              ) : (
                <div style={{ display: "grid", gap: 10 }}>
                  {[...readings].slice(-5).reverse().map((r: any) => (
                    <div key={r.id} style={readingRow}>
                      <div><strong>Fecha:</strong> {formatDate(r.recordedAt || r.createdAt)}</div>
                      <div><strong>pH:</strong> {r.ph ?? "-"}</div>
                      <div><strong>Densidad:</strong> {r.density ?? "-"}</div>
                      <div><strong>Temp:</strong> {r.temperature ?? "-"}</div>
                      <div><strong>Purgas:</strong> {r.purges ?? "-"}</div>
                      <div><strong>Unidad:</strong> {r.purgeUnit ?? "-"}</div>
                      <div><strong>Adiciones:</strong> {r.additions || "-"}</div>
                      <div><strong>Nota:</strong> {r.note || "-"}</div>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {(fermenter.status === "disponible" || fermenter.status === "sanitizado") && (
              <Section title="Iniciar fermentación">
                <div style={{ ...grid2, gridTemplateColumns: "1fr" }}>
                  <select
                    style={inputStyle}
                    value={fermentationForm.batchId}
                    onChange={(e) =>
                      setFermentationForm((prev) => ({
                        ...prev,
                        batchId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecciona un lote</option>
                    {availableProductions.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        #{p.id} - {p.beerName} - {p.status}
                      </option>
                    ))}
                  </select>

                  <input
                    style={inputStyle}
                    placeholder="Litros elaborados"
                    value={fermentationForm.brewedLiters}
                    onChange={(e) =>
                      setFermentationForm((prev) => ({
                        ...prev,
                        brewedLiters: e.target.value,
                      }))
                    }
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    style={primaryBtn}
                    onClick={() => {
                      const batchId = Number(fermentationForm.batchId);
                      const brewedLiters = Number(fermentationForm.brewedLiters);

                      if (!Number.isFinite(batchId) || batchId <= 0) {
                        setMsg({ type: "err", text: "Selecciona un lote válido." });
                        return;
                      }

                      if (!Number.isFinite(brewedLiters) || brewedLiters < 0) {
                        setMsg({ type: "err", text: "Escribe litros elaborados válidos." });
                        return;
                      }

                      startFermentationMutation.mutate({
                        batchId,
                        fermenterId: id,
                        brewedLiters,
                      });
                    }}
                  >
                    Iniciar fermentación
                  </button>
                </div>
              </Section>
            )}

            {fermenter.status === "en_fermentacion" && (
              <Section title="Iniciar trasiego">
                <div style={{ ...grid2, gridTemplateColumns: "1fr" }}>
                  <input
                    style={inputStyle}
                    placeholder="ID del lote"
                    value={transferForm.batchId}
                    onChange={(e) =>
                      setTransferForm((prev) => ({ ...prev, batchId: e.target.value }))
                    }
                  />

                  <input
                    style={inputStyle}
                    placeholder="Destino (barril, bbt, botella)"
                    value={transferForm.destinationType}
                    onChange={(e) =>
                      setTransferForm((prev) => ({
                        ...prev,
                        destinationType: e.target.value,
                      }))
                    }
                  />

                  <textarea
                    style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                    placeholder="Nota"
                    value={transferForm.note}
                    onChange={(e) =>
                      setTransferForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    style={warningBtn}
                    onClick={() => {
                      const batchId = Number(transferForm.batchId);
                      if (!Number.isFinite(batchId) || batchId <= 0) {
                        setMsg({ type: "err", text: "Escribe un batchId válido." });
                        return;
                      }

                      startTransferMutation.mutate({
                        batchId,
                        fermenterId: id,
                        destinationType: transferForm.destinationType.trim() || "barril",
                        note: transferForm.note.trim() || undefined,
                      });
                    }}
                  >
                    Iniciar trasiego
                  </button>
                </div>
              </Section>
            )}

            {fermenter.status === "en_trasiego" && (
              <Section title="Finalizar trasiego">
                <div style={{ ...grid2, gridTemplateColumns: "1fr" }}>
                  <input
                    style={inputStyle}
                    placeholder="Transfer ID"
                    value={finishTransferForm.transferId}
                    onChange={(e) =>
                      setFinishTransferForm((prev) => ({
                        ...prev,
                        transferId: e.target.value,
                      }))
                    }
                  />
                  <Section title="Salidas del trasiego">
                      <div style={{ display: "grid", gap: 12 }}>
                        <div style={{ padding: 12, border: "1px solid #e2e8f0", borderRadius: 12 }}>
                          <div><strong>Transfer ID abierto:</strong> {openTransfer?.id ?? "-"}</div>
                          <div><strong>Cerveza:</strong> {currentProduction?.beerName ?? "-"}</div>
                          <div><strong>Volumen restante:</strong> {fermenter.currentVolumeLiters ?? 0} L</div>
                        </div>

                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            style={warningBtn}
                            onClick={() =>
                              navigate(
                                `/bbt/1`
                              )
                            }
                          >
                            Ir a BBT
                          </button>

                          <button
                            style={primaryBtn}
                            onClick={() =>
                              navigate(
                                `/cold-room?fermenterId=${id}&transferId=${openTransfer?.id ?? ""}`
                              )
                            }
                          >
                            Bajar a barriles
                          </button>

                          <button
                            style={successBtn}
                            onClick={() =>
                              navigate(
                                `/bottling?fermenterId=${id}&transferId=${openTransfer?.id ?? ""}`
                              )
                            }
                          >
                            Enviar a embotellado
                          </button>
                        </div>
                      </div>
                    </Section>

                  

                  <textarea
                    style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
                    placeholder="Nota"
                    value={finishTransferForm.note}
                    onChange={(e) =>
                      setFinishTransferForm((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                  />
                </div>

                <div style={{ marginTop: 12 }}>
                  <button
                    style={dangerBtn}
                    onClick={() => {
                      const transferId = Number(finishTransferForm.transferId);
                      finishTransferMutation.mutate({
                        transferId,
                        note: finishTransferForm.note.trim() || undefined,
                      });
                    }}
                  >
                    Finalizar trasiego
                  </button>
                </div>
              </Section>
            )}

            {fermenter.status === "vacio_sucio" && (
              <StatusSection
                title="Marcar como limpio"
                buttonText="Marcar limpio"
                buttonStyle={dangerBtn}
                status="limpio"
                statusForm={statusForm}
                setStatusForm={setStatusForm}
                onSubmit={(payload) => updateStatusMutation.mutate(payload)}
                fermenterId={id}
              />
            )}

            {fermenter.status === "limpio" && (
              <StatusSection
                title="Marcar como sanitizado"
                buttonText="Marcar sanitizado"
                buttonStyle={primaryBtn}
                status="sanitizado"
                statusForm={statusForm}
                setStatusForm={setStatusForm}
                onSubmit={(payload) => updateStatusMutation.mutate(payload)}
                fermenterId={id}
              />
            )}

            {fermenter.status === "sanitizado" && (
              <StatusSection
                title="Liberar fermentador"
                buttonText="Marcar disponible"
                buttonStyle={successBtn}
                status="disponible"
                statusForm={statusForm}
                setStatusForm={setStatusForm}
                onSubmit={(payload) => updateStatusMutation.mutate(payload)}
                fermenterId={id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusSection({
  title,
  buttonText,
  buttonStyle,
  status,
  statusForm,
  setStatusForm,
  onSubmit,
  fermenterId,
}: {
  title: string;
  buttonText: string;
  buttonStyle: React.CSSProperties;
  status: "limpio" | "sanitizado" | "disponible";
  statusForm: { note: string };
  setStatusForm: React.Dispatch<React.SetStateAction<{ note: string }>>;
  onSubmit: (payload: {
    fermenterId: number;
    status: "limpio" | "sanitizado" | "disponible" | "vacio_sucio";
    note?: string;
  }) => void;
  fermenterId: number;
}) {
  return (
    <Section title={title}>
      <div style={{ ...grid2, gridTemplateColumns: "1fr" }}>
        <textarea
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          placeholder="Nota"
          value={statusForm.note}
          onChange={(e) => setStatusForm((prev) => ({ ...prev, note: e.target.value }))}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          style={buttonStyle}
          onClick={() =>
            onSubmit({
              fermenterId,
              status,
              note: statusForm.note.trim() || undefined,
            })
          }
        >
          {buttonText}
        </button>
      </div>
    </Section>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ color: "#64748b", fontSize: 13, marginBottom: 8 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        padding: 14,
        background: "white",
      }}
    >
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 6 }}>{title}</div>
      <div style={{ fontWeight: 700, color: "#0f172a" }}>{value}</div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={sectionStyle}>
      <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 22 }}>{title}</h2>
      {children}
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={miniBox}>
      <div style={{ color: "#64748b", fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 6, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function Strong({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 22, fontWeight: 800 }}>{children}</div>;
}

const cardStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 18,
  boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
};

const sectionStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
};

const miniBox: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 14,
  background: "#f8fafc",
};

const mutedP: React.CSSProperties = {
  margin: 0,
  color: "#64748b",
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  background: "#2563eb",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const successBtn: React.CSSProperties = {
  background: "#059669",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const warningBtn: React.CSSProperties = {
  background: "#ea580c",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
};

const dangerBtn: React.CSSProperties = {
  background: "#dc2626",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  cursor: "pointer",
  fontWeight: 700,
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

const linkBtn: React.CSSProperties = {
  background: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  textDecoration: "none",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
};

const readingRow: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 12,
  background: "#f8fafc",
  display: "grid",
  gap: 6,
};