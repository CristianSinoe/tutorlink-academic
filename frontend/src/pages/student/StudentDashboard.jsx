// src/pages/student/StudentDashboard.jsx
import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import apiClient from "../../api/axiosClient";
import { formatDateTime } from "../../utils/dateUtils";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { Alert, EmptyState, ErrorState, LoadingState } from "../../components/ui/States";
import Badge from "../../components/ui/Badge";
import Table from "../../components/ui/Table";

const STATUS_CHIP = {
  PUBLICADA: {
    label: "Respondida",
    classes: "bg-emerald-100 text-emerald-800",
  },
  CORREGIDA: {
    label: "Corregida",
    classes: "bg-blue-100 text-blue-800",
  },
  PENDIENTE: {
    label: "Pendiente",
    classes: "bg-amber-100 text-amber-800",
  },
  RECHAZADA: {
    label: "Rechazada",
    classes: "bg-red-100 text-red-700",
  },
};

export default function StudentDashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [me, setMe] = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  const [questions, setQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questionsError, setQuestionsError] = useState(null);
  const [meError, setMeError] = useState(null);

  const displayName = auth.name || auth.email || "Estudiante";

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
      setMeError("No pudimos cargar tus datos de perfil.");
    } finally {
      setLoadingMe(false);
    }
  };

  // /api/student/questions/my
  const loadQuestions = async () => {
    try {
      setLoadingQuestions(true);
      setQuestionsError(null);
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
      setQuestionsError("No pudimos cargar tus preguntas. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  // Métricas rápidas
  const questionList = questions || [];
  const totalQuestions = questionList.length;
  const answeredQuestions = questionList.filter((q) =>
    ["PUBLICADA", "CORREGIDA"].includes(q.status)
  ).length;
  const pendingQuestions = questionList.filter((q) => q.status === "PENDIENTE")
    .length;

  // Últimas respuestas (ordenamos por createdAt y tomamos las respondidas)
  const answeredList = questionList.filter((q) =>
    ["PUBLICADA", "CORREGIDA"].includes(q.status)
  );
  const latestAnswered = [...answeredList]
    .sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 3);

  return (
    <div className="min-w-0">
      <div className="space-y-6">
        <PageHeader title="Dashboard del estudiante" description="Aquí puedes ver un resumen de tu actividad en TutorLink y el estado de tus preguntas académicas.">
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
        </PageHeader>

        {/* RESUMEN RÁPIDO */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.18em]">
            Resumen rápido
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              label="Preguntas enviadas"
              value={loadingQuestions ? "…" : questionsError ? "—" : totalQuestions}
              helper="Total de preguntas que has registrado en el sistema."
            />
            <SummaryCard
              label="Preguntas respondidas"
              value={loadingQuestions ? "…" : questionsError ? "—" : answeredQuestions}
              helper="Preguntas que ya tienen una respuesta del tutor."
            />
            <SummaryCard
              label="Preguntas pendientes"
              value={loadingQuestions ? "…" : questionsError ? "—" : pendingQuestions}
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
            <Button
              type="button"
              onClick={() => navigate("/student/ask")}
              variant="positive"
            >
              Hacer nueva pregunta
            </Button>
            <Button
              type="button"
              onClick={() => navigate("/student/questions")}
              variant="secondary"
            >
              Ver mis preguntas
            </Button>
          </div>
        </section>

        {/* ÚLTIMAS RESPUESTAS */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-[0.18em]">
            Últimas respuestas
          </h2>

          <Card>{renderLatestAnswers({ loadingQuestions, latestAnswered, questionsError, retry: loadQuestions })}</Card>

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
            {" "}
            .
          </p>
        </section>

        {/* FOOTER INFO ESTUDIANTE */}
        {!loadingMe && meError && <Alert tone="warning">{meError}</Alert>}
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
    <div className="tl-card flex flex-col justify-between">
      <p className="text-[0.6875rem] font-semibold text-slate-500 uppercase tracking-[0.16em]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      {helper && (
        <p className="mt-2 text-[0.6875rem] text-slate-500 leading-snug">
          {helper}
        </p>
      )}
    </div>
  );
}

SummaryCard.propTypes = {
  label: PropTypes.string,
  value: PropTypes.node,
  helper: PropTypes.string,
};

function StatusChip({ status }) {
  if (!status) {
    return (
      <Badge>—</Badge>
    );
  }

  const { label } = STATUS_CHIP[status] ?? {
    label: status,
  };

  return (
    <Badge tone={status === "PUBLICADA" ? "success" : status === "CORREGIDA" ? "info" : status === "PENDIENTE" ? "warning" : status === "RECHAZADA" ? "error" : "neutral"}>{label}</Badge>
  );
}

StatusChip.propTypes = {
  status: PropTypes.string,
};

function renderLatestAnswers({ loadingQuestions, latestAnswered, questionsError, retry }) {
  if (loadingQuestions) {
    return <LoadingState label="Cargando información de tus preguntas…" />;
  }

  if (questionsError) {
    return <ErrorState message={questionsError} onRetry={retry} />;
  }

  if (latestAnswered.length === 0) {
    return <EmptyState title="Aún no tienes preguntas respondidas." description="Cuando tus tutores te respondan, verás aquí un resumen de las más recientes." />;
  }

  return (
    <Table label="Últimas respuestas">
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
            <tr key={q.id} className="border-b last:border-0 border-slate-100">
              <td className="py-2 pr-4 max-w-xs truncate" title={q.title}>
                {q.title}
              </td>
              <td className="py-2 pr-4">
                <StatusChip status={q.status} />
              </td>
              <td className="py-2 pr-4">{formatDateTime(q.createdAt)}</td>
              <td className="py-2 pr-4">{q.scope || "—"}</td>
            </tr>
          ))}
        </tbody>
    </Table>
  );
}
