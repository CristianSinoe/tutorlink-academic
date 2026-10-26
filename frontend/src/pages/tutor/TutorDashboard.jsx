// src/pages/tutor/TutorDashboard.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { Alert, EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";

export default function TutorDashboard({ embedded = false }) {
  const [summary, setSummary] = useState(null);
  const [recentQuestions, setRecentQuestions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      {embedded ? <h2 className="text-xl font-semibold">Tutorías académicas</h2> : <PageHeader title="Dashboard del Tutor" description="Resumen de tus preguntas asignadas y actividad reciente." />}

      {/* MENSAJE DE ERROR */}
      {error && <Alert tone="error">{error}</Alert>}

      {/* RESUMEN RÁPIDO */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Resumen rápido
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Preguntas pendientes"
            value={loading ? "…" : summary?.pendingCount ?? "—"}
            accent="bg-amber-50 text-amber-700 border-amber-200"
          />
          <SummaryCard
            label="Preguntas respondidas hoy"
            value={loading ? "…" : summary?.todayAnsweredCount ?? "—"}
            accent="bg-uvGreen/10 text-uvGreen border-uvGreen/30"
          />
          <SummaryCard
            label="Total de respuestas"
            value={loading ? "…" : summary?.totalAnswers ?? "—"}
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
            className="tl-button-positive"
          >
            Ver preguntas pendientes
          </Link>
          <Link
            to="/tutor/history"
            className="tl-button-secondary"
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

        <Card className="overflow-hidden p-0">
          {renderRecentQuestions({ loading, recentQuestions, error, retry: load })}
        </Card>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div
      className={`tl-card flex flex-col justify-between ${accent}`}
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

SummaryCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
  accent: PropTypes.string,
};

function StatusBadge({ status }) {
  if (!status) {
    return (
      <Badge>—</Badge>
    );
  }

  let label = status;

  switch (status) {
    case "PENDIENTE":
      label = "Pendiente";
      break;
    case "RESPONDIDA":
    case "PUBLICADA":
      label = "Respondida";
      break;
    case "CORREGIDA":
      label = "Corregida";
      break;
    case "RECHAZADA":
      label = "Rechazada";
      break;
    default:
  }

  return (
    <Badge tone={status === "PENDIENTE" ? "warning" : ["RESPONDIDA", "PUBLICADA"].includes(status) ? "success" : status === "CORREGIDA" ? "info" : status === "RECHAZADA" ? "error" : "neutral"}>{label}</Badge>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

function renderRecentQuestions({ loading, recentQuestions, error, retry }) {
  if (loading) {
    return <LoadingState label="Cargando preguntas recientes…" />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={retry} />;
  }

  if (!recentQuestions?.length) {
    return <EmptyState title="No tienes preguntas asignadas recientemente." />;
  }

  return (
    <Table label="Preguntas recientes asignadas">
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
            <tr key={q.id} className="border-t border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2.5 max-w-xs truncate" title={q.title}>
                {q.title}
              </td>
              <td className="px-3 py-2.5">
                {q.studentName || q.studentEmail || "—"}
              </td>
              <td className="px-3 py-2.5">{q.scope || "—"}</td>
              <td className="px-3 py-2.5">{formatDateTime(q.createdAt)}</td>
              <td className="px-3 py-2.5">
                <StatusBadge status={q.status} />
              </td>
            </tr>
          ))}
        </tbody>
    </Table>
  );
}

TutorDashboard.propTypes = { embedded: PropTypes.bool };
