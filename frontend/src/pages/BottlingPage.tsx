import { CSSProperties, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createKegBottlingOrder,
  deleteBottlingOrder,
  finishBottling,
  getFermenter,
  listBottlingOrders,
  listColdRoomKegs,
  sendToBottling,
  startBottling,
} from "../api/fermenters";
import { finishBbtBottling, startBbtBottling } from "../api/bbts";

function formatLiters(value: any) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return "-";
  return `${n.toFixed(2)} L`;
}

function getSourceLabel(sourceType?: string) {
  if (sourceType === "FERMENTER") return "Fermentador";
  if (sourceType === "KEG") return "Barril";
  if (sourceType === "BBT") return "BBT";
  return sourceType || "-";
}

function getStatusMeta(status?: string) {
  switch (status) {
    case "PENDIENTE":
      return {
        label: "Pendiente",
        bg: "#fef3c7",
        color: "#92400e",
        border: "#fcd34d",
      };
    case "EN_PROCESO":
      return {
        label: "En proceso",
        bg: "#dbeafe",
        color: "#1d4ed8",
        border: "#93c5fd",
      };
    case "FINALIZADA":
      return {
        label: "Finalizada",
        bg: "#dcfce7",
        color: "#166534",
        border: "#86efac",
      };
    default:
      return {
        label: status || "-",
        bg: "#f1f5f9",
        color: "#334155",
        border: "#cbd5e1",
      };
  }
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div style={infoItemStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value ?? "-"}</div>
    </div>
  );
}

