// src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";

export default function StudentDashboard() {
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // Nombre para saludo (desde localStorage.auth)
  let displayName = "Estudiante";
  try {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.name) displayName = parsed.name;
      else if (parsed?.email) displayName = parsed.email;
    }
  } catch {
    // ignore
  }

  useEffect(() => {
    loadMe();
    loadQuestions();
  }, []);

  // /api/me
  const loadMe = async () => {
    try {
      setLoadingMe(true);
      const { data } = await apiClient.get("/api/me");
      setMe(data);
    } catch (err) {
      console.error("Error cargando /me", err);
    } finally {
      setLoadingMe(false);
    }
  };

  // /api/student/questions/my
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const { data } = await apiClient.get("/api/student/questions/my", {
        params: {
          page: 0,
          size: 50,
        },
      });

      const list = data && Array.isArray(data.content) ? data.content : [];
      setQuestions(list);
    } catch (err) {
      console.error("Error cargando preguntas del estudiante", err);
      setQuestions([]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Métricas rápidas
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter((q) =>
    ["PUBLICADA", "CORREGIDA"].includes(q.status)
  ).length;
  const pendingQuestions = questions.filter((q) => q.status === "PENDIENTE")
    .length;

  // Últimas respuestas (ordenamos por createdAt y tomamos las respondidas)
  const answeredList = questions.filter((q) =>
    ["PUBLICADA", "CORREGIDA"].includes(q.status)
  );
  const latestAnswered = [...answeredList]
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 3);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* HEADER */}
        <section className="space-y-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-uvBlue tracking-tight">
                Dashboard del estudiante
              </h1>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                Aquí puedes ver un resumen de tu actividad en TutorLink y el
                estado de tus preguntas académicas.
              </p>
            </div>
            <div className="flex flex-col items-start md:items-end text-xs text-slate-500">
              <p className="uppercase tracking-[0.16em] text-slate-500">
                Bienvenido(a)
              </p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-uvBlue/5 text-uvBlue border border-uvBlue/20">
                  {displayName}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* RESUMEN RÁPIDO */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.18em]">
            Resumen rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="Preguntas enviadas"
              value={loadingQuestions ? "…" : totalQuestions}
              helper="Total de preguntas que has registrado en el sistema."
            />
            <SummaryCard
              label="Preguntas respondidas"
              value={loadingQuestions ? "…" : answeredQuestions}
              helper="Preguntas que ya tienen una respuesta del tutor."
            />
            <SummaryCard
              label="Preguntas pendientes"
              value={loadingQuestions ? "…" : pendingQuestions}
              helper="Preguntas que aún están en revisión."
            />
          </div>
        </section>

        {/* ATAJOS */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.18em]">
            Atajos
          </h2>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/student/ask")}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-uvGreen text-white text-sm font-semibold shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uvGreen transition"
            >
              Hacer nueva pregunta
            </button>
            <button
              type="button"
              onClick={() => navigate("/student/questions")}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-uvBlue text-uvBlue text-sm font-semibold hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uvBlue transition"
            >
              Ver mis preguntas
            </button>
          </div>
        </section>

        {/* ÚLTIMAS RESPUESTAS */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.18em]">
            Últimas respuestas
          </h2>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-4 md:p-5">
            {loadingQuestions ? (
              <p className="text-sm text-slate-500">
                Cargando información de tus preguntas…
              </p>
            ) : latestAnswered.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no tienes preguntas respondidas. Cuando tus tutores te
                respondan, verás aquí un resumen de las más recientes.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wide">
                        Pregunta
                      </th>
                      <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wide">
                        Estado
                      </th>
                      <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wide">
                        Fecha
                      </th>
                      <th className="py-2 pr-4 font-semibold text-xs uppercase tracking-wide">
                        Alcance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestAnswered.map((q) => (
                      <tr
                        key={q.id}
                        className="border-b last:border-0 border-slate-100"
                      >
                        <td
                          className="py-2 pr-4 max-w-xs truncate"
                          title={q.title}
                        >
                          {q.title}
                        </td>

                        <td className="py-2 pr-4">
                          <StatusChip status={q.status} />
                        </td>

                        <td className="py-2 pr-4">
                          {formatDateTime(q.createdAt)}
                        </td>

                        <td className="py-2 pr-4">
                          {q.scope || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Si quieres revisar el detalle completo de cada pregunta y su
            respuesta, entra al módulo{" "}
            <button
              type="button"
              onClick={() => navigate("/student/questions")}
              className="text-uvBlue underline underline-offset-2 hover:text-uvBlue/80"
            >
              Mis preguntas
            </button>
            .
          </p>
        </section>

        {/* FOOTER INFO ESTUDIANTE */}
        {!loadingMe && me && (
          <section className="pt-3 border-t border-dashed border-slate-200 text-xs text-slate-500">
            Estudiante:{" "}
            <span className="font-semibold text-slate-700">
              {me.name} {me.lastNamePaterno} {me.lastNameMaterno}
            </span>{" "}
            — {me.career || "Programa no registrado"}, plan{" "}
            {me.plan || "N/D"}, semestre {me.semester ?? "N/D"}.
          </section>
        )}
      </div>
    </div>
  );
}

/* ========== COMPONENTES AUXILIARES ========== */

function SummaryCard({ label, value, helper }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-5 py-4 flex flex-col justify-between">
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {helper && (
        <p className="mt-2 text-[11px] text-slate-500 leading-snug">
          {helper}
        </p>
      )}
    </div>
  );
}

function StatusChip({ status }) {
  if (!status) {
    return (
      <span className="inline-flex px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
        —
      </span>
    );
  }

  let label = status;
  let classes = "bg-slate-100 text-slate-700";

  switch (status) {
    case "PUBLICADA":
      label = "Respondida";
      classes = "bg-emerald-100 text-emerald-800";
      break;
    case "CORREGIDA":
      label = "Corregida";
      classes = "bg-blue-100 text-blue-800";
      break;
    case "PENDIENTE":
      label = "Pendiente";
      classes = "bg-amber-100 text-amber-800";
      break;
    case "RECHAZADA":
      label = "Rechazada";
      classes = "bg-red-100 text-red-700";
      break;
    default:
      label = status;
  }

  return (
    <span
      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}
