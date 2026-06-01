// src/pages/admin/StudentsPage.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import apiClient from "../../api/axiosClient";

/* ============================
   HELPERS DE VALIDACIÓN
============================= */

const LETTERS_AND_SPACES_PATTERN = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;

function isEmpty(value) {
  return !value || !String(value).trim();
}

function calcularEdad(dateStr) {
  const birth = new Date(dateStr);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function validateLettersField(errors, values, field, messages, optional = false) {
  const value = values[field];
  if (optional && isEmpty(value)) {
    return;
  }

  if (isEmpty(value)) {
    errors[field] = messages.required;
    return;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length < 2) {
    errors[field] = messages.min;
    return;
  }

  if (!LETTERS_AND_SPACES_PATTERN.test(trimmedValue)) {
    errors[field] = messages.pattern;
  }
}

function validateSimpleTextField(errors, values, field, messages) {
  if (isEmpty(values[field])) {
    errors[field] = messages.required;
    return;
  }

  if (values[field].trim().length < 2) {
    errors[field] = messages.min;
  }
}

function validateStudentEmail(errors, values) {
  if (isEmpty(values.email)) {
    errors.email = "El correo institucional es obligatorio.";
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Ingresa un correo electrónico válido.";
  }
}

function validateStudentPassword(errors, values, isEdit) {
  if (isEdit) {
    return;
  }

  if (isEmpty(values.password)) {
    errors.password = "La contraseña inicial es obligatoria.";
    return;
  }

  if (values.password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }
}

function validateMatricula(errors, values) {
  if (isEmpty(values.matricula)) {
    errors.matricula = "La matrícula es obligatoria.";
    return;
  }

  const matricula = values.matricula.trim();
  if (matricula.length < 4) {
    errors.matricula = "La matrícula debe tener al menos 4 caracteres.";
    return;
  }

  if (!/^S/i.test(matricula)) {
    errors.matricula = "La matrícula debe iniciar con la letra S.";
  }
}

function validateSemester(errors, values) {
  if (isEmpty(values.semester)) {
    errors.semester = "El semestre es obligatorio.";
    return;
  }

  const num = Number(values.semester);
  if (Number.isNaN(num)) {
    errors.semester = "El semestre debe ser un número.";
    return;
  }

  if (num < 1 || num > 15) {
    errors.semester = "El semestre debe estar entre 1 y 15.";
  }
}

function validatePhone(errors, values) {
  if (isEmpty(values.phone)) {
    return;
  }

  const onlyDigits = values.phone.replaceAll(/\D/g, "");
  if (onlyDigits.length !== 10) {
    errors.phone = "El teléfono debe tener 10 dígitos.";
  }
}

function validateBirthDate(errors, values) {
  if (isEmpty(values.birthDate)) {
    errors.birthDate = "La fecha de nacimiento es obligatoria.";
    return;
  }

  const age = calcularEdad(values.birthDate);
  if (age === null) {
    errors.birthDate = "La fecha de nacimiento no es válida.";
    return;
  }

  if (age < 15 || age > 120) {
    errors.birthDate = "La edad debe estar entre 15 y 120 años.";
  }
}

const STUDENT_STATUS = {
  ACTIVE: {
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    label: "ACTIVO",
  },
  CREATED_BY_ADMIN: {
    classes: "bg-amber-50 text-amber-700 border border-amber-100",
    label: "CREADO POR ADMIN",
  },
  DISABLED: {
    classes: "bg-slate-100 text-slate-600 border border-slate-200",
    label: "DESHABILITADO",
  },
  BLOCKED: {
    classes: "bg-red-50 text-red-700 border border-red-100",
    label: "BLOQUEADO",
  },
};

function getInputType(type, showPassword) {
  if (type !== "password") {
    return type;
  }
  return showPassword ? "text" : "password";
}

function getDetailValue(value) {
  return value === undefined || value === null || value === "" ? "—" : value;
}

function validateStudent(values, { isEdit = false } = {}) {
  const errors = {};
  validateLettersField(errors, values, "name", {
    required: "El nombre es obligatorio.",
    min: "El nombre debe tener al menos 2 caracteres.",
    pattern: "El nombre solo puede contener letras y espacios.",
  });
  validateLettersField(errors, values, "lastNamePaterno", {
    required: "El apellido paterno es obligatorio.",
    min: "El apellido paterno debe tener al menos 2 caracteres.",
    pattern: "El apellido paterno solo puede contener letras y espacios.",
  });
  validateLettersField(errors, values, "lastNameMaterno", {
    min: "El apellido materno debe tener al menos 2 caracteres.",
    pattern: "El apellido materno solo puede contener letras y espacios.",
  }, true);
  validateStudentEmail(errors, values);
  validateStudentPassword(errors, values, isEdit);
  validateMatricula(errors, values);
  validateSimpleTextField(errors, values, "career", {
    required: "La carrera es obligatoria.",
    min: "La carrera debe tener al menos 2 caracteres.",
  });
  validateSimpleTextField(errors, values, "plan", {
    required: "El plan es obligatorio.",
    min: "El plan debe tener al menos 2 caracteres.",
  });
  validateSemester(errors, values);
  validatePhone(errors, values);
  validateBirthDate(errors, values);

  return errors;
}

/* ============================
   PÁGINA PRINCIPAL
============================= */

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modales
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [viewStudent, setViewStudent] = useState(null);

  // Para editar
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    lastNamePaterno: "",
    lastNameMaterno: "",
    email: "",
    matricula: "",
    career: "",
    plan: "",
    semester: "",
    birthDate: "",
    phone: "",
    status: "ACTIVE",
  });

  const [form, setForm] = useState({
    name: "",
    lastNamePaterno: "",
    lastNameMaterno: "",
    email: "",
    password: "",
    matricula: "",
    career: "",
    plan: "",
    semester: "",
    phone: "",
    birthDate: "",
  });

  const [csvFile, setCsvFile] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [updatingEdit, setUpdatingEdit] = useState(false);

  // Feedback (éxito / error global)
  const [feedback, setFeedback] = useState(null);

  // Errores específicos de los modales
  const [createError, setCreateError] = useState(null); // mensaje general
  const [createErrors, setCreateErrors] = useState({}); // por campo

  const [editError, setEditError] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  // Paginación
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // ============================
  // CARGAR LISTA DE ESTUDIANTES
  // ============================
  const loadStudents = async () => {
    try {
      setLoadingList(true);
      setFeedback(null);
      const { data } = await apiClient.get("/api/admin/users/students");
      setStudents(data || []);
    } catch (err) {
      console.error("Error loading students", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar estudiantes.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // ============================
  // FORM CREAR
  // ============================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // limpiar error de ese campo
    setCreateErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetForm = () => {
    setForm({
      name: "",
      lastNamePaterno: "",
      lastNameMaterno: "",
      email: "",
      password: "",
      matricula: "",
      career: "",
      plan: "",
      semester: "",
      phone: "",
      birthDate: "",
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    // 1) Validación en frontend
    const fieldErrors = validateStudent(form, { isEdit: false });
    if (Object.keys(fieldErrors).length > 0) {
      setCreateErrors(fieldErrors);
      setCreateError("Revisa los campos marcados en rojo.");
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      setCreateError(null);

      const payload = {
        ...form,
        semester: form.semester ? Number.parseInt(form.semester, 10) : null,
      };

      const { data } = await apiClient.post(
        "/api/admin/users/students",
        payload
      );

      const msg =
        data?.message || "Estudiante creado correctamente.";
      setFeedback({ type: "success", message: msg });

      resetForm();
      setCreateErrors({});
      setIsCreateOpen(false);
      loadStudents();
    } catch (err) {
      console.error("Error al crear estudiante", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al crear estudiante.";
      // Error de backend: lo mostramos dentro del modal
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
        "/api/admin/users/students/import-csv",
        { csv: text }
      );

      const msg =
        data && typeof data === "object"
          ? `Importación completa. total=${data.total}, creados=${data.created}, ya existentes=${data.skippedExisting}`
          : "Importación completa.";

      setFeedback({ type: "success", message: msg });
      setCsvFile(null);
      setIsImportOpen(false);
      loadStudents();
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
  // EDITAR ESTUDIANTE (PUT + PATCH STATUS)
  // ============================
  const openEditModal = (student) => {
    const allowedStatus = ["ACTIVE", "DISABLED", "BLOCKED"];
    const initialStatus = allowedStatus.includes(student.status)
      ? student.status
      : "ACTIVE";

    setEditStudent(student);
    setEditForm({
      name: student.name || "",
      lastNamePaterno: student.lastNamePaterno || "",
      lastNameMaterno: student.lastNameMaterno || "",
      email: student.email || "",
      matricula: student.matricula || "",
      career: student.career || "",
      plan: student.plan || "",
      semester:
        student.semester !== null && student.semester !== undefined
          ? String(student.semester)
          : "",
      birthDate: student.birthDate || "",
      phone: student.phone || "",
      status: initialStatus,
    });
    setEditError(null);
    setEditErrors({});
    setFeedback(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleUpdateStudent = async () => {
    if (!editStudent) return;

    // 1) Validar en frontend (sin contraseña)
    const fieldErrors = validateStudent(editForm, { isEdit: true });
    if (Object.keys(fieldErrors).length > 0) {
      setEditErrors(fieldErrors);
      setEditError("Revisa los campos marcados en rojo.");
      return;
    }

    try {
      setUpdatingEdit(true);
      setEditError(null);
      setFeedback(null);

      // 1) Actualizar datos generales (PUT)
      const { semester, ...rest } = editForm;
      delete rest.status;
      const body = {
        ...rest,
        semester: semester ? Number.parseInt(semester, 10) : null,
      };

      await apiClient.put(
        `/api/admin/users/students/${editStudent.id}`,
        body
      );

      // 2) Actualizar estado (PATCH) limitado a ACTIVE / DISABLED / BLOCKED
      await apiClient.patch(`/api/admin/users/${editStudent.id}/status`, {
        role: "ESTUDIANTE",
        status: editForm.status,
      });

      setFeedback({
        type: "success",
        message: "Estudiante actualizado correctamente.",
      });
      setEditStudent(null);
      loadStudents();
    } catch (err) {
      console.error("Error actualizando estudiante", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al actualizar estudiante.";
      // Mostrar dentro del modal
      setEditError(msg);
    } finally {
      setUpdatingEdit(false);
    }
  };

  // ============================
  // FILTROS
  // ============================
  const filteredStudents = students.filter((s) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      `${s.name} ${s.lastNamePaterno} ${s.lastNameMaterno}`
        .toLowerCase()
        .includes(term) ||
      (s.email || "").toLowerCase().includes(term) ||
      (s.matricula || "").toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === "ALL" || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  // Reset página al cambiar filtros o lista
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, students]);

  // ============================
  // Paginación
  // ============================
  const totalStudents = filteredStudents.length;
  const totalPages = Math.max(1, Math.ceil(totalStudents / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  const showingFrom = totalStudents === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalStudents);

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
            Gestión de Estudiantes
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Crea, importa y administra la información de los estudiantes
            registrados en TutorLink.
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
              setCreateError(null);
              setCreateErrors({});
            }}
            className="
              px-4 py-2 rounded-full 
              bg-uvGreen hover:bg-green-600 
              text-white text-sm font-semibold 
              shadow-sm transition
            "
          >
            Crear estudiante
          </button>
        </div>
      </div>

      {/* FEEDBACK GLOBAL */}
      {feedback && (
        <output
          className={`px-4 py-3 rounded-xl text-sm border ${feedback.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live={feedback.type === "error" ? undefined : "polite"}
        >
          {feedback.message}
        </output>
      )}

      {/* FILTROS */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <label
            htmlFor="students-search"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Buscar
          </label>
          <input
            id="students-search"
            type="text"
            placeholder="Nombre, correo o matrícula"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Aplica sobre nombre completo, correo institucional o matrícula.
          </p>
        </div>

        <div className="w-full md:w-64">
          <label
            htmlFor="students-status-filter"
            className="block text-xs font-semibold text-slate-700 mb-1"
          >
            Estado
          </label>
          <select
            id="students-status-filter"
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

      {/* LISTA DE ESTUDIANTES */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Lista de estudiantes
        </h2>

        {loadingList ? (
          <p className="text-sm text-slate-600">Cargando estudiantes...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Matrícula
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Correo
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Carrera
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Semestre
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
                  {currentStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-slate-200 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2 text-slate-800">
                        {s.matricula}
                      </td>
                      <td className="px-4 py-2 text-slate-800">
                        {s.name} {s.lastNamePaterno}{" "}
                        {s.lastNameMaterno || ""}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {s.email}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {s.career || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {s.semester ?? "—"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setViewStudent(s)}
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
                            onClick={() => openEditModal(s)}
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

                  {currentStudents.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-slate-500"
                        colSpan={7}
                      >
                        No hay estudiantes que coincidan con los filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalStudents > pageSize && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <p className="text-slate-500">
                  Mostrando{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}–{showingTo}
                  </span>{" "}
                  de{" "}
                  <span className="font-semibold text-slate-700">
                    {totalStudents}
                  </span>{" "}
                  estudiantes
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

      {/* MODAL CREAR ESTUDIANTE */}
      {isCreateOpen && (
        <Modal onClose={() => !saving && setIsCreateOpen(false)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-2">
            Crear estudiante
          </h2>

          {createError && (
            <div
              className="
                mb-3 text-xs text-red-700 bg-red-50 border border-red-200
                rounded-lg px-3 py-2
              "
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
              label="Matrícula"
              name="matricula"
              value={form.matricula}
              onChange={handleChange}
              error={createErrors.matricula}
            />
            <Input
              label="Carrera"
              name="career"
              value={form.career}
              onChange={handleChange}
              error={createErrors.career}
            />
            <Input
              label="Plan"
              name="plan"
              value={form.plan}
              onChange={handleChange}
              error={createErrors.plan}
            />
            <Input
              label="Semestre"
              name="semester"
              value={form.semester}
              onChange={handleChange}
              error={createErrors.semester}
            />
            <Input
              label="Teléfono"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              error={createErrors.phone}
            />
            <Input
              label="Fecha de nacimiento"
              name="birthDate"
              type="date"
              value={form.birthDate}
              onChange={handleChange}
              error={createErrors.birthDate}
            />

            <div className="col-span-full flex justify-end gap-3 mt-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (!saving) {
                    setIsCreateOpen(false);
                    resetForm();
                    setCreateError(null);
                    setCreateErrors({});
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
                {saving ? "Guardando..." : "Guardar estudiante"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL IMPORTAR CSV */}
      {isImportOpen && (
        <Modal onClose={() => !importing && setIsImportOpen(false)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Importar estudiantes por CSV
          </h2>

          <p className="text-sm text-slate-600 mb-3">
            Selecciona un archivo CSV con el siguiente formato:
          </p>
          <pre className="bg-slate-50 rounded-lg p-3 text-xs mb-3 overflow-x-auto border border-slate-200">
            matricula;email;name;lastNamePaterno;lastNameMaterno;career;plan;semester;phone
            {"\n"}
            S230010;mariana.rosas@uv.mx;Mariana;Rosas;Torres;ISC;2023;2;2295550011
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

      {/* MODAL VER ESTUDIANTE */}
      {viewStudent && (
        <Modal onClose={() => setViewStudent(null)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Detalle de estudiante
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Detail
              label="Nombre"
              value={`${viewStudent.name} ${viewStudent.lastNamePaterno} ${viewStudent.lastNameMaterno || ""
                }`}
            />
            <Detail label="Matrícula" value={viewStudent.matricula} />
            <Detail label="Correo" value={viewStudent.email} />
            <Detail label="Carrera" value={viewStudent.career} />
            <Detail label="Plan" value={viewStudent.plan} />
            <Detail label="Semestre" value={viewStudent.semester} />
            <Detail label="Teléfono" value={viewStudent.phone} />
            <Detail
              label="Fecha de nacimiento"
              value={viewStudent.birthDate}
            />
            <Detail
              label="Estado"
              value={<StatusBadge status={viewStudent.status} />}
            />
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setViewStudent(null)}
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

      {/* MODAL EDITAR ESTUDIANTE (PUT + PATCH STATUS) */}
      {editStudent && (
        <Modal onClose={() => !updatingEdit && setEditStudent(null)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-2">
            Editar estudiante
          </h2>

          {editError && (
            <div
              className="
                mb-3 text-xs text-red-700 bg-red-50 border border-red-200
                rounded-lg px-3 py-2
              "
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
              label="Matrícula"
              name="matricula"
              value={editForm.matricula}
              onChange={handleEditChange}
              error={editErrors.matricula}
            />
            <Input
              label="Carrera"
              name="career"
              value={editForm.career}
              onChange={handleEditChange}
              error={editErrors.career}
            />
            <Input
              label="Plan"
              name="plan"
              value={editForm.plan}
              onChange={handleEditChange}
              error={editErrors.plan}
            />
            <Input
              label="Semestre"
              name="semester"
              value={editForm.semester}
              onChange={handleEditChange}
              error={editErrors.semester}
            />
            <Input
              label="Teléfono"
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
              error={editErrors.phone}
            />
            <Input
              label="Fecha de nacimiento"
              name="birthDate"
              type="date"
              value={editForm.birthDate}
              onChange={handleEditChange}
              error={editErrors.birthDate}
            />

            <div className="col-span-full">
              <label
                htmlFor="student-edit-status"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Estado
              </label>
              <select
                id="student-edit-status"
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
                if (!updatingEdit) setEditStudent(null);
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
              onClick={handleUpdateStudent}
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

  const commonClasses = `
    w-full border rounded-lg px-3 py-2 
    focus:ring-2 outline-none text-sm
    pr-10
  `;

  const borderClasses = error
    ? "border-red-400 focus:ring-red-400"
    : "border-slate-300 focus:ring-uvBlue";

  return (
    <div className="flex flex-col">
      <label htmlFor={`student-${name}`} className="text-slate-700 mb-1 text-sm">
        {label}
      </label>
      <div className="relative">
        <input
          id={`student-${name}`}
          type={getInputType(type, showPassword)}
          name={name}
          value={value}
          onChange={onChange}
          className={`${commonClasses} ${borderClasses}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="
              absolute inset-y-0 right-2 flex items-center 
              text-[11px] text-slate-500 hover:text-slate-800
            "
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {showPassword ? "Ocultar" : "Ver"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

Input.propTypes = {
  error: PropTypes.string,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

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

        {/* Contenido del modal */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

function StatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600 border border-slate-200">
        —
      </span>
    );
  }

  const { classes, label } = STUDENT_STATUS[status] ?? {
    classes: "bg-slate-100 text-slate-700 border border-slate-200",
    label: status,
  };

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">
        {getDetailValue(value)}
      </p>
    </div>
  );
}

Detail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};
