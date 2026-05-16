// src/pages/admin/AdminProfilePage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function AdminProfilePage() {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showChangePass, setShowChangePass] = useState(false);

  useEffect(() => {
    const loadMe = async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/api/me");
        setMe(data);
      } catch (err) {
        console.error("Error cargando /api/me para admin", err);
      } finally {
        setLoading(false);
      }
    };
    loadMe();
  }, []);

  const fullName = me
    ? `${me.name || ""} ${me.lastNamePaterno || ""} ${
        me.lastNameMaterno || ""
      }`.trim() || "—"
    : "—";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 rounded-2xl">
      <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-uvBlue tracking-tight">
              Mi perfil (Administrador)
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Consulta tus datos básicos de usuario administrador y actualiza tu
              contraseña cuando lo necesites.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowChangePass(true)}
            className="
              inline-flex items-center justify-center 
              px-4 py-2 rounded-full 
              bg-uvBlue text-white text-sm font-medium 
              shadow hover:bg-blue-700 transition
            "
          >
            Cambiar contraseña
          </button>
        </div>

        {/* Tarjeta de datos */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-slate-900">
              Datos generales
            </h2>

            {me && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <RoleBadge role={me.role || "ADMIN"} />
                <StatusBadge status={me.status} />
              </div>
            )}
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Cargando información…</p>
          ) : !me ? (
            <p className="text-sm text-slate-500">
              No se pudo cargar tu información. Intenta recargar la página.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4 text-sm">
              <InfoRow label="Nombre completo" value={fullName} />
              <InfoRow label="Correo institucional" value={me.email} />
              <InfoRow label="Rol" value={me.role || "ADMIN"} />
              <InfoRow label="Estado de cuenta" value={me.status || "—"} />
            </div>
          )}
        </section>

        <section className="text-xs text-slate-500">
          Si detectas algún dato incorrecto, contacta al soporte del sistema
          para solicitar su actualización.
        </section>
      </div>

      {/* Modal para cambio de contraseña */}
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

function RoleBadge({ role }) {
  const text = role || "ADMIN";

  return (
    <span
      className="
        inline-flex items-center px-2.5 py-0.5 rounded-full 
        bg-uvBlue/5 text-uvBlue border border-uvBlue/20 
        font-medium
      "
    >
      Rol: {text}
    </span>
  );
}

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
        Estado: —
      </span>
    );
  }

  const normalized = status.toUpperCase();
  let colorClasses =
    "bg-slate-100 text-slate-700 border border-slate-200";

  if (normalized === "ACTIVE") {
    colorClasses =
      "bg-emerald-50 text-emerald-700 border border-emerald-100";
  } else if (normalized === "CREATED_BY_ADMIN") {
    colorClasses =
      "bg-amber-50 text-amber-700 border border-amber-100";
  } else if (normalized === "DISABLED") {
    colorClasses = "bg-slate-100 text-slate-600 border border-slate-200";
  } else if (normalized === "BLOCKED") {
    colorClasses = "bg-red-50 text-red-700 border border-red-100";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${colorClasses}`}
    >
      Estado: {normalized}
    </span>
  );
}
