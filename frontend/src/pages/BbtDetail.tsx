import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getBbtById,
  getAvailableFromFermenters,
  transferToBbt,
  updateBbtStatus,
  kegDownFromBbt,
  sendToBottlingFromBbt,
} from '../api/bbts';

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatLiters(value: any) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return '-';
  return `${num.toFixed(2)} L`;
}

function getStatusMeta(status?: string) {
  switch (status) {
    case 'DISPONIBLE':
      return {
        label: 'Disponible',
        bg: '#dcfce7',
        color: '#166534',
        border: '#86efac',
      };
    case 'SANITIZADO':
      return {
        label: 'Sanitizado',
        bg: '#dbeafe',
        color: '#1d4ed8',
        border: '#93c5fd',
      };
    case 'LIMPIO':
      return {
        label: 'Limpio',
        bg: '#ecfeff',
        color: '#0f766e',
        border: '#99f6e4',
      };
    case 'SUCIO':
      return {
        label: 'Sucio',
        bg: '#fee2e2',
        color: '#b91c1c',
        border: '#fca5a5',
      };
    case 'EN_MADURACION':
      return {
        label: 'En maduración',
        bg: '#fef3c7',
        color: '#92400e',
        border: '#fcd34d',
      };
    case 'EN_CARBONATACION':
      return {
        label: 'En carbonatación',
        bg: '#ede9fe',
        color: '#6d28d9',
        border: '#c4b5fd',
      };
    case 'LISTO_PARA_EMPAQUE':
      return {
        label: 'Carbonatada',
        bg: '#cffafe',
        color: '#155e75',
        border: '#67e8f9',
      };
    default:
      return {
        label: status || '-',
        bg: '#f1f5f9',
        color: '#334155',
        border: '#cbd5e1',
      };
  }
}

function getMovementLabel(type?: string) {
  switch (type) {
    case 'TRANSFER_IN':
      return 'Ingreso desde fermentador';
    case 'STATUS_CHANGE':
      return 'Cambio de estado';
    case 'KEG_FILL':
      return 'Llenado de barriles';
    case 'BOTTLING_ORDER_CREATED':
      return 'Orden de embotellado creada';
    case 'BOTTLING_FINISHED':
      return 'Embotellado finalizado';
    case 'AUTO_MARKED_DIRTY':
      return 'Marcado automático a sucio';
    default:
      return type || '-';
  }
}

