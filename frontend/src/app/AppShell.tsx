import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { registerUser } from "../api/auth";

type RoleValue = "operador" | "supervisor" | "admin";

const EMPTY_FORM = {
  fullName: "",
  username: "",
  password: "",
  role: "operador" as RoleValue,
};

export function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPlant = location.pathname === "/plant";
  const { user, token, logout } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function openModal() {
    setForm(EMPTY_FORM);
    setMsg(null);
    setShowModal(true);
  }

  function closeModal() {
    if (loading) return;
    setShowModal(false);
  }

  function setField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.fullName || !form.username || !form.password) {
      setMsg({ type: "err", text: "Todos los campos son obligatorios" });
      return;
    }
    setMsg(null);
    setLoading(true);
    try {
      await registerUser({ ...form, isActive: true }, token);
      setMsg({ type: "ok", text: `Usuario "${form.username}" creado correctamente` });
      setForm(EMPTY_FORM);
    } catch (err: any) {
      setMsg({ type: "err", text: err.message || "No se pudo crear el usuario" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {/* Header */}
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

          {user?.role === "admin" && (
            <button
              onClick={openModal}
              type="button"
              style={{
                border: "none",
                borderRadius: 10,
                padding: "8px 14px",
                background: "#1e40af",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              + Crear usuario
            </button>
          )}

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

      {/* Main content */}
      <div className="flex">
        <div className="flex-1 min-h-screen">
          <main className={isPlant ? "p-0" : "p-6"}>
            <Outlet />
          </main>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "grid",
            placeItems: "center",
            zIndex: 100,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 18,
              padding: 32,
              width: "100%",
              maxWidth: 440,
              boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800 }}>
              Crear usuario
            </h2>
            <p style={{ margin: "0 0 24px", color: "#64748b", fontSize: 14 }}>
              El nuevo usuario podrá acceder al sistema con el rol asignado.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 6 }}>
                <label style={labelStyle}>Nombre completo</label>
                <input
                  style={inputStyle}
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  disabled={loading}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={labelStyle}>Usuario</label>
                <input
                  style={inputStyle}
                  value={form.username}
                  onChange={(e) => setField("username", e.target.value)}
                  placeholder="Ej: jperez"
                  autoComplete="off"
                  disabled={loading}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={labelStyle}>Contraseña</label>
                <input
                  type="password"
                  style={inputStyle}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <label style={labelStyle}>Rol</label>
                <select
                  style={inputStyle}
                  value={form.role}
                  onChange={(e) => setField("role", e.target.value)}
                  disabled={loading}
                >
                  <option value="operador">Operario</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {msg && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    background: msg.type === "ok" ? "#f0fdf4" : "#fef2f2",
                    color: msg.type === "ok" ? "#15803d" : "#b91c1c",
                    border: `1px solid ${msg.type === "ok" ? "#bbf7d0" : "#fecaca"}`,
                  }}
                >
                  {msg.text}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    background: "white",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 2,
                    padding: "10px 0",
                    borderRadius: 10,
                    border: "none",
                    background: loading ? "#94a3b8" : "#0f172a",
                    color: "white",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {loading ? "Creando..." : "Crear usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};
