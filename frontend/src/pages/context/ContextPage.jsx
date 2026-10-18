import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { roleLabels, sessionHome } from '../../context/sessionStore';

export default function ContextPage() {
  const { auth, selectRole } = useAuth();
  const navigate = useNavigate();
  return <section className="mx-auto max-w-4xl px-4 py-8 text-slate-900">
    <h1 className="text-2xl font-semibold text-uvBlue">Tu contexto en TutorLink</h1>
    <p className="mt-3">Bienvenido, {auth.name}. {auth.institutionId === null ? 'Ámbito global de plataforma' : auth.institutionName || `Institución ${auth.institutionId}`}.</p>
    <p className="mt-2">La identidad de tu cuenta es global. Cada institución conserva sus perfiles y roles independientes.</p>
    <h2 className="mt-6 text-lg font-semibold">Espacios autorizados</h2>
    <div className="mt-3 flex flex-wrap gap-3">{auth.roles.map(role => auth.selectedRole === role ? <span key={role} className="rounded-lg border border-slate-500 bg-white px-4 py-2 font-semibold" aria-current="true">{roleLabels[role]} (activo)</span> : <button type="button" key={role} className="tl-button-primary" disabled={auth.switching}
      onClick={() => { selectRole(role); navigate(sessionHome({ ...auth, selectedRole: role })); }}>{roleLabels[role]}</button>)}</div>
    {auth.selectedRole === 'DOCENTE' && <p className="mt-6">Estás en tu espacio docente. Los módulos de cursos, tareas y asistencia se incorporarán en los siguientes incrementos.</p>}
    {auth.roles.includes('SUPER_ADMIN') && <p className="mt-6">El contexto institucional no concede acceso automático al contenido académico privado.</p>}
  </section>;
}
