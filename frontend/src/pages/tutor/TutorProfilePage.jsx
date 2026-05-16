// src/pages/tutor/TutorProfilePage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function TutorProfilePage() {
  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);
  const [error, setError] = useState(null);

  const [profile, setProfile] = useState({
    bio: "",
    academicLink: "",
    professionalLink: "",
    notifyNewQuestions: false,
    weeklySummary: false,
  });
  const [saving, setSaving] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingMe(true);
        setError(null);

        const { data: meData } = await apiClient.get("/api/me");
        setMe(meData);

        const { data: profileData } = await apiClient.get(
          "/api/tutor/profile"
        );
        setProfile((prev) => ({ ...prev, ...(profileData || {}) }));
      } catch (err) {
        console.error("Error cargando perfil de tutor", err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "No se pudo cargar tu información. Intenta recargar la página.";
        setError(msg);
      } finally {
        setLoadingMe(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.put("/api/tutor/profile", profile);
      alert("Perfil actualizado correctamente.");
    } catch (err) {
      console.error("Error guardando perfil de tutor", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al guardar el perfil";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-uvBlue tracking-tight">
            Mi perfil
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa tus datos básicos y configura cómo quieres aparecer ante los
            estudiantes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowChangePass(true)}
          className="self-start sm:self-auto px-4 py-2 text-xs rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
        >
          Cambiar contraseña
        </button>
      </header>

      {/* ERROR GLOBAL */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* INFORMACIÓN BÁSICA */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Información básica
        </h2>

        {loadingMe ? (
          <p className="text-sm text-slate-500">Cargando datos...</p>
        ) : !me ? (
          <p className="text-sm text-slate-500">
            No se pudo cargar la información de tu usuario.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <InfoRow
              label="Nombre completo"
              value={`${me.name || ""} ${me.lastNamePaterno || ""} ${
                me.lastNameMaterno || ""
              }`}
            />
            <InfoRow label="Correo institucional" value={me.email} />
            <InfoRow label="Código de tutor" value={me.tutorCode} />
            <InfoRow label="Departamento" value={me.department} />
            <InfoRow label="Especialidad" value={me.specialty} />
            <InfoRow label="Teléfono" value={me.tutorPhone || me.phone} />
          </div>
        )}
      </section>

      {/* PERFIL PÚBLICO Y PREFERENCIAS */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-5 space-y-5"
      >
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Perfil público y preferencias
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="md:col-span-2 flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Descripción breve / Bio
            </label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              placeholder="Ejemplo: Tutora del área de programación, disponible para apoyo en proyectos finales y regularización."
              className="border border-slate-300 rounded-lg px-3 py-2 h-24 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Enlace a perfil académico
            </label>
            <input
              type="url"
              name="academicLink"
              value={profile.academicLink}
              onChange={handleChange}
              placeholder="Ejemplo: Google Scholar, ResearchGate"
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Enlace a perfil profesional
            </label>
            <input
              type="url"
              name="professionalLink"
              value={profile.professionalLink}
              onChange={handleChange}
              placeholder="Ejemplo: LinkedIn"
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Preferencias
          </p>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="notifyNewQuestions"
              checked={profile.notifyNewQuestions}
              onChange={handleChange}
              className="rounded border-slate-300 text-uvBlue focus:ring-uvBlue"
            />
            <span>Recibir correo cuando haya nuevas preguntas pendientes</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="weeklySummary"
              checked={profile.weeklySummary}
              onChange={handleChange}
              className="rounded border-slate-300 text-uvBlue focus:ring-uvBlue"
            />
            <span>Recibir resumen semanal de actividad</span>
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-full bg-uvBlue text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-60 transition"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>

      <ChangePasswordModal
        isOpen={showChangePass}
        onClose={() => setShowChangePass(false)}
        userEmail={me?.email}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 mt-0.5">{value || "—"}</p>
    </div>
  );
}
