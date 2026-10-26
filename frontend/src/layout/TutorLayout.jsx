import { useAuth } from '../context/useAuth';
import AcademicWorkspaceLayout from './AcademicWorkspaceLayout';
import { combinedAcademic } from '../context/sessionStore';
import WorkspaceLayout from './WorkspaceLayout';
const items = [
  { to: '/tutor', group: 'Resumen', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/tutor/pending', group: 'Tutorías', icon: 'tutor', label: 'Preguntas pendientes' },
  { to: '/tutor/history', group: 'Tutorías', icon: 'assignment', label: 'Historial de respuestas' }
];
export default function TutorLayout() {
  const { auth } = useAuth();
  if (combinedAcademic(auth)) return <AcademicWorkspaceLayout />;
  return <WorkspaceLayout title="Panel de tutor" items={items} profilePath="/tutor/profile" />;
}
