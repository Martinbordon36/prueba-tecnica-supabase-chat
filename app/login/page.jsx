"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{7,15}$/;

export default function Login() {
  const router = useRouter();

  // "view" pueden ser: login | register | forgot
  const [view, setView] = useState("login");

  // Campos
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");

  // Estado general
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  // Login
  async function handleLogin(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!email.trim()) return setMsg({ type: "error", text: "Ingresá tu correo." });
    if (!emailRegex.test(email)) return setMsg({ type: "error", text: "Correo inválido." });
    if (!password.trim()) return setMsg({ type: "error", text: "Ingresá tu contraseña." });

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) setMsg({ type: "error", text: error.message });
    else router.replace("/home");
  }

  // Registro
  
  async function handleRegister(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!nombre.trim()) return setMsg({ type: "error", text: "Ingresá tu nombre." });
    if (!telefono.trim()) return setMsg({ type: "error", text: "Ingresá tu celular." });
    if (!phoneRegex.test(telefono))
      return setMsg({
        type: "error",
        text: "El celular debe tener entre 7 y 15 números.",
      });
    if (!email.trim()) return setMsg({ type: "error", text: "Ingresá tu correo." });
    if (!emailRegex.test(email)) return setMsg({ type: "error", text: "Correo inválido." });
    if (password.length < 6)
      return setMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });
    if (password !== password2)
      return setMsg({ type: "error", text: "Las contraseñas no coinciden." });

    setLoading(true);

    // Creamos usuario en AUTH con metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre, telefono },
      },
    });

    if (error) {
      setLoading(false);
      return setMsg({ type: "error", text: error.message });
    }

    const user = data.user;

    if (!user) {
      setLoading(false);
      return setMsg({ type: "error", text: "No se pudo crear el usuario." });
    }

    // Creo perfil en tabla profiles
    await supabase.from("profiles").upsert({
      id: user.id,
      email,
      nombre,
      telefono,
      created_at: new Date().toISOString(),
    });

    setLoading(false);
    setMsg({ type: "ok", text: "Cuenta creada. Revisá tu correo 📧" });

    // Limpio valores
    setNombre("");
    setTelefono("");
    setPassword("");
    setPassword2("");
  }

  // Formulario Olvide mi contraseña

  async function handleForgot(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (!email.trim()) return setMsg({ type: "error", text: "Ingresá tu correo." });
    if (!emailRegex.test(email)) return setMsg({ type: "error", text: "Correo inválido." });

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000/reset-password",
    });

    setLoading(false);

    if (error) setMsg({ type: "error", text: error.message });
    else setMsg({ type: "ok", text: "Te enviamos un correo para restablecer la contraseña." });
  }

  // Renderizado

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
      <div className="card w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-blue-700">💬 Chat en Tiempo Real</h1>
        <p className="text-gray-500 mt-1 mb-4">
          {view === "login" && "Iniciá sesión"}
          {view === "register" && "Crear cuenta"}
          {view === "forgot" && "Recuperar contraseña"}
        </p>

 {/* LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <input className="input" type="email" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} />

            <input className="input" type="password" placeholder="Contraseña"
              value={password} onChange={e => setPassword(e.target.value)} />

            {msg.text && (
              <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {msg.text}
              </p>
            )}

            <button className="btn btn-primary w-full py-2" disabled={loading}>
              {loading ? "Ingresando…" : "Ingresar"}
            </button>

            <button type="button" className="btn w-full py-2 bg-gray-200 hover:bg-gray-300"
              onClick={() => { setView("register"); setMsg({}); }}>
              Crear cuenta
            </button>

            <button type="button" className="btn w-full py-2 bg-gray-200 hover:bg-gray-300"
              onClick={() => { setView("forgot"); setMsg({}); }}>
              Olvidé mi contraseña
            </button>
          </form>
        )}

{/* Registro */}
        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-3">
            <input className="input" placeholder="Nombre completo"
              value={nombre} onChange={e => setNombre(e.target.value)} />

            <input className="input" placeholder="Celular"
              value={telefono} onChange={e => setTelefono(e.target.value)} />

            <input className="input" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} />

            <input className="input" type="password" placeholder="Contraseña"
              value={password} onChange={e => setPassword(e.target.value)} />

            <input className="input" type="password" placeholder="Repetir contraseña"
              value={password2} onChange={e => setPassword2(e.target.value)} />

            {msg.text && (
              <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {msg.text}
              </p>
            )}

            <button className="btn btn-primary w-full py-2" disabled={loading}>
              {loading ? "Creando cuenta…" : "Registrarme"}
            </button>

            <button type="button" className="btn w-full py-2 bg-gray-200 hover:bg-gray-300"
              onClick={() => { setView("login"); setMsg({}); }}>
              Ya tengo cuenta
            </button>
          </form>
        )}

 {/* Olvide mi Contraseña */}
        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-3">
            <input className="input" type="email" placeholder="Correo electrónico"
              value={email} onChange={e => setEmail(e.target.value)} />

            {msg.text && (
              <p className={`text-sm ${msg.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {msg.text}
              </p>
            )}

            <button className="btn btn-primary w-full py-2" disabled={loading}>
              {loading ? "Enviando…" : "Enviar link de recuperación"}
            </button>

            <button type="button" className="btn w-full py-2 bg-gray-200 hover:bg-gray-300"
              onClick={() => { setView("login"); setMsg({}); }}>
              Volver al login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
