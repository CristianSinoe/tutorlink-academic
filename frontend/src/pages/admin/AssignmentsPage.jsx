import { useEffect, useRef, useState } from "react";
import apiClient from "../../api/axiosClient";

export default function AssignmentsPage() {
  const [groups, setGroups] = useState([]); // agrupado por tutor
  const [loadingList, setLoadingList] = useState(false);

  // Filtro simple por tutor (nombre / correo / código)
  const [search, setSearch] = useState("");

  // Modal detalle por tutor
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [newMatricula, setNewMatricula] = useState("");

  // Autocomplete de matrículas
  const [studentSuggestions, setStudentSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestTimeoutRef = useRef(null);

  // CSV
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [savingAssign, setSavingAssign] = useState(false);
  const [removing, setRemoving] = useState(false);

  // Notificaciones (éxito / error)
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Paginación de tutores
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ============================
  // CARGAR ASIGNACIONES Y AGRUPAR
  // ============================
  const loadAssignments = async () => {
    try {
      setLoadingList(true);
      setFeedback(null);

      const { data } = await apiClient.get("/api/admin/users/tutor-students");

      const rows = data || [];
      const map = new Map();

      rows.forEach((row) => {
        const key = row.tutorCode || `TUTOR_${row.tutorId || "sin_codigo"}`;

        if (!map.has(key)) {
          const tutorName =
            row.tutorName ||
            `${row.tutorFirstName || ""} ${
              row.tutorLastName || ""
            }`.trim();

          map.set(key, {
            tutorCode: row.tutorCode,
            tutorName,
            tutorEmail: row.tutorEmail, // <- ahora sí viene del backend
            tutorDepartment: row.tutorDepartment,
            tutorSpecialty: row.tutorSpecialty,
            students: [],
          });
        }

        const group = map.get(key);

        group.students.push({
          id: row.id, // id de la entidad TutorStudent
          matricula: row.studentMatricula,
          studentName:
            row.studentName ||
            `${row.studentFirstName || ""} ${
              row.studentLastName || ""
            }`.trim(),
          studentEmail: row.studentEmail,
        });
      });

      const grouped = Array.from(map.values()).map((g) => ({
        ...g,
        totalStudents: g.students.length,
      }));

      setGroups(grouped);
    } catch (err) {
      console.error("Error cargando asignaciones", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar las asignaciones tutor–estudiante.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  // ============================
  // FILTRO POR TUTOR
  // ============================
  const filteredGroups = groups.filter((g) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;

    return (
      (g.tutorCode || "").toLowerCase().includes(term) ||
      (g.tutorName || "").toLowerCase().includes(term) ||
      (g.tutorEmail || "").toLowerCase().includes(term)
    );
  });

  // Reset a página 1 cuando cambian los datos o el filtro
  useEffect(() => {
    setPage(1);
  }, [search, groups]);

  const clearSearch = () => setSearch("");

  // ============================
  // Paginación de tutores
  // ============================
  const totalTutors = filteredGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalTutors / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentTutors = filteredGroups.slice(startIndex, endIndex);

  const showingFrom = totalTutors === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalTutors);

  const handlePrevPage = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  // ============================
  // AUTOCOMPLETE MATRÍCULA
  // ============================
  const fetchStudentSuggestions = async (term) => {
    try {
      setLoadingSuggestions(true);
      const { data } = await apiClient.get(
        "/api/admin/users/tutor-students/suggest-students",
        {
          params: { q: term },
        }
      );
      setStudentSuggestions(Array.isArray(data) ? data : []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Error obteniendo sugerencias de estudiantes", err);
      setStudentSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleChangeMatricula = (e) => {
    const value = e.target.value.toUpperCase();
    setNewMatricula(value);

    if (!value.trim()) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // debounce simple
    if (suggestTimeoutRef.current) {
      clearTimeout(suggestTimeoutRef.current);
    }

    // Sólo buscar si hay al menos 2 caracteres
    if (value.trim().length < 2) {
      setStudentSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    suggestTimeoutRef.current = setTimeout(() => {
      fetchStudentSuggestions(value.trim());
    }, 300);
  };

  const handleSelectSuggestion = (suggestion) => {
    setNewMatricula(suggestion.matricula);
    setStudentSuggestions([]);
    setShowSuggestions(false);
  };

  // ============================
  // DETALLE POR TUTOR
  // ============================
  const openTutorDetail = (group) => {
    setSelectedTutor(group);
    setNewMatricula("");
    setStudentSuggestions([]);
    setShowSuggestions(false);
    setFeedback(null);
  };

  const closeTutorDetail = () => {
    if (savingAssign || removing) return;
    setSelectedTutor(null);
    setNewMatricula("");
    setStudentSuggestions([]);
    setShowSuggestions(false);
  };

  // Asignar estudiante a este tutor (dentro del modal)
  const handleAssignToTutor = async (e) => {
    e.preventDefault();
    if (!selectedTutor) return;

    const matricula = newMatricula.trim();
    if (!matricula) {
      setFeedback({
        type: "error",
        message: "Captura la matrícula del estudiante.",
      });
      return;
    }

    try {
      setSavingAssign(true);
      setFeedback(null);

      await apiClient.post("/api/admin/users/tutor-students/assign", {
        tutorCode: selectedTutor.tutorCode,
        matricula,
      });

      setFeedback({
        type: "success",
        message: "Asignación creada correctamente.",
      });

      // Simplificamos: cerramos modal y recargamos todo
      closeTutorDetail();
      await loadAssignments();
    } catch (err) {
      console.error("Error al asignar estudiante a tutor", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al crear la asignación.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setSavingAssign(false);
    }
  };

  // Quitar una asignación (un estudiante de ese tutor)
  const handleRemoveAssignment = async (assignment) => {
    if (!selectedTutor) return;

    const confirmRemove = window.confirm(
      `¿Quitar al estudiante ${assignment.studentName} (${assignment.matricula}) de este tutor?`
    );
    if (!confirmRemove) return;

    try {
      setRemoving(true);
      setFeedback(null);

      await apiClient.delete(
        `/api/admin/users/tutor-students/${assignment.id}`
      );

      setFeedback({
        type: "success",
        message: "Asignación eliminada correctamente.",
      });

      // Cerrar modal y recargar lista completa
      closeTutorDetail();
      await loadAssignments();
    } catch (err) {
      console.error("Error al quitar asignación", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al quitar la asignación.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setRemoving(false);
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
        "/api/admin/users/tutor-students/import-csv",
        { csv: text }
      );

      const msg =
        data && typeof data === "object"
          ? `Importación completa. total=${data.total}, creados=${data.created}, ya existentes=${data.skippedExisting}`
          : "Importación completa.";

      setFeedback({ type: "success", message: msg });
      setCsvFile(null);
      setIsImportOpen(false);
      loadAssignments();
    } catch (err) {
      console.error("Error importando CSV de asignaciones", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error importando CSV de asignaciones.";
      setFeedback({ type: "error", message: msg });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER + BOTÓN IMPORTAR */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-uvBlue tracking-tight">
            Asignaciones Tutor – Estudiante
          </h1>
          <p className="text-sm text-slate-600 max-w-xl">
            Consulta y gestiona las relaciones entre tutores académicos y sus
            estudiantes asignados.
          </p>
        </div>

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
      </div>

      {/* NOTIFICACIONES */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl text-sm border ${
            feedback.type === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
          role={feedback.type === "error" ? "alert" : "status"}
        >
          {feedback.message}
        </div>
      )}

      {/* FILTRO POR TUTOR */}
      <section className="
    bg-white border border-slate-200 rounded-2xl shadow-sm p-4 
    flex flex-col gap-4 
    md:flex-row md:items-start md:justify-between
  ">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Buscar tutor
          </label>
          <input
            type="text"
            placeholder="Nombre, correo o código"
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Filtra la lista de tutores por datos básicos. La paginación se
            ajusta al filtro aplicado.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearSearch}
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

      {/* LISTA DE TUTORES CON CONTADOR */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Tutores y sus asignaciones
        </h2>

        {loadingList ? (
          <p className="text-sm text-slate-600">Cargando asignaciones...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Código tutor
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Nombre tutor
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
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      # Estudiantes
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentTutors.map((g, idx) => (
                    <tr
                      key={g.tutorCode || idx}
                      className="border-t border-slate-200 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2 text-slate-800">
                        {g.tutorCode || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-800">
                        {g.tutorName || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {g.tutorEmail || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {g.tutorDepartment || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {g.tutorSpecialty || "—"}
                      </td>
                      <td className="px-4 py-2 text-center text-slate-800">
                        {g.totalStudents || 0}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => openTutorDetail(g)}
                          className="
                            inline-flex items-center px-3 py-1.5 
                            border border-slate-300 rounded-full 
                            text-slate-700 text-xs 
                            hover:bg-slate-100 transition
                          "
                        >
                          Ver asignaciones
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loadingList && totalTutors === 0 && (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-sm text-slate-500"
                        colSpan={7}
                      >
                        No hay tutores con asignaciones que coincidan con el
                        filtro.
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

      {/* MODAL IMPORTAR CSV */}
      {isImportOpen && (
        <Modal onClose={() => !importing && setIsImportOpen(false)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Importar asignaciones por CSV
          </h2>

          <p className="text-sm text-slate-600 mb-3">
            Selecciona un archivo CSV con el siguiente formato:
          </p>
          <pre className="bg-slate-50 rounded-lg p-3 text-xs mb-3 overflow-x-auto border border-slate-200">
            tutorCode;matricula
            {"\n"}
            TUT001;S230010
            {"\n"}
            TUT001;S230011
            {"\n"}
            TUT002;S230012
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

      {/* MODAL DETALLE DE ASIGNACIONES POR TUTOR */}
      {selectedTutor && (
        <Modal onClose={closeTutorDetail}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Asignaciones de {selectedTutor.tutorName}
          </h2>

          <div className="mb-4 text-sm text-slate-700 space-y-1">
            <p>
              <span className="font-semibold">Código: </span>
              {selectedTutor.tutorCode}
            </p>
            <p>
              <span className="font-semibold">Correo: </span>
              {selectedTutor.tutorEmail || "—"}
            </p>
            {selectedTutor.tutorDepartment && (
              <p>
                <span className="font-semibold">Departamento: </span>
                {selectedTutor.tutorDepartment}
              </p>
            )}
            {selectedTutor.tutorSpecialty && (
              <p>
                <span className="font-semibold">Especialidad: </span>
                {selectedTutor.tutorSpecialty}
              </p>
            )}
            <p>
              <span className="font-semibold">Estudiantes asignados: </span>
              {selectedTutor.totalStudents}
            </p>
          </div>

          {/* FORM PARA ASIGNAR NUEVO ESTUDIANTE */}
          <section className="mb-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Asignar nuevo estudiante a este tutor
            </h3>
            <form
              onSubmit={handleAssignToTutor}
              className="flex flex-col md:flex-row gap-3 md:items-center relative"
            >
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Matrícula del estudiante
                </label>
                <input
                  type="text"
                  value={newMatricula}
                  onChange={handleChangeMatricula}
                  placeholder="Ej. S230010"
                  className="
                    w-full border border-slate-300 rounded-lg px-3 py-2 
                    focus:ring-2 focus:ring-uvBlue outline-none text-sm
                  "
                  onFocus={() => {
                    if (studentSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />

                {/* LISTA DE SUGERENCIAS */}
                {showSuggestions && (
                  <div className="absolute z-50 mt-1 w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto text-sm">
                    {loadingSuggestions && (
                      <div className="px-3 py-2 text-slate-500">
                        Buscando estudiantes...
                      </div>
                    )}

                    {!loadingSuggestions &&
                      studentSuggestions.length === 0 && (
                        <div className="px-3 py-2 text-slate-500">
                          No hay estudiantes disponibles para asignar.
                        </div>
                      )}

                    {!loadingSuggestions &&
                      studentSuggestions.map((s) => (
                        <button
                          key={s.studentId}
                          type="button"
                          onClick={() => handleSelectSuggestion(s)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 flex flex-col"
                        >
                          <span className="font-semibold">
                            {s.matricula}
                          </span>
                          <span className="text-xs text-slate-700">
                            {s.fullName}
                          </span>
                          <span className="text-xs text-slate-500">
                            {s.email}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 justify-end mt-2 md:mt-6">
                <button
                  type="submit"
                  disabled={savingAssign}
                  className="
                    px-4 py-2 rounded-full 
                    bg-uvGreen hover:bg-green-600 
                    disabled:opacity-60 
                    text-white text-sm font-semibold 
                    transition
                  "
                >
                  {savingAssign ? "Asignando..." : "Asignar"}
                </button>
              </div>
            </form>
          </section>

          {/* TABLA DE ESTUDIANTES DE ESTE TUTOR */}
          <section>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">
              Estudiantes asignados
            </h3>

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
                    <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTutor.students.map((s) => (
                    <tr
                      key={s.id}
                      className="border-t border-slate-200 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2 text-slate-800">
                        {s.matricula}
                      </td>
                      <td className="px-4 py-2 text-slate-800">
                        {s.studentName}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {s.studentEmail}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          disabled={removing}
                          onClick={() => handleRemoveAssignment(s)}
                          className="
                            inline-flex items-center px-3 py-1.5 
                            border border-red-300 text-red-600 
                            rounded-full text-xs hover:bg-red-50 
                            transition disabled:opacity-60
                          "
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  ))}

                  {selectedTutor.students.length === 0 && (
                    <tr>
                      <td
                        className="px-4 py-4 text-center text-slate-500"
                        colSpan={4}
                      >
                        Este tutor aún no tiene estudiantes asignados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="mt-5 flex justify-end">
            <button
              onClick={closeTutorDetail}
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
          max-w-4xl w-full mx-4 p-6 relative 
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
