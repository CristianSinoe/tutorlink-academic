import AcademicWorkspaceLayout from './AcademicWorkspaceLayout';
import { combinedAcademic } from '../context/sessionStore';
import { useAuth } from '../context/useAuth';
import WorkspaceLayout from './WorkspaceLayout';
export default function ContextLayout() {
  const { auth } = useAuth();
  if (combinedAcademic(auth) && ['DOCENTE', 'TUTOR'].includes(auth.selectedRole)) return <AcademicWorkspaceLayout />;
  const platform = auth.selectedRole === 'PLATFORM_SUPER_ADMIN';
  const teacher = auth.selectedRole === 'DOCENTE';
  const base = platform ? '/platform' : teacher ? '/teacher' : '/context';
  const items = [{ group: 'Resumen', icon: platform ? 'groups' : 'dashboard', to: base, label: platform ? 'Instituciones' : teacher ? 'Inicio' : 'Espacios de trabajo', end: true }];
  if (teacher) items.push({ group: 'Gestión académica', icon: 'book', to: '/teacher/courses', label: 'Mis materias' });
  return <WorkspaceLayout title={platform ? 'Acceso de plataforma' : teacher ? 'Espacio docente' : 'Contexto de trabajo'}
    items={items} profilePath={`${base}/profile`} />;
}
