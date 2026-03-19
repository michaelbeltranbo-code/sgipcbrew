import { CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getProductionReport } from "../api/reports";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatNumber(value: any, decimals = 2) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "-";
  return num.toFixed(decimals);
}

function formatLiters(value: any) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "-";
  return `${num.toFixed(2)} L`;
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div style={infoCardStyle}>
      <div style={infoLabelStyle}>{label}</div>
      <div style={infoValueStyle}>{value ?? "-"}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div style={emptyStateStyle}>{text}</div>;
}

function TableSection({
  title,
  columns,
  rows,
}: {
  title?: string;
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      {title && <h3 style={subSectionTitleStyle}>{title}</h3>}

      {rows.length === 0 ? (
        <EmptyState text="No hay registros disponibles." />
      ) : (
        <div style={tableWrapStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={theadRowStyle}>
                {columns.map((col) => (
                  <th key={col} style={thStyle}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, i) => (
                    <td key={i} style={tdStyle}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function ProductionReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productionId = Number(id);

  const reportQ = useQuery({
    queryKey: ["production-report", productionId],
    queryFn: () => getProductionReport(productionId),
    enabled: productionId > 0,
  });

  const data = reportQ.data;

  function downloadPdf() {
  if (!data) return;

  const doc = new jsPDF("p", "mm", "a4");
  const {
    datosGenerales,
    materiasPrimas,
    fermentacion,
    existenciasActuales,
    barrilesCuartoFrio,
    botellasProductoTerminado,
  } = data;

  const pdfTableStyle = {
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
  };

  doc.setFontSize(14);
  doc.text(`Informe de Producción #${datosGenerales.id}`, 14, 15);

  doc.setFontSize(9);
  doc.text(`Cerveza: ${datosGenerales.cerveza ?? "-"}`, 14, 24);
  doc.text(`Cliente: ${datosGenerales.cliente ?? "-"}`, 14, 30);
  doc.text(`Estado: ${datosGenerales.estado ?? "-"}`, 14, 36);

  autoTable(doc, {
    startY: 44,
    head: [["Campo", "Valor"]],
    body: [
      ["ID producción", String(datosGenerales.id ?? "-")],
      ["Cerveza", datosGenerales.cerveza ?? "-"],
      ["Cliente", datosGenerales.cliente ?? "-"],
      ["Responsable", datosGenerales.responsable ?? "-"],
      ["Estado", datosGenerales.estado ?? "-"],
      ["Fecha producción", formatDate(datosGenerales.fechaProduccion)],
      ["Litros producción", formatLiters(datosGenerales.litrosProduccion)],
      ["Litros post hervor", formatLiters(datosGenerales.litrosPostHervor)],
      ["pH inicial", datosGenerales.phInicial ?? "-"],
      ["Densidad inicial", datosGenerales.densidadInicial ?? "-"],
    ],
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Maltas", "Lote", "Cantidad (kg)", "Proveedor"]],
    body: (materiasPrimas?.malts ?? []).map((m: any) => [
      m.nombre ?? "-",
      m.lote ?? "-",
      formatNumber(m.cantidadKg),
      m.proveedor ?? "-",
    ]),
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Lúpulos", "Lote", "Cantidad (g)", "Minuto hervor", "Proveedor"]],
    body: (materiasPrimas?.hops ?? []).map((h: any) => [
      h.nombre ?? "-",
      h.lote ?? "-",
      formatNumber(h.cantidadGramos),
      h.minutoHervor ?? "-",
      h.proveedor ?? "-",
    ]),
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Adjuntos", "Lote", "Cantidad (kg)", "Momento", "Notas", "Proveedor"]],
    body: (materiasPrimas?.adjuncts ?? []).map((a: any) => [
      a.nombre ?? "-",
      a.lote ?? "-",
      formatNumber(a.cantidadKg),
      a.momentoAdicion ?? "-",
      a.notas ?? "-",
      a.proveedor ?? "-",
    ]),
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Otros materiales", "Tipo", "Cantidad", "Unidad", "Lote", "Proveedor"]],
    body: (materiasPrimas?.otros ?? []).map((o: any) => [
      o.nombre ?? "-",
      o.tipo ?? "-",
      formatNumber(o.cantidadUsada),
      o.unidad ?? "-",
      o.lote ?? "-",
      o.proveedor ?? "-",
    ]),
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Dato de fermentación", "Valor"]],
    body: [
      ["Fecha inicio", formatDate(fermentacion?.resumen?.fechaInicio)],
      ["Dry hop aplicado", fermentacion?.resumen?.dryHopAplicado ? "Sí" : "No"],
      ["Descripción dry hop", fermentacion?.resumen?.descripcionDryHop ?? "-"],
      ["Purgas", fermentacion?.resumen?.purgas ?? 0],
      ["Peso purga (kg)", formatNumber(fermentacion?.resumen?.pesoPurgaKg)],
      ["Notas", fermentacion?.resumen?.notas ?? "-"],
    ],
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [[
      "Fecha",
      "pH",
      "Densidad",
      "Temperatura",
      "Purgas",
      "Unidad",
      "Dry hop",
      "Clarificante",
      "Carbonatada",
      "Adiciones",
      "Nota",
      "Registrado por",
    ]],
    body: (fermentacion?.lecturas ?? []).map((r: any) => [
      formatDate(r.recordedAt),
      r.ph ?? "-",
      r.density ?? "-",
      r.temperature ?? "-",
      r.purges ?? "-",
      r.purgeUnit ?? "-",
      r.dryHop ? "Sí" : "No",
      r.hasClarifier ? "Sí" : "No",
      r.isCarbonated ? "Sí" : "No",
      r.additions ?? "-",
      r.note ?? "-",
      r.recordedByName ?? "-",
    ]),
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["Cerveza en fermentador", "Estado", "Litros"]],
    body: existenciasActuales?.enFermentador
      ? [[
          existenciasActuales.enFermentador.fermentador ?? "-",
          existenciasActuales.enFermentador.estado ?? "-",
          formatLiters(existenciasActuales.enFermentador.litros),
        ]]
      : [["No hay cerveza actualmente en fermentador", "-", "-"]],
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [["BBT", "Estado", "Proceso", "Litros"]],
    body:
      (existenciasActuales?.enBbt ?? []).length > 0
        ? (existenciasActuales?.enBbt ?? []).map((b: any) => [
            b.bbt ?? "-",
            b.estado ?? "-",
            b.proceso ?? "-",
            formatLiters(b.litros),
          ])
        : [["No hay cerveza actualmente en BBT", "-", "-", "-"]],
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [[
      "ID",
      "Cerveza",
      "Cliente",
      "Fuente",
      "60 L",
      "50 L",
      "30 L",
      "Litros",
      "Merma",
      "Fecha",
    ]],
    body:
      (barrilesCuartoFrio?.registros ?? []).length > 0
        ? (barrilesCuartoFrio?.registros ?? []).map((k: any) => [
            k.id,
            k.cerveza ?? "-",
            k.cliente ?? "-",
            k.fuente ?? "-",
            k.barriles60 ?? 0,
            k.barriles50 ?? 0,
            k.barriles30 ?? 0,
            formatLiters(k.litrosTotales),
            formatLiters(k.merma),
            formatDate(k.fechaRegistro),
          ])
        : [["No hay barriles en cuarto frío", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
    ...pdfTableStyle,
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 6,
    head: [[
      "Orden",
      "Fuente",
      "Cerveza",
      "Cliente",
      "Unid. 335",
      "Unid. 269",
      "L 335",
      "L 269",
      "Merma",
      "Total",
      "Fecha finalización",
    ]],
    body:
      (botellasProductoTerminado?.registros ?? []).length > 0
        ? (botellasProductoTerminado?.registros ?? []).map((b: any) => [
            b.ordenId,
            b.fuente ?? "-",
            b.cerveza ?? "-",
            b.cliente ?? "-",
            b.unidades335 ?? 0,
            b.unidades269 ?? 0,
            formatLiters(b.litros335),
            formatLiters(b.litros269),
            formatLiters(b.merma),
            formatLiters(b.totalProcesado),
            formatDate(b.fechaFinalizacion),
          ])
        : [["No hay botellas o latas registradas", "-", "-", "-", "-", "-", "-", "-", "-", "-", "-"]],
    ...pdfTableStyle,
  });

  doc.save(`informe-produccion-${datosGenerales.id}.pdf`);
}

  if (reportQ.isLoading) {
    return <div style={{ padding: 24 }}>Cargando informe...</div>;
  }

  if (reportQ.isError || !data) {
    return <div style={{ padding: 24 }}>No se pudo cargar el informe.</div>;
  }

  const { datosGenerales, materiasPrimas, fermentacion, existenciasActuales, barrilesCuartoFrio, botellasProductoTerminado } =
    data;

  return (
    <div style={pageStyle}>
      <div style={heroStyle}>
        <div>
          <div style={heroEyebrowStyle}>Informe de producción</div>
          <h1 style={heroTitleStyle}>
            {datosGenerales?.cerveza || "Cerveza sin nombre"}
          </h1>
          <p style={heroSubtitleStyle}>
            Informe consolidado de producción, materias primas, fermentación, existencias y empaque.
          </p>
        </div>

        <div style={heroActionsStyle}>
          <button style={secondaryButtonStyle} onClick={() => navigate(-1)}>
            Volver
          </button>
          <button style={primaryButtonStyle} onClick={downloadPdf}>
            Descargar PDF
          </button>
        </div>
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Datos generales de la cerveza</h2>
        <div style={infoGridStyle}>
          <InfoCard label="ID producción" value={datosGenerales?.id} />
          <InfoCard label="Cerveza" value={datosGenerales?.cerveza} />
          <InfoCard label="Cliente" value={datosGenerales?.cliente} />
          <InfoCard label="Responsable" value={datosGenerales?.responsable} />
          <InfoCard label="Estado" value={datosGenerales?.estado} />
          <InfoCard label="Fecha de producción" value={formatDate(datosGenerales?.fechaProduccion)} />
          <InfoCard label="Litros de producción" value={formatLiters(datosGenerales?.litrosProduccion)} />
          <InfoCard label="Litros post hervor" value={formatLiters(datosGenerales?.litrosPostHervor)} />
          <InfoCard label="pH inicial" value={datosGenerales?.phInicial ?? "-"} />
          <InfoCard label="Densidad inicial" value={datosGenerales?.densidadInicial ?? "-"} />
        </div>
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Materias primas utilizadas</h2>

        <TableSection
          title="Maltas"
          columns={["Nombre", "Lote", "Cantidad (kg)", "Proveedor"]}
          rows={(materiasPrimas?.malts ?? []).map((item: any) => [
            item.nombre ?? "-",
            item.lote ?? "-",
            formatNumber(item.cantidadKg),
            item.proveedor ?? "-",
          ])}
        />

        <TableSection
          title="Lúpulos"
          columns={["Nombre", "Lote", "Cantidad (g)", "Minuto hervor", "Proveedor"]}
          rows={(materiasPrimas?.hops ?? []).map((item: any) => [
            item.nombre ?? "-",
            item.lote ?? "-",
            formatNumber(item.cantidadGramos),
            item.minutoHervor ?? "-",
            item.proveedor ?? "-",
          ])}
        />

        <TableSection
          title="Adjuntos"
          columns={["Nombre", "Lote", "Cantidad (kg)", "Momento de adición", "Notas", "Proveedor"]}
          rows={(materiasPrimas?.adjuncts ?? []).map((item: any) => [
            item.nombre ?? "-",
            item.lote ?? "-",
            formatNumber(item.cantidadKg),
            item.momentoAdicion ?? "-",
            item.notas ?? "-",
            item.proveedor ?? "-",
          ])}
        />

        <TableSection
          title="Otros materiales"
          columns={["Nombre", "Tipo", "Cantidad usada", "Unidad", "Lote", "Proveedor"]}
          rows={(materiasPrimas?.otros ?? []).map((item: any) => [
            item.nombre ?? "-",
            item.tipo ?? "-",
            formatNumber(item.cantidadUsada),
            item.unidad ?? "-",
            item.lote ?? "-",
            item.proveedor ?? "-",
          ])}
        />
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Datos de fermentación</h2>

        <div style={infoGridStyle}>
          <InfoCard label="Fecha inicio fermentación" value={formatDate(fermentacion?.resumen?.fechaInicio)} />
          <InfoCard label="Dry hop aplicado" value={fermentacion?.resumen?.dryHopAplicado ? "Sí" : "No"} />
          <InfoCard label="Descripción dry hop" value={fermentacion?.resumen?.descripcionDryHop ?? "-"} />
          <InfoCard label="Purgas" value={fermentacion?.resumen?.purgas ?? 0} />
          <InfoCard label="Peso purga (kg)" value={formatNumber(fermentacion?.resumen?.pesoPurgaKg)} />
          <InfoCard label="Notas" value={fermentacion?.resumen?.notas ?? "-"} />
        </div>

        <TableSection
          title="Lecturas de fermentación"
          columns={[
            "Fecha",
            "pH",
            "Densidad",
            "Temperatura",
            "Purgas",
            "Unidad purga",
            "Dry hop",
            "Clarificante",
            "Carbonatada",
            "Adiciones",
            "Nota",
            "Registrado por",
          ]}
          rows={(fermentacion?.lecturas ?? []).map((item: any) => [
            formatDate(item.recordedAt),
            item.ph ?? "-",
            item.density ?? "-",
            item.temperature ?? "-",
            item.purges ?? "-",
            item.purgeUnit ?? "-",
            item.dryHop ? "Sí" : "No",
            item.hasClarifier ? "Sí" : "No",
            item.isCarbonated ? "Sí" : "No",
            item.additions ?? "-",
            item.note ?? "-",
            item.recordedByName ?? "-",
          ])}
        />
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Cerveza actualmente en fermentador</h2>

        {existenciasActuales?.enFermentador ? (
          <div style={infoGridStyle}>
            <InfoCard label="Fermentador" value={existenciasActuales.enFermentador.fermentador} />
            <InfoCard label="Estado" value={existenciasActuales.enFermentador.estado} />
            <InfoCard label="Litros actuales" value={formatLiters(existenciasActuales.enFermentador.litros)} />
          </div>
        ) : (
          <EmptyState text="No hay cerveza actualmente en fermentador para esta producción." />
        )}
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Cerveza actualmente en BBT</h2>

        {(existenciasActuales?.enBbt ?? []).length === 0 ? (
          <EmptyState text="No hay cerveza actualmente en BBT para esta producción." />
        ) : (
          <TableSection
            columns={["BBT", "Estado", "Proceso", "Litros actuales"]}
            rows={(existenciasActuales?.enBbt ?? []).map((item: any) => [
              item.bbt ?? "-",
              item.estado ?? "-",
              item.proceso ?? "-",
              formatLiters(item.litros),
            ])}
          />
        )}
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Barriles en cuarto frío</h2>

        <div style={infoGridStyle}>
          <InfoCard label="Total barriles 60 L" value={barrilesCuartoFrio?.total60 ?? 0} />
          <InfoCard label="Total barriles 50 L" value={barrilesCuartoFrio?.total50 ?? 0} />
          <InfoCard label="Total barriles 30 L" value={barrilesCuartoFrio?.total30 ?? 0} />
          <InfoCard label="Total litros en barriles" value={formatLiters(barrilesCuartoFrio?.totalLitros)} />
        </div>

        <TableSection
          columns={[
            "ID",
            "Cerveza",
            "Cliente",
            "Fuente",
            "Barriles 60",
            "Barriles 50",
            "Barriles 30",
            "Litros totales",
            "Merma",
            "Fecha registro",
          ]}
          rows={(barrilesCuartoFrio?.registros ?? []).map((item: any) => [
            item.id,
            item.cerveza ?? "-",
            item.cliente ?? "-",
            item.fuente ?? "-",
            item.barriles60 ?? 0,
            item.barriles50 ?? 0,
            item.barriles30 ?? 0,
            formatLiters(item.litrosTotales),
            formatLiters(item.merma),
            formatDate(item.fechaRegistro),
          ])}
        />
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Botellas y latas registradas</h2>

        <div style={infoGridStyle}>
          <InfoCard label="Total unidades 335 ml" value={botellasProductoTerminado?.totalUnidades335 ?? 0} />
          <InfoCard label="Total unidades 269 ml" value={botellasProductoTerminado?.totalUnidades269 ?? 0} />
          <InfoCard
            label="Total litros en producto terminado"
            value={formatLiters(botellasProductoTerminado?.totalLitrosBotella)}
          />
        </div>

        <TableSection
          columns={[
            "Orden",
            "Fuente",
            "Cerveza",
            "Cliente",
            "Unidades 335",
            "Unidades 269",
            "Litros 335",
            "Litros 269",
            "Merma",
            "Total procesado",
            "Fecha finalización",
          ]}
          rows={(botellasProductoTerminado?.registros ?? []).map((item: any) => [
            item.ordenId,
            item.fuente ?? "-",
            item.cerveza ?? "-",
            item.cliente ?? "-",
            item.unidades335 ?? 0,
            item.unidades269 ?? 0,
            formatLiters(item.litros335),
            formatLiters(item.litros269),
            formatLiters(item.merma),
            formatLiters(item.totalProcesado),
            formatDate(item.fechaFinalizacion),
          ])}
        />
      </div>

      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Resumen final</h2>

        <div style={summaryGridStyle}>
          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Cerveza</div>
            <div style={summaryValueStyle}>{datosGenerales?.cerveza ?? "-"}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Cliente</div>
            <div style={summaryValueStyle}>{datosGenerales?.cliente ?? "-"}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Litros en barriles</div>
            <div style={summaryValueStyle}>{formatLiters(barrilesCuartoFrio?.totalLitros)}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>Litros en botellas/latas</div>
            <div style={summaryValueStyle}>{formatLiters(botellasProductoTerminado?.totalLitrosBotella)}</div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>En fermentador</div>
            <div style={summaryValueStyle}>
              {existenciasActuales?.enFermentador
                ? formatLiters(existenciasActuales.enFermentador.litros)
                : "0.00 L"}
            </div>
          </div>

          <div style={summaryCardStyle}>
            <div style={summaryLabelStyle}>En BBT</div>
            <div style={summaryValueStyle}>
              {formatLiters(
                (existenciasActuales?.enBbt ?? []).reduce(
                  (acc: number, item: any) => acc + Number(item.litros ?? 0),
                  0,
                ),
              )}
            </div>
          </div>
        </div>
      </div>
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
  maxWidth: 760,
  lineHeight: 1.55,
  opacity: 0.92,
};

const heroActionsStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const sectionCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 18,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
  marginBottom: 20,
};

const sectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
};

const subSectionTitleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: 10,
  fontSize: 18,
  fontWeight: 800,
  color: "#0f172a",
};

const infoGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
  marginBottom: 16,
};

const infoCardStyle: CSSProperties = {
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

const primaryButtonStyle: CSSProperties = {
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  background: "#475569",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 800,
  cursor: "pointer",
};

const tableWrapStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 1100,
};

const theadRowStyle: CSSProperties = {
  background: "#f8fafc",
};

const thStyle: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #e2e8f0",
  textAlign: "left",
  fontSize: 13,
  color: "#334155",
  fontWeight: 800,
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #f1f5f9",
  fontSize: 14,
  color: "#0f172a",
  verticalAlign: "top",
};

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const summaryCardStyle: CSSProperties = {
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  borderRadius: 14,
  padding: 16,
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