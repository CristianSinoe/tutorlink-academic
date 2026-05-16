// src/pages/admin/TutorsPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";

/* ============================
   VALIDACIÓN DE TUTORES
============================= */
function validateTutor(values, { isEdit = false } = {}) {
  const errors = {};
  const isEmpty = (v) => !v || !String(v).trim();

  // Nombre
  if (isEmpty(values.name)) {
    errors.name = "El nombre es obligatorio.";
  } else if (values.name.trim().length < 2) {
    errors.name = "El nombre debe tener al menos 2 caracteres.";
  } else if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(values.name.trim())) {
    errors.name = "El nombre solo puede contener letras y espacios.";
  }

  // Apellido paterno
  if (isEmpty(values.lastNamePaterno)) {
    errors.lastNamePaterno = "El apellido paterno es obligatorio.";
  } else if (values.lastNamePaterno.trim().length < 2) {
    errors.lastNamePaterno = "Debe tener mínimo 2 caracteres.";
  } else if (
    !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(values.lastNamePaterno.trim())
  ) {
    errors.lastNamePaterno = "Solo letras y espacios.";
  }

  // Apellido materno (opcional)
  if (!isEmpty(values.lastNameMaterno)) {
    if (values.lastNameMaterno.trim().length < 2) {
      errors.lastNameMaterno = "Debe tener mínimo 2 caracteres.";
    } else if (
      !/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(values.lastNameMaterno.trim())
    ) {
      errors.lastNameMaterno = "Solo letras y espacios.";
    }
  }

  // Email
  if (isEmpty(values.email)) {
    errors.email = "El correo es obligatorio.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Ingresa un correo válido.";
  }

  // Contraseña (solo al crear)
  if (!isEdit) {
    if (isEmpty(values.password)) {
      errors.password = "La contraseña es obligatoria.";
    } else if (values.password.length < 8) {
      errors.password = "Debe tener al menos 8 caracteres.";
    }
  }

  // Código de tutor
  if (isEmpty(values.tutorCode)) {
    errors.tutorCode = "El código de tutor es obligatorio.";
  } else if (values.tutorCode.trim().length < 3) {
    errors.tutorCode = "Debe tener al menos 3 caracteres.";
  }

  // Departamento
  if (isEmpty(values.department)) {
    errors.department = "El departamento es obligatorio.";
  } else if (values.department.trim().length < 2) {
    errors.department = "Debe tener al menos 2 caracteres.";
  }

  // Especialidad
  if (isEmpty(values.specialty)) {
    errors.specialty = "La especialidad es obligatoria.";
  } else if (values.specialty.trim().length < 2) {
    errors.specialty = "Debe tener al menos 2 caracteres.";
  }

  // Teléfono
  if (!isEmpty(values.phone)) {
    const digits = values.phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      errors.phone = "El teléfono debe tener 10 dígitos.";
    }
  }

  return errors;
}

