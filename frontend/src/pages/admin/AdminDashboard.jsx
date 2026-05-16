import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../api/axiosClient";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalStudents: 0,
    totalTutors: 0,
    totalAssignments: 0,
  });
  const [latestAssignments, setLatestAssignments] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // Para mostrar el nombre del admin desde localStorage
  let adminName = "Administrador";
  try {
    const saved = localStorage.getItem("auth");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.name) adminName = parsed.name;
      else if (parsed?.email) adminName = parsed.email;
    }
  } catch {
    // ignore
  }

  // ============================
  // CARGAR RESUMEN DEL BACKEND
  // ============================
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setLoadError(null);

      const [usersRes, studentsRes, tutorsRes, assignmentsRes] =
        await Promise.all([
          apiClient.get("/api/admin/users"),
          apiClient.get("/api/admin/users/students"),
          apiClient.get("/api/admin/users/tutors"),
          apiClient.get("/api/admin/users/tutor-students"),
        ]);

      const users = usersRes.data || [];
      const students = studentsRes.data || [];
      const tutors = tutorsRes.data || [];
      const assignments = assignmentsRes.data || [];

      const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
      const blockedUsers = users.filter((u) => u.status === "BLOCKED").length;

      // Últimas 5 asignaciones (si backend no viene ordenado, las dejamos como vengan)
      const latest = assignments.slice(0, 5);

      setStats({
        totalUsers: users.length,
        activeUsers,
        blockedUsers,
        totalStudents: students.length,
        totalTutors: tutors.length,
        totalAssignments: assignments.length,
      });

      setLatestAssignments(latest);
    } catch (err) {
      console.error("Error cargando datos del dashboard", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Error al cargar el resumen del panel de administración.";
      setLoadError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-uvBlue tracking-tight">
            Panel de administración
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bienvenido,{" "}
            <span className="font-semibold text-slate-800">
              {adminName}
            </span>
            . Aquí puedes ver un resumen general de TutorLink.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="
            self-start px-4 py-2 rounded-full 
            bg-uvBlue hover:bg-blue-700 
            text-white text-sm font-semibold 
            shadow-sm disabled:opacity-60 
            transition
          "
        >
          {loading ? "Actualizando..." : "Actualizar datos"}
        </button>
      </div>

      {/* ERROR GENERAL */}
      {loadError && (
        <div
          className="
            bg-red-50 border border-red-200 text-red-800 
            rounded-xl px-4 py-3 text-sm
          "
          role="alert"
        >
          {loadError}
        </div>
      )}

      {/* CARDS DE RESUMEN */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          title="Usuarios totales"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} activos`}
          tone="primary"
        />
        <SummaryCard
          title="Estudiantes"
          value={stats.totalStudents}
          subtitle="Registrados en la plataforma"
          tone="neutral"
        />
        <SummaryCard
          title="Tutores"
          value={stats.totalTutors}
          subtitle="Con perfil académico"
          tone="neutral"
        />
        <SummaryCard
          title="Asignaciones"
          value={stats.totalAssignments}
          subtitle="Relaciones tutor–estudiante"
          tone="accent"
        />
      </section>

      {/* ALERTA RÁPIDA DE BLOQUEADOS */}
      {stats.blockedUsers > 0 && (
        <section className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm">
          <p className="font-semibold">
            Usuarios bloqueados: {stats.blockedUsers}
          </p>
          <p className="mt-1">
            Revisa el módulo de{" "}
            <Link
              to="/admin/users"
              className="underline font-medium hover:text-red-900"
            >
              Gestión de usuarios
            </Link>{" "}
            para revisar estos casos.
          </p>
        </section>
      )}

      {/* ACCESOS RÁPIDOS */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          Accesos rápidos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <QuickLinkCard
            to="/admin/students"
            title="Gestión de estudiantes"
            description="Crear, importar y consultar estudiantes."
          />
          <QuickLinkCard
            to="/admin/tutors"
            title="Gestión de tutores"
            description="Registrar tutores y actualizar su información."
          />
          <QuickLinkCard
            to="/admin/assignments"
            title="Asignaciones tutor–estudiante"
            description="Asignar y gestionar tutorías para cada alumno."
          />
          <QuickLinkCard
            to="/admin/users"
            title="Estados de usuarios"
            description="Activar, bloquear o deshabilitar cuentas."
          />
        </div>
      </section>

      {/* ÚLTIMAS ASIGNACIONES */}
      <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Últimas asignaciones tutor–estudiante
            </h2>
            <p className="text-xs text-slate-500">
              Se muestran hasta 5 asignaciones recientes.
            </p>
          </div>
          <Link
            to="/admin/assignments"
            className="text-sm text-uvBlue hover:underline font-medium"
          >
            Ver todas
          </Link>
        </div>

        {loading && latestAssignments.length === 0 ? (
          <p className="text-sm text-slate-600">Cargando datos...</p>
        ) : latestAssignments.length === 0 ? (
          <p className="text-sm text-slate-600">
            Aún no hay asignaciones registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Código tutor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Nombre tutor
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Estudiante
                  </th>
                </tr>
              </thead>
              <tbody>
                {latestAssignments.map((a) => {
                  const tutorName =
                    a.tutorName ||
                    `${a.tutorFirstName || ""} ${
                      a.tutorLastName || ""
                    }`.trim();
                  const studentName =
                    a.studentName ||
                    `${a.studentFirstName || ""} ${
                      a.studentLastName || ""
                    }`.trim();

                  return (
                    <tr
                      key={a.id}
                      className="border-t border-slate-200 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-2 text-slate-800">
                        {a.tutorCode}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {tutorName || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {studentName || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ============================
   COMPONENTES AUXILIARES
============================= */

function SummaryCard({ title, value, subtitle, tone = "neutral" }) {
  let accentClasses =
    "bg-white border border-slate-200 text-slate-800"; // neutral base
  let valueClasses = "text-3xl font-bold text-uvBlue mt-2";

  if (tone === "primary") {
    accentClasses =
      "bg-uvBlue/5 border border-uvBlue/15 text-slate-900";
  } else if (tone === "accent") {
    accentClasses =
      "bg-uvGreen/5 border border-uvGreen/20 text-slate-900";
    valueClasses = "text-3xl font-bold text-uvGreen mt-2";
  }

  return (
    <div
      className={`${accentClasses} rounded-2xl p-4 flex flex-col justify-between`}
    >
      <div>
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-[0.08em]">
          {title}
        </p>
        <p className={valueClasses}>{value}</p>
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 whitespace-pre-line">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function QuickLinkCard({ to, title, description }) {
  return (
    <Link
      to={to}
      className="
        group border border-slate-200 rounded-xl p-4 
        hover:border-uvBlue hover:shadow-md 
        transition flex flex-col justify-between 
        min-h-[120px] bg-white
      "
    >
      <div>
        <h3 className="text-sm font-semibold text-slate-800 group-hover:text-uvBlue mb-1">
          {title}
        </h3>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
      <div className="mt-3 text-xs text-uvBlue font-medium group-hover:underline">
        Ir al módulo →
      </div>
    </Link>
  );
}
