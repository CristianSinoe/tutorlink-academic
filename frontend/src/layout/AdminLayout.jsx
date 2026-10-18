import WorkspaceLayout from './WorkspaceLayout';
const items = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/students', label: 'Estudiantes' },
  { to: '/admin/teachers', label: 'Docentes' },
  { to: '/admin/tutors', label: 'Tutores' },
  { to: '/admin/assignments', label: 'Asignaciones' },
  { to: '/admin/periods', label: 'Periodos académicos' },
  { to: '/admin/courses', label: 'Cursos y materias' },
  { to: '/admin/groups', label: 'Grupos' },
  { to: '/admin/users', label: 'Usuarios' },
  { to: '/admin/invitations', label: 'Invitaciones' }
];
export default function AdminLayout() {
  return <WorkspaceLayout title="Panel administrativo" items={items} profilePath="/admin/profile" />;
}
