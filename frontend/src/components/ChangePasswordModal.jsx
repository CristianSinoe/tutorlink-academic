// src/components/ChangePasswordModal.jsx
import { useState } from "react";
import apiClient from "../api/axiosClient";

export default function ChangePasswordModal({ isOpen, onClose, userEmail }) {
  const [step, setStep] = useState(1);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  // visibilidad de contraseñas
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirmNew, setShowConfirmNew] = useState(false);

  const resetState = () => {
    setStep(1);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setCode("");
    setLoading(false);
    setError(null);
    setInfo(null);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirmNew(false);
  };

  const handleClose = () => {
    resetState();
    onClose && onClose();
  };

  const handleStartRequest = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("La confirmación de la nueva contraseña no coincide.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/api/auth/password/change/request", {});
      setStep(2);
      setInfo("Se envió un código a tu correo institucional.");
    } catch (err) {
      console.error("Error solicitando OTP de cambio de contraseña", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo enviar el código. Inténtalo más tarde.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmChange = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!code.trim()) {
      setError("Ingresa el código que recibiste por correo.");
      return;
    }

    try {
      setLoading(true);
      await apiClient.post("/api/auth/password/change/confirm", {
        currentPassword,
        newPassword,
        confirmNewPassword,
        code,
      });

      setStep(3);
    } catch (err) {
      console.error("Error confirmando cambio de contraseña", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo cambiar la contraseña. Revisa el código e intenta de nuevo.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black/40 backdrop-blur-sm 
        px-4 sm:px-0
        animate-fadeIn
      "
      role="dialog"
      aria-modal="true"
    >
      <div
        className="
          bg-white rounded-2xl shadow-xl 
          max-w-md w-full mx-auto p-6 relative 
          border border-slate-200
          animate-scaleIn
        "
      >
        {/* Botón cerrar */}
        <button
          onClick={handleClose}
          type="button"
          aria-label="Cerrar ventana de cambio de contraseña"
          className="
            absolute top-3 right-3 
            text-slate-400 hover:text-uvBlue 
            focus:outline-none focus:ring-2 focus:ring-uvBlue 
            rounded-full p-1 transition
          "
        >
          ✕
        </button>

        {/* Encabezado general + paso */}
        <div className="mb-4 space-y-3 pr-8">
          <div>
            <h2 className="text-xl font-semibold text-uvBlue">
              Cambiar contraseña
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Refuerza la seguridad de tu cuenta actualizando tu contraseña.
            </p>
          </div>

          <div
            className="
      inline-flex items-center gap-1 
      px-3 py-1 rounded-full 
      bg-uvGreen/10 text-uvGreen 
      text-[10px] font-medium
    "
          >
            <span className="inline-block w-2 h-2 rounded-full bg-uvGreen" />
            <span>
              Paso {step}
              <span className="text-slate-500"> de 3</span>
            </span>
          </div>
        </div>




        {/* PASO 1 */}
        {step === 1 && (
          <form
            onSubmit={handleStartRequest}
            className="space-y-4"
            aria-describedby="change-password-step1-help"
          >
            <p
              id="change-password-step1-help"
              className="text-xs text-slate-500"
            >
              Ingresa tu contraseña actual y la nueva contraseña que deseas
              usar. Después te enviaremos un código a tu correo institucional
              para confirmar el cambio.
            </p>

            <div className="space-y-3 text-sm">
              {/* Contraseña actual */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="
                      w-full border border-slate-300 rounded-lg px-3 py-2 
                      pr-20
                      focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                      outline-none transition
                    "
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent((v) => !v)}
                    className="
                      absolute inset-y-0 right-2 flex items-center 
                      text-[11px] text-slate-500 hover:text-slate-700 
                      px-2 rounded-md
                      focus:outline-none focus:ring-1 focus:ring-uvBlue
                    "
                    aria-label={
                      showCurrent
                        ? "Ocultar contraseña actual"
                        : "Mostrar contraseña actual"
                    }
                  >
                    {showCurrent ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="
                      w-full border border-slate-300 rounded-lg px-3 py-2 
                      pr-20
                      focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                      outline-none transition
                    "
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((v) => !v)}
                    className="
                      absolute inset-y-0 right-2 flex items-center 
                      text-[11px] text-slate-500 hover:text-slate-700 
                      px-2 rounded-md
                      focus:outline-none focus:ring-1 focus:ring-uvBlue
                    "
                    aria-label={
                      showNew
                        ? "Ocultar nueva contraseña"
                        : "Mostrar nueva contraseña"
                    }
                  >
                    {showNew ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Mínimo 8 caracteres. Te recomendamos combinar letras, números
                  y símbolos.
                </p>
              </div>

              {/* Confirmar nueva */}
              <div>
                <label
                  htmlFor="confirmNewPassword"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Confirmar nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    type={showConfirmNew ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="
                      w-full border border-slate-300 rounded-lg px-3 py-2 
                      pr-20
                      focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                      outline-none transition
                    "
                    aria-required="true"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNew((v) => !v)}
                    className="
                      absolute inset-y-0 right-2 flex items-center 
                      text-[11px] text-slate-500 hover:text-slate-700 
                      px-2 rounded-md
                      focus:outline-none focus:ring-1 focus:ring-uvBlue
                    "
                    aria-label={
                      showConfirmNew
                        ? "Ocultar confirmación de nueva contraseña"
                        : "Mostrar confirmación de nueva contraseña"
                    }
                  >
                    {showConfirmNew ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div
                className="
                  text-xs text-red-700 bg-red-50 border border-red-200 
                  rounded-lg px-3 py-2 animate-fadeIn
                "
                role="alert"
              >
                {error}
              </div>
            )}
            {info && (
              <div
                className="
                  text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 
                  rounded-lg px-3 py-2 animate-fadeIn
                "
                role="status"
              >
                {info}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="
                  px-4 py-2 text-xs rounded-full 
                  border border-slate-300 text-slate-700 
                  hover:bg-slate-100
                  transition
                "
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="
                  px-4 py-2 text-xs rounded-full 
                  bg-uvBlue text-white font-medium shadow 
                  hover:bg-[#0f3a6d]
                  disabled:opacity-60
                  transition
                "
              >
                {loading ? "Enviando código..." : "Continuar"}
              </button>
            </div>
          </form>
        )}

        {/* PASO 2 */}
        {step === 2 && (
          <form
            onSubmit={handleConfirmChange}
            className="space-y-4"
            aria-describedby="change-password-step2-help"
          >
            <p
              id="change-password-step2-help"
              className="text-xs text-slate-500"
            >
              Te enviamos un código de verificación a tu correo
              {userEmail ? (
                <>
                  {" "}
                  <span className="font-semibold">{userEmail}</span>
                </>
              ) : (
                ""
              )}
              . Ingresa el código para confirmar el cambio de contraseña.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <label
                  htmlFor="verificationCode"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Código de verificación
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="
                    w-full border border-slate-300 rounded-lg px-3 py-2 
                    focus:ring-2 focus:ring-uvBlue focus:border-uvBlue 
                    outline-none transition
                    tracking-[0.3em] text-center
                  "
                  placeholder="••••••"
                  maxLength={6}
                  inputMode="numeric"
                  aria-required="true"
                />
              </div>
            </div>

            {error && (
              <div
                className="
                  text-xs text-red-700 bg-red-50 border border-red-200 
                  rounded-lg px-3 py-2 animate-fadeIn
                "
                role="alert"
              >
                {error}
              </div>
            )}
            {info && (
              <div
                className="
                  text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 
                  rounded-lg px-3 py-2 animate-fadeIn
                "
                role="status"
              >
                {info}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError(null);
                  setInfo(null);
                }}
                className="
                  text-xs text-slate-500 hover:text-slate-700 
                  inline-flex items-center gap-1
                "
              >
                <span aria-hidden="true">←</span> Volver
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="
                    px-4 py-2 text-xs rounded-full 
                    border border-slate-300 text-slate-700 
                    hover:bg-slate-100
                    transition
                  "
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="
                    px-4 py-2 text-xs rounded-full 
                    bg-uvBlue text-white font-medium shadow 
                    hover:bg-[#0f3a6d]
                    disabled:opacity-60
                    transition
                  "
                >
                  {loading ? "Verificando..." : "Confirmar cambio"}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* PASO 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-uvGreen/10 flex items-center justify-center">
                <span className="text-uvGreen text-lg" aria-hidden="true">
                  ✓
                </span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Contraseña actualizada
              </h2>
            </div>

            <p className="text-sm text-slate-600">
              Tu contraseña se actualizó correctamente. La próxima vez que
              inicies sesión, usa tu nueva contraseña para acceder a TutorLink.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleClose}
                className="
                  px-5 py-2 text-sm rounded-full 
                  bg-uvBlue text-white font-medium shadow 
                  hover:bg-[#0f3a6d]
                  transition
                "
              >
                Aceptar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
