// src/pages/student/StudentInfoPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";
import ChangePasswordModal from "../../components/ChangePasswordModal";

export default function StudentInfoPage() {
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
        console.error("Error cargando /me", err);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  // Formatear fecha de nacimiento si viene del backend
  const birthDateFormatted =
    me?.birthDate ? formatDateTime(me.birthDate).split(" ")[0] : null;

  const fullName = me
    ? `${me.name || ""} ${me.lastNamePaterno || ""} ${
        me.lastNameMaterno || ""
      }`.trim()
    : "";

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* HEADER */}
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-uvBlue tracking-tight">
              Mi información
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl">
              Consulta tus datos personales y académicos registrados en
              TutorLink. Desde aquí también puedes actualizar tu contraseña.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowChangePass(true)}
            className="self-start md:self-auto px-4 py-2 text-xs rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            Cambiar contraseña
          </button>
        </section>

        {/* TARJETA DE DATOS */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 md:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Datos generales
          </h2>

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
              <InfoRow label="Matrícula" value={me.matricula} />
              <InfoRow label="Carrera" value={me.career} />
              <InfoRow label="Plan de estudios" value={me.plan} />
              <InfoRow label="Semestre" value={me.semester} />
              <InfoRow label="Teléfono" value={me.studentPhone} />
              <InfoRow
                label="Fecha de nacimiento"
                value={birthDateFormatted}
              />
              <InfoRow
                label="Estado de cuenta"
                value={me.status || "—"}
              />
            </div>
          )}
        </section>

        <section className="text-xs text-slate-500">
          Si detectas algún dato incorrecto, comunícate con coordinación
          académica para solicitar su actualización.
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
