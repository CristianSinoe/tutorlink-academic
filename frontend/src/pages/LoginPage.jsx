// src/pages/LoginPage.jsx
import { useState, useEffect } from "react";
import apiClient from "../api/axiosClient";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import Logo from "../components/Logo";
import LoginPreloader from "../components/LoginPreloader";
import { useAuth } from "../context/useAuth.js";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || "";

function renderRecaptchaStatus({ isCypressE2E, isRecaptchaConfigured, onChange }) {
  if (isCypressE2E) {
    return (
      <output
        className="w-full rounded-lg border border-sky-200 bg-sky-50 px-3 py-3 text-xs text-sky-800"
        data-cy="login-recaptcha-bypassed"
        aria-live="polite"
      >
        Verificación reCAPTCHA omitida solo para pruebas E2E con Cypress.
      </output>
    );
  }

  if (isRecaptchaConfigured) {
    return (
      <ReCAPTCHA
        sitekey={RECAPTCHA_SITE_KEY}
        onChange={onChange}
      />
    );
  }

  return (
    <div
      className="w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-800"
      role="alert"
    >
      Falta configurar <code>VITE_RECAPTCHA_SITE_KEY</code> en el frontend.
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const isRecaptchaConfigured = Boolean(RECAPTCHA_SITE_KEY);
  const isCypressE2E =
    globalThis.window !== undefined && Boolean(globalThis.window.Cypress);
  const nextPath = searchParams.get("next");

  const [showPreloader, setShowPreloader] = useState(true);

  const [form, setForm] = useState({
    email: "",
    password: "",
    recaptchaToken: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // controlar duración del preloader
  useEffect(() => {
    const timer = setTimeout(() => setShowPreloader(false), 5600);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRecaptchaChange = (token) => {
    setForm((prev) => ({ ...prev, recaptchaToken: token || "" }));

    if (token && error === "Debes confirmar que no eres un robot.") {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isRecaptchaConfigured && !isCypressE2E) {
      setError(
        "reCAPTCHA no esta configurado en el frontend. Reinicia el servicio despues de definir VITE_RECAPTCHA_SITE_KEY.",
      );
      return;
    }

    const recaptchaToken = isCypressE2E
      ? form.recaptchaToken || "cypress-e2e-bypass-token"
      : form.recaptchaToken;

    if (!recaptchaToken) {
      setError("Debes confirmar que no eres un robot.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await apiClient.post("/api/auth/login", {
        ...form,
        recaptchaToken,
      });

      // 1️⃣ EL BACKEND PIDE OTP
      if (data.requiresOtp) {
        navigate("/otp", {
          state: {
            otpToken: data.otpToken,
            email: form.email,
            message: data.message,
            resendCooldownSeconds: data.resendCooldownSeconds,
            nextPath,
          },
        });
        return;
      }

      // 2️⃣ LOGIN COMPLETO SIN OTP
      const { token, role, name, email } = data;
      login({ token, role, email, name });

      if (nextPath) navigate(nextPath);
      else if (role === "ADMIN") navigate("/admin");
      else if (role === "ESTUDIANTE") navigate("/student");
      else if (role === "TUTOR") navigate("/tutor");
    } catch (err) {
      console.error(err);

      const msgBackend =
        err?.response?.data?.message || err?.response?.data?.error;

      if (msgBackend === "reCAPTCHA inválido") {
        setError("No se pudo verificar el reCAPTCHA. Intenta de nuevo.");
      } else if (msgBackend) {
        setError(msgBackend);
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 🔥 mostrar preloader sólo en login
  if (showPreloader) {
    return <LoginPreloader onDone={() => setShowPreloader(false)} />;
  }

  // Tu login tal cual
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LADO IZQUIERDO – Branding (igual estilo que OTP) */}
      <aside className="hidden lg:flex w-1/2 xl:w-7/12 bg-gradient-to-br from-uvBlue via-uvBlue to-uvGreen text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-24 -left-10 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-black/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center h-full w-full px-10 xl:px-16">
          <div className="max-w-lg space-y-10">
            <div className="space-y-4">
              <Logo variant="monoWhite" className="w-40" />
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Plataforma de tutorías académicas
              </p>
              <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight">
                Bienvenido a TutorLink
              </h1>
              <p className="mt-1 text-base text-white/85 leading-relaxed">
                Inicia sesión con tu correo institucional para acceder al
                acompañamiento académico con tus tutores.
              </p>
            </div>

            <div className="pt-4 border-t border-white/20 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Acceso institucional
              </h2>
              <ul className="mt-1 space-y-1 text-sm text-white/85">
                <li>• Solo usuarios autorizados de la Universidad Veracruzana.</li>
                <li>• Tus datos se usan únicamente para fines académicos.</li>
                <li>• Te recomendamos cerrar sesión al terminar.</li>
              </ul>
            </div>

            <p className="pt-4 text-[11px] text-white/70">
              Universidad Veracruzana · Facultad de Negocios y Tecnologías
            </p>
          </div>
        </div>
      </aside>

      {/* LADO DERECHO – Card de login (similar a OTP) */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-slate-100 p-6 sm:p-8">
            {/* Logo compacto en mobile / tablet */}
            <div className="flex items-center justify-center mb-4 lg:hidden">
              <Logo variant="horizontal" className="h-10" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-semibold text-uvBlue text-center mb-1">
              Inicia sesión en TutorLink
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-5">
              Usa tu correo institucional y contraseña para acceder a la
              plataforma.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Correo institucional
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  data-cy="login-email"
                  value={form.email}
                  onChange={handleChange}
                  className="
                    w-full px-3 py-2 border border-slate-300 rounded-lg
                    focus:ring-2 focus:ring-uvBlue focus:border-uvBlue
                    outline-none text-sm transition
                  "
                  placeholder="nombre.apellido@uv.mx"
                  autoComplete="email"
                  required
                />
              </div>

              {/* Password + toggle mostrar/ocultar */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    data-cy="login-password"
                    value={form.password}
                    onChange={handleChange}
                    className="
                      w-full px-3 py-2 border border-slate-300 rounded-lg
                      pr-20
                      focus:ring-2 focus:ring-uvBlue focus:border-uvBlue
                      outline-none text-sm transition
                    "
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="
                      absolute inset-y-0 right-2 flex items-center
                      text-[11px] text-slate-500 hover:text-slate-700
                      px-2 rounded-md
                      focus:outline-none focus:ring-1 focus:ring-uvBlue
                    "
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {/* reCAPTCHA */}
              <div className="flex justify-center mt-2" data-cy="login-recaptcha">
                {renderRecaptchaStatus({
                  isCypressE2E,
                  isRecaptchaConfigured,
                  onChange: handleRecaptchaChange,
                })}
              </div>

              {error && (
                <div
                  className="
                    mt-2 text-xs text-red-700 bg-red-50 border border-red-200
                    rounded-lg px-3 py-2 text-center
                  "
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                data-cy="login-submit"
                className="
                  w-full mt-2 inline-flex items-center justify-center
                  rounded-full px-4 py-2.5 text-sm font-semibold
                  bg-uvBlue text-white shadow-sm
                  hover:bg-[#0f3a6d] disabled:opacity-60
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uvBlue/70
                  transition
                "
              >
                {loading ? "Ingresando..." : "Ingresar"}
              </button>

              <p className="text-[11px] text-slate-400 text-center mt-3">
                Al iniciar sesión aceptas el uso responsable de TutorLink y el
                tratamiento de tus datos académicos.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
