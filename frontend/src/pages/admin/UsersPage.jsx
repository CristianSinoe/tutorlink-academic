// src/pages/admin/UsersPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal cambiar estado
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("ACTIVE");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Feedback global (éxito / error)
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // ============================
  // CARGAR LISTA DE USUARIOS
  // ============================
  const loadUsers = async () => {
    try {
      setLoadingList(true);
      setFeedback(null);
      const { data } = await apiClient.get("/api/admin/users");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando usuarios", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar la lista de usuarios.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // ============================
  // FILTROS
  // ============================
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase().trim();

    const fullName = `${u.name || ""} ${u.lastNamePaterno || ""} ${u.lastNameMaterno || ""
      }`.trim();

    const matchesSearch =
      !term ||
      fullName.toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.role || "").toLowerCase().includes(term);

    const matchesRole =
      roleFilter === "ALL" || (u.role || "").toUpperCase() === roleFilter;

    const matchesStatus =
      statusFilter === "ALL" || (u.status || "") === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  };

  // Reset página cuando cambian filtros o lista
  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, users]);

  // ============================
  // Paginación
  // ============================
  const totalFiltered = filteredUsers.length;
  const totalUsers = users.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const showingFrom = totalFiltered === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalFiltered);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  // ============================
  // CAMBIAR ESTADO
  // ============================
  const allowedStatus = ["ACTIVE", "DISABLED", "BLOCKED"];

  const openStatusModal = (user) => {
    setSelectedUser(user);
    setFeedback(null);

    const current = user.status;
    const initial = allowedStatus.includes(current) ? current : "ACTIVE";
    setSelectedStatus(initial);
  };

  const closeStatusModal = () => {
    if (updatingStatus) return;
    setSelectedUser(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;

    try {
      setUpdatingStatus(true);
      setFeedback(null);

      await apiClient.patch(`/api/admin/users/${selectedUser.id}/status`, {
        role: selectedUser.role, // requerido por el backend
        status: selectedStatus,  // nuevo estado
      });

      setFeedback({
        type: "success",
        message: "Estado del usuario actualizado correctamente.",
      });
      closeStatusModal();
      loadUsers();
    } catch (err) {
      console.error("Error actualizando estado", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al actualizar el estado del usuario.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uvBlue tracking-tight">
            Gestión de usuarios
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Supervisa a todos los usuarios del sistema (administradores,
            estudiantes y tutores) y gestiona su estado de acceso.
          </p>
        </div>

        {!loadingList && (
          <div className="text-xs sm:text-sm text-slate-500 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-sm">
            Filtrados:{" "}
            <span className="font-semibold text-slate-700">
              {totalFiltered}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-slate-700">
              {totalUsers}
            </span>{" "}
            usuarios totales
          </div>
        )}
      </div>

      {/* FEEDBACK */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border ${feedback.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}

      {/* FILTROS */}
      <section className="
    bg-white border border-slate-200 rounded-2xl shadow-sm p-4 
    flex flex-col gap-4 
    md:flex-row md:items-start md:justify-between
  ">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nombre, correo o rol"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Puedes buscar por nombre completo, correo institucional o por el
            rol (ADMIN, ESTUDIANTE, TUTOR).
          </p>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Rol
          </label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="ADMIN">Admin</option>
            <option value="ESTUDIANTE">Estudiante</option>
            <option value="TUTOR">Tutor</option>
          </select>
        </div>

        <div className="w-full md:w-52">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Estado
          </label>
          <select
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos</option>
            <option value="CREATED_BY_ADMIN">Creado por admin</option>
            <option value="ACTIVE">Activo</option>
            <option value="DISABLED">Deshabilitado</option>
            <option value="BLOCKED">Bloqueado</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearFilters}
            className="
    bg-white border border-slate-200 rounded-2xl shadow-sm p-4 
    flex flex-col gap-4 
    md:flex-row md:items-start md:justify-between
  "
          >
            Limpiar
          </button>
        </div>
      </section>

      {/* LISTA DE USUARIOS */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Lista de usuarios
        </h2>

        {loadingList ? (
          <p className="text-sm text-slate-600">Cargando usuarios...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
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
                      Rol
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-200 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2 text-slate-700">#{u.id}</td>
                      <td className="px-4 py-2 text-slate-800">
                        {(u.name || "")} {(u.lastNamePaterno || "")}{" "}
                        {u.lastNameMaterno || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {u.email}
                      </td>
                      <td className="px-4 py-2">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => openStatusModal(u)}
                          className="
                            inline-flex items-center px-3 py-1.5 
                            border border-slate-300 rounded-full 
                            text-slate-700 text-xs hover:bg-slate-100 
                            transition
                          "
                        >
                          Cambiar estado
                        </button>
                      </td>
                    </tr>
                  ))}

                  {currentUsers.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-slate-500"
                        colSpan={6}
                      >
                        No hay usuarios que coincidan con los filtros
                        aplicados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalFiltered > pageSize && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <p className="text-slate-500">
                  Mostrando{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}–{showingTo}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-slate-700">
                    {totalFiltered}
                  </span>{" "}
                  usuarios filtrados
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
                    <span className="font-semibold text-slate-700">
                      {page}
                    </span>{" "}
                    de{" "}
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
          </>
        )}
      </section>

      {/* MODAL CAMBIAR ESTADO */}
      {selectedUser && (
        <Modal onClose={closeStatusModal}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Cambiar estado de usuario
          </h2>

          <div className="mb-4 text-sm text-slate-700 space-y-1">
            <p>
              <span className="font-semibold">Usuario: </span>
              {(selectedUser.name || "")}{" "}
              {(selectedUser.lastNamePaterno || "")}{" "}
              {selectedUser.lastNameMaterno || ""}
            </p>
            <p>
              <span className="font-semibold">Correo: </span>
              {selectedUser.email}
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Rol: </span>
              <RoleBadge role={selectedUser.role} />
            </p>
            <p className="flex items-center gap-2">
              <span className="font-semibold">Estado actual: </span>
              <StatusBadge status={selectedUser.status} />
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nuevo estado
            </label>
            <select
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ACTIVE">Activo</option>
              <option value="DISABLED">Deshabilitado</option>
              <option value="BLOCKED">Bloqueado</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              No se puede volver a &quot;CREATED_BY_ADMIN&quot; desde aquí;
              solo puedes alternar entre ACTIVE, DISABLED y BLOCKED.
            </p>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              disabled={updatingStatus}
              onClick={closeStatusModal}
              className="
                px-4 py-2 border border-slate-300 rounded-full 
                text-slate-700 hover:bg-slate-100 
                text-sm transition
              "
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={updatingStatus}
              onClick={handleUpdateStatus}
              className="
                px-6 py-2 rounded-full 
                bg-uvGreen hover:bg-green-600 
                disabled:opacity-60 
                text-white text-sm font-semibold 
                transition
              "
            >
              {updatingStatus ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ============================
   COMPONENTES AUXILIARES
============================= */

function Modal({ children, onClose }) {
  return (
    <div
      className="
        fixed inset-0 z-40 flex items-center justify-center 
        bg-black/40 backdrop-blur-sm
      "
    >
      <div
        className="
          bg-white rounded-2xl shadow-xl 
          max-w-xl w-full mx-4 p-6 relative 
          border border-slate-200
        "
      >
        <button
          onClick={onClose}
          type="button"
          aria-label="Cerrar ventana"
          className="
            absolute top-3 right-3 text-slate-400 hover:text-uvBlue 
            focus:outline-none focus:ring-2 focus:ring-uvBlue 
            rounded-full p-1 transition
          "
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
        —
      </span>
    );
  }

  let classes =
    "bg-slate-100 text-slate-700 border border-slate-200";
  let label = status;

  switch (status) {
    case "ACTIVE":
      classes =
        "bg-emerald-50 text-emerald-700 border border-emerald-100";
      label = "ACTIVO";
      break;
    case "CREATED_BY_ADMIN":
      classes =
        "bg-amber-50 text-amber-700 border border-amber-100";
      label = "CREADO POR ADMIN";
      break;
    case "DISABLED":
      classes =
        "bg-slate-100 text-slate-600 border border-slate-200";
      label = "DESHABILITADO";
      break;
    case "BLOCKED":
      classes = "bg-red-50 text-red-700 border border-red-100";
      label = "BLOQUEADO";
      break;
    default:
      classes =
        "bg-slate-100 text-slate-700 border border-slate-200";
      label = status;
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function RoleBadge({ role }) {
  if (!role) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
        —
      </span>
    );
  }

  const r = (role || "").toUpperCase();

  let classes =
    "bg-slate-100 text-slate-700 border border-slate-200";
  let label = r;

  switch (r) {
    case "ADMIN":
      classes =
        "bg-purple-50 text-purple-700 border border-purple-100";
      label = "ADMIN";
      break;
    case "ESTUDIANTE":
      classes =
        "bg-emerald-50 text-emerald-700 border border-emerald-100";
      label = "ESTUDIANTE";
      break;
    case "TUTOR":
      classes =
        "bg-sky-50 text-sky-700 border border-sky-100";
      label = "TUTOR";
      break;
    default:
      classes =
        "bg-slate-100 text-slate-700 border border-slate-200";
      label = r;
  }

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
