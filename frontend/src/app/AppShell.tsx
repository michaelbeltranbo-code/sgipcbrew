import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlant = location.pathname === "/plant";
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header
        style={{
          width: "100%",
          padding: "14px 20px",
          borderBottom: "1px solid #e2e8f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "white",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ fontWeight: 800 }}>SGIPC - Planta cervecera</div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14 }}>
            Usuario activo: <strong>{user?.fullName ?? "-"}</strong>
          </span>

          <button
            onClick={handleLogout}
            type="button"
            style={{
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              padding: "8px 12px",
              background: "white",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex">
        <div className="flex-1 min-h-screen">
          <main className={isPlant ? "p-0" : "p-6"}>
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}