// src/pages/tutor/TutorPendingPage.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
  { value: "REJECT", label: "Rechazar pregunta (fuera de alcance)" },
];

export default function TutorPendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    text: "",
    scope: "ALL",
  });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);
  const [answerForm, setAnswerForm] = useState({
    action: "PUBLISH",
    newScope: "",
    answerBody: "",
    rejectReason: "",
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await apiClient.get("/api/tutor/questions/pending/my", {
        params: {
          q: filters.text?.trim() || undefined,
          scope:
            filters.scope && filters.scope !== "ALL"
              ? filters.scope
              : undefined,
        },
      });

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

  const buildDefaultForm = (conversation) => ({
    action: "PUBLISH",
    newScope: conversation?.scope || "",
    answerBody: "",
    rejectReason: "",
  });

  const openDetail = async (questionId, syncUrl = true) => {
    try {
      setLoadingDetail(true);
      const { data } = await apiClient.get(`/api/questions/${questionId}/messages`);
      setSelectedQuestion(data);
      setAnswerForm(buildDefaultForm(data));
      setHistoryOpen(false);
      setEditingMessage(null);
      setEditingText("");
      if (syncUrl) {
        setSearchParams({ questionId: String(questionId) });
      }
      return data;
    } catch (err) {
      console.error("Error cargando detalle de pregunta", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar el detalle de la pregunta";
      alert(msg);
      setSelectedQuestion(null);
      return null;
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    const questionId = searchParams.get("questionId");
    if (questionId) {
      openDetail(questionId, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const closeDetail = () => {
    if (savingAnswer) return;
    setSelectedQuestion(null);
    setHistoryOpen(false);
    setEditingMessage(null);
    setEditingText("");
    setSearchParams({});
  };

  const handleAnswerChange = (e) => {
    const { name, value } = e.target;
    setAnswerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!selectedQuestion) return;

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
      const questionId = selectedQuestion.questionId;
      const newScope =
        answerForm.newScope && answerForm.newScope !== selectedQuestion.scope
          ? answerForm.newScope
          : null;

      if (newScope) {
        actions.push(
          apiClient.post(`/api/tutor/questions/${questionId}/reclassify`, {
            scope: newScope,
          }),
        );
      }

      if (answerForm.action === "PUBLISH") {
        actions.push(
          apiClient.post(`/api/tutor/questions/${questionId}/answer`, {
            body: answerForm.answerBody.trim(),
          }),
        );
      } else if (answerForm.action === "REJECT") {
        actions.push(
          apiClient.post(`/api/tutor/questions/${questionId}/reject`, {
            reason: answerForm.rejectReason.trim(),
          }),
        );
      }

      await Promise.all(actions);

      const refreshed = await openDetail(questionId, false);
      setAnswerForm(buildDefaultForm(refreshed));
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

  const tutorFeedbackMessages = selectedQuestion
    ? getTutorFeedbackMessages(selectedQuestion)
    : [];

  const handleOpenCorrection = (message) => {
    setEditingMessage(message);
    setEditingText(message.body || "");
  };

  const handleCloseCorrection = () => {
    if (savingCorrection) return;
    setEditingMessage(null);
    setEditingText("");
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!editingMessage || !selectedQuestion) return;

    if (!editingText.trim()) {
      alert("Escribe el texto corregido.");
      return;
    }

    try {
      setSavingCorrection(true);
      await apiClient.post(
        `/api/questions/messages/${editingMessage.id}/corrections`,
        {
          body: editingText.trim(),
        },
      );

      const refreshed = await openDetail(selectedQuestion.questionId, false);
      setAnswerForm(buildDefaultForm(refreshed));
      loadQuestions();
      handleCloseCorrection();
    } catch (err) {
      console.error("Error corrigiendo mensaje del tutor", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo corregir el mensaje.";
      alert(msg);
    } finally {
      setSavingCorrection(false);
    }
  };

  return (
    <div className="space-y-6">
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

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
                    <td className="px-3 py-2.5">{q.scope || "—"}</td>
                    <td className="px-3 py-2.5">
                      {formatDateTime(q.createdAt || q.updatedAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        className="px-3 py-1 rounded-full border border-uvBlue text-uvBlue text-xs font-medium hover:bg-uvBlue hover:text-white transition"
                        onClick={() => openDetail(q.id)}
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

      {selectedQuestion && (
        <Modal onClose={closeDetail}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Conversación de la pregunta
          </h2>

          {loadingDetail ? (
            <p className="text-sm text-slate-500">Cargando detalle...</p>
          ) : (
            <form onSubmit={handleSubmitAnswer} className="space-y-5 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  value={formatDateTime(selectedQuestion.createdAt)}
                />
                <InfoBox
                  label="Alcance actual"
                  value={selectedQuestion.scope || "—"}
                />
                <InfoBox
                  label="Estado"
                  value={<StatusBadge status={selectedQuestion.status} />}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-500 mb-1">
                  Pregunta
                </p>
                <p className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 whitespace-pre-line">
                  {selectedQuestion.title || "—"}
                </p>
              </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      Hilo de conversación
                    </p>
                {selectedQuestion.messages?.length ? (
                  <ConversationThread
                    messages={selectedQuestion.messages}
                    onCorrectMessage={handleOpenCorrection}
                  />
                ) : (
                  <div className="border border-slate-200 rounded-lg px-3 py-3 bg-slate-50">
                    <p className="text-slate-600">
                      Aún no hay mensajes en esta conversación.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Retroalimentación e historial
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {tutorFeedbackMessages.length
                        ? `${tutorFeedbackMessages.length} version${
                            tutorFeedbackMessages.length > 1 ? "es" : ""
                          } registradas`
                        : "Aún no has publicado retroalimentación para esta pregunta"}
                    </p>
                  </div>
                  <span className="text-slate-500 text-lg">
                    {historyOpen ? "−" : "+"}
                  </span>
                </button>

                {historyOpen && (
                  <div className="mt-3">
                    {tutorFeedbackMessages.length ? (
                      <ul className="space-y-3">
                        {tutorFeedbackMessages.map((message, idx) => {
                          const isLast = idx === tutorFeedbackMessages.length - 1;
                          return (
                            <li
                              key={`feedback-${message.id ?? idx}`}
                              className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <span className="font-semibold text-slate-800">
                                  Retroalimentación {idx + 1}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {formatDateTime(message.createdAt)}
                                </span>
                              </div>
                              {(message.currentAnswer || isLast) && (
                                <span className="inline-flex mb-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                  Retroalimentación actual
                                </span>
                              )}
                              <p className="whitespace-pre-line text-slate-800">
                                {message.body}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="border border-slate-200 rounded-lg px-3 py-3 bg-slate-50">
                        <p className="text-slate-600">
                          Aún no has publicado retroalimentación para esta pregunta.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {selectedQuestion.rejectReason && (
                <div className="border border-red-200 bg-red-50 rounded-lg px-3 py-3">
                  <p className="text-xs font-semibold text-red-700 mb-1">
                    Motivo de rechazo
                  </p>
                  <p className="text-sm text-red-800 whitespace-pre-line">
                    {selectedQuestion.rejectReason}
                  </p>
                </div>
              )}

              {selectedQuestion.canReply && selectedQuestion.status !== "RECHAZADA" && (
                <>
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
                        ),
                      )}
                    </select>
                  </div>

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
                        placeholder={
                          "Escribe aquí tu respuesta para el estudiante."
                        }
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Si quieres corregir una respuesta ya publicada, usa el
                        botón `Corregir` en el mensaje correspondiente dentro
                        del hilo.
                      </p>
                    </div>
                  )}

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
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeDetail}
                  disabled={savingAnswer}
                  className="px-4 py-2 border border-slate-300 rounded-full text-slate-700 hover:bg-slate-100 transition"
                >
                  Cerrar
                </button>
                {selectedQuestion.canReply && selectedQuestion.status !== "RECHAZADA" && (
                  <button
                    type="submit"
                    disabled={savingAnswer}
                    className="px-6 py-2 rounded-full bg-uvGreen text-white font-medium hover:bg-green-600 disabled:opacity-60 transition"
                  >
                    {savingAnswer ? "Guardando..." : "Aplicar acción"}
                  </button>
                )}
              </div>
            </form>
          )}
        </Modal>
      )}

      {editingMessage && (
        <Modal onClose={handleCloseCorrection}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Corregir mensaje
          </h2>

          <form onSubmit={handleSubmitCorrection} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Texto corregido
              </label>
              <textarea
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-32 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
              />
              <p className="mt-1 text-xs text-slate-500">
                Si el texto queda igual al actual, no se registrará una nueva
                corrección.
              </p>
            </div>

            {editingMessage.versions?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-900 mb-2">
                  Historial del mensaje
                </p>
                <MessageVersionList versions={editingMessage.versions} />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseCorrection}
                disabled={savingCorrection}
                className="px-4 py-2 border border-slate-300 rounded-full text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={savingCorrection}
                className="px-6 py-2 rounded-full bg-uvGreen text-white font-medium hover:bg-green-600 disabled:opacity-60 transition"
              >
                {savingCorrection ? "Guardando..." : "Guardar corrección"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full mx-4 p-6 relative max-h-[90vh] overflow-y-auto">
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
    <div className="border border-slate-200 rounded-lg px-3 py-2 bg-white">
      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
      {typeof value === "string" ? <p className="text-sm text-slate-800">{value}</p> : value}
    </div>
  );
}

function ConversationThread({ messages, onCorrectMessage = null }) {
  const [openHistories, setOpenHistories] = useState({});

  const toggleHistory = (messageKey) => {
    setOpenHistories((prev) => ({ ...prev, [messageKey]: !prev[messageKey] }));
  };

  return (
    <ul className="space-y-3">
      {messages.map((message, idx) => {
        const isTutor = message.authorRole === "TUTOR";
        const messageKey = `${message.sourceType}-${message.id ?? idx}`;
        const hasCorrections = (message.versions?.length || 0) > 1;

        return (
          <li
            key={messageKey}
            className={`flex ${isTutor ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm ${
                isTutor
                  ? "bg-uvBlue text-white border-uvBlue"
                  : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
                <span
                  className={`font-semibold ${
                    isTutor ? "text-white/90" : "text-slate-700"
                  }`}
                >
                  {message.authorName || message.authorRole}
                </span>
                <span className={isTutor ? "text-white/75" : "text-slate-500"}>
                  {formatDateTime(message.createdAt)}
                </span>
                {message.legacy && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full ${
                      isTutor
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    Histórico
                  </span>
                )}
                {message.currentAnswer && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full ${
                      isTutor
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    Respuesta actual
                  </span>
                )}
                {message.corrected && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full ${
                      isTutor
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    Corregido
                  </span>
                )}
              </div>
              <p className="whitespace-pre-line">{message.body}</p>

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {hasCorrections && (
                  <button
                    type="button"
                    onClick={() => toggleHistory(messageKey)}
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition ${
                      isTutor
                        ? "border border-white/30 text-white hover:bg-white/10"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {openHistories[messageKey]
                      ? "Ocultar historial"
                      : "Ver historial"}
                  </button>
                )}
                {message.canCorrect && onCorrectMessage && (
                  <button
                    type="button"
                    onClick={() => onCorrectMessage(message)}
                    className="inline-flex px-3 py-1 rounded-full border border-white/30 text-xs font-medium text-white hover:bg-white/10 transition"
                  >
                    Corregir
                  </button>
                )}
              </div>

              {openHistories[messageKey] && hasCorrections && (
                <div
                  className={`mt-3 rounded-xl p-3 ${
                    isTutor ? "bg-white/10" : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <MessageVersionList
                    versions={message.versions}
                    inverted={isTutor}
                  />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function MessageVersionList({ versions, inverted = false }) {
  return (
    <ul className="space-y-3">
      {versions.map((version, idx) => (
        <li key={version.id ?? idx}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <span
              className={`font-semibold text-xs ${
                inverted ? "text-white" : "text-slate-800"
              }`}
            >
              Versión {version.version ?? idx + 1}
            </span>
            <span
              className={`text-xs ${
                inverted ? "text-white/80" : "text-slate-500"
              }`}
            >
              {formatDateTime(version.createdAt)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {version.original && (
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  inverted
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                Original
              </span>
            )}
            {version.current && (
              <span
                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                  inverted
                    ? "bg-white/20 text-white"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                Actual
              </span>
            )}
          </div>
          <p className={inverted ? "text-white/95" : "text-slate-800"}>
            {version.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

function getTutorFeedbackMessages(question) {
  return (question?.messages || []).filter(
    (message) => message.authorRole === "TUTOR",
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDIENTE: "Pendiente",
    PUBLICADA: "Respondida",
    CORREGIDA: "Corregida",
    RECHAZADA: "Rechazada",
  };

  return (
    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
      {map[status] || status || "—"}
    </span>
  );
}
