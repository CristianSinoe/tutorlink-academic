// src/pages/tutor/TutorDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";

export default function TutorDashboard() {
  const [summary, setSummary] = useState({
    pendingCount: 0,
    todayAnsweredCount: 0,
    totalAnswers: 0,
  });
  const [recentQuestions, setRecentQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar resumen y preguntas recientes
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [summaryRes, recentRes] = await Promise.all([
          apiClient.get("/api/tutor/dashboard/summary"),
          apiClient.get("/api/tutor/questions/recent", {
            params: { size: 5 },
          }),
        ]);

        setSummary(summaryRes.data || {});

        const raw = recentRes.data;
        let list = [];

        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.content)) {
          list = raw.content;
        }

        setRecentQuestions(list);
      } catch (err) {
        console.error("Error cargando dashboard tutor", err);
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Error al cargar la información del dashboard de tutor.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-uvBlue tracking-tight">
            Dashboard del Tutor
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Resumen de tus preguntas asignadas y actividad reciente.
          </p>
        </div>
      </header>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {/* RESUMEN RÁPIDO */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Resumen rápido
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Preguntas pendientes"
            value={summary.pendingCount ?? 0}
            accent="bg-amber-50 text-amber-700 border-amber-200"
          />
          <SummaryCard
            label="Preguntas respondidas hoy"
            value={summary.todayAnsweredCount ?? 0}
            accent="bg-uvGreen/10 text-uvGreen border-uvGreen/30"
          />
          <SummaryCard
            label="Total de respuestas"
            value={summary.totalAnswers ?? 0}
            accent="bg-uvBlue/5 text-uvBlue border-uvBlue/30"
          />
        </div>
      </section>

      {/* ATAJOS */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Atajos
        </h2>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/tutor/pending"
            className="px-4 py-2 rounded-full bg-uvGreen text-white text-sm font-medium shadow hover:bg-green-600 transition"
          >
            Ver preguntas pendientes
          </Link>
          <Link
            to="/tutor/history"
            className="px-4 py-2 rounded-full border border-uvBlue text-uvBlue text-sm font-medium hover:bg-uvBlue hover:text-white transition"
          >
            Ver historial de respuestas
          </Link>
        </div>
      </section>

      {/* PREGUNTAS RECIENTES */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Preguntas recientes asignadas
          </h2>
          <Link
            to="/tutor/pending"
            className="text-xs text-uvBlue hover:underline"
          >
            Ver todas
          </Link>
        </div>

        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <p className="p-4 text-sm text-slate-500">Cargando...</p>
          ) : recentQuestions.length === 0 ? (
            <p className="p-4 text-sm text-slate-500">
              No tienes preguntas asignadas recientemente.
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
                    <th className="px-3 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentQuestions.map((q) => (
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

                      {/* ← AQUÍ SE USA formatDateTime */}
                      <td className="px-3 py-2.5">
                        {formatDateTime(q.createdAt)}
                      </td>

                      <td className="px-3 py-2.5">
                        <StatusBadge status={q.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-500 mt-1">
          * En la versión final se mostrarán datos reales de tus preguntas y
          respuestas registradas en TutorLink.
        </p>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm flex flex-col justify-between px-4 py-4 ${accent}`}
    >
      <p className="text-xs font-semibold tracking-wide text-slate-600 uppercase">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
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
    case "RESPONDIDA":
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
  }

  return (
    <span
      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