export default function BbtDetail() {
  const { id } = useParams();
  const bbtId = Number(id);

  const [bbt, setBbt] = useState<any>(null);
  const [availableBeers, setAvailableBeers] = useState<any[]>([]);
  const [selectedBeer, setSelectedBeer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fermenterId: '',
    processType: 'CLARIFICAR',
    litersTransferred: '',
    lossLiters: '0',
    notes: '',
  });

  const [kegForm, setKegForm] = useState({
    kegs60: 0,
    kegs50: 0,
    kegs30: 0,
    partialLiters: '',
    lossLiters: 0,
    note: '',
  });

  const [bottlingNote, setBottlingNote] = useState('');
  const [showTransfers, setShowTransfers] = useState(false);
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  const [showMovements, setShowMovements] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      const [bbtData, beersData] = await Promise.all([
        getBbtById(bbtId),
        getAvailableFromFermenters(),
      ]);
      setBbt(bbtData);
      setAvailableBeers(beersData);
    } catch (error) {
      console.error(error);
      alert('Error cargando datos del BBT');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [bbtId]);

  const handleBeerChange = (fermenterId: string) => {
    setForm((prev) => ({ ...prev, fermenterId }));
    const beer = availableBeers.find(
      (item) => String(item.fermenterId) === fermenterId,
    );
    setSelectedBeer(beer || null);
  };

  const handleTransfer = async () => {
    try {
      setSaving(true);

      const litersTransferred = Number(form.litersTransferred);
      const lossLiters = Number(form.lossLiters);
      const availableLiters = Number(selectedBeer?.volumeLiters ?? 0);

      if (!form.fermenterId) {
        alert('Debes seleccionar un fermentador');
        return;
      }

      if (!(litersTransferred > 0)) {
        alert('Los litros transferidos deben ser mayores a 0');
        return;
      }

      if (lossLiters < 0) {
        alert('La merma no puede ser negativa');
        return;
      }

      if (lossLiters > litersTransferred) {
        alert('La merma no puede ser mayor que los litros transferidos');
        return;
      }

      if (litersTransferred > availableLiters) {
        alert('No puedes transferir más litros de los disponibles en el fermentador');
        return;
      }

      await transferToBbt({
        fermenterId: Number(form.fermenterId),
        bbtId,
        processType: form.processType as 'CLARIFICAR' | 'CARBONATAR',
        litersTransferred,
        lossLiters,
        notes: form.notes,
      });

      alert('Transferencia registrada correctamente');

      setForm({
        fermenterId: '',
        processType: 'CLARIFICAR',
        litersTransferred: '',
        lossLiters: '0',
        notes: '',
      });
      setSelectedBeer(null);

      await loadData();
    } catch (error: any) {
      alert(error.message || 'Error registrando transferencia');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      setSaving(true);
      await updateBbtStatus(bbtId, { status });
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Error actualizando estado');
    } finally {
      setSaving(false);
    }
  };

  const handleKegDown = async () => {
    try {
      setSaving(true);

      const totalKegs =
        Number(kegForm.kegs60 || 0) +
        Number(kegForm.kegs50 || 0) +
        Number(kegForm.kegs30 || 0);
      const partial = Number(kegForm.partialLiters || 0);

      if (totalKegs <= 0 && partial <= 0 && Number(kegForm.lossLiters || 0) <= 0) {
        alert('Debes registrar al menos barriles, litros parciales o merma');
        return;
      }

      await kegDownFromBbt(bbtId, {
        kegs60: Number(kegForm.kegs60 || 0),
        kegs50: Number(kegForm.kegs50 || 0),
        kegs30: Number(kegForm.kegs30 || 0),
        partialLiters: partial > 0 ? partial : undefined,
        lossLiters: Number(kegForm.lossLiters || 0),
        note: kegForm.note || undefined,
      });

      alert('Barriles registrados correctamente');

      setKegForm({
        kegs60: 0,
        kegs50: 0,
        kegs30: 0,
        partialLiters: '',
        lossLiters: 0,
        note: '',
      });

      await loadData();
    } catch (error: any) {
      alert(error.message || 'Error registrando barriles desde el BBT');
    } finally {
      setSaving(false);
    }
  };

  const handleSendToBottling = async () => {
    try {
      setSaving(true);

      await sendToBottlingFromBbt(bbtId, {
        note: bottlingNote || undefined,
      });

      alert('Orden de embotellado creada correctamente');
      setBottlingNote('');
      await loadData();
    } catch (error: any) {
      alert(error.message || 'Error enviando el BBT a embotellado');
    } finally {
      setSaving(false);
    }
  };

  const hasBeer = Number(bbt?.currentVolumeLiters ?? 0) > 0;

  const canReceiveBeer =
    bbt?.status === 'DISPONIBLE' || bbt?.status === 'SANITIZADO';

  const canPackage =
    bbt?.status === 'LISTO_PARA_EMPAQUE' && hasBeer;

  const statusMeta = useMemo(() => getStatusMeta(bbt?.status), [bbt?.status]);

  const occupancyPercent = useMemo(() => {
    const capacity = Number(bbt?.capacityLiters ?? 0);
    const current = Number(bbt?.currentVolumeLiters ?? 0);
    if (!(capacity > 0)) return 0;
    return Math.min(100, Math.max(0, Number(((current / capacity) * 100).toFixed(1))));
  }, [bbt?.capacityLiters, bbt?.currentVolumeLiters]);

  if (loading) {
    return <div style={{ padding: 24 }}>Cargando BBT...</div>;
  }

  if (!bbt) {
    return <div style={{ padding: 24 }}>No se encontró el BBT</div>;
  }

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div>
          <div style={heroEyebrowStyle}>Módulo BBT</div>
          <h1 style={heroTitleStyle}>{bbt.name}</h1>
          <p style={heroSubtitleStyle}>
            Gestión del tanque, transferencias, cambios de estado, empaque y trazabilidad.
          </p>
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

      <div style={summaryGridStyle}>
        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Capacidad total</div>
          <div style={metricValueStyle}>{formatLiters(bbt.capacityLiters)}</div>
        </div>

        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Volumen actual</div>
          <div style={metricValueStyle}>{formatLiters(bbt.currentVolumeLiters)}</div>
        </div>

        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Cerveza actual</div>
          <div style={metricValueStyle}>{bbt.currentBeerName || '-'}</div>
        </div>

        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Cliente</div>
          <div style={metricValueStyle}>{bbt.currentClientName || '-'}</div>
        </div>

        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Producción</div>
          <div style={metricValueStyle}>{bbt.currentProductionId || '-'}</div>
        </div>

        <div style={metricCardStyle}>
          <div style={metricLabelStyle}>Proceso</div>
          <div style={metricValueStyle}>{bbt.processType || '-'}</div>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Ocupación del tanque</h2>
            <p style={sectionSubtitleStyle}>
              Nivel actual respecto a la capacidad total del BBT.
            </p>
          </div>
          <div style={occupancyTextStyle}>{occupancyPercent}%</div>
        </div>

        <div style={progressTrackStyle}>
          <div
            style={{
              ...progressFillStyle,
              width: `${occupancyPercent}%`,
            }}
          />
        </div>
      </div>

      {canReceiveBeer && (
        <div style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Ingreso desde fermentador en trasiego</h2>
              <p style={sectionSubtitleStyle}>
                Recibe cerveza desde un fermentador disponible para transferencia.
              </p>
            </div>
          </div>

          <div style={formGridStyle}>
            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Seleccionar cerveza disponible</label>
              <select
                value={form.fermenterId}
                onChange={(e) => handleBeerChange(e.target.value)}
                style={fieldStyle}
              >
                <option value="">Seleccione una cerveza</option>
                {availableBeers.map((beer) => (
                  <option key={beer.fermenterId} value={beer.fermenterId}>
                    {`Prod ${beer.productionId} - ${beer.beerName} - ${beer.clientName} - ${beer.fermenterName} - ${beer.volumeLiters} L`}
                  </option>
                ))}
              </select>
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Proceso</label>
              <select
                value={form.processType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, processType: e.target.value }))
                }
                style={fieldStyle}
              >
                <option value="CLARIFICAR">Clarificar</option>
                <option value="CARBONATAR">Carbonatar</option>
              </select>
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Litros transferidos</label>
              <input
                type="number"
                value={form.litersTransferred}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, litersTransferred: e.target.value }))
                }
                style={fieldStyle}
              />
            </div>

            <div style={fieldBlockStyle}>
              <label style={labelStyle}>Merma (L)</label>
              <input
                type="number"
                value={form.lossLiters}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, lossLiters: e.target.value }))
                }
                style={fieldStyle}
              />
            </div>
          </div>

          {selectedBeer && (
            <div style={highlightBoxStyle}>
              <div style={highlightGridStyle}>
                <div><strong>ID Producción:</strong> {selectedBeer.productionId}</div>
                <div><strong>Cerveza:</strong> {selectedBeer.beerName}</div>
                <div><strong>Cliente:</strong> {selectedBeer.clientName}</div>
                <div><strong>Fermentador:</strong> {selectedBeer.fermenterName}</div>
                <div><strong>Volumen disponible:</strong> {formatLiters(selectedBeer.volumeLiters)}</div>
              </div>
            </div>
          )}

          <div style={fieldBlockStyle}>
            <label style={labelStyle}>Observaciones</label>
            <textarea
              value={form.notes}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, notes: e.target.value }))
              }
              style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }}
            />
          </div>

          <div style={actionRowStyle}>
            <button onClick={handleTransfer} disabled={saving} style={primaryButtonStyle}>
              {saving ? 'Guardando...' : 'Registrar ingreso a BBT'}
            </button>
          </div>
        </div>
      )}

      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Estados operativos del BBT</h2>
            <p style={sectionSubtitleStyle}>
              {hasBeer
                ? 'El tanque tiene cerveza cargada. Solo puedes cambiar a estados de proceso.'
                : 'El tanque está vacío. Solo puedes cambiar a estados de limpieza o disponibilidad.'}
            </p>
          </div>
          <div style={{
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 800,
            background: hasBeer ? '#fef3c7' : '#f0fdf4',
            color: hasBeer ? '#92400e' : '#166534',
            border: `1px solid ${hasBeer ? '#fcd34d' : '#86efac'}`,
            whiteSpace: 'nowrap',
          }}>
            {hasBeer ? `Con cerveza · ${Number(bbt.currentVolumeLiters).toFixed(1)} L` : 'Vacío'}
          </div>
        </div>

        {!hasBeer && (
          <div style={statusButtonsGridStyle}>
            {([
              { key: 'SUCIO',      label: 'Sucio',      bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
              { key: 'LIMPIO',     label: 'Limpio',     bg: '#ecfeff', color: '#0f766e', border: '#99f6e4' },
              { key: 'SANITIZADO', label: 'Sanitizado', bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
              { key: 'DISPONIBLE', label: 'Disponible', bg: '#dcfce7', color: '#166534', border: '#86efac' },
            ] as const).map(({ key, label, bg, color, border }) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                disabled={saving || bbt?.status === key}
                style={{
                  ...statusActionButtonStyle,
                  background: bbt?.status === key ? bg : '#fff',
                  color: bbt?.status === key ? color : '#334155',
                  borderColor: bbt?.status === key ? border : '#cbd5e1',
                  borderWidth: bbt?.status === key ? 2 : 1,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {bbt?.status === key && <span style={{ marginRight: 6 }}>✓</span>}
                {label}
              </button>
            ))}
          </div>
        )}

        {hasBeer && (
          <div style={statusButtonsGridStyle}>
            {([
              { key: 'EN_MADURACION',     label: 'En maduración',    bg: '#fef3c7', color: '#92400e', border: '#fcd34d' },
              { key: 'EN_CARBONATACION',  label: 'En carbonatación', bg: '#ede9fe', color: '#6d28d9', border: '#c4b5fd' },
              { key: 'LISTO_PARA_EMPAQUE',label: 'Carbonatada',      bg: '#cffafe', color: '#155e75', border: '#67e8f9' },
            ] as const).map(({ key, label, bg, color, border }) => (
              <button
                key={key}
                onClick={() => handleStatusChange(key)}
                disabled={saving || bbt?.status === key}
                style={{
                  ...statusActionButtonStyle,
                  background: bbt?.status === key ? bg : '#fff',
                  color: bbt?.status === key ? color : '#334155',
                  borderColor: bbt?.status === key ? border : '#cbd5e1',
                  borderWidth: bbt?.status === key ? 2 : 1,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {bbt?.status === key && <span style={{ marginRight: 6 }}>✓</span>}
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {canPackage && (
        <div style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Funciones de empaque</h2>
              <p style={sectionSubtitleStyle}>
                Registra salida a barriles o crea orden para embotellado desde este BBT.
              </p>
            </div>
          </div>

          <div style={packageGridStyle}>
            <div style={subCardStyle}>
              <h3 style={subCardTitleStyle}>Llenar barriles</h3>

              <div style={formGridStyle}>
                <div style={fieldBlockStyle}>
                  <label style={labelStyle}>Barriles 60 L</label>
                  <input
                    type="number"
                    min="0"
                    value={kegForm.kegs60}
                    onChange={(e) =>
                      setKegForm((prev) => ({
                        ...prev,
                        kegs60: Number(e.target.value || 0),
                      }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div style={fieldBlockStyle}>
                  <label style={labelStyle}>Barriles 50 L</label>
                  <input
                    type="number"
                    min="0"
                    value={kegForm.kegs50}
                    onChange={(e) =>
                      setKegForm((prev) => ({
                        ...prev,
                        kegs50: Number(e.target.value || 0),
                      }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div style={fieldBlockStyle}>
                  <label style={labelStyle}>Barriles 30 L</label>
                  <input
                    type="number"
                    min="0"
                    value={kegForm.kegs30}
                    onChange={(e) =>
                      setKegForm((prev) => ({
                        ...prev,
                        kegs30: Number(e.target.value || 0),
                      }))
                    }
                    style={fieldStyle}
                  />
                </div>

                <div style={fieldBlockStyle}>
                  <label style={labelStyle}>Merma (L)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={kegForm.lossLiters}
                    onChange={(e) =>
                      setKegForm((prev) => ({
                        ...prev,
                        lossLiters: Number(e.target.value || 0),
                      }))
                    }
                    style={fieldStyle}
                  />
                </div>
              </div>

              {/* Campo barril parcial */}
              <div style={{
                background: '#faf5ff',
                border: '1px dashed #c4b5fd',
                borderRadius: 10,
                padding: 12,
                marginBottom: 12,
              }}>
                <label style={{ ...labelStyle, color: '#6d28d9', display: 'block', marginBottom: 4 }}>
                  Barril parcial — cantidad exacta (L)
                </label>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: '#7c3aed' }}>
                  Usa este campo si queda cerveza que no alcanza para un barril completo.
                  Ejemplo: quedan 18 L → escribe 18.
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Ej: 18"
                  value={kegForm.partialLiters}
                  onChange={(e) =>
                    setKegForm((prev) => ({ ...prev, partialLiters: e.target.value }))
                  }
                  style={{ ...fieldStyle, borderColor: '#c4b5fd', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Resumen */}
              {(() => {
                const litersComplete =
                  Number(kegForm.kegs60 || 0) * 60 +
                  Number(kegForm.kegs50 || 0) * 50 +
                  Number(kegForm.kegs30 || 0) * 30;
                const partial = Number(kegForm.partialLiters || 0);
                const loss = Number(kegForm.lossLiters || 0);
                const total = litersComplete + partial + loss;
                const available = Number(bbt?.currentVolumeLiters ?? 0);
                if (total <= 0) return null;
                return (
                  <div style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 12,
                    fontSize: 14,
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>Resumen de esta bajada</div>
                    {litersComplete > 0 && <div>Barriles completos: <strong>{litersComplete} L</strong></div>}
                    {partial > 0 && <div>Barril parcial: <strong style={{ color: '#6d28d9' }}>{partial} L</strong></div>}
                    {loss > 0 && <div>Merma: <strong>{loss} L</strong></div>}
                    <div style={{ marginTop: 6, fontWeight: 800 }}>
                      Total que saldrá del BBT:{' '}
                      <span style={{ color: total > available ? '#dc2626' : '#1d4ed8' }}>
                        {total.toFixed(1)} L
                      </span>
                      {total > available && (
                        <span style={{ color: '#dc2626', marginLeft: 8, fontWeight: 700 }}>
                          ⚠ Excede los {available} L disponibles
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              <div style={fieldBlockStyle}>
                <label style={labelStyle}>Nota</label>
                <input
                  type="text"
                  value={kegForm.note}
                  onChange={(e) =>
                    setKegForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  style={fieldStyle}
                />
              </div>

              <button onClick={handleKegDown} disabled={saving} style={primaryButtonStyle}>
                {saving ? 'Guardando...' : 'Registrar barriles desde BBT'}
              </button>
            </div>

            <div style={subCardStyle}>
              <h3 style={subCardTitleStyle}>Enviar a embotellado</h3>

              <div style={fieldBlockStyle}>
                <label style={labelStyle}>Nota</label>
                <input
                  type="text"
                  value={bottlingNote}
                  onChange={(e) => setBottlingNote(e.target.value)}
                  style={fieldStyle}
                />
              </div>

              <button
                onClick={handleSendToBottling}
                disabled={saving}
                style={secondaryButtonStyle}
              >
                {saving ? 'Guardando...' : 'Crear orden de embotellado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historial de transferencias — acordeón */}
      <div style={sectionCardStyle}>
        <button
          onClick={() => setShowTransfers((v) => !v)}
          style={accordionButtonStyle}
        >
          <span>📋 Historial de transferencias</span>
          <span style={accordionBadgeStyle}>{bbt.transfers?.length ?? 0}</span>
          <span style={accordionChevronStyle}>{showTransfers ? '▲' : '▼'}</span>
        </button>

        {showTransfers && (
          <div style={{ marginTop: 16 }}>
            {!bbt.transfers?.length ? (
              <div style={emptyStateStyle}>No hay transferencias registradas.</div>
            ) : (
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={theadRowStyle}>
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Cerveza</th>
                      <th style={thStyle}>Cliente</th>
                      <th style={thStyle}>Proceso</th>
                      <th style={thStyle}>Litros transferidos</th>
                      <th style={thStyle}>Merma</th>
                      <th style={thStyle}>Litros netos</th>
                      <th style={thStyle}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bbt.transfers.map((t: any) => (
                      <tr key={t.id}>
                        <td style={tdStyle}>{t.id}</td>
                        <td style={tdStyle}>{t.production?.beerName ?? '-'}</td>
                        <td style={tdStyle}>{t.production?.client?.name ?? '-'}</td>
                        <td style={tdStyle}>{t.processType}</td>
                        <td style={tdStyle}>{formatLiters(t.litersTransferred)}</td>
                        <td style={tdStyle}>{formatLiters(t.lossLiters)}</td>
                        <td style={tdStyle}>{formatLiters(t.litersReceivedInBbt)}</td>
                        <td style={tdStyle}>{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historial de estados — acordeón */}
      <div style={sectionCardStyle}>
        <button
          onClick={() => setShowStatusHistory((v) => !v)}
          style={accordionButtonStyle}
        >
          <span>🔄 Historial de estados del BBT</span>
          <span style={accordionBadgeStyle}>{bbt.statusHistory?.length ?? 0}</span>
          <span style={accordionChevronStyle}>{showStatusHistory ? '▲' : '▼'}</span>
        </button>

        {showStatusHistory && (
          <div style={{ marginTop: 16 }}>
            {!bbt.statusHistory?.length ? (
              <div style={emptyStateStyle}>No hay historial de estados registrado.</div>
            ) : (
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={theadRowStyle}>
                      <th style={thStyle}>De</th>
                      <th style={thStyle}>A</th>
                      <th style={thStyle}>Usuario</th>
                      <th style={thStyle}>Nota</th>
                      <th style={thStyle}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bbt.statusHistory.map((h: any) => (
                      <tr key={h.id}>
                        <td style={tdStyle}>{h.fromStatus || '-'}</td>
                        <td style={tdStyle}>{h.toStatus || '-'}</td>
                        <td style={tdStyle}>{h.changedBy || '-'}</td>
                        <td style={tdStyle}>{h.note || '-'}</td>
                        <td style={tdStyle}>{formatDate(h.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Movimientos del BBT — acordeón */}
      <div style={sectionCardStyle}>
        <button
          onClick={() => setShowMovements((v) => !v)}
          style={accordionButtonStyle}
        >
          <span>📊 Historial de movimientos</span>
          <span style={accordionBadgeStyle}>{bbt.movements?.length ?? 0}</span>
          <span style={accordionChevronStyle}>{showMovements ? '▲' : '▼'}</span>
        </button>

        {showMovements && (
          <div style={{ marginTop: 16 }}>
            {!bbt.movements?.length ? (
              <div style={emptyStateStyle}>No hay movimientos registrados.</div>
            ) : (
              <div style={tableWrapStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={theadRowStyle}>
                      <th style={thStyle}>Tipo</th>
                      <th style={thStyle}>Entrada (L)</th>
                      <th style={thStyle}>Salida (L)</th>
                      <th style={thStyle}>Merma (L)</th>
                      <th style={thStyle}>Vol. resultante</th>
                      <th style={thStyle}>Usuario</th>
                      <th style={thStyle}>Nota</th>
                      <th style={thStyle}>Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bbt.movements.map((m: any) => (
                      <tr key={m.id}>
                        <td style={tdStyle}>{getMovementLabel(m.movementType)}</td>
                        <td style={tdStyle}>{formatLiters(m.litersIn)}</td>
                        <td style={tdStyle}>{formatLiters(m.litersOut)}</td>
                        <td style={tdStyle}>{formatLiters(m.lossLiters)}</td>
                        <td style={tdStyle}>{formatLiters(m.resultingVolumeLiters)}</td>
                        <td style={tdStyle}>{m.changedBy || '-'}</td>
                        <td style={tdStyle}>{m.note || '-'}</td>
                        <td style={tdStyle}>{formatDate(m.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle: CSSProperties = {
  padding: 24,
  background: '#f8fafc',
  minHeight: '100vh',
};

const heroStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: 24,
  borderRadius: 20,
  background: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%)',
  color: '#fff',
  marginBottom: 20,
  boxShadow: '0 16px 40px rgba(15, 23, 42, 0.18)',
};

const heroEyebrowStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  opacity: 0.8,
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
  opacity: 0.9,
  lineHeight: 1.5,
};

const statusBadgeStyle: CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid',
  fontWeight: 800,
  fontSize: 14,
  whiteSpace: 'nowrap',
  background: '#fff',
};

const summaryGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 14,
  marginBottom: 20,
};

const metricCardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
};

const metricLabelStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 13,
  fontWeight: 700,
  marginBottom: 10,
};

const metricValueStyle: CSSProperties = {
  color: '#0f172a',
  fontSize: 22,
  fontWeight: 800,
  wordBreak: 'break-word',
};

const sectionCardStyle: CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 18,
  padding: 20,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
  marginBottom: 20,
};

const sectionHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
  marginBottom: 16,
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 22,
  fontWeight: 800,
  color: '#0f172a',
};

const sectionSubtitleStyle: CSSProperties = {
  margin: '6px 0 0 0',
  color: '#64748b',
  lineHeight: 1.45,
};

const occupancyTextStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: '#1d4ed8',
};

const progressTrackStyle: CSSProperties = {
  width: '100%',
  height: 16,
  borderRadius: 999,
  background: '#e2e8f0',
  overflow: 'hidden',
};

const progressFillStyle: CSSProperties = {
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(90deg, #06b6d4 0%, #2563eb 100%)',
  transition: 'width 0.25s ease',
};

const formGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  marginBottom: 16,
};

const fieldBlockStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const labelStyle: CSSProperties = {
  fontWeight: 700,
  color: '#0f172a',
  fontSize: 14,
};

const fieldStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #cbd5e1',
  background: '#fff',
  fontSize: 14,
  boxSizing: 'border-box',
  outline: 'none',
};

const highlightBoxStyle: CSSProperties = {
  background: '#eff6ff',
  border: '1px solid #bfdbfe',
  borderRadius: 14,
  padding: 16,
  marginBottom: 16,
};

const highlightGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 10,
  color: '#1e3a8a',
};

const actionRowStyle: CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const primaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 22px rgba(37, 99, 235, 0.22)',
};

const secondaryButtonStyle: CSSProperties = {
  background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 12,
  padding: '12px 18px',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 10px 22px rgba(13, 148, 136, 0.18)',
};

const statusButtonsGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 10,
};

const statusActionButtonStyle: CSSProperties = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#0f172a',
  borderRadius: 12,
  padding: '12px 14px',
  fontWeight: 800,
  cursor: 'pointer',
};

const packageGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 16,
};

const subCardStyle: CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  padding: 16,
};

const subCardTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  fontSize: 18,
  fontWeight: 800,
  color: '#0f172a',
};

const emptyStateStyle: CSSProperties = {
  padding: 18,
  borderRadius: 14,
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  color: '#64748b',
};

const tableWrapStyle: CSSProperties = {
  overflowX: 'auto',
};

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 860,
};

const theadRowStyle: CSSProperties = {
  background: '#f8fafc',
};

const thStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #e2e8f0',
  textAlign: 'left',
  fontSize: 13,
  color: '#334155',
  fontWeight: 800,
  whiteSpace: 'nowrap',
};

const tdStyle: CSSProperties = {
  padding: '12px 14px',
  borderBottom: '1px solid #f1f5f9',
  fontSize: 14,
  color: '#0f172a',
  verticalAlign: 'top',
};

const accordionButtonStyle: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: '14px 18px',
  fontWeight: 800,
  fontSize: 15,
  color: '#0f172a',
  cursor: 'pointer',
  textAlign: 'left',
};

const accordionBadgeStyle: CSSProperties = {
  marginLeft: 'auto',
  background: '#e2e8f0',
  color: '#475569',
  borderRadius: 999,
  padding: '2px 10px',
  fontSize: 13,
  fontWeight: 700,
};

const accordionChevronStyle: CSSProperties = {
  fontSize: 12,
  color: '#94a3b8',
  marginLeft: 6,
};