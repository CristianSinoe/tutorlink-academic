import { useAuth } from '../context/useAuth';
import WorkspaceLayout from './WorkspaceLayout';
export default function ContextLayout() {
  const { auth } = useAuth();
  const platform = auth.selectedRole === 'PLATFORM_SUPER_ADMIN';
  const teacher = auth.selectedRole === 'DOCENTE';
  const base = platform ? '/platform' : teacher ? '/teacher' : '/context';
  const items = [{ to: base, label: platform ? 'Instituciones' : teacher ? 'Inicio' : 'Espacios de trabajo', end: true }];
  if (teacher) items.push({ to: '/teacher/courses', label: 'Mis materias' });
  return <WorkspaceLayout title={platform ? 'Acceso de plataforma' : teacher ? 'Espacio docente' : 'Contexto de trabajo'}
    items={items} profilePath={`${base}/profile`} />;
}
