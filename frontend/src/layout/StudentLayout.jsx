import WorkspaceLayout from './WorkspaceLayout';
const items = [
  { to: '/student', group: 'Resumen', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/student/courses', group: 'Gestión académica', icon: 'book', label: 'Mis materias' },
  { to: '/student/ask', group: 'Tutorías', icon: 'tutor', label: 'Hacer pregunta' },
  { to: '/student/questions', group: 'Tutorías', icon: 'assignment', label: 'Mis preguntas' }
];
export default function StudentLayout() {
  return <WorkspaceLayout title="Panel de estudiante" items={items} profilePath="/student/info" />;
}
