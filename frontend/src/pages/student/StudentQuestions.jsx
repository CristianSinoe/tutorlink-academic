// src/pages/student/StudentQuestions.jsx
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useSearchParams } from "react-router-dom";
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

const QUESTION_STATUS = {
  PENDIENTE: {
    classes: "bg-amber-100 text-amber-800",
    label: "Pendiente",
  },
  PUBLICADA: {
    classes: "bg-emerald-100 text-emerald-800",
    label: "Respondida",
  },
  CORREGIDA: {
    classes: "bg-blue-100 text-blue-800",
    label: "Corregida",
  },
  RECHAZADA: {
    classes: "bg-red-100 text-red-700",
    label: "Rechazada",
  },
};

function getFeedbackSummary(count) {
  if (count === 0) {
    return "Aún no hay respuestas del tutor";
  }
  return `${count} ${count > 1 ? "versiones" : "versión"} registradas`;
}

function getHistoryButtonLabel(isOpen) {
  return isOpen ? "Ocultar historial" : "Ver historial";
}

export default function StudentQuestions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [scopeFilter, setScopeFilter] = useState("ALL");

  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

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
  const openDetail = async (questionId, syncUrl = true) => {
    try {
      setLoadingDetail(true);
      const { data } = await apiClient.get(`/api/questions/${questionId}/messages`);
      setSelectedQuestion(data);
      if (syncUrl) {
        setSearchParams({ questionId: String(questionId) });
      }
    } catch (err) {
      console.error("Error cargando detalle de pregunta", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar el detalle de la pregunta";
      alert(msg);
      setSelectedQuestion(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedQuestion(null);
    setMessageBody("");
    setSearchParams({});
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedQuestion || !messageBody.trim()) {
      return;
    }

    try {
      setSendingMessage(true);
      await apiClient.post(`/api/questions/${selectedQuestion.questionId}/messages`, {
        body: messageBody.trim(),
      });
      setMessageBody("");
      await Promise.all([
        loadQuestions(),
        openDetail(selectedQuestion.questionId, false),
      ]);
    } catch (err) {
      console.error("Error enviando mensaje", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo enviar el mensaje.";
      alert(msg);
    } finally {
      setSendingMessage(false);
    }
  };

  useEffect(() => {
      const questionId = searchParams.get("questionId");
      if (questionId) {
        openDetail(questionId, false);
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
              <label
                htmlFor="student-question-search"
                className="block text-xs font-semibold text-slate-500 mb-1"
              >
                Buscar
              </label>
              <input
                id="student-question-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
                placeholder="Texto de la pregunta"
              />
            </div>

            <div>
              <label
                htmlFor="student-question-status"
                className="block text-xs font-semibold text-slate-500 mb-1"
              >
                Estado
              </label>
              <select
                id="student-question-status"
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
              <label
                htmlFor="student-question-scope"
                className="block text-xs font-semibold text-slate-500 mb-1"
              >
                Alcance
              </label>
              <select
                id="student-question-scope"
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
                      data-cy="student-question-row"
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
                          onClick={() => openDetail(q.id)}
                          data-cy="student-question-detail"
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
        <Modal onClose={closeDetail}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Conversación de mi pregunta
          </h2>

          {loadingDetail ? (
            <p className="text-sm text-slate-500">Cargando detalle…</p>
          ) : (
            <QuestionDetail
              question={selectedQuestion}
              messageBody={messageBody}
              onMessageBodyChange={setMessageBody}
              onSendMessage={handleSendMessage}
              sendingMessage={sendingMessage}
              onRefreshQuestion={() => openDetail(selectedQuestion.questionId, false)}
              onRefreshQuestions={loadQuestions}
            />
          )}

          <div className="mt-5 flex justify-end">
            <button
              onClick={closeDetail}
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

  const { classes, label } = QUESTION_STATUS[status] ?? {
    classes: "bg-slate-100 text-slate-700",
    label: status,
  };

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

QuestionStatusBadge.propTypes = {
  status: PropTypes.string,
};

function QuestionDetail({
  question,
  messageBody,
  onMessageBodyChange,
  onSendMessage,
  sendingMessage,
  onRefreshQuestion,
  onRefreshQuestions,
}) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [savingCorrection, setSavingCorrection] = useState(false);
  const tutorFeedbackMessages = (question.messages || []).filter(
    (message) => message.authorRole === "TUTOR",
  );

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
    if (!editingMessage) return;

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
      await Promise.all([onRefreshQuestions(), onRefreshQuestion()]);
      handleCloseCorrection();
    } catch (err) {
      console.error("Error corrigiendo mensaje del estudiante", err);
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
    <div className="space-y-5 text-sm">
      {/* Info general */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Información general
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InfoBox label="ID" value={`#${question.questionId}`} />

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
            value={question.tutorName || question.tutorEmail || "—"}
          />
        </div>
      </div>

      {/* Datos base */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Mi pregunta
        </h3>
        <div className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
          <p className="font-medium text-slate-900 mb-1">
            {question.title}
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2">
          Hilo de conversación
        </h3>
        {question.messages?.length ? (
          <ConversationThread
            messages={question.messages}
            onCorrectMessage={handleOpenCorrection}
          />
        ) : (
          <div className="border border-slate-200 rounded-lg px-3 py-3 bg-slate-50">
            <p className="text-slate-600">
              Aún no hay mensajes registrados para esta pregunta.
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
              {getFeedbackSummary(tutorFeedbackMessages.length)}
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
                          Versión {idx + 1}
                        </span>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(message.createdAt)}
                        </span>
                      </div>

                      {(message.currentAnswer || isLast) && (
                        <span className="inline-flex mb-2 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                          Versión actual
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
              <p className="text-sm text-slate-500">
                No hay retroalimentación del tutor registrada todavía.
              </p>
            )}
          </div>
        )}
      </div>

      {question.canReply && question.status !== "RECHAZADA" && (
        <form onSubmit={onSendMessage} className="space-y-3">
          <div>
            <label
              htmlFor="student-question-message"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Agregar mensaje
            </label>
            <textarea
              id="student-question-message"
              value={messageBody}
              onChange={(e) => onMessageBodyChange(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 h-28 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
              placeholder="Escribe aquí tu mensaje para el tutor."
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sendingMessage || !messageBody.trim()}
              className="px-5 py-2 rounded-full bg-uvGreen text-white font-medium hover:bg-green-600 disabled:opacity-60 transition"
            >
              {sendingMessage ? "Enviando..." : "Enviar mensaje"}
            </button>
          </div>
        </form>
      )}

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
          * El historial conserva todos los mensajes en orden cronológico para
          mantener trazabilidad de la conversación.
        </p>
      </div>

      {editingMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 p-6 relative max-h-[88vh] overflow-y-auto">
            <button
              type="button"
              onClick={handleCloseCorrection}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>

            <h3 className="text-xl font-semibold text-uvBlue mb-4">
              Corregir mensaje
            </h3>

            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label
                  htmlFor="student-question-correction"
                  className="block text-xs font-semibold text-slate-500 mb-1"
                >
                  Texto corregido
                </label>
                <textarea
                  id="student-question-correction"
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

              <div className="flex justify-end gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}

QuestionDetail.propTypes = {
  question: PropTypes.shape({
    canReply: PropTypes.bool,
    createdAt: PropTypes.string,
    messages: PropTypes.arrayOf(PropTypes.object),
    questionId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    rejectReason: PropTypes.string,
    scope: PropTypes.string,
    status: PropTypes.string,
    title: PropTypes.string,
    tutorEmail: PropTypes.string,
    tutorName: PropTypes.string,
  }).isRequired,
  messageBody: PropTypes.string.isRequired,
  onMessageBodyChange: PropTypes.func.isRequired,
  onRefreshQuestion: PropTypes.func.isRequired,
  onRefreshQuestions: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  sendingMessage: PropTypes.bool.isRequired,
};

function ConversationThread({ messages, onCorrectMessage = null }) {
  const [openHistories, setOpenHistories] = useState({});

  const toggleHistory = (messageKey) => {
    setOpenHistories((prev) => ({ ...prev, [messageKey]: !prev[messageKey] }));
  };

  return (
    <ul className="space-y-3">
      {messages.map((message, idx) => {
        const isStudent = message.authorRole === "ESTUDIANTE";
        const messageKey = `${message.sourceType}-${message.id ?? idx}`;
        const hasCorrections = (message.versions?.length || 0) > 1;

        return (
          <li
            key={messageKey}
            className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 border shadow-sm ${
                isStudent
                  ? "bg-uvBlue text-white border-uvBlue"
                  : "bg-white text-slate-900 border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-1 text-xs">
                <span
                  className={`font-semibold ${
                    isStudent ? "text-white/90" : "text-slate-700"
                  }`}
                >
                  {message.authorName || message.authorRole}
                </span>
                <span className={isStudent ? "text-white/75" : "text-slate-500"}>
                  {formatDateTime(message.createdAt)}
                </span>
                {message.legacy && (
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full ${
                      isStudent
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
                      isStudent
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
                      isStudent
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
                      isStudent
                        ? "border border-white/30 text-white hover:bg-white/10"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {getHistoryButtonLabel(openHistories[messageKey])}
                  </button>
                )}
                {message.canCorrect && onCorrectMessage && (
                  <button
                    type="button"
                    onClick={() => onCorrectMessage(message)}
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium transition ${
                      isStudent
                        ? "border border-white/30 text-white hover:bg-white/10"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    Corregir
                  </button>
                )}
              </div>

              {openHistories[messageKey] && hasCorrections && (
                <div
                  className={`mt-3 rounded-xl p-3 ${
                    isStudent ? "bg-white/10" : "bg-slate-50 border border-slate-200"
                  }`}
                >
                  <MessageVersionList
                    versions={message.versions}
                    inverted={isStudent}
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

ConversationThread.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCorrectMessage: PropTypes.func,
};

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

MessageVersionList.propTypes = {
  inverted: PropTypes.bool,
  versions: PropTypes.arrayOf(PropTypes.object).isRequired,
};

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

InfoBox.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
};

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 p-6 relative max-h-[88vh] overflow-y-auto">
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

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};
