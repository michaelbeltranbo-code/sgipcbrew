import { useNavigate } from "react-router-dom";
import mapa from "../assets/mapa_interactivo.png";

type Hotspot = {
  key: string;
  title: string;
  path: string;
  left: string;
  top: string;
  width: string;
  height: string;
  debugColor?: string;
};

const DEBUG_HOTSPOTS = false;

const hotspots: Hotspot[] = [
  {
    key: "raw-materials",
    title: "Materia Prima",
    path: "/raw-materials",
    left: "6%",
    top: "65%",
    width: "18%",
    height: "14%",
    debugColor: "rgba(16,185,129,0.20)",
  },
  {
    key: "fermenter-1",
    title: "Fermentador 1",
    path: "/fermenters/1",
    left: "41%",
    top: "12%",
    width: "12%",
    height: "34%",
    debugColor: "rgba(59,130,246,0.20)",
  },
  {
    key: "fermenter-2",
    title: "Fermentador 2",
    path: "/fermenters/2",
    left: "56%",
    top: "12%",
    width: "14%",
    height: "34%",
    debugColor: "rgba(59,130,246,0.20)",
  },
  {
    key: "fermenter-3",
    title: "Fermentador 3",
    path: "/fermenters/3",
    left: "72%",
    top: "12%",
    width: "14%",
    height: "34%",
    debugColor: "rgba(34,197,94,0.20)",
  },
  {
    key: "bbt-1",
    title: "BBT",
    path: "/bbt/1",
    left: "87%",
    top: "12%",
    width: "12%",
    height: "38%",
    debugColor: "rgba(37,99,235,0.20)",
  },
  {
    key: "production",
    title: "Producción",
    path: "/production",
    left: "22%",
    top: "50%",
    width: "32%",
    height: "18%",
    debugColor: "rgba(245,158,11,0.20)",
  },
  {
    key: "bottling",
    title: " Area de Embotellado",
    path: "/bottling",
    left: "55%",
    top: "53%",
    width: "30%",
    height: "20%",
    debugColor: "rgba(34,197,94,0.18)",
  },
  {
    key: "cold-room",
    title: "Cuarto Frío / Barriles",
    path: "/cold-room",
    left: "4%",
    top: "8%",
    width: "28%",
    height: "38%",
    debugColor: "rgba(59,130,246,0.18)",
  },
  {
    key: "reports",
    title: "Reportes",
    path: "/reports",
    left: "86%",
    top: "53%",
    width: "12%",
    height: "14%",
    debugColor: "rgba(168,85,247,0.20)",
  },
];

type HotspotButtonProps = {
  spot: Hotspot;
  onNavigate: (path: string) => void;
  debug?: boolean;
};

function HotspotButton({
  spot,
  onNavigate,
  debug = false,
}: HotspotButtonProps) {
  return (
    <button
      type="button"
      title={spot.title}
      aria-label={spot.title}
      onClick={() => onNavigate(spot.path)}
      onMouseEnter={(e) => {
        if (!debug) return;
        e.currentTarget.style.background =
          spot.debugColor || "rgba(0,0,0,0.15)";
        e.currentTarget.style.outline = "2px solid rgba(15,23,42,0.55)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.outline = "none";
      }}
      style={{
        position: "absolute",
        left: spot.left,
        top: spot.top,
        width: spot.width,
        height: spot.height,
        background: "transparent",
        border: "0",
        borderRadius: 14,
        cursor: "pointer",
        zIndex: 50,
      }}
    />
  );
}

export default function PlantMap() {
  const nav = useNavigate();

  return (
    <div
      style={{
        minHeight: "calc(100vh - 62px)",
        background: "white",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: "18px 24px",
          borderBottom: "1px solid #e5e7eb",
          background: "white",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: 0,
          }}
        >
          Mapa de la planta
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1200,
          }}
        >
          <img
            src={mapa}
            alt="Mapa de la planta"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
              userSelect: "none",
            }}
            draggable={false}
          />

          {hotspots.map((spot) => (
            <HotspotButton
              key={spot.key}
              spot={spot}
              debug={DEBUG_HOTSPOTS}
              onNavigate={(path) => nav(path)}
            />
          ))}

          <button
            type="button"
            onClick={() => nav("/cold-room-outputs")}
            style={{
              position: "absolute",
              left: "23%",
              bottom: "58%",
              transform: "translateX(-50%)",
              background: "#086d2d",
              color: "#ffffff",
              border: "none",
              borderRadius: "14px",
              padding: "10px 18px",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
              zIndex: 80,
              //boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
              minWidth: "190px",
            }}
          >
            Salidas cuarto frío
          </button>
        </div>
      </div>
    </div>
  );
}