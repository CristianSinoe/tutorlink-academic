// src/pages/auth/OtpPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { useAuth } from "../../context/useAuth.js";
import Logo from "../../components/Logo";

const DEFAULT_RESEND_COOLDOWN_SECONDS = 30;

function getCooldownSeconds(value) {
  const parsed = Number(value);
  return parsed > 0 ? parsed : DEFAULT_RESEND_COOLDOWN_SECONDS;
}

export default function OtpPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Lo que mandamos desde LoginPage:
  // navigate("/otp", { state: { otpToken, email, message } });
  const state = location.state;

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const hasOtpState = Boolean(state?.otpToken);
  const initialCooldownSeconds = getCooldownSeconds(state?.resendCooldownSeconds);
  const [currentOtpToken, setCurrentOtpToken] = useState(state?.otpToken ?? "");
  const [secondsLeft, setSecondsLeft] = useState(initialCooldownSeconds);
  const email = state?.email ?? "";
  const nextPath = state?.nextPath ?? "";

  // 🔒 Protección: si no hay otpToken, mandar al login
  useEffect(() => {
    if (!hasOtpState) {
      navigate("/login", { replace: true });
    }
  }, [hasOtpState, navigate]);

  useEffect(() => {
    setCurrentOtpToken(state?.otpToken ?? "");
    setSecondsLeft(getCooldownSeconds(state?.resendCooldownSeconds));
  }, [state]);

  useEffect(() => {
    setInfoMessage(state?.message || null);
  }, [state]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }

    const timerId = globalThis.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => globalThis.clearInterval(timerId);
  }, [secondsLeft]);

  // Si todavía no hay state (primer render), mostramos algo simple
  if (!hasOtpState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">
          Redirigiendo al inicio de sesión…
        </p>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Ingresa el código que te llegó por correo.");
      return;
    }

    try {
      setSubmitting(true);

      const { data } = await apiClient.post("/api/auth/login/verify-otp", {
        otpToken: currentOtpToken,
        code,
      });

      // data debe ser JwtResponse: { token, role, email, name }
      login({
        token: data.token,
        role: data.role,
        email: data.email,
        name: data.name,
      });

      // Redirigir según rol
      if (nextPath) navigate(nextPath);
      else if (data.role === "ADMIN") navigate("/admin");
      else if (data.role === "ESTUDIANTE") navigate("/student");
      else if (data.role === "TUTOR") navigate("/tutor");
      else navigate("/");
    } catch (err) {
      console.error("Error verificando OTP", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Código inválido o expirado.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const handleResendCode = async () => {
    if (secondsLeft > 0) {
      return;
    }

    try {
      setError(null);
      setResending(true);

      const { data } = await apiClient.post("/api/auth/login/resend-otp", {
        otpToken: currentOtpToken,
      });

      setCurrentOtpToken(data.otpToken);
      setInfoMessage(
        data.message ||
          "Se envió un nuevo código de verificación a tu correo institucional.",
      );
      setSecondsLeft(getCooldownSeconds(data.resendCooldownSeconds));
      setCode("");
    } catch (err) {
      console.error("Error reenviando OTP", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo reenviar el código.";
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LADO IZQUIERDO – Branding (desktop) */}
      <aside className="hidden lg:flex w-1/2 xl:w-7/12 bg-gradient-to-br from-uvBlue via-uvBlue to-uvGreen text-white relative overflow-hidden">
        {/* blobs decorativos */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full w-full px-10 xl:px-16">
          <div className="max-w-lg space-y-10">
            {/* Logo + texto principal */}
            <div className="space-y-4">
              <Logo variant="monoWhite" className="w-20" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Plataforma de tutorías académicas
              </p>
              <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight">
                TutorLink
              </h1>
              <p className="mt-1 text-base text-white/85 leading-relaxed">
                Aseguramos tu acceso con verificación en dos pasos para proteger
                tu cuenta y la información académica.
              </p>
            </div>

            {/* Bloque de seguridad */}
            <div className="pt-4 border-t border-white/20 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Seguridad y confianza
              </h2>
              <ul className="mt-1 space-y-1 text-sm text-white/85">
                <li>• El código es temporal y de un solo uso.</li>
                <li>• Nunca compartas tu código con nadie.</li>
                <li>
                  • Si no reconoces este inicio de sesión, cambia tu contraseña.
                </li>
              </ul>
            </div>

            {/* Footer */}
            <p className="pt-4 text-[11px] text-white/70">
              Universidad Veracruzana · Facultad de Negocios y Tecnologías
              
            </p>
          </div>
        </div>
      </aside>

      {/* LADO DERECHO – Formulario OTP */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8">
            {/* Logo compacto en mobile / tablet */}
            <div className="flex items-center justify-center mb-4 lg:hidden">
              <Logo variant="horizontal" className="h-10" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-uvBlue text-center mb-1">
              Verificación en dos pasos
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-4">
              Hemos enviado un código de verificación a tu correo institucional.
            </p>

            <div className="text-center mb-3">
              <p className="text-xs text-slate-500 mb-1">Correo destino</p>
              <p className="text-sm font-medium text-slate-800 break-all">
                {email}
              </p>
            </div>

            {infoMessage && (
              <p className="text-[11px] text-slate-500 text-center mb-4 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                {infoMessage}
              </p>
            )}


            {error && (
              <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div>
                <label htmlFor="otp-code" className="block text-xs font-semibold text-slate-600 mb-1">
                  Código de verificación
                </label>
                <input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  data-cy="otp-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="
                    w-full border border-slate-300 rounded-lg px-3 py-2
                    focus:ring-2 focus:ring-uvBlue focus:border-uvBlue
                    outline-none tracking-[0.35em] text-center
                    text-lg font-semibold text-slate-800
                  "
                  placeholder="••••••"
                  aria-label="Código de verificación de 6 dígitos"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Ingresa el código de 6 dígitos que recibiste por correo. El
                  código es temporal y caduca después de unos minutos.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                data-cy="otp-submit"
                className="
                  w-full inline-flex items-center justify-center
                  rounded-full px-4 py-2.5 text-sm font-semibold
                  bg-uvGreen text-white shadow-sm
                  hover:bg-green-600 disabled:opacity-60
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uvGreen
                  transition
                "
              >
                {submitting ? "Verificando..." : "Confirmar código"}
              </button>
            </form>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending || submitting || secondsLeft > 0}
                data-cy="otp-resend"
                className="
                  w-full inline-flex items-center justify-center
                  rounded-full px-4 py-2.5 text-sm font-semibold
                  border border-slate-300 text-slate-700 bg-white
                  hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300
                  transition
                "
              >
                {getResendButtonLabel({ resending, secondsLeft })}
              </button>
              <p className="mt-2 text-[11px] text-slate-500 text-center">
                Solo puedes solicitar un nuevo código cada 60 segundos.
              </p>
            </div>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="
                mt-4 w-full text-xs sm:text-sm text-slate-600
                hover:text-uvBlue hover:underline
                inline-flex items-center justify-center
              "
            >
              Volver al inicio de sesión
            </button>

            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[11px] text-slate-500 text-center">
                ¿No recibiste el código? Revisa tu carpeta de correo no deseado
                o intenta iniciar sesión de nuevo para generar un nuevo código.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function getResendButtonLabel({ resending, secondsLeft }) {
  if (resending) {
    return "Reenviando...";
  }

  if (secondsLeft > 0) {
    return `Reenviar código en ${secondsLeft}s`;
  }

  return "Reenviar código";
}
