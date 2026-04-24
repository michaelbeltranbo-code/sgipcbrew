import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      
      navigate("/plant", { replace: true });
    } catch (err: any) {
      setError(err.message || "Usuario o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f8fafc",
        padding: 24,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 8, fontSize: 28 }}>
          Iniciar sesión
        </h1>

        <p style={{ marginTop: 0, color: "#64748b", marginBottom: 20 }}>
          Sistema de gestión de planta cervecera
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 6 }}>
            <label>Usuario</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              style={input}
            />
          </div>

          <div style={{ display: "grid", gap: 6 }}>
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              style={input}
            />
          </div>

          {error && (
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                borderRadius: 12,
                padding: 12,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: "#0f172a",
              color: "white",
              border: 0,
              borderRadius: 12,
              padding: "12px 16px",
              cursor: "pointer",
              fontWeight: 800,
            }}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>

          <Link
            to="/change-password"
            style={{
              textAlign: "center",
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Cambiar contraseña
          </Link>
        </div>
      </form>
    </div>
  );
}

const input: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 14px",
  outline: "none",
  fontSize: 14,
};