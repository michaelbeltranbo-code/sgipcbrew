import { useEffect, useMemo, useState } from "react";
import {
  createColdRoomOutput,
  getColdRoomKegs,
  getColdRoomOutputs,
  getPackagedStock,
  type ColdRoomKegStock,
  type ColdRoomOutput,
  type PackagedStock,
} from "../api/cold-room";

type OutputType = "KEG" | "PACKAGE";
type DestinationType = "CLIENTE" | "EVENTO" | "BAR" | "INTERNO";

type DeliveryItem = {
  itemType: "KEG" | "PACKAGE";
  sourceColdRoomKegId?: number;
  sourcePackagedStockId?: number;
  kegSizeLiters?: number;
  kegQuantity?: number;
  units330?: number;
  units269?: number;
  label: string;
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  marginTop: 6,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  marginBottom: 12,
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  cursor: "pointer",
  background: "#f9fafb",
  fontWeight: 600,
};

const activeSecondaryButtonStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  background: "#dcfce7",
  border: "1px solid #16a34a",
  color: "#166534",
};

export default function ColdRoomOutputsPage() {
  const [kegs, setKegs] = useState<ColdRoomKegStock[]>([]);
  const [packaged, setPackaged] = useState<PackagedStock[]>([]);
  const [outputs, setOutputs] = useState<ColdRoomOutput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activePanel, setActivePanel] = useState<
    "NONE" | "PACKAGED" | "HISTORY"
  >("NONE");

  const [outputDate, setOutputDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [destinationName, setDestinationName] = useState("");
  const [destinationType, setDestinationType] =
    useState<DestinationType>("CLIENTE");
  const [note, setNote] = useState("");

  const [itemType, setItemType] = useState<OutputType>("KEG");

  const [selectedKegId, setSelectedKegId] = useState<number | "">("");
  const [kegSizeLiters, setKegSizeLiters] = useState<30 | 50 | 60>(30);
  const [kegQuantity, setKegQuantity] = useState(1);

  const [selectedPackagedId, setSelectedPackagedId] = useState<number | "">("");
  const [units330, setUnits330] = useState(0);
  const [units269, setUnits269] = useState(0);

  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [kegsData, packagedData, outputsData] = await Promise.all([
        getColdRoomKegs(),
        getPackagedStock(),
        getColdRoomOutputs(),
      ]);

      setKegs(kegsData || []);
      setPackaged(packagedData || []);
      setOutputs(outputsData || []);
    } catch (err: any) {
      setError(err.message || "Error cargando datos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const selectedKeg = useMemo(
    () => kegs.find((k) => k.id === Number(selectedKegId)),
    [kegs, selectedKegId]
  );

  const selectedPackaged = useMemo(
    () => packaged.find((p) => p.id === Number(selectedPackagedId)),
    [packaged, selectedPackagedId]
  );

  function getReservedKegs(stockId: number, size: 30 | 50 | 60) {
    return deliveryItems
      .filter(
        (item) =>
          item.itemType === "KEG" &&
          Number(item.sourceColdRoomKegId) === Number(stockId) &&
          Number(item.kegSizeLiters) === Number(size)
      )
      .reduce((acc, item) => acc + Number(item.kegQuantity || 0), 0);
  }

  function getReservedUnits330(stockId: number) {
    return deliveryItems
      .filter(
        (item) =>
          item.itemType === "PACKAGE" &&
          Number(item.sourcePackagedStockId) === Number(stockId)
      )
      .reduce((acc, item) => acc + Number(item.units330 || 0), 0);
  }

  function getReservedUnits269(stockId: number) {
    return deliveryItems
      .filter(
        (item) =>
          item.itemType === "PACKAGE" &&
          Number(item.sourcePackagedStockId) === Number(stockId)
      )
      .reduce((acc, item) => acc + Number(item.units269 || 0), 0);
  }

  const availableForSelectedKegSize = useMemo(() => {
    if (!selectedKeg) return 0;

    const base =
      kegSizeLiters === 60
        ? Number(selectedKeg.kegs60 || 0)
        : kegSizeLiters === 50
        ? Number(selectedKeg.kegs50 || 0)
        : Number(selectedKeg.kegs30 || 0);

    const reserved = getReservedKegs(selectedKeg.id, kegSizeLiters);
    return Math.max(0, base - reserved);
  }, [selectedKeg, kegSizeLiters, deliveryItems]);

  const available330ForSelectedPackaged = useMemo(() => {
    if (!selectedPackaged) return 0;
    return Math.max(
      0,
      Number(selectedPackaged.units330Available || 0) -
        getReservedUnits330(selectedPackaged.id)
    );
  }, [selectedPackaged, deliveryItems]);

  const available269ForSelectedPackaged = useMemo(() => {
    if (!selectedPackaged) return 0;
    return Math.max(
      0,
      Number(selectedPackaged.units269Available || 0) -
        getReservedUnits269(selectedPackaged.id)
    );
  }, [selectedPackaged, deliveryItems]);

  function resetCurrentItemForm() {
    setSelectedKegId("");
    setKegSizeLiters(30);
    setKegQuantity(1);
    setSelectedPackagedId("");
    setUnits330(0);
    setUnits269(0);
  }

  function handleAddItem() {
    try {
      setError("");

      if (itemType === "KEG") {
        if (!selectedKegId) {
          throw new Error("Debes seleccionar un registro de barriles");
        }

        if (kegQuantity <= 0) {
          throw new Error("La cantidad de barriles debe ser mayor a 0");
        }

        if (kegQuantity > availableForSelectedKegSize) {
          throw new Error(
            `No puedes agregar esa cantidad. Disponibles para ${kegSizeLiters}L: ${availableForSelectedKegSize}`
          );
        }

        const selected = kegs.find((k) => k.id === Number(selectedKegId));
        if (!selected) {
          throw new Error("No se encontró el registro de barriles");
        }

        const label = `${selected.beerName || "Cerveza"} - ${
          selected.clientName || "N/A"
        } - ${kegQuantity} barril(es) de ${kegSizeLiters}L`;

        setDeliveryItems((prev) => [
          ...prev,
          {
            itemType: "KEG",
            sourceColdRoomKegId: Number(selectedKegId),
            kegSizeLiters,
            kegQuantity,
            label,
          },
        ]);

        resetCurrentItemForm();
        return;
      }

      if (itemType === "PACKAGE") {
        if (!selectedPackagedId) {
          throw new Error("Debes seleccionar un stock empacado");
        }

        if (units330 <= 0 && units269 <= 0) {
          throw new Error("Debes ingresar unidades 330 o 269");
        }

        if (units330 > available330ForSelectedPackaged) {
          throw new Error(
            `No puedes agregar esa cantidad de 330. Disponibles: ${available330ForSelectedPackaged}`
          );
        }

        if (units269 > available269ForSelectedPackaged) {
          throw new Error(
            `No puedes agregar esa cantidad de 269. Disponibles: ${available269ForSelectedPackaged}`
          );
        }

        const selected = packaged.find((p) => p.id === Number(selectedPackagedId));
        if (!selected) {
          throw new Error("No se encontró el stock empacado");
        }

        const label = `${selected.beerName || "Cerveza"} - ${
          selected.clientName || "N/A"
        } - 330: ${units330}, 269: ${units269}`;

        setDeliveryItems((prev) => [
          ...prev,
          {
            itemType: "PACKAGE",
            sourcePackagedStockId: Number(selectedPackagedId),
            units330,
            units269,
            label,
          },
        ]);

        resetCurrentItemForm();
      }
    } catch (err: any) {
      setError(err.message || "Error agregando item");
    }
  }

  function handleRemoveItem(index: number) {
    setDeliveryItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");

      if (!destinationName.trim()) {
        throw new Error("Debes escribir el destino");
      }

      if (deliveryItems.length === 0) {
        throw new Error("Debes agregar al menos una cerveza a la entrega");
      }

      await createColdRoomOutput({
        outputDate,
        destinationName,
        destinationType,
        note,
        items: deliveryItems.map(({ label, ...rest }) => rest),
      });

      setDestinationName("");
      setDestinationType("CLIENTE");
      setNote("");
      setDeliveryItems([]);
      resetCurrentItemForm();

      await loadAll();
      alert("Salida registrada correctamente");
    } catch (err: any) {
      setError(err.message || "Error guardando salida");
    } finally {
      setSaving(false);
    }
  }

  const visiblePackaged = packaged.filter(
    (p) =>
      Number(p.units330Available || 0) > 0 ||
      Number(p.units269Available || 0) > 0
  );

  const visibleKegs = kegs.filter(
    (k) =>
      Number(k.kegs60 || 0) > 0 ||
      Number(k.kegs50 || 0) > 0 ||
      Number(k.kegs30 || 0) > 0
  );

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: "0 auto" }}>
      <h1>Salidas de cuarto frío</h1>

      {error && (
        <div
          style={{
            background: "#ffe8e8",
            color: "#8a1f1f",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      <div style={cardStyle}>
        <h2>Datos de la salida</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          <label style={labelStyle}>
            Fecha
            <input
              type="date"
              value={outputDate}
              onChange={(e) => setOutputDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Destino
            <input
              value={destinationName}
              onChange={(e) => setDestinationName(e.target.value)}
              style={inputStyle}
              placeholder="Ej: Bar Central"
            />
          </label>

          <label style={labelStyle}>
            Tipo de destino
            <select
              value={destinationType}
              onChange={(e) =>
                setDestinationType(e.target.value as DestinationType)
              }
              style={inputStyle}
            >
              <option value="CLIENTE">CLIENTE</option>
              <option value="EVENTO">EVENTO</option>
              <option value="BAR">BAR</option>
              <option value="INTERNO">INTERNO</option>
            </select>
          </label>

          <label style={labelStyle}>
            Tipo de item
            <select
              value={itemType}
              onChange={(e) => setItemType(e.target.value as OutputType)}
              style={inputStyle}
            >
              <option value="KEG">BARRILES</option>
              <option value="PACKAGE">BOTELLAS / LATAS</option>
            </select>
          </label>
        </div>

        <label style={{ ...labelStyle, marginTop: 12 }}>
          Observación
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ ...inputStyle, minHeight: 80 }}
          />
        </label>
      </div>

      {itemType === "KEG" && (
        <div style={cardStyle}>
          <h2>Agregar barriles a la entrega</h2>

          <label style={labelStyle}>
            Registro de barriles
            <select
              value={selectedKegId}
              onChange={(e) =>
                setSelectedKegId(e.target.value ? Number(e.target.value) : "")
              }
              style={inputStyle}
            >
              <option value="">Seleccione...</option>
              {visibleKegs.map((k) => (
                <option key={k.id} value={k.id}>
                  #{k.id} - {k.beerName || "Sin nombre"} - Cliente:{" "}
                  {k.clientName || "N/A"} - 60L:{k.kegs60} / 50L:{k.kegs50} / 30L:
                  {k.kegs30}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <label style={labelStyle}>
              Tamaño barril
              <select
                value={kegSizeLiters}
                onChange={(e) =>
                  setKegSizeLiters(Number(e.target.value) as 30 | 50 | 60)
                }
                style={inputStyle}
              >
                <option value={30}>30 L</option>
                <option value={50}>50 L</option>
                <option value={60}>60 L</option>
              </select>
            </label>

            <label style={labelStyle}>
              Cantidad
              <input
                type="number"
                min={1}
                value={kegQuantity}
                onChange={(e) => setKegQuantity(Number(e.target.value))}
                style={inputStyle}
              />
            </label>
          </div>

          {selectedKeg && (
            <div style={{ marginTop: 12 }}>
              <strong>Disponibles para {kegSizeLiters}L:</strong>{" "}
              {availableForSelectedKegSize}
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            style={{
              ...buttonStyle,
              background: "#2563eb",
              color: "#fff",
              marginTop: 12,
            }}
          >
            Añadir barriles a la entrega
          </button>
        </div>
      )}

      {itemType === "PACKAGE" && (
        <div style={cardStyle}>
          <h2>Agregar botellas / latas a la entrega</h2>

          <label style={labelStyle}>
            Stock empacado
            <select
              value={selectedPackagedId}
              onChange={(e) =>
                setSelectedPackagedId(
                  e.target.value ? Number(e.target.value) : ""
                )
              }
              style={inputStyle}
            >
              <option value="">Seleccione...</option>
              {visiblePackaged.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.beerName || "Sin nombre"} - Cliente:{" "}
                  {p.clientName || "N/A"} - 330:{p.units330Available} / 269:
                  {p.units269Available}
                </option>
              ))}
            </select>
          </label>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 12,
            }}
          >
            <label style={labelStyle}>
              Unidades 330
              <input
                type="number"
                min={0}
                value={units330}
                onChange={(e) => setUnits330(Number(e.target.value))}
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Unidades 269
              <input
                type="number"
                min={0}
                value={units269}
                onChange={(e) => setUnits269(Number(e.target.value))}
                style={inputStyle}
              />
            </label>
          </div>

          {selectedPackaged && (
            <div style={{ marginTop: 12 }}>
              <div>
                <strong>Disponible 330:</strong> {available330ForSelectedPackaged}
              </div>
              <div>
                <strong>Disponible 269:</strong> {available269ForSelectedPackaged}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddItem}
            style={{
              ...buttonStyle,
              background: "#2563eb",
              color: "#fff",
              marginTop: 12,
            }}
          >
            Añadir botellas / latas a la entrega
          </button>
        </div>
      )}

      <div style={cardStyle}>
        <h2>Detalle de la entrega actual</h2>

        {deliveryItems.length === 0 ? (
          <div>No has agregado productos a esta entrega.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {deliveryItems.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  padding: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <span>{item.label}</span>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 10px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...buttonStyle,
            background: "#111827",
            color: "#fff",
          }}
        >
          {saving ? "Guardando..." : "Registrar salida completa"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() =>
            setActivePanel((prev) => (prev === "PACKAGED" ? "NONE" : "PACKAGED"))
          }
          style={
            activePanel === "PACKAGED"
              ? activeSecondaryButtonStyle
              : secondaryButtonStyle
          }
        >
          {activePanel === "PACKAGED"
            ? "Ocultar stock empacado"
            : "Ver stock empacado disponible"}
        </button>

        <button
          type="button"
          onClick={() =>
            setActivePanel((prev) => (prev === "HISTORY" ? "NONE" : "HISTORY"))
          }
          style={
            activePanel === "HISTORY"
              ? activeSecondaryButtonStyle
              : secondaryButtonStyle
          }
        >
          {activePanel === "HISTORY"
            ? "Ocultar historial"
            : "Ver historial de salidas"}
        </button>
      </div>

      {activePanel === "PACKAGED" && (
        <div style={cardStyle}>
          <h2>Stock empacado disponible</h2>

          {visiblePackaged.length === 0 ? (
            <div>No hay cervezas embotelladas/latas disponibles para salida.</div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {visiblePackaged.map((p) => (
                <div
                  key={p.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div>
                    <strong>Cerveza:</strong> {p.beerName || "Sin nombre"}
                  </div>
                  <div>
                    <strong>Cliente:</strong> {p.clientName || "N/A"}
                  </div>
                  <div>
                    <strong>330:</strong> {p.units330Available}
                  </div>
                  <div>
                    <strong>269:</strong> {p.units269Available}
                  </div>
                  <div>
                    <strong>Litros disponibles:</strong>{" "}
                    {p.totalPackagedLitersAvailable}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activePanel === "HISTORY" && (
        <div style={cardStyle}>
          <h2>Historial de salidas</h2>

          {outputs.length === 0 ? (
            <div>No hay salidas registradas.</div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {outputs.map((output) => (
                <div
                  key={output.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  <div>
                    <strong>Fecha:</strong> {output.outputDate}
                  </div>
                  <div>
                    <strong>Destino:</strong> {output.destinationName}
                  </div>
                  <div>
                    <strong>Tipo:</strong> {output.destinationType}
                  </div>
                  <div>
                    <strong>Responsable:</strong> {output.responsibleName || "N/A"}
                  </div>
                  <div>
                    <strong>Estado:</strong> {output.status}
                  </div>

                  {output.note && (
                    <div>
                      <strong>Nota:</strong> {output.note}
                    </div>
                  )}

                  <div style={{ marginTop: 10 }}>
                    <strong>Items:</strong>
                    <ul>
                      {output.items.map((item) => (
                        <li key={item.id}>
                          {item.itemType === "KEG"
                            ? `${item.beerName || "Cerveza"} - ${item.kegQuantity} barril(es) de ${item.kegSizeLiters}L`
                            : `${item.beerName || "Cerveza"} - 330: ${item.units330}, 269: ${item.units269}`}
                          {" - "}
                          Litros: {item.litersDelivered}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}