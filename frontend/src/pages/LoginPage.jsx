import { getRecaptchaSiteKey } from '../config/runtimeConfig';
// src/pages/LoginPage.jsx
import { useState, useEffect, useRef } from "react";
import apiClient from "../api/axiosClient";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import Logo from "../components/Logo";
import { authorizedNext, sessionHome, validateSession, validateOptions } from "../context/sessionStore";
import { useAuth } from "../context/useAuth.js";
import { getPublicInstitution, normalizeInstitutionCode } from "../api/institutionApi";

const RECAPTCHA_SITE_KEY = getRecaptchaSiteKey();

function renderRecaptchaStatus({ isRecaptchaConfigured, onChange }) {
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
      La verificación de seguridad no está disponible. Contacta al administrador.
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const lifecycle = useRef({ mounted: true, request: 0 });
  const [searchParams] = useSearchParams();
  const { auth, login } = useAuth();
  const { institutionCode: routeInstitutionCode } = useParams();
  const institutionRoute = typeof routeInstitutionCode === 'string';
  const institutionCode = normalizeInstitutionCode(routeInstitutionCode);
  const isRecaptchaConfigured = Boolean(RECAPTCHA_SITE_KEY);
  const nextPath = searchParams.get("next");
  const platformAccess = searchParams.get("access") === "platform";
  const requestScope = searchParams.toString();
  useEffect(() => {
    const state = lifecycle.current;
    state.mounted = true;
    return () => { state.mounted = false; state.request++; };
  }, [requestScope]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    recaptchaToken: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [institutionLoading, setInstitutionLoading] = useState(institutionRoute);
  const [institutionError, setInstitutionError] = useState(null);

  useEffect(() => {
    if (!routeInstitutionCode) {
      setInstitution(null);
      setInstitutionLoading(false);
      setInstitutionError(null);
      return undefined;
    }
    let active = true;
    setInstitutionLoading(true);
    setInstitutionError(null);
    getPublicInstitution(routeInstitutionCode)
      .then(value => { if (active) setInstitution(value); })
      .catch(error => { if (active) setInstitutionError(error.message || 'No se pudo cargar la institución.'); })
      .finally(() => { if (active) setInstitutionLoading(false); });
    return () => { active = false; };
  }, [routeInstitutionCode]);

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
    const request = ++lifecycle.current.request;
    setError(null);

    if (institutionRoute && (institutionLoading || institutionError || !institution)) {
      setError(institutionError || "Estamos confirmando la institución del enlace. Intenta de nuevo en unos segundos.");
      return;
    }

    if (!isRecaptchaConfigured) {
      setError(
        "No se pudo habilitar la verificación de seguridad. Contacta al administrador para habilitar la verificación de acceso.",
      );
      return;
    }

    const recaptchaToken = form.recaptchaToken;

    if (!recaptchaToken) {
      setError("Debes confirmar que no eres un robot.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await apiClient.post("/api/auth/login", {
        ...form,
        recaptchaToken,
        ...(institutionCode ? { institutionCode } : {}),
      });

      if (!lifecycle.current.mounted || request !== lifecycle.current.request) return;

      // 1️⃣ EL BACKEND PIDE OTP
      if (data.requiresOtp) {
        navigate(institutionCode ? `/${encodeURIComponent(institutionCode)}/otp` : "/otp", {
          state: {
            otpToken: data.otpToken,
            email: form.email,
            message: data.message,
            resendCooldownSeconds: data.resendCooldownSeconds,
            nextPath,
            institutions: validateOptions(data.institutions || []),
            platformAccess,
            institutionCode,
            institutionName: institution?.name || '',
          },
        });
        return;
      }

      // 2️⃣ LOGIN COMPLETO SIN OTP
      const session = validateSession(data);
      login(data, []);
      navigate(authorizedNext(nextPath, session) || sessionHome(session));
    } catch (err) {
      if (!lifecycle.current.mounted || request !== lifecycle.current.request) return;

      const msgBackend =
        err?.response?.data?.message || err?.response?.data?.error;

      if (msgBackend === "reCAPTCHA inválido") {
        setError("No se pudo verificar el reCAPTCHA. Intenta de nuevo.");
      } else if (msgBackend) {
        setError(msgBackend);
      } else {
        setError(err.response ? "Usuario o contraseña incorrectos." : "No pudimos confirmar tu acceso. Revisa tu conexión y vuelve a intentarlo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LADO IZQUIERDO – Branding (igual estilo que OTP) */}
      <aside className="hidden lg:flex w-1/2 xl:w-7/12 bg-uvBlue text-white relative overflow-hidden">
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
              <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight">
                Bienvenido a TutorLink
              </h2>
              <p className="mt-1 text-base text-white/85 leading-relaxed">
                Inicia sesión con el correo principal de tu cuenta para acceder al
                acompañamiento académico con tus tutores.
              </p>
            </div>

            <div className="pt-4 border-t border-white/20 space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                Acceso institucional
              </h2>
              <ul className="mt-1 space-y-1 text-sm text-white/85">
                <li>• Una cuenta puede participar en varias instituciones.</li>
                <li>• Tus datos se usan únicamente para fines académicos.</li>
                <li>• Te recomendamos cerrar sesión al terminar.</li>
              </ul>
            </div>

            <p className="pt-4 text-[0.6875rem] text-white/70">
              TutorLink · Acceso seguro
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

            <h1 className="text-2xl sm:text-3xl font-semibold text-uvBlue text-center mb-1">
              {institution ? `Acceso a ${institution.name}` : 'Inicia sesión en TutorLink'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 text-center mb-5">
              Usa el correo principal de tu cuenta y contraseña para acceder a la
              plataforma.
            </p>

            {auth.notice && <p role="status" className="mb-4 text-sm">{auth.notice}</p>}
            {platformAccess && <p role="status" className="mb-4 text-sm text-slate-700">Acceso al ámbito global para SUPER_ADMIN. El servidor verificará tus permisos.</p>}
            {institutionLoading && <p role="status" className="mb-4 text-sm text-slate-600">Confirmando la institución del enlace…</p>}
            {institutionError && <p role="alert" className="mb-4 text-sm text-red-700">{institutionError}</p>}
            {institution && <p role="status" className="mb-4 text-sm text-slate-700">Tu acceso se verificará para esta institución. El servidor determinará los roles autorizados.</p>}
            <Link className="mb-4 block text-uvBlue underline" to={platformAccess ? "/login" : "/login?access=platform"}>{platformAccess ? "Acceso institucional" : "Acceso de plataforma"}</Link>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Correo principal
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
                      text-[0.6875rem] text-slate-500 hover:text-slate-700
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

              <p className="text-[0.6875rem] text-slate-400 text-center mt-3">
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
