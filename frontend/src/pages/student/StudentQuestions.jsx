// src/pages/student/StudentQuestions.jsx
import { useEffect, useMemo, useState } from "react";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "PUBLICADA", label: "Respondida" },
  { value: "CORREGIDA", label: "Corregida" },
  { value: "RECHAZADA", label: "Rechazada" },
];

const SCOPE_OPTIONS = [
  { value: "ALL", label: "Todos" },
  { value: "GENERAL", label: "General" },
  { value: "PROGRAMA", label: "Programa educativo" },
  { value: "PLAN", label: "Plan de estudios" },
  { value: "SEMESTRE", label: "Semestre" },
  { value: "ACADEMICO", label: "Académico" },
];

export default function StudentQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // ============================
  // CARGAR PREGUNTAS
  // ============================
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const { data } = await apiClient.get("/api/student/questions/my", {
        params: { page: 0, size: 100 },
      });
      const list =
        data && Array.isArray(data.content) ? data.content : [];
      setQuestions(list);
    } catch (err) {
      console.error("Error cargando preguntas del estudiante", err);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  // ============================
  // FILTROS (solo en frontend)
  // ============================
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !searchText.trim() ||
        q.title?.toLowerCase().includes(searchText.trim().toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || q.status === statusFilter;

      const matchesScope =
        scopeFilter === "ALL" || q.scope === scopeFilter;

      return matchesSearch && matchesStatus && matchesScope;
    });
  }, [questions, searchText, statusFilter, scopeFilter]);

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("ALL");
    setScopeFilter("ALL");
  };

  // ============================
  // DETALLE
  // ============================
  const openDetail = async (qSummary) => {
    try {
      setLoadingDetail(true);
      const { data } = await apiClient.get(
        `/api/student/questions/${qSummary.id}`
      );
      setSelectedQuestion(data);
    } catch (err) {
      console.error("Error cargando detalle de pregunta", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar el detalle de la pregunta";
      alert(msg);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-uvBlue tracking-tight">
            Mis preguntas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa todas tus preguntas y accede al detalle de cada una.
          </p>
        </div>

        {/* FILTROS */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900">Filtros</h2>

          <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr] gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Buscar
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
                placeholder="Texto de la pregunta"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Alcance
              </label>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
              >
                {SCOPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-1.5 rounded-full border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
            >
              Limpiar filtros
            </button>
          </div>
        </section>

        {/* LISTADO */}
        <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 md:p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Listado
          </h2>

          {loadingQuestions ? (
            <p className="text-sm text-slate-500">
              Cargando preguntas…
            </p>
          ) : filteredQuestions.length === 0 ? (
            <p className="text-sm text-slate-500">
              No se encontraron preguntas con los filtros actuales.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100/80">
                  <tr>
                    <th className="p-2.5">Pregunta</th>
                    <th className="p-2.5">Estado</th>
                    <th className="p-2.5">Fecha</th>
                    <th className="p-2.5">Alcance</th>
                    <th className="p-2.5">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr
                      key={q.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td
                        className="p-2.5 max-w-md truncate"
                        title={q.title}
                      >
                        {q.title}
                      </td>

                      <td className="p-2.5">
                        <QuestionStatusBadge status={q.status} />
                      </td>

                      {/* FECHA FORMATEADA: createdAt primero, luego updatedAt */}
                      <td className="p-2.5">
                        {formatDateTime(q.createdAt || q.updatedAt)}
                      </td>

                      <td className="p-2.5">
                        {q.scope || "—"}
                      </td>

                      <td className="p-2.5">
                        <button
                          onClick={() => openDetail(q)}
                          className="px-3 py-1 border border-slate-300 rounded-full text-xs text-slate-700 hover:bg-slate-100 transition"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-3 text-xs text-slate-500">
            * Aquí puedes revisar todas tus preguntas y acceder al detalle y la
            respuesta completa.
          </p>
        </section>
      </div>

      {/* MODAL DETALLE */}
      {selectedQuestion && (
        <Modal onClose={() => setSelectedQuestion(null)}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Detalle de mi pregunta
          </h2>

          {loadingDetail ? (
            <p className="text-sm text-slate-500">Cargando detalle…</p>
          ) : (
            <QuestionDetail question={selectedQuestion} />
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => setSelectedQuestion(null)}
              className="px-4 py-2 border border-slate-300 rounded-full text-slate-700 hover:bg-slate-100 transition"
            >
              Cerrar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ========= COMPONENTES AUXILIARES ========= */

function QuestionStatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
        —
      </span>
    );
  }

  let classes = "";
  let label = status;

  switch (status) {
    case "PENDIENTE":
      classes = "bg-amber-100 text-amber-800";
      label = "Pendiente";
      break;
    case "PUBLICADA":
      classes = "bg-emerald-100 text-emerald-800";
      label = "Respondida";
      break;
    case "CORREGIDA":
      classes = "bg-blue-100 text-blue-800";
      label = "Corregida";
      break;
    case "RECHAZADA":
      classes = "bg-red-100 text-red-700";
      label = "Rechazada";
      break;
    default:
      classes = "bg-slate-100 text-slate-700";
      label = status;
  }

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

function QuestionDetail({ question }) {
  return (
    <div className="space-y-5 text-sm">
      {/* Info general */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Información general
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoBox label="ID" value={`#${question.id}`} />

          <InfoBox
            label="Fecha de envío"
            value={formatDateTime(question.createdAt)}
          />

          <InfoBox
            label="Estado"
            value={<QuestionStatusBadge status={question.status} />}
          />

          <InfoBox label="Alcance" value={question.scope || "—"} />

          <InfoBox
            label="Tutor que respondió"
            value={
              question.tutorName ||
              question.tutorFullName ||
              question.tutorEmail ||
              "—"
            }
          />
        </div>
      </div>

      {/* Mi pregunta */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Mi pregunta
        </h3>
        <div className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
          <p className="font-medium text-slate-900 mb-1">
            {question.title}
          </p>
          <p className="text-slate-800 whitespace-pre-line">
            {question.body}
          </p>
        </div>
      </div>

      {/* Respuesta del tutor */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Respuesta del tutor
        </h3>
        <div className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
          {question.currentAnswerBody ? (
            <>
              <p className="text-xs text-slate-500 mb-1">
                Versión {question.currentAnswerVersion ?? "—"}
                {question.wasCorrected ? " (corregida)" : ""}
              </p>
              <p className="text-slate-800 whitespace-pre-line">
                {question.currentAnswerBody}
              </p>
            </>
          ) : (
            <p className="text-slate-600">
              Tu pregunta aún no ha sido respondida.
            </p>
          )}
        </div>
      </div>

      {/* Notas adicionales */}
      <div>
        {question.rejectReason && (
          <>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Motivo de rechazo
            </h3>
            <p className="text-sm text-slate-800 whitespace-pre-line mb-2">
              {question.rejectReason}
            </p>
          </>
        )}
        <p className="text-xs text-slate-500">
          * En la versión final aquí podrían mostrarse enlaces a documentos,
          reglamentos o recursos sugeridos por el tutor.
        </p>
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
      <p className="text-xs font-semibold text-slate-500 mb-1">
        {label}
      </p>
      {typeof value === "string" ? (
        <p className="text-sm text-slate-800">{value}</p>
      ) : (
        value
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
