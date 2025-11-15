"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (password.length < 6) {
      return setMsg({
        type: "error",
        text: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    if (password !== password2) {
      return setMsg({
        type: "error",
        text: "Las contraseñas no coinciden.",
      });
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) {
      setMsg({ type: "error", text: error.message });
    } else {
      setMsg({ type: "ok", text: "Contraseña actualizada correctamente." });

      setTimeout(() => {
        router.replace("/login");
      }, 1500);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="card w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-700">🔐 Nueva Contraseña</h1>

        <form onSubmit={handleReset} className="space-y-3 mt-5">
          <input
            className="input"
            type="password"
            placeholder="Nueva contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="Repetir contraseña"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
          />

          {msg.text && (
            <div
              className={`text-sm ${
                msg.type === "error" ? "text-red-600" : "text-green-600"
              }`}
            >
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full py-2"
          >
            {loading ? "Actualizando…" : "Guardar nueva contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
