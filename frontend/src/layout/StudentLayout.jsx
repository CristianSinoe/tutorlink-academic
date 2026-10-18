import WorkspaceLayout from './WorkspaceLayout';
const items = [
  { to: '/student', label: 'Dashboard', end: true },
  { to: '/student/courses', label: 'Mis materias' },
  { to: '/student/ask', label: 'Hacer pregunta' },
  { to: '/student/questions', label: 'Mis preguntas' }
];
export default function StudentLayout() {
  return <WorkspaceLayout title="Panel de estudiante" items={items} profilePath="/student/info" />;
}
