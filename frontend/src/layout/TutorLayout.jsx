import WorkspaceLayout from './WorkspaceLayout';
const items = [
  { to: '/tutor', label: 'Dashboard', end: true },
  { to: '/tutor/pending', label: 'Preguntas pendientes' },
  { to: '/tutor/history', label: 'Historial de respuestas' }
];
export default function TutorLayout() {
  return <WorkspaceLayout title="Panel de tutor" items={items} profilePath="/tutor/profile" />;
}
