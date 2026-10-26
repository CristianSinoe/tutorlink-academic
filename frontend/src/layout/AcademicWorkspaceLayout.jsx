import WorkspaceLayout from './WorkspaceLayout';

const items = [
  { to: '/teacher', label: 'Resumen general', group: 'Resumen', icon: 'dashboard', end: true },
  { to: '/teacher/courses', label: 'Mis materias y actividades', group: 'Docencia', icon: 'book' },
  { to: '/tutor/pending', label: 'Preguntas pendientes', group: 'Tutorías', icon: 'tutor' },
  { to: '/tutor/history', label: 'Historial de respuestas', group: 'Tutorías', icon: 'assignment' },
];
export default function AcademicWorkspaceLayout() {
  return <WorkspaceLayout title="Docencia y tutorías" items={items} profilePath="/tutor/profile" />;
}
