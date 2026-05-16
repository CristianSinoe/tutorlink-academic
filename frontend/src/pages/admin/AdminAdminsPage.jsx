// src/pages/admin/AdminAdminsPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import CreateAdminModal from "../../components/admin/CreateAdminModal";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalAdmins = admins.length;
  const totalPages = Math.max(1, Math.ceil(totalAdmins / pageSize));

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get("/api/admin/users/admins");
      setAdmins(data || []);
    } catch (err) {
      console.error("Error cargando administradores", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar la lista de administradores.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // Reiniciar a la primera página cuando cambie la lista
  useEffect(() => {
    setPage(1);
  }, [totalAdmins]);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAdmins = admins.slice(startIndex, endIndex);

  const showingFrom = totalAdmins === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalAdmins);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-uvBlue tracking-tight">
            Administradores
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Gestiona a los usuarios con rol de administrador del sistema.
            Cuando crees un nuevo administrador, recibirá un correo para
            activar su cuenta y definir su contraseña.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpenModal(true)}
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-uvBlue text-white text-sm font-medium shadow hover:bg-blue-700 transition"
        >
          + Crear administrador
        </button>
      </div>

      {/* Tabla */}
      <section
        className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
        aria-label="Lista de administradores"
      >
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">
              Lista de administradores
            </h2>
            <p className="text-[11px] text-slate-500">
              Total:{" "}
              <span className="font-semibold text-slate-700">
                {totalAdmins}
              </span>
            </p>
          </div>
          {loading && (
            <span className="text-xs text-slate-500">Cargando...</span>
          )}
        </div>

        {error && (
          <div
            className="px-4 py-3 text-xs text-red-700 bg-red-50 border-b border-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  ID
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Nombre
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Correo
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {!loading && totalAdmins === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No hay administradores registrados.
                  </td>
                </tr>
              )}

              {currentAdmins.map((a) => {
                const fullName = [a.name, a.lastNamePaterno, a.lastNameMaterno]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr key={a.id} className="border-b border-slate-100">
                    <td className="px-4 py-2 text-xs text-slate-500">
                      #{a.id}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-800">
                      {fullName || "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {a.email}
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalAdmins > pageSize && (
          <div className="px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className="text-slate-500">
              Mostrando{" "}
              <span className="font-semibold text-slate-700">
                {showingFrom}–{showingTo}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-slate-700">
                {totalAdmins}
              </span>{" "}
              administradores
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={page === 1}
                className="
                  inline-flex items-center px-3 py-1.5 rounded-full 
                  border border-slate-300 text-slate-700 
                  hover:bg-slate-50 text-xs font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition
                "
              >
                ← Anterior
              </button>
              <span className="text-slate-500 text-[11px]">
                Página{" "}
                <span className="font-semibold text-slate-700">{page}</span> de{" "}
                <span className="font-semibold text-slate-700">
                  {totalPages}
                </span>
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={page === totalPages}
                className="
                  inline-flex items-center px-3 py-1.5 rounded-full 
                  border border-slate-300 text-slate-700 
                  hover:bg-slate-50 text-xs font-medium
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition
                "
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Modal creación admin */}
      {openModal && (
        <CreateAdminModal
          onClose={() => setOpenModal(false)}
          onCreated={() => {
            setOpenModal(false);
            loadAdmins();
          }}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">
        —
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${colorClasses}`}
    >
      {normalized}
    </span>
  );
}
