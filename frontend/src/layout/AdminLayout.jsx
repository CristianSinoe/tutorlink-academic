import { AdminPresentationContext } from '../context/AdminPresentationContext';
import WorkspaceLayout from './WorkspaceLayout';
const items = [
  { group: 'Resumen', icon: 'dashboard', to: '/admin', label: 'Dashboard', end: true },
  { group: 'Comunidad', icon: 'users', to: '/admin/users', label: 'Usuarios' },
  { group: 'Comunidad', icon: 'student', to: '/admin/students', label: 'Estudiantes' },
  { group: 'Comunidad', icon: 'teacher', to: '/admin/teachers', label: 'Docentes' },
  { group: 'Comunidad', icon: 'tutor', to: '/admin/tutors', label: 'Tutores' },
  { group: 'Gestión académica', icon: 'calendar', to: '/admin/periods', label: 'Periodos académicos' },
  { group: 'Gestión académica', icon: 'book', to: '/admin/courses', label: 'Cursos y materias' },
  { group: 'Gestión académica', icon: 'groups', to: '/admin/groups', label: 'Grupos' },
  { group: 'Tutorías', icon: 'assignment', to: '/admin/assignments', label: 'Asignaciones' },
  { group: 'Vinculación', icon: 'mail', to: '/admin/invitations', label: 'Invitaciones' }
];
export default function AdminLayout() {
  return <AdminPresentationContext.Provider value={true}><WorkspaceLayout appearance="admin" title="Panel administrativo" items={items} profilePath="/admin/profile" /></AdminPresentationContext.Provider>;
}
