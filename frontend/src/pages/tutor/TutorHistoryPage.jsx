// src/pages/tutor/TutorHistoryPage.jsx
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

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos los estados" },
  { value: "PUBLICADA", label: "Publicadas" },
  { value: "CORREGIDA", label: "Corregidas" },
  { value: "RECHAZADA", label: "Rechazadas" },
];

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
  const [historyLoading, setHistoryLoading] = useState(false);

  // ===== Corrección (modal) =====
  const [correctionQuestion, setCorrectionQuestion] = useState(null);
  const [correctionText, setCorrectionText] = useState("");
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
            scope:
              filters.scope && filters.scope !== "ALL"
                ? filters.scope
                : undefined,
            status:
              filters.status && filters.status !== "ALL"
                ? filters.status
                : undefined,
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

  // ============================
  // ABRIR HISTORIAL DE UNA PREGUNTA
  // ============================
  const openAnswersHistory = async (item) => {
    try {
      setHistoryLoading(true);
      setHistoryQuestion(item);

      const { data } = await apiClient.get(
        "/api/tutor/answers/history",
        {
          params: { questionId: item.id },
        }
      );

      const list = Array.isArray(data) ? data : [];
      setAnswersHistory(list);
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
      setHistoryQuestion(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeAnswersHistory = () => {
    setHistoryQuestion(null);
    setAnswersHistory([]);
  };

  // ============================
  // ABRIR MODAL DE CORRECCIÓN
  // ============================
  const openCorrection = async (item) => {
    try {
      setCorrectionLoading(true);
      setCorrectionQuestion(item);

      const { data } = await apiClient.get(
        "/api/tutor/answers/history",
        {
          params: { questionId: item.id },
        }
      );

      const list = Array.isArray(data) ? data : [];
      const last = list.length > 0 ? list[list.length - 1] : null;

      setCorrectionText(last?.body || "");
    } catch (err) {
      console.error("Error preparando corrección", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al preparar la corrección";
      alert(msg);
      setCorrectionQuestion(null);
      setCorrectionText("");
    } finally {
      setCorrectionLoading(false);
    }
  };

  const closeCorrection = () => {
    if (correctionLoading) return;
    setCorrectionQuestion(null);
    setCorrectionText("");
  };

  const handleCorrectionSubmit = async (e) => {
    e.preventDefault();
    if (!correctionQuestion) return;

    if (!correctionText.trim()) {
      alert("Escribe el texto de la corrección.");
      return;
    }

    try {
      setCorrectionLoading(true);

      await apiClient.post(
        `/api/tutor/questions/${correctionQuestion.id}/correct`,
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
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Buscar por pregunta
            </label>
            <input
              type="text"
              name="text"
              value={filters.text}
              onChange={handleChange}
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
            <label className="text-xs font-semibold text-slate-500 mb-1">
              Estado
            </label>
            <select
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

        {loading ? (
          <p className="px-4 pb-4 text-sm text-slate-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-slate-500">
            Aún no tienes respuestas registradas en el sistema.
          </p>
        ) : (
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

                    {/* ← FECHA FORMATEADA CON FALLBACKS */}
                    <td className="px-3 py-2.5">
                      {formatDateTime(
                        item.answeredAt || item.updatedAt || item.createdAt
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
        )}

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
          ) : answersHistory.length === 0 ? (
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
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Texto de la corrección
              </label>
              <textarea
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

function HistoryStatusBadge({ status }) {
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
    case "PUBLICADA":
      classes = "bg-emerald-100 text-emerald-800";
      label = "Publicada";
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
  }

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