export default function BottlingPage() {
  const [params] = useSearchParams();
  const qc = useQueryClient();

  const fermenterId = Number(params.get("fermenterId") || 0);
  const transferId = Number(params.get("transferId") || 0);

  const [newOrderNote, setNewOrderNote] = useState("");
  const [kegOrderForm, setKegOrderForm] = useState({
    coldRoomKegId: "",
    kegSizeLiters: "",
    note: "",
  });

  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [processForm, setProcessForm] = useState({
    units330: "",
    units269: "",
    lossLiters: "",
    note: "",
  });

  const fermenterQ = useQuery({
    queryKey: ["fermenter", fermenterId],
    queryFn: () => getFermenter(fermenterId),
    enabled: fermenterId > 0,
  });

  const ordersQ = useQuery({
    queryKey: ["bottling-orders"],
    queryFn: listBottlingOrders,
  });

  const kegsQ = useQuery({
    queryKey: ["cold-room-kegs"],
    queryFn: listColdRoomKegs,
  });

  const createOrderM = useMutation({
    mutationFn: sendToBottling,
    onSuccess: async () => {
      setNewOrderNote("");
      await qc.invalidateQueries({ queryKey: ["bottling-orders"] });
      alert("Orden de embotellado creada");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || "Error creando orden");
    },
  });

  const createKegOrderM = useMutation({
    mutationFn: createKegBottlingOrder,
    onSuccess: async () => {
      setKegOrderForm({
        coldRoomKegId: "",
        kegSizeLiters: "",
        note: "",
      });
      await qc.invalidateQueries({ queryKey: ["bottling-orders"] });
      alert("Orden desde barril creada");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || "Error creando orden desde barril");
    },
  });

  const startM = useMutation({
    mutationFn: async (payload: { orderId: number; sourceType: string }) => {
      if (payload.sourceType === "BBT") {
        return startBbtBottling({ orderId: payload.orderId });
      }
      return startBottling({ orderId: payload.orderId });
    },
    onSuccess: async (data: any) => {
      setActiveOrderId(data.id);
      await qc.invalidateQueries({ queryKey: ["bottling-orders"] });
      alert("Embotellado iniciado");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || "Error iniciando embotellado");
    },
  });

  const finishM = useMutation({
    mutationFn: async (payload: {
      orderId: number;
      sourceType: string;
      units330: number;
      units269: number;
      lossLiters: number;
      note?: string;
    }) => {
      if (payload.sourceType === "BBT") {
        return finishBbtBottling({
          orderId: payload.orderId,
          units330: payload.units330,
          units269: payload.units269,
          lossLiters: payload.lossLiters,
          note: payload.note,
        });
      }

      return finishBottling({
        orderId: payload.orderId,
        units330: payload.units330,
        units269: payload.units269,
        lossLiters: payload.lossLiters,
        note: payload.note,
      });
    },
    onSuccess: async () => {
      setActiveOrderId(null);
      setProcessForm({
        units330: "",
        units269: "",
        lossLiters: "",
        note: "",
      });
      await qc.invalidateQueries({ queryKey: ["bottling-orders"] });
      await qc.invalidateQueries({ queryKey: ["fermenter", fermenterId] });
      await qc.invalidateQueries({ queryKey: ["cold-room-kegs"] });
      alert("Embotellado finalizado");
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.message || "Error finalizando embotellado");
    },
  });

  const deleteM = useMutation({
  mutationFn: deleteBottlingOrder,
  onSuccess: async (_data, deletedOrderId) => {
    if (activeOrderId === deletedOrderId) {
      setActiveOrderId(null);
      setProcessForm({
        units330: "",
        units269: "",
        lossLiters: "",
        note: "",
      });
    }

    await qc.invalidateQueries({ queryKey: ["bottling-orders"] });
    await qc.invalidateQueries({ queryKey: ["fermenter", fermenterId] });
    await qc.invalidateQueries({ queryKey: ["cold-room-kegs"] });

    alert("Orden eliminada correctamente");
  },
  onError: (err: any) => {
    alert(err?.response?.data?.message || err?.message || "Error eliminando orden");
  },
});

  const fermenter = fermenterQ.data;
  const orders = ordersQ.data ?? [];
  const kegRecords = kegsQ.data ?? [];

  const selectedKegRecord = useMemo(() => {
    return kegRecords.find((x: any) => String(x.id) === kegOrderForm.coldRoomKegId);
  }, [kegRecords, kegOrderForm.coldRoomKegId]);

  const activeOrder = useMemo(() => {
    return orders.find((x: any) => x.id === activeOrderId) ?? null;
  }, [orders, activeOrderId]);

        const processOrders = useMemo(
        () => orders.filter((x: any) => x.status === "EN_PROCESO"),
        [orders],
        );

        const pendingOrdersList = useMemo(
        () => orders.filter((x: any) => x.status === "PENDIENTE"),
        [orders],
        );

        const finishedOrders = useMemo(
        () => orders.filter((x: any) => x.status === "FINALIZADA"),
        [orders],
        );

  const pendingOrders = useMemo(
    () => orders.filter((x: any) => x.status === "PENDIENTE").length,
    [orders],
  );

  const runningOrders = useMemo(
    () => orders.filter((x: any) => x.status === "EN_PROCESO").length,
    [orders],
  );

  const liters335 = Number((Number(processForm.units330 || 0) * 0.35).toFixed(2));
  const liters269 = Number((Number(processForm.units269 || 0) * 0.269).toFixed(2));
  const processLoss = Number(processForm.lossLiters || 0);
  const totalProcessed = Number((liters335 + liters269 + processLoss).toFixed(2));

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div>
          <div style={heroEyebrowStyle}>Módulo de empaque</div>
          <h1 style={heroTitleStyle}>Área de Embotellado</h1>
          <p style={heroSubtitleStyle}>
            Gestiona órdenes desde fermentador, barril o BBT, inicia procesos,
            finaliza lotes y mantén la trazabilidad completa del empaque.
          </p>
        </div>
        <div style={sectionCardStyle}>
  <div style={sectionHeaderStyle}>
    <div>
      <h2 style={sectionTitleStyle}>Órdenes en proceso</h2>
      <p style={sectionSubtitleStyle}>
        Retoma cualquiera de las órdenes abiertas actualmente.
      </p>
    </div>
  </div>

  {processOrders.length === 0 ? (
    <div style={emptyStateStyle}>No hay órdenes en proceso.</div>
  ) : (
    <div style={ordersGridStyle}>
      {processOrders.map((item: any) => {
        const statusMeta = getStatusMeta(item.status);

        return (
          <div key={item.id} style={orderCardStyle}>
            <div style={orderHeaderStyle}>
              <div>
                <div style={orderTitleStyle}>Orden #{item.id}</div>
                <div style={orderSourceStyle}>{getSourceLabel(item.sourceType)}</div>
              </div>

              <div
                style={{
                  ...statusBadgeStyle,
                  background: statusMeta.bg,
                  color: statusMeta.color,
                  borderColor: statusMeta.border,
                }}
              >
                {statusMeta.label}
              </div>
            </div>

            <div style={horizontalInfoWrapStyle}>
              <InfoItem label="Producción" value={item.productionId ?? "-"} />
              <InfoItem label="Cerveza" value={item.beerName} />
              <InfoItem label="Cliente" value={item.clientName ?? "-"} />
              <InfoItem label="Litros disponibles" value={formatLiters(item.remainingLiters)} />
              <InfoItem label="Fuente" value={getSourceLabel(item.sourceType)} />
            </div>

            <div style={actionRowStyle}>
              <button
                style={secondaryButtonStyle}
                onClick={() => setActiveOrderId(item.id)}
              >
                Retomar embotellado
              </button>
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>





        <div style={heroStatsGridStyle}>
          <div style={heroMiniCardStyle}>
            <div style={heroMiniLabelStyle}>Órdenes pendientes</div>
            <div style={heroMiniValueStyle}>{pendingOrders}</div>
          </div>
          <div style={heroMiniCardStyle}>
            <div style={heroMiniLabelStyle}>En proceso</div>
            <div style={heroMiniValueStyle}>{runningOrders}</div>
          </div>
          <div style={heroMiniCardStyle}>
            <div style={heroMiniLabelStyle}>Registros cuarto frío</div>
            <div style={heroMiniValueStyle}>{kegRecords.length}</div>
          </div>
        </div>
      </div>

      {fermenter && transferId > 0 && (
        <div style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Crear orden desde fermentador</h2>
              <p style={sectionSubtitleStyle}>
                Genera una orden de embotellado a partir de una transferencia activa.
              </p>
            </div>
          </div>

          <div style={horizontalInfoWrapStyle}>
            <InfoItem label="Fermentador" value={fermenter.name} />
            <InfoItem label="ID producción" value={fermenter.currentProduction?.id ?? "-"} />
            <InfoItem label="Cerveza" value={fermenter.currentProduction?.beerName ?? "-"} />
            <InfoItem label="Cliente" value={fermenter.currentProduction?.client?.name ?? "-"} />
            <InfoItem label="Litros disponibles" value={formatLiters(fermenter.currentVolumeLiters ?? 0)} />
            <InfoItem label="Transfer ID" value={transferId} />
          </div>

          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Observaciones de la orden</label>
            <textarea
              placeholder="Observaciones de la orden"
              value={newOrderNote}
              onChange={(e) => setNewOrderNote(e.target.value)}
              style={{ ...fieldStyle, minHeight: 96, resize: "vertical" }}
            />
          </div>

          <div style={actionRowStyle}>
            <button
              style={primaryButtonStyle}
              onClick={() =>
                createOrderM.mutate({
                  transferId,
                  note: newOrderNote || undefined,
                })
              }
            >
              Crear orden de embotellado desde este fermentador
            </button>
          </div>
        </div>
      )}

      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Embotellar un barril del cuarto frío</h2>
            <p style={sectionSubtitleStyle}>
              Selecciona el registro del cuarto frío y el tamaño del barril que se va a procesar.
            </p>
          </div>
        </div>

        <div style={formGridStyle}>
          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Registro del cuarto frío</label>
            <select
              value={kegOrderForm.coldRoomKegId}
              onChange={(e) =>
                setKegOrderForm((p) => ({ ...p, coldRoomKegId: e.target.value, kegSizeLiters: "" }))
              }
              style={fieldStyle}
            >
              <option value="">Selecciona</option>
              {kegRecords.map((item: any) => (
                <option key={item.id} value={item.id}>
                  #{item.id} - {item.beerName} - 60L:{item.kegs60} / 50L:{item.kegs50} / 30L:{item.kegs30}
                </option>
              ))}
            </select>
          </div>

          {selectedKegRecord && (
            <>
              <div style={fieldBlockStyle}>
                <label style={labelStyle}>Barril a embotellar</label>
                <select
                  value={kegOrderForm.kegSizeLiters}
                  onChange={(e) =>
                    setKegOrderForm((p) => ({ ...p, kegSizeLiters: e.target.value }))
                  }
                  style={fieldStyle}
                >
                  <option value="">Selecciona tamaño</option>
                  {Number(selectedKegRecord.kegs60 ?? 0) > 0 && <option value="60">Barril de 60 L</option>}
                  {Number(selectedKegRecord.kegs50 ?? 0) > 0 && <option value="50">Barril de 50 L</option>}
                  {Number(selectedKegRecord.kegs30 ?? 0) > 0 && <option value="30">Barril de 30 L</option>}
                </select>
              </div>

              <div style={fieldBlockStyle}>
                <label style={labelStyle}>Observaciones</label>
                <textarea
                  value={kegOrderForm.note}
                  onChange={(e) => setKegOrderForm((p) => ({ ...p, note: e.target.value }))}
                  style={{ ...fieldStyle, minHeight: 96, resize: "vertical" }}
                />
              </div>
            </>
          )}
        </div>

        {selectedKegRecord && (
          <div style={horizontalInfoWrapStyle}>
            <InfoItem label="Registro" value={`#${selectedKegRecord.id}`} />
            <InfoItem label="Cerveza" value={selectedKegRecord.beerName} />
            <InfoItem label="Cliente" value={selectedKegRecord.clientName ?? "-"} />
            <InfoItem label="Litros totales" value={formatLiters(selectedKegRecord.totalKegLiters)} />
            <InfoItem label="Barriles 60 L" value={selectedKegRecord.kegs60} />
            <InfoItem label="Barriles 50 L" value={selectedKegRecord.kegs50} />
            <InfoItem label="Barriles 30 L" value={selectedKegRecord.kegs30} />
            <InfoItem label="Fuente" value={getSourceLabel(selectedKegRecord.sourceType)} />
          </div>
        )}

        <div style={actionRowStyle}>
          <button
            style={secondaryButtonStyle}
            onClick={() => {
              if (!kegOrderForm.coldRoomKegId || !kegOrderForm.kegSizeLiters) {
                alert("Debes seleccionar el registro y el tamaño del barril");
                return;
              }

              createKegOrderM.mutate({
                coldRoomKegId: Number(kegOrderForm.coldRoomKegId),
                kegSizeLiters: Number(kegOrderForm.kegSizeLiters) as 60 | 50 | 30,
                note: kegOrderForm.note || undefined,
              });
            }}
          >
            Crear orden de embotellado desde barril
          </button>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Órdenes de embotellado</h2>
            <p style={sectionSubtitleStyle}>
              Consulta todas las órdenes registradas y arranca las que estén pendientes.
            </p>
          </div>
        </div>

        {pendingOrdersList.length === 0 && (
  <div style={emptyStateStyle}>No hay órdenes pendientes.</div>
)}

        <div style={ordersGridStyle}>
          {pendingOrdersList.map((item: any) => {
            const statusMeta = getStatusMeta(item.status);

            return (
              <div key={item.id} style={orderCardStyle}>
                <div style={orderHeaderStyle}>
                  <div>
                    <div style={orderTitleStyle}>Orden #{item.id}</div>
                    <div style={orderSourceStyle}>{getSourceLabel(item.sourceType)}</div>
                  </div>

                  <div
                    style={{
                      ...statusBadgeStyle,
                      background: statusMeta.bg,
                      color: statusMeta.color,
                      borderColor: statusMeta.border,
                    }}
                  >
                    {statusMeta.label}
                  </div>
                </div>

                <div style={horizontalInfoWrapStyle}>
                  <InfoItem label="Producción" value={item.productionId ?? "-"} />
                  <InfoItem label="Fermentador origen" value={item.fermenterId ?? "-"} />
                  {item.sourceType === "BBT" && (
                    <InfoItem label="BBT origen" value={item.sourceBbtId ?? "-"} />
                  )}
                  {item.sourceType === "KEG" && (
                    <InfoItem label="Registro cuarto frío" value={item.sourceColdRoomKegId ?? "-"} />
                  )}
                  {item.sourceType === "KEG" && (
                    <InfoItem label="Barril seleccionado" value={`${item.sourceKegSizeLiters ?? "-"} L`} />
                  )}
                  <InfoItem label="Cerveza" value={item.beerName} />
                  <InfoItem label="Cliente" value={item.clientName ?? "-"} />
                  <InfoItem label="Litros disponibles" value={formatLiters(item.remainingLiters)} />
                </div>

                {(item.status === "PENDIENTE" || item.status === "EN_PROCESO") && (
                    <div style={actionRowStyle}>
                        {item.status === "PENDIENTE" && (
                        <button
                            style={outlineButtonStyle}
                            onClick={() =>
                            startM.mutate({
                                orderId: item.id,
                                sourceType: item.sourceType,
                            })
                            }
                        >
                            Empezar embotellado
                        </button>
                        )}

                        {item.status === "EN_PROCESO" && (
                        <button
                            style={secondaryButtonStyle}
                            onClick={() => setActiveOrderId(item.id)}
                        >
                            Retomar embotellado
                        </button>
                        )}

                        <button
                        style={dangerButtonStyle}
                        onClick={() => {
                            const ok = window.confirm(
                            `¿Seguro que deseas eliminar la orden #${item.id}?`,
                            );
                            if (!ok) return;
                            deleteM.mutate(item.id);
                        }}
                        >
                        Eliminar orden
                        </button>
                    </div>
                    )}
                                </div>
                                );

                                
                            })}
                            </div>
                        </div>

      {activeOrder && (
        <div style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Proceso de embotellado en curso</h2>
              <p style={sectionSubtitleStyle}>
                Registra unidades, merma y observaciones para cerrar la orden activa.
              </p>
            </div>

            <div
              style={{
                ...statusBadgeStyle,
                background: "#dbeafe",
                color: "#1d4ed8",
                borderColor: "#93c5fd",
              }}
            >
              Orden #{activeOrder.id}
            </div>
          </div>

          <div style={horizontalInfoWrapStyle}>
            <InfoItem label="Fuente" value={getSourceLabel(activeOrder.sourceType)} />
            <InfoItem label="Cerveza" value={activeOrder.beerName} />
            <InfoItem label="Cliente" value={activeOrder.clientName ?? "-"} />
            <InfoItem label="Producción" value={activeOrder.productionId ?? "-"} />
            <InfoItem label="Fermentador origen" value={activeOrder.fermenterId ?? "-"} />
            {activeOrder.sourceType === "BBT" && (
              <InfoItem label="BBT origen" value={activeOrder.sourceBbtId ?? "-"} />
            )}
            {activeOrder.sourceType === "KEG" && (
              <InfoItem label="Barril" value={`${activeOrder.sourceKegSizeLiters ?? "-"} L`} />
            )}
            <InfoItem label="Litros disponibles en la orden" value={formatLiters(activeOrder.remainingLiters)} />
          </div>

          <div style={formGridStyle}>
            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Cantidad de botellas/latas de 330 ml</label>
              <input
                type="number"
                min="0"
                value={processForm.units330}
                onChange={(e) => setProcessForm((p) => ({ ...p, units330: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Cantidad de botellas/latas de 269 ml</label>
              <input
                type="number"
                min="0"
                value={processForm.units269}
                onChange={(e) => setProcessForm((p) => ({ ...p, units269: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Merma del proceso (L)</label>
              <input
                type="number"
                min="0"
                value={processForm.lossLiters}
                onChange={(e) => setProcessForm((p) => ({ ...p, lossLiters: e.target.value }))}
                style={fieldStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Observaciones</label>
              <textarea
                value={processForm.note}
                onChange={(e) => setProcessForm((p) => ({ ...p, note: e.target.value }))}
                style={{ ...fieldStyle, minHeight: 96, resize: "vertical" }}
              />
            </div>
          </div>

          <div style={summaryHorizontalStyle}>
            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Litros por 330 ml</div>
              <div style={summaryValueStyle}>{formatLiters(liters335)}</div>
            </div>

            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Litros por 269 ml</div>
              <div style={summaryValueStyle}>{formatLiters(liters269)}</div>
            </div>

            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Merma</div>
              <div style={summaryValueStyle}>{formatLiters(processLoss)}</div>
            </div>

            <div style={summaryCardStyle}>
              <div style={summaryLabelStyle}>Total procesado</div>
              <div style={summaryValueStyle}>{formatLiters(totalProcessed)}</div>
            </div>
          </div>

          <div style={actionRowStyle}>
            <button
              style={primaryButtonStyle}
              onClick={() =>
                finishM.mutate({
                  orderId: activeOrder.id,
                  sourceType: activeOrder.sourceType,
                  units330: Number(processForm.units330 || 0),
                  units269: Number(processForm.units269 || 0),
                  lossLiters: Number(processForm.lossLiters || 0),
                  note: processForm.note || undefined,
                })
              }
            >
              Finalizar embotellado
            </button>
          </div>
          
          


        </div>
      )}
    </div>
  );
}

const pageStyle: CSSProperties = {
  padding: 24,
  background: "#f8fafc",
  minHeight: "100vh",
};

const heroStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 18,
  padding: 24,
  borderRadius: 20,
  background: "linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)",
  color: "#fff",
  marginBottom: 22,
  boxShadow: "0 16px 40px rgba(15, 23, 42, 0.18)",
  flexWrap: "wrap",
};

const heroEyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  opacity: 0.82,
  marginBottom: 8,
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 34,
  fontWeight: 800,
};

const heroSubtitleStyle: CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  maxWidth: 720,
  lineHeight: 1.55,
  opacity: 0.92,
};

const heroStatsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 12,
  minWidth: 320,
  flex: 1,
};

const heroMiniCardStyle: CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: 16,
  padding: 14,
  backdropFilter: "blur(6px)",
};

const heroMiniLabelStyle: CSSProperties = {
  fontSize: 12,
  opacity: 0.85,
  marginBottom: 8,
};

const heroMiniValueStyle: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
};

const sectionCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  marginBottom: 20,
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
  marginBottom: 16,
  flexWrap: "wrap",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
};

const sectionSubtitleStyle: CSSProperties = {
  margin: "6px 0 0 0",
  color: "#64748b",
  lineHeight: 1.45,
};

const horizontalInfoWrapStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 16,
};

const infoItemStyle: CSSProperties = {
  minWidth: 170,
  flex: "1 1 180px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "12px 14px",
};

const infoLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  fontWeight: 700,
  marginBottom: 6,
};

const infoValueStyle: CSSProperties = {
  fontSize: 15,
  color: "#0f172a",
  fontWeight: 800,
  wordBreak: "break-word",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 14,
  marginBottom: 16,
};

const fieldBlockStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 12,
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
  color: "#0f172a",
  fontSize: 14,
};

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #cbd5e1",
  background: "#fff",
  fontSize: 14,
  boxSizing: "border-box",
  outline: "none",
};

const actionRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  marginTop: 8,
};

const primaryButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(37, 99, 235, 0.22)",
};

