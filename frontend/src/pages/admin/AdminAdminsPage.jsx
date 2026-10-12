// src/pages/admin/AdminAdminsPage.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import apiClient from "../../api/axiosClient";
import CreateAdminModal from "../../components/admin/CreateAdminModal";
import ExportActions from "../../components/admin/ExportActions";

const ADMIN_EXPORT_COLUMNS = [
  { label: "ID", value: (admin) => admin.id },
  { label: "Nombre", value: (admin) => [admin.name, admin.lastNamePaterno, admin.lastNameMaterno].filter(Boolean).join(" ") },
  { label: "Correo", value: (admin) => admin.email },
  { label: "Estado", value: (admin) => admin.status },
];

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filteredAdmins = admins.filter((admin) => {
    const term = search.trim().toLowerCase();
    const fullName = [admin.name, admin.lastNamePaterno, admin.lastNameMaterno]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchesSearch = !term || fullName.includes(term) || (admin.email || "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "ALL" || admin.status === statusFilter;

    return matchesSearch && matchesStatus;
  });
  const totalAdmins = filteredAdmins.length;
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

  // Reiniciar a la primera página cuando cambie la lista o los filtros.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, admins]);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentAdmins = filteredAdmins.slice(startIndex, endIndex);

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

        <div className="flex flex-wrap gap-3">
          <ExportActions
            title="Lista de administradores"
            fileBaseName="administradores"
            columns={ADMIN_EXPORT_COLUMNS}
            rows={filteredAdmins}
          />
          <button
            type="button"
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-uvBlue text-white text-sm font-medium shadow hover:bg-blue-700 transition"
          >
            + Crear administrador
          </button>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
        <div>
          <label htmlFor="admins-search" className="mb-1 block text-xs font-semibold text-slate-700">
            Buscar
          </label>
          <input
            id="admins-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre o correo"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-uvBlue"
          />
        </div>
        <div>
          <label htmlFor="admins-status-filter" className="mb-1 block text-xs font-semibold text-slate-700">
            Estado
          </label>
          <select
            id="admins-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-uvBlue"
          >
            <option value="ALL">Todos</option>
            <option value="CREATED_BY_ADMIN">Creado por admin</option>
            <option value="ACTIVE">Activo</option>
            <option value="DISABLED">Deshabilitado</option>
            <option value="BLOCKED">Bloqueado</option>
          </select>
        </div>
      </section>

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
            <p className="text-[0.6875rem] text-slate-500">
              Filtrados:{" "}
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
              <span className="text-slate-500 text-[0.6875rem]">
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
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] bg-slate-100 text-slate-600">
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
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.6875rem] font-medium ${colorClasses}`}
    >
      {normalized}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};
