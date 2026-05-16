// src/pages/tutor/TutorPendingPage.jsx
import { useEffect, useState } from "react";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";

const SCOPE_OPTIONS = [
  { value: "ALL", label: "Todos los alcances" },
  { value: "GENERAL", label: "General" },
  { value: "PROGRAMA", label: "Programa" },
  { value: "PLAN", label: "Plan" },
  { value: "SEMESTRE", label: "Semestre" },
  { value: "ACADEMICO", label: "Académico" },
];

const ANSWER_ACTIONS = [
  { value: "PUBLISH", label: "Publicar respuesta (aprobar)" },
  { value: "CORRECT", label: "Publicar como corregida" },
  { value: "REJECT", label: "Rechazar pregunta (fuera de alcance)" },
];

export default function TutorPendingPage() {
  const [filters, setFilters] = useState({
    text: "",
    scope: "ALL",
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Detalle / responder
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [answerForm, setAnswerForm] = useState({
    action: "PUBLISH",
    newScope: "",
    answerBody: "",
    rejectReason: "",
  });

  // ============================
  // FILTROS
  // ============================
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await apiClient.get(
        "/api/tutor/questions/pending/my",
        {
          params: {
            q: filters.text?.trim() || undefined,
            scope:
              filters.scope && filters.scope !== "ALL"
                ? filters.scope
                : undefined,
          },
        }
      );

      const list = Array.isArray(data) ? data : data.content || [];
      setQuestions(list);
    } catch (err) {
      console.error("Error cargando preguntas pendientes", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar las preguntas pendientes.";
      setError(msg);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================
  // DETALLE / RESPONDER
  // ============================
  const openDetail = async (qSummary) => {
    try {
      setLoadingDetail(true);

      // Por ahora usamos el summary directo
      setSelectedQuestion(qSummary);
      setAnswerForm({
        action: "PUBLISH",
        newScope: qSummary.scope || "",
        answerBody: "",
        rejectReason: "",
      });
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

  const closeDetail = () => {
    if (savingAnswer) return;
    setSelectedQuestion(null);
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!selectedQuestion) return;

    // Validaciones básicas
    if (!answerForm.answerBody.trim() && answerForm.action !== "REJECT") {
      alert("Escribe la respuesta para el estudiante.");
      return;
    }

    if (answerForm.action === "REJECT" && !answerForm.rejectReason.trim()) {
      alert("Indica el motivo de rechazo.");
      return;
    }

    try {
      setSavingAnswer(true);

      const actions = [];
      const questionId = selectedQuestion.id;

      // 1) Reclasificar si eligió un alcance nuevo
      const newScope =
        answerForm.newScope && answerForm.newScope !== selectedQuestion.scope
          ? answerForm.newScope
          : null;

      if (newScope) {
        actions.push(
          apiClient.post(`/api/tutor/questions/${questionId}/reclassify`, {
            scope: newScope,
          })
        );
      }

      // 2) Acción principal: publicar / corregir / rechazar
      if (answerForm.action === "PUBLISH" || answerForm.action === "CORRECT") {
        const endpoint =
          answerForm.action === "PUBLISH" ? "answer" : "correct";

        actions.push(
          apiClient.post(`/api/tutor/questions/${questionId}/${endpoint}`, {
            body: answerForm.answerBody.trim(),
          })
        );
      } else if (answerForm.action === "REJECT") {
        actions.push(
          apiClient.post(`/api/tutor/questions/${questionId}/reject`, {
            reason: answerForm.rejectReason.trim(),
          })
        );
      }

      await Promise.all(actions);

      alert("Acción aplicada correctamente.");
      setSelectedQuestion(null);
      setAnswerForm({
        action: "PUBLISH",
        newScope: "",
        answerBody: "",
        rejectReason: "",
      });
      loadQuestions();
    } catch (err) {
      console.error("Error al guardar respuesta", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al guardar la respuesta";
      alert(msg);
    } finally {
      setSavingAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-uvBlue tracking-tight">
            Preguntas pendientes
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Gestiona las dudas que tienes asignadas y prioriza cuáles responder
            primero.
          </p>
        </div>
      </header>

      {/* ERROR GLOBAL */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* FILTROS */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Filtros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Buscar por pregunta
            </label>
            <input
              type="text"
              name="text"
              value={filters.text}
              onChange={handleFilterChange}
              placeholder="Texto de la pregunta"
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Alcance
            </label>
            <select
              name="scope"
              value={filters.scope}
              onChange={handleFilterChange}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadQuestions}
              disabled={loading}
              className="w-full md:w-auto px-4 py-2 rounded-full bg-uvBlue text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {loading ? "Cargando..." : "Aplicar filtros"}
            </button>
          </div>
        </div>
      </section>

      {/* LISTADO */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="px-4 pt-4 pb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Listado
        </h2>

        {loading ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Cargando...</p>
        ) : questions.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">
            No tienes preguntas pendientes por el momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-slate-100/70 text-slate-700">
                <tr>
                  <th className="px-3 py-2.5">Pregunta</th>
                  <th className="px-3 py-2.5">Estudiante</th>
                  <th className="px-3 py-2.5">Alcance</th>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr
                    key={q.id}
                    className="border-t border-slate-100 hover:bg-slate-50"
                  >
                    <td
                      className="px-3 py-2.5 max-w-xs truncate"
                      title={q.title}
                    >
                      {q.title}
                    </td>

                    <td className="px-3 py-2.5">
                      {q.studentName || q.studentEmail || "—"}
                    </td>

                    <td className="px-3 py-2.5">
                      {q.scope || "—"}
                    </td>

                    {/* ← FECHA FORMATEADA CON FALLBACK */}
                    <td className="px-3 py-2.5">
                      {formatDateTime(q.createdAt || q.updatedAt)}
                    </td>

                    <td className="px-3 py-2.5">
                      <button
                        className="px-3 py-1 rounded-full border border-uvBlue text-uvBlue text-xs font-medium hover:bg-uvBlue hover:text-white transition"
                        onClick={() => openDetail(q)}
                      >
                        Ver detalle / Responder
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="px-4 pb-4 text-xs text-slate-500">
          * Desde aquí priorizas qué preguntas atender primero.
        </p>
      </section>

      {/* MODAL DETALLE / RESPUESTA */}
      {selectedQuestion && (
        <Modal onClose={closeDetail}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Detalle de la pregunta
          </h2>

          {loadingDetail ? (
            <p className="text-sm text-slate-500">Cargando detalle...</p>
          ) : (
            <form
              onSubmit={handleSubmitAnswer}
              className="space-y-5 text-sm"
            >
              {/* Info general */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InfoBox
                  label="Estudiante"
                  value={
                    selectedQuestion.studentName ||
                    selectedQuestion.studentEmail ||
                    "—"
                  }
                />
                <InfoBox
                  label="Fecha de creación"
                  value={formatDateTime(
                    selectedQuestion.createdAt || selectedQuestion.updatedAt
                  )}
                />
                <InfoBox
                  label="Alcance actual"
                  value={selectedQuestion.scope || "—"}
                />
              </div>

              {/* Pregunta */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Pregunta
                </p>
                <p className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 whitespace-pre-line">
                  {selectedQuestion.body || selectedQuestion.title}
                </p>
              </div>

              {/* Reclasificar alcance */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Reclasificar alcance (opcional)
                </label>
                <select
                  name="newScope"
                  value={answerForm.newScope}
                  onChange={handleAnswerChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
                >
                  <option value="">Mantener alcance actual</option>
                  {SCOPE_OPTIONS.filter((s) => s.value !== "ALL").map(
                    (opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Respuesta del tutor */}
              {answerForm.action !== "REJECT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Respuesta del tutor
                  </label>
                  <textarea
                    name="answerBody"
                    value={answerForm.answerBody}
                    onChange={handleAnswerChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-32 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
                    placeholder="Escribe aquí tu respuesta para el estudiante."
                  />
                </div>
              )}

              {/* Acción */}
              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Acción
                </p>
                <div className="space-y-1">
                  {ANSWER_ACTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="radio"
                        name="action"
                        value={opt.value}
                        checked={answerForm.action === opt.value}
                        onChange={handleAnswerChange}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Motivo de rechazo */}
              {answerForm.action === "REJECT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Motivo de rechazo
                  </label>
                  <textarea
                    name="rejectReason"
                    value={answerForm.rejectReason}
                    onChange={handleAnswerChange}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
                    placeholder="Describe brevemente por qué rechazas esta pregunta."
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDetail}
                  disabled={savingAnswer}
                  className="px-4 py-2 border border-slate-300 rounded-full text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingAnswer}
                  className="px-6 py-2 rounded-full bg-uvGreen text-white font-medium hover:bg-green-600 disabled:opacity-60 transition"
                >
                  {savingAnswer ? "Guardando..." : "Guardar y aplicar acción"}
                </button>
              </div>
            </form>
          )}
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

function InfoBox({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}