const secondaryButtonStyle: CSSProperties = {
  background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(13, 148, 136, 0.18)",
};

const outlineButtonStyle: CSSProperties = {
  background: "#fff",
  color: "#1d4ed8",
  border: "1px solid #93c5fd",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
};

const ordersGridStyle: CSSProperties = {
  display: "grid",
  gap: 14,
};

const orderCardStyle: CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 16,
  background: "#fff",
};

const orderHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 14,
  flexWrap: "wrap",
};

const orderTitleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
};

const orderSourceStyle: CSSProperties = {
  color: "#64748b",
  fontWeight: 700,
  marginTop: 4,
};

const statusBadgeStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid",
  fontWeight: 800,
  fontSize: 13,
  whiteSpace: "nowrap",
};

const summaryHorizontalStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  marginBottom: 16,
};

const summaryCardStyle: CSSProperties = {
  flex: "1 1 180px",
  minWidth: 160,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 14,
  padding: 14,
};

const summaryLabelStyle: CSSProperties = {
  fontSize: 12,
  color: "#1e40af",
  fontWeight: 700,
  marginBottom: 8,
};

const summaryValueStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#1e3a8a",
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 14,
  background: "#f8fafc",
  border: "1px dashed #cbd5e1",
  color: "#64748b",
};

const dangerButtonStyle: React.CSSProperties = {
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(220, 38, 38, 0.18)",
};