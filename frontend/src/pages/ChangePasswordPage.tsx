import { useState } from "react";
import { changePassword } from "../api/auth";
import { Link } from "react-router-dom";

export default function ChangePasswordPage() {
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setLoading(true);

    try {
      const res = await changePassword({ username, newPassword });
      setMsg(res.message || "Contraseña actualizada correctamente");
      setUsername("");
      setNewPassword("");
    } catch (err: any) {
      setError(err.message || "No se pudo cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Cambiar contraseña</h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Usuario</label>
            <input
              className="w-full border rounded-lg px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: steven"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium">Nueva contraseña</label>
            <input
              type="password"
              className="w-full border rounded-lg px-3 py-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black text-white py-2 font-semibold disabled:opacity-60"
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>

        {msg && <div className="mt-4 text-sm text-center text-green-600">{msg}</div>}
        {error && <div className="mt-4 text-sm text-center text-red-600">{error}</div>}

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-blue-600 font-semibold">
            Volver al login
          </Link>
        </div>
      </div>
    </div>
  );
}