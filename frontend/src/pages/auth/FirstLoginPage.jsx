// src/pages/auth/FirstLoginPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import Logo from "../../components/Logo";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function FirstLoginPage() {
  const query = useQuery();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  useEffect(() => {
    const t = query.get("token") || "";
    setToken(t);
  }, [query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("El enlace no es válido (falta el token).");
      return;
    }

    if (!password || !password2) {
      setError("Debes ingresar y confirmar la contraseña.");
      return;
    }

    if (password !== password2) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);

      await apiClient.post("/api/auth/first-login/complete", {
        token,
        password,
      });

      setMessage("Tu contraseña se definió correctamente. Ya puedes iniciar sesión.");

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Error completando primer login", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Ocurrió un error al definir la contraseña.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const disabled = !token || loading;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-uvBlue via-uvBlue to-uvGreen relative overflow-hidden px-4">
      
      {/* Burbujas decorativas (coherencia con Login y OTP) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Card principal */}
      <div className="relative z-10 w-full max-w-lg bg-white/90 backdrop-blur rounded-2xl shadow-xl p-6 sm:p-8 border border-slate-100">

        {/* Header con logo */}
        <div className="flex flex-col items-center mb-4">
          <Logo variant="horizontal" className="w-40 mb-2" />
          <h1 className="text-xl sm:text-2xl font-semibold text-uvBlue text-center">
            Activar cuenta en TutorLink
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 text-center mt-1">
            Define tu primera contraseña para comenzar a usar la plataforma.
          </p>
        </div>

        {/* Aviso si no hay token */}
        {!token && (
          <p
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 text-center"
            role="alert"
          >
            El enlace no es válido o no contiene token.
          </p>
        )}

        {/* Mensajes */}
        {error && (
          <p
            className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3"
            role="alert"
          >
            {error}
          </p>
        )}

        {message && (
          <p
            className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3"
            role="status"
          >
            {message}
          </p>
        )}

        {/* FORMULARIO */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">

          {/* Nueva contraseña */}
          <div className="flex flex-col">
            <label htmlFor="newPassword" className="text-xs font-semibold text-slate-600 mb-1">
              Nueva contraseña
            </label>

            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="
                  w-full border border-slate-300 rounded-lg px-3 py-2 
                  pr-20 focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                  outline-none text-sm transition
                "
                placeholder="Ingresa tu contraseña"
                disabled={disabled}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="
                  absolute inset-y-0 right-2 flex items-center 
                  text-[11px] text-slate-500 hover:text-slate-700 
                  px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-uvBlue
                "
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-1">
              Usa al menos 8 caracteres con letras, números y símbolos.
            </p>
          </div>

          {/* Confirmar contraseña */}
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600 mb-1">
              Confirmar contraseña
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword2 ? "text" : "password"}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="
                  w-full border border-slate-300 rounded-lg px-3 py-2 
                  pr-20 focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                  outline-none text-sm transition
                "
                placeholder="Repite tu contraseña"
                disabled={disabled}
              />

              <button
                type="button"
                onClick={() => setShowPassword2((v) => !v)}
                className="
                  absolute inset-y-0 right-2 flex items-center 
                  text-[11px] text-slate-500 hover:text-slate-700 
                  px-2 rounded-md focus:outline-none focus:ring-1 focus:ring-uvBlue
                "
              >
                {showPassword2 ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Botón */}
          <button
            type="submit"
            disabled={disabled}
            className="
              w-full mt-2 px-4 py-2.5 rounded-full 
              bg-uvBlue text-white text-sm font-medium 
              shadow hover:bg-[#0f3a6d] 
              disabled:opacity-60 transition
              focus:outline-none focus:ring-2 focus:ring-uvBlue/60
            "
          >
            {loading ? "Guardando..." : "Definir contraseña"}
          </button>

          <p className="text-[11px] text-slate-500 text-center mt-3 drop-shadow-sm">
            Este enlace es de un solo uso. Si tienes problemas, solicita un nuevo correo de activación.
          </p>
        </form>
      </div>
    </div>
  );
}
