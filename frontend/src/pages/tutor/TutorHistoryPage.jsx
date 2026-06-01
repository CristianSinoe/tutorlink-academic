// src/pages/tutor/TutorHistoryPage.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
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

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PUBLICADA", label: "Publicadas" },
  { value: "CORREGIDA", label: "Corregidas" },
  { value: "RECHAZADA", label: "Rechazadas" },
];

const HISTORY_STATUS = {
  PUBLICADA: {
    classes: "bg-emerald-100 text-emerald-800",
    label: "Publicada",
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

function getFilterParam(value) {
  return value && value !== "ALL" ? value : undefined;
}

function getHistorySummary(count) {
  if (count === 0) {
    return "Sin versiones registradas todavía";
  }
  return `${count} ${count > 1 ? "versiones" : "versión"} registradas`;
}

function getHistoryButtonLabel(isOpen) {
  return isOpen ? "Ocultar historial" : "Ver historial";
}

export default function TutorHistoryPage() {
  const [filters, setFilters] = useState({
    text: "",
    scope: "ALL",
    status: "ALL",
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ===== Historial de respuestas (modal) =====
  const [answersHistory, setAnswersHistory] = useState([]);
  const [historyQuestion, setHistoryQuestion] = useState(null);
  const [historyConversation, setHistoryConversation] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyReplyText, setHistoryReplyText] = useState("");
  const [historyReplyLoading, setHistoryReplyLoading] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  // ===== Corrección (modal) =====
  const [correctionQuestion, setCorrectionQuestion] = useState(null);
  const [correctionMessageId, setCorrectionMessageId] = useState(null);
  const [correctionConversation, setCorrectionConversation] = useState(null);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionOriginalBody, setCorrectionOriginalBody] = useState("");
  const [correctionLoading, setCorrectionLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data } = await apiClient.get(
        "/api/tutor/questions/history",
        {
          params: {
            q: filters.text?.trim() || undefined,
            scope: getFilterParam(filters.scope),
            status: getFilterParam(filters.status),
          },
        }
      );

      const list = Array.isArray(data) ? data : data.content || [];
      setItems(list);
    } catch (err) {
      console.error("Error cargando historial de respuestas", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar el historial de respuestas.";
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadQuestionThreadData = async (questionId) => {
    const [answersResponse, conversationResponse] = await Promise.all([
      apiClient.get("/api/tutor/answers/history", {
        params: { questionId },
      }),
      apiClient.get(`/api/questions/${questionId}/messages`),
    ]);

    return {
      answers: Array.isArray(answersResponse.data) ? answersResponse.data : [],
      conversation: conversationResponse.data,
    };
  };

  // ============================
  // ABRIR HISTORIAL DE UNA PREGUNTA
  // ============================
  const openAnswersHistory = async (item) => {
    try {
      setHistoryLoading(true);
      setHistoryQuestion(item);
      setHistoryReplyText("");
      setHistoryPanelOpen(false);

      const data = await loadQuestionThreadData(item.id);
      setAnswersHistory(data.answers);
      setHistoryConversation(data.conversation);
    } catch (err) {
      console.error(
        "Error cargando historial de respuestas de la pregunta",
        err
      );
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar el historial de respuestas";
      alert(msg);
      setAnswersHistory([]);
      setHistoryConversation(null);
      setHistoryQuestion(null);
      setHistoryReplyText("");
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeAnswersHistory = () => {
    setHistoryQuestion(null);
    setAnswersHistory([]);
    setHistoryConversation(null);
    setHistoryReplyText("");
    setHistoryReplyLoading(false);
    setHistoryPanelOpen(false);
  };

  // ============================
  // ABRIR MODAL DE CORRECCIÓN
  // ============================
  const openCorrection = async (item, initialText = null, targetMessageId = null) => {
    try {
      setCorrectionLoading(true);
      setCorrectionQuestion(item);

      const [answersResponse, conversationResponse] = await Promise.all([
        apiClient.get("/api/tutor/answers/history", {
          params: { questionId: item.id },
        }),
        apiClient.get(`/api/questions/${item.id}/messages`),
      ]);

      const list = Array.isArray(answersResponse.data) ? answersResponse.data : [];
      const last = list.length > 0 ? list.at(-1) : null;
      const baseText = initialText ?? last?.body ?? "";
      const resolvedTargetMessage =
        conversationResponse.data?.messages?.find(
          (message) => message.id === targetMessageId,
        ) ??
        conversationResponse.data?.messages
          ?.filter((message) => message.authorRole === "TUTOR" && message.canCorrect)
          ?.at(-1) ?? null;

      setCorrectionConversation(conversationResponse.data);
      setCorrectionMessageId(resolvedTargetMessage?.id ?? null);
      setCorrectionOriginalBody(baseText);
      setCorrectionText(baseText);
    } catch (err) {
      console.error("Error preparando corrección", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al preparar la corrección";
      alert(msg);
      setCorrectionQuestion(null);
      setCorrectionMessageId(null);
      setCorrectionConversation(null);
      setCorrectionOriginalBody("");
      setCorrectionText("");
    } finally {
      setCorrectionLoading(false);
    }
  };

  const closeCorrection = () => {
    if (correctionLoading) return;
    setCorrectionQuestion(null);
    setCorrectionMessageId(null);
    setCorrectionConversation(null);
    setCorrectionOriginalBody("");
    setCorrectionText("");
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionQuestion) return;

    if (!correctionText.trim()) {
      alert("Escribe el texto de la corrección.");
      return;
    }

    if (correctionText.trim() === correctionOriginalBody.trim()) {
      closeCorrection();
      return;
    }

    try {
      setCorrectionLoading(true);

      if (!correctionMessageId) {
        throw new Error("No se encontró el mensaje a corregir.");
      }

      await apiClient.post(
        `/api/questions/messages/${correctionMessageId}/corrections`,
        {
          body: correctionText.trim(),
        }
      );

      alert("Corrección registrada correctamente.");
      closeCorrection();
      loadHistory();
    } catch (err) {
      console.error("Error guardando corrección", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al guardar la corrección";
      alert(msg);
    } finally {
      setCorrectionLoading(false);
    }
  };

  const handleHistoryReplySubmit = async (e) => {
    e.preventDefault();
    if (!historyQuestion) return;

    if (!historyReplyText.trim()) {
      alert("Escribe el mensaje de respuesta.");
      return;
    }

    try {
      setHistoryReplyLoading(true);
      await apiClient.post(`/api/questions/${historyQuestion.id}/messages`, {
        body: historyReplyText.trim(),
      });

      const refreshed = await loadQuestionThreadData(historyQuestion.id);
      setAnswersHistory(refreshed.answers);
      setHistoryConversation(refreshed.conversation);
      setHistoryReplyText("");
      setHistoryPanelOpen(true);
      loadHistory();
    } catch (err) {
      console.error("Error respondiendo desde historial", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "No se pudo guardar la respuesta.";
      alert(msg);
    } finally {
      setHistoryReplyLoading(false);
    }
  };

  const renderHistoryItems = () => {
    if (loading) {
      return <p className="px-4 pb-4 text-sm text-slate-500">Cargando...</p>;
    }

    if (items.length === 0) {
      return (
        <p className="px-4 pb-4 text-sm text-slate-500">
          Aún no tienes respuestas registradas en el sistema.
        </p>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-slate-100/70 text-slate-700">
            <tr>
              <th className="px-3 py-2.5">Pregunta</th>
              <th className="px-3 py-2.5">Estado</th>
              <th className="px-3 py-2.5">Fecha respuesta</th>
              <th className="px-3 py-2.5">Alcance</th>
              <th className="px-3 py-2.5">Estudiante</th>
              <th className="px-3 py-2.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td
                  className="px-3 py-2.5 max-w-xs truncate"
                  title={item.title}
                >
                  {item.title}
                </td>

                <td className="px-3 py-2.5">
                  <HistoryStatusBadge status={item.status} />
                </td>

                <td className="px-3 py-2.5">
                  {formatDateTime(
                    item.answeredAt || item.updatedAt || item.createdAt,
                  )}
                </td>

                <td className="px-3 py-2.5">
                  {item.scope || "—"}
                </td>

                <td className="px-3 py-2.5">
                  {item.studentName || item.studentEmail || "—"}
                </td>

                <td className="px-3 py-2.5 space-x-2">
                  <button
                    className="px-3 py-1 rounded-full border border-slate-300 text-slate-700 text-xs hover:bg-slate-100 transition"
                    onClick={() => openAnswersHistory(item)}
                  >
                    Ver historial
                  </button>

                  <button
                    className="px-3 py-1 rounded-full border border-uvBlue text-uvBlue text-xs hover:bg-uvBlue hover:text-white transition"
                    onClick={() => openCorrection(item)}
                  >
                    Corregir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-uvBlue tracking-tight">
            Historial de respuestas
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Revisa lo que has respondido y cómo se han clasificado tus
            respuestas.
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
            <label
              htmlFor="tutor-history-search"
              className="text-xs font-semibold text-slate-500 mb-1"
            >
              Buscar por pregunta
            </label>
            <input
              id="tutor-history-search"
              type="text"
              name="text"
              value={filters.text}
              onChange={handleChange}
              placeholder="Texto de la pregunta"
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="tutor-history-scope"
              className="text-xs font-semibold text-slate-500 mb-1"
            >
              Alcance
            </label>
            <select
              id="tutor-history-scope"
              name="scope"
              value={filters.scope}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            >
              {SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label
              htmlFor="tutor-history-status"
              className="text-xs font-semibold text-slate-500 mb-1"
            >
              Estado
            </label>
            <select
              id="tutor-history-status"
              name="status"
              value={filters.status}
              onChange={handleChange}
              className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvBlue outline-none"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="mt-2 inline-flex px-4 py-2 rounded-full bg-uvBlue text-white text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? "Cargando..." : "Aplicar filtros"}
        </button>
      </section>

      {/* LISTADO */}
      <section className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        <h2 className="px-4 pt-4 pb-3 text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Listado
        </h2>

        {renderHistoryItems()}

        <p className="px-4 pb-4 text-xs text-slate-500">
          * Esta vista te ayuda a revisar tu actividad, por ejemplo para
          informes o seguimiento de casos.
        </p>
      </section>

      {/* MODAL HISTORIAL DE RESPUESTAS */}
      {historyQuestion && (
        <Modal onClose={closeAnswersHistory}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Historial de respuestas
          </h2>

          <p className="text-sm text-slate-700 mb-2">
            <span className="font-semibold">Pregunta:</span>{" "}
            {historyQuestion.title}
          </p>

          {historyLoading ? (
            <p className="text-sm text-slate-500">Cargando historial...</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  Hilo de conversación
                </h3>
                {historyConversation?.messages?.length ? (
                  <ConversationThread
                    messages={historyConversation.messages}
                    onCorrectMessage={(message) =>
                      openCorrection(historyQuestion, message.body, message.id)
                    }
                  />
                ) : (
                  <p className="text-sm text-slate-500">
                    No hay mensajes registrados para esta pregunta.
                  </p>
                  )}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setHistoryPanelOpen((prev) => !prev)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Retroalimentación e historial
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {getHistorySummary(answersHistory.length)}
                    </p>
                  </div>
                  <span className="text-slate-500 text-lg">
                    {historyPanelOpen ? "−" : "+"}
                  </span>
                </button>

                {historyPanelOpen && (
                  <div className="mt-3">
                    {answersHistory.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No hay respuestas registradas para esta pregunta.
                      </p>
                    ) : (
                      <ul className="space-y-3 text-sm">
                        {answersHistory.map((a, idx) => {
                          const isLast = idx === answersHistory.length - 1;
                          return (
                            <li
                              key={a.id ?? idx}
                              className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">
                                  Versión {a.version ?? idx + 1}
                                </span>

                                <span className="text-xs text-slate-500">
                                  {formatDateTime(a.createdAt)}
                                </span>
                              </div>

                              {isLast && (
                                <span className="inline-flex mb-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                                  Versión actual
                                </span>
                              )}

                              <p className="whitespace-pre-line mt-1 text-slate-800">
                                {a.body || "—"}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <form onSubmit={handleHistoryReplySubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="tutor-history-reply"
                    className="block text-sm font-semibold text-slate-900 mb-2"
                  >
                    Respuesta de vuelta
                  </label>
                  <textarea
                    id="tutor-history-reply"
                    value={historyReplyText}
                    onChange={(e) => setHistoryReplyText(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-28 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
                    placeholder="Escribe aquí tu respuesta de seguimiento para el estudiante."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Este mensaje se agregará al hilo de conversación sin borrar
                    los mensajes anteriores. Si quieres corregir una respuesta,
                    usa el botón `Corregir` en el mensaje correspondiente.
                  </p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={historyReplyLoading || !historyReplyText.trim()}
                    className="px-5 py-2 rounded-full bg-uvGreen text-white font-medium hover:bg-green-600 disabled:opacity-60 transition"
                  >
                    {historyReplyLoading
                      ? "Guardando..."
                      : "Enviar respuesta"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL CORRECCIÓN */}
      {correctionQuestion && (
        <Modal onClose={closeCorrection}>
          <h2 className="text-xl font-semibold text-uvBlue mb-4">
            Corregir respuesta
          </h2>

          <p className="text-sm text-slate-700 mb-2">
            <span className="font-semibold">Pregunta:</span>{" "}
            {correctionQuestion.title}
          </p>

          <form
            onSubmit={handleCorrectionSubmit}
            className="space-y-4 text-sm"
          >
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">
                Hilo de conversación
              </h3>
              {correctionConversation?.messages?.length ? (
                <ConversationThread messages={correctionConversation.messages} />
              ) : (
                <p className="text-sm text-slate-500">
                  No hay mensajes registrados para esta pregunta.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="tutor-history-correction"
                className="block text-xs font-semibold text-slate-500 mb-1"
              >
                Texto de la corrección
              </label>
              <textarea
                id="tutor-history-correction"
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-32 resize-vertical focus:ring-2 focus:ring-uvBlue outline-none"
                placeholder="Escribe aquí la versión corregida de tu respuesta."
              />
              <p className="mt-1 text-xs text-slate-500">
                Se generará una nueva versión de la respuesta, manteniendo el
                historial anterior.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeCorrection}
                disabled={correctionLoading}
                className="px-4 py-2 border border-slate-300 rounded-full text-slate-700 hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={correctionLoading}
                className="px-6 py-2 rounded-full bg-uvGreen text-white font-medium hover:bg-green-600 disabled:opacity-60 transition"
              >
                {correctionLoading ? "Guardando..." : "Guardar corrección"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
};

/* ============================
   COMPONENTES AUXILIARES
============================= */

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
                    {getHistoryButtonLabel(openHistories[messageKey])}
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

function HistoryStatusBadge({ status }) {
  if (!status) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
        —
      </span>
    );
  }

  const { classes, label } = HISTORY_STATUS[status] ?? {
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

HistoryStatusBadge.propTypes = {
  status: PropTypes.string,
};