export default function TutorsPage() {
  const [tutors, setTutors] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewTutor, setViewTutor] = useState(null);

  // Para editar
  const [editTutor, setEditTutor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    lastNamePaterno: "",
    lastNameMaterno: "",
    email: "",
    tutorCode: "",
    department: "",
    specialty: "",
    phone: "",
    status: "ACTIVE",
  });

  // Form crear
  const [form, setForm] = useState({
    name: "",
    lastNamePaterno: "",
    lastNameMaterno: "",
    email: "",
    password: "",
    tutorCode: "",
    department: "",
    specialty: "",
    phone: "",
  });

  const [csvFile, setCsvFile] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updatingEdit, setUpdatingEdit] = useState(false);

  // Feedback global (éxito / error)
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Errores específicos de formularios
  const [createErrors, setCreateErrors] = useState({});
  const [createError, setCreateError] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [editError, setEditError] = useState(null);

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // ============================
  // CARGAR LISTA DE TUTORES
  // ============================
  const loadTutors = async () => {
    try {
      setLoadingList(true);
      setFeedback(null);
      const { data } = await apiClient.get("/api/admin/users/tutors");
      setTutors(data || []);
    } catch (err) {
      console.error("Error loading tutors", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar tutores.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, []);

  // ============================
  // FORM CREAR
  // ============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // limpiar error de ese campo
    setCreateErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    setCreateError(null);
  };

  const resetForm = () => {
    setForm({
      name: "",
      lastNamePaterno: "",
      lastNameMaterno: "",
      email: "",
      password: "",
      tutorCode: "",
      department: "",
      specialty: "",
      phone: "",
    });
    setCreateErrors({});
    setCreateError(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    const fieldErrors = validateTutor(form, { isEdit: false });
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      setCreateError("Revisa los campos marcados en rojo.");
      return;
    }

    try {
      setSaving(true);
      setCreateError(null);

      const { data } = await apiClient.post("/api/admin/users/tutors", form);

      setFeedback({
        type: "success",
        message: data?.message || "Tutor creado correctamente.",
      });

      resetForm();
      setIsCreateOpen(false);
      loadTutors();
    } catch (err) {
      console.error("Error al crear tutor", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al crear tutor.";
      setCreateError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ============================
  // IMPORTAR CSV
  // ============================
  const handleImportCSV = async () => {
    if (!csvFile) {
      setFeedback({
        type: "error",
        message: "Selecciona un archivo CSV primero.",
      });
      return;
    }
    try {
      setImporting(true);
      setFeedback(null);

      const text = await csvFile.text();

      const { data } = await apiClient.post(
        "/api/admin/users/tutors/import-csv",
        { csv: text }
      );

      const msg =
        data && typeof data === "object"
          ? `Importación completa. total=${data.total}, creados=${data.created}, ya existentes=${data.skippedExisting}`
          : "Importación completa.";

      setFeedback({ type: "success", message: msg });
      setCsvFile(null);
      setIsImportOpen(false);
      loadTutors();
    } catch (err) {
      console.error("Error importando CSV", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error importando CSV.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setImporting(false);
    }
  };

  // ============================
  // EDITAR TUTOR (PUT + PATCH ESTADO)
  // ============================
  const openEditModal = (tutor) => {
    const allowedStatus = ["ACTIVE", "DISABLED", "BLOCKED"];
    const initialStatus = allowedStatus.includes(tutor.status)
      ? tutor.status
      : "ACTIVE";

    setEditTutor(tutor);
    setEditForm({
      name: tutor.name || "",
      lastNamePaterno: tutor.lastNamePaterno || "",
      lastNameMaterno: tutor.lastNameMaterno || "",
      email: tutor.email || "",
      tutorCode: tutor.tutorCode || "",
      department: tutor.department || "",
      specialty: tutor.specialty || "",
      phone: tutor.phone || "",
      status: initialStatus,
    });
    setEditErrors({});
    setEditError(null);
    setFeedback(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditErrors((prev) => {
      if (!prev[name]) return prev;
      const copy = { ...prev };
      delete copy[name];
      return copy;
    });
    setEditError(null);
  };

  const handleUpdateTutor = async () => {
    if (!editTutor) return;

    const fieldErrors = validateTutor(editForm, { isEdit: true });
    if (Object.keys(fieldErrors).length > 0) {
      setEditErrors(fieldErrors);
      setEditError("Revisa los campos marcados en rojo.");
      return;
    }

    try {
      setUpdatingEdit(true);
      setEditError(null);

      // 1) Actualizar datos generales (PUT)
      const { status: _status, ...body } = editForm;
      await apiClient.put(`/api/admin/users/tutors/${editTutor.id}`, body);

      // 2) Actualizar estado (PATCH)
      await apiClient.patch(`/api/admin/users/${editTutor.id}/status`, {
        role: "TUTOR",
        status: editForm.status,
      });

      setFeedback({
        type: "success",
        message: "Tutor actualizado correctamente.",
      });
      setEditTutor(null);
      loadTutors();
    } catch (err) {
      console.error("Error actualizando tutor", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al actualizar tutor.";
      setEditError(msg);
    } finally {
      setUpdatingEdit(false);
    }
  };

  // ============================
  // FILTROS
  // ============================
  const filteredTutors = tutors.filter((t) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      `${t.name} ${t.lastNamePaterno} ${t.lastNameMaterno}`
        .toLowerCase()
        .includes(term) ||
      (t.email || "").toLowerCase().includes(term) ||
      (t.tutorCode || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "ALL" || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  // Reset página al cambiar filtros o datos
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, tutors]);

  // ============================
  // Paginación
  // ============================
  const totalTutors = filteredTutors.length;
  const totalPages = Math.max(1, Math.ceil(totalTutors / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTutors = filteredTutors.slice(startIndex, endIndex);

  const showingFrom = totalTutors === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalTutors);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-6">
      {/* HEADER + BOTONES */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uvBlue tracking-tight">
            Gestión de Tutores
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Administra a los tutores académicos: crea nuevos registros, importa
            desde CSV y actualiza sus datos y estados.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsImportOpen(true)}
            className="
              px-4 py-2 rounded-full 
              bg-uvBlue hover:bg-blue-700 
              text-white text-sm font-semibold 
              shadow-sm transition
            "
          >
            Importar CSV
          </button>
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setFeedback(null);
              setCreateErrors({});
              setCreateError(null);
            }}
            className="
              px-4 py-2 rounded-full 
              bg-uvGreen hover:bg-green-600 
              text-white text-sm font-semibold 
              shadow-sm transition
            "
          >
            Crear tutor
          </button>
        </div>
      </div>

      {/* FEEDBACK GLOBAL */}
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
      <section
        className="
          bg-white border border-slate-200 rounded-2xl shadow-sm p-4 
          flex flex-col gap-4 
          md:flex-row md:items-start md:justify-between
        "
      >
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Nombre, correo o código de tutor"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Aplica sobre nombre completo, correo institucional o código de
            tutor.
          </p>
        </div>

        <div className="w-full md:w-64">
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

      {/* LISTA DE TUTORES */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Lista de tutores
        </h2>

        {loadingList ? (
          <p className="text-sm text-slate-600">Cargando tutores...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Código
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Correo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Departamento
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Especialidad
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
                  {currentTutors.map((t) => (
                    <tr
                      key={t.id}
                      className="border-t border-slate-200 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2 text-slate-800">
                        {t.tutorCode}
                      </td>
                      <td className="px-4 py-2 text-slate-800">
                        {t.name} {t.lastNamePaterno}{" "}
                        {t.lastNameMaterno || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {t.email}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {t.department || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {t.specialty || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setViewTutor(t)}
                            className="
                              inline-flex items-center px-2.5 py-1.5 
                              border border-slate-300 rounded-full 
                              text-slate-700 text-xs hover:bg-slate-100 
                              transition
                            "
                          >
                            Ver
                          </button>
                          <button
                            onClick={() => openEditModal(t)}
                            className="
                              inline-flex items-center px-2.5 py-1.5 
                              border border-slate-300 rounded-full 
                              text-slate-700 text-xs hover:bg-slate-100 
                              transition
                            "
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {currentTutors.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-slate-500"
                        colSpan={7}
                      >
                        No hay tutores que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalTutors > pageSize && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <p className="text-slate-500">
                  Mostrando{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}–{showingTo}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-slate-700">
                    {totalTutors}
                  </span>{" "}
                  tutores
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

      {/* MODAL CREAR TUTOR */}
      {isCreateOpen && (
        <Modal onClose={() => !saving && setIsCreateOpen(false)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Crear tutor
          </h2>

          {createError && (
            <div
              className="
                mb-3 text-xs text-red-700 bg-red-50 border border-red-200 
                rounded-lg px-3 py-2
              "
              role="alert"
            >
              {createError}
            </div>
          )}

          <form
            onSubmit={handleCreate}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Input
              label="Nombre"
              name="name"
              value={form.name}
              onChange={handleChange}
              error={createErrors.name}
            />
            <Input
              label="Apellido paterno"
              name="lastNamePaterno"
              value={form.lastNamePaterno}
              onChange={handleChange}
              error={createErrors.lastNamePaterno}
            />
            <Input
              label="Apellido materno"
              name="lastNameMaterno"
              value={form.lastNameMaterno}
              onChange={handleChange}
              error={createErrors.lastNameMaterno}
            />
            <Input
              label="Correo institucional"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={createErrors.email}
            />
            <Input
              label="Contraseña inicial"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={createErrors.password}
            />
            <Input
              label="Código de tutor"
              name="tutorCode"
              value={form.tutorCode}
              onChange={handleChange}
              error={createErrors.tutorCode}
            />
            <Input
              label="Departamento"
              name="department"
              value={form.department}
              onChange={handleChange}
              error={createErrors.department}
            />
            <Input
              label="Especialidad"
              name="specialty"
              value={form.specialty}
              onChange={handleChange}
              error={createErrors.specialty}
            />
            <Input
              label="Teléfono"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={createErrors.phone}
            />

            <div className="col-span-full flex justify-end gap-3 mt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (!saving) {
                    setIsCreateOpen(false);
                    resetForm();
                  }
                }}
                className="
                  px-4 py-2 border border-slate-300 rounded-full 
                  text-slate-700 hover:bg-slate-100 
                  text-sm transition
                "
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="
                  px-6 py-2 rounded-full 
                  bg-uvGreen hover:bg-green-600 
                  disabled:opacity-60 
                  text-white text-sm font-semibold 
                  transition
                "
              >
                {saving ? "Guardando..." : "Guardar tutor"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL IMPORTAR CSV */}
      {isImportOpen && (
        <Modal onClose={() => !importing && setIsImportOpen(false)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Importar tutores por CSV
          </h2>

          <p className="text-sm text-slate-600 mb-3">
            Selecciona un archivo CSV con el siguiente formato:
          </p>
          <pre className="bg-slate-50 rounded-lg p-3 text-xs mb-3 overflow-x-auto border border-slate-200">
            tutorCode;email;name;lastNamePaterno;lastNameMaterno;department;specialty;phone
            {"\n"}
            TUT010;laura.martinez@uv.mx;Laura;Martínez;Santos;Sistemas;Frontend;2297001101
          </pre>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            className="mb-4 text-sm"
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={importing}
              onClick={() => {
                if (!importing) {
                  setIsImportOpen(false);
                  setCsvFile(null);
                }
              }}
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
              disabled={importing}
              onClick={handleImportCSV}
              className="
                px-6 py-2 rounded-full 
                bg-uvBlue hover:bg-blue-700 
                disabled:opacity-60 
                text-white text-sm font-semibold 
                transition
              "
            >
              {importing ? "Importando..." : "Importar CSV"}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL VER TUTOR */}
      {viewTutor && (
        <Modal onClose={() => setViewTutor(null)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Detalle de tutor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Detail
              label="Nombre"
              value={`${viewTutor.name} ${viewTutor.lastNamePaterno} ${viewTutor.lastNameMaterno || ""
                }`}
            />
            <Detail label="Código de tutor" value={viewTutor.tutorCode} />
            <Detail label="Correo" value={viewTutor.email} />
            <Detail label="Departamento" value={viewTutor.department} />
            <Detail label="Especialidad" value={viewTutor.specialty} />
            <Detail label="Teléfono" value={viewTutor.phone} />
            <Detail
              label="Estado"
              value={<StatusBadge status={viewTutor.status} />}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setViewTutor(null)}
              className="
                px-4 py-2 border border-slate-300 rounded-full 
                text-slate-700 hover:bg-slate-100 
                text-sm transition
              "
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL EDITAR TUTOR */}
      {editTutor && (
        <Modal onClose={() => !updatingEdit && setEditTutor(null)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Editar tutor
          </h2>

          {editError && (
            <div
              className="
                mb-3 text-xs text-red-700 bg-red-50 border border-red-200 
                rounded-lg px-3 py-2
              "
              role="alert"
            >
              {editError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <Input
              label="Nombre"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              error={editErrors.name}
            />
            <Input
              label="Apellido paterno"
              name="lastNamePaterno"
              value={editForm.lastNamePaterno}
              onChange={handleEditChange}
              error={editErrors.lastNamePaterno}
            />
            <Input
              label="Apellido materno"
              name="lastNameMaterno"
              value={editForm.lastNameMaterno}
              onChange={handleEditChange}
              error={editErrors.lastNameMaterno}
            />
            <Input
              label="Correo institucional"
              name="email"
              type="email"
              value={editForm.email}
              onChange={handleEditChange}
              error={editErrors.email}
            />
            <Input
              label="Código de tutor"
              name="tutorCode"
              value={editForm.tutorCode}
              onChange={handleEditChange}
              error={editErrors.tutorCode}
            />
            <Input
              label="Departamento"
              name="department"
              value={editForm.department}
              onChange={handleEditChange}
              error={editErrors.department}
            />
            <Input
              label="Especialidad"
              name="specialty"
              value={editForm.specialty}
              onChange={handleEditChange}
              error={editErrors.specialty}
            />
            <Input
              label="Teléfono"
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
              error={editErrors.phone}
            />

            <div className="col-span-full">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={editForm.status}
                onChange={handleEditChange}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
              >
                <option value="ACTIVE">Activo</option>
                <option value="DISABLED">Deshabilitado</option>
                <option value="BLOCKED">Bloqueado</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Solo se puede cambiar entre ACTIVE, DISABLED y BLOCKED.
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              disabled={updatingEdit}
              onClick={() => {
                if (!updatingEdit) setEditTutor(null);
              }}
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
              disabled={updatingEdit}
              onClick={handleUpdateTutor}
              className="
                px-6 py-2 rounded-full 
                bg-uvGreen hover:bg-green-600 
                disabled:opacity-60 
                text-white text-sm font-semibold 
                transition
              "
            >
              {updatingEdit ? "Guardando..." : "Guardar cambios"}
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

function Input({ label, name, value, onChange, type = "text", error }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="flex flex-col">
      <label className="text-slate-700 mb-1 text-sm">{label}</label>
      <div className="relative">
        <input
          type={isPassword ? (showPassword ? "text" : "password") : type}
          name={name}
          value={value}
          onChange={onChange}
          className={`
            w-full rounded-lg px-3 py-2 text-sm pr-10
            border ${error ? "border-red-400" : "border-slate-300"}
            focus:ring-2 ${error ? "focus:ring-red-400" : "focus:ring-uvBlue"}
            outline-none
          `}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute inset-y-0 right-2 flex items-center 
              text-[11px] text-slate-500 hover:text-slate-800
            "
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div
      className="
        fixed inset-0 z-40 
        flex items-start justify-center 
        bg-black/40 backdrop-blur-sm
        overflow-y-auto
      "
    >
      <div
        className="
          relative w-full max-w-3xl mx-4 my-8
          bg-white rounded-2xl shadow-xl 
          border border-slate-200
          max-h-[90vh] overflow-y-auto
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

        <div className="p-6">{children}</div>
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

  let classes = "bg-slate-100 text-slate-700 border border-slate-200";
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

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">
        {value === undefined || value === null || value === "" ? "—" : value}
      </p>
    </div>
  );
}
