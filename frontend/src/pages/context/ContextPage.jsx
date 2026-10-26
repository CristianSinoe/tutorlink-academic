import { Link, useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import { useAuth } from '../../context/useAuth';
import { academicSpaces, combinedAcademic, roleLabels, sessionHome } from '../../context/sessionStore';

export default function ContextPage() {
  const { auth, selectRole } = useAuth();
  const navigate = useNavigate();
  return <div className="space-y-6"><PageHeader title={auth.selectedRole === 'DOCENTE' ? 'Espacio docente' : 'Tu contexto en TutorLink'} description="Institución activa y espacios de trabajo autorizados." /><Card>
    <p className="mt-3">Bienvenido, {auth.name}. {auth.institutionId === null ? 'Ámbito global de plataforma' : auth.institutionName || `Institución ${auth.institutionId}`}.</p>
    <p className="mt-2">La identidad de tu cuenta es global. Cada institución conserva sus perfiles y roles independientes.</p>
    <h2 className="mt-6 text-lg font-semibold">Espacios autorizados</h2>
    <div className="mt-3 flex flex-wrap gap-3">{academicSpaces(auth).map(role => (auth.selectedRole === role || (combinedAcademic(auth) && role === 'DOCENTE' && auth.selectedRole === 'TUTOR')) ? <span key={role} className="rounded-lg border border-slate-500 bg-white px-4 py-2 font-semibold" aria-current="true">{role === 'DOCENTE' && combinedAcademic(auth) ? 'Docencia y tutorías' : roleLabels[role]} (activo)</span> : <button type="button" key={role} className="tl-button-primary" disabled={auth.switching}
      onClick={() => { selectRole(role); navigate(sessionHome({ ...auth, selectedRole: role })); }}>{role === 'DOCENTE' && combinedAcademic(auth) ? 'Docencia y tutorías' : roleLabels[role]}</button>)}</div>
    {auth.selectedRole === 'DOCENTE' && <div className="mt-6 border-t pt-5"><h2 className="font-semibold">Mis materias y actividades</h2><p className="mb-4 mt-2">Estás en tu espacio docente. Consulta tus grupos asignados, sus tareas, fechas límite y materiales disponibles.</p><Link className="tl-button-primary" to="/teacher/courses">Ver mis materias</Link></div>}
    {auth.roles.includes('SUPER_ADMIN') && <p className="mt-6">El contexto institucional no concede acceso automático al contenido académico privado.</p>}
  </Card></div>;
}
