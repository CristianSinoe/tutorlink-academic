import apiClient from '../../api/axiosClient';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { academicSpaces, combinedAcademic, roleLabels, sessionHome, validateOptions } from '../../context/sessionStore';
import InstitutionSwitch from './InstitutionSwitch';
import ConfirmDialog from './ConfirmDialog';

export default function ProfileContextSection() {
  const { auth, refreshOptions, selectRole, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [action, setAction] = useState(null);
  const [membershipState, setMembershipState] = useState({ options: [], loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  const platform = auth.roles.includes('PLATFORM_SUPER_ADMIN');
  useEffect(() => {
    if (!platform) return;
    let active = true;
    apiClient.get('/api/auth/institutions').then(({ data }) => {
      const options = validateOptions(data);
      if (active) setMembershipState({ options, loading: false, error: '' });
    }).catch(failure => {
      if (active && failure.code !== 'ERR_CANCELED') setMembershipState({ options: [], loading: false, error: 'No pudimos consultar tus membresías. Actualiza las instituciones para reintentar.' });
    });
    return () => { active = false; };
  }, [platform, auth.generation, revision]);
  const memberships = platform ? membershipState.options : auth.options || [];
  const cancel = useCallback(() => setAction(null), []);
  const load = useCallback(async () => {
    setError('');
    setRevision(value => value + 1);
    try { await refreshOptions(); } catch (error) { if (error.code !== 'ERR_CANCELED') setError('No pudimos actualizar las instituciones disponibles.'); }
  }, [refreshOptions]);
  const confirm = () => {
    if (action === 'platform') { logout('/login?access=platform'); navigate('/login?access=platform'); }
    else { selectRole(action); navigate(sessionHome({ ...auth, selectedRole: action })); }
    setAction(null);
  };
  return <>
    <section aria-labelledby="institution-context-title" className="min-w-0 break-words rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-sm" data-context-background>
      <h2 id="institution-context-title" className="text-lg font-semibold">Instituciones y contexto de trabajo</h2>
      <p className="my-3 text-sm">Cambiar de institución descarta los formularios sin guardar. Los roles disponibles dependen de cada institución.</p>
      <p className="mb-4"><span className="font-semibold">Institución activa: </span>{auth.institutionId ? auth.institutionName || `Institución ${auth.institutionId}` : 'Ámbito global de plataforma'}</p>
      <h3 className="font-semibold">Instituciones a las que perteneces</h3>
      {memberships.length ? <ul className="mb-4 list-disc space-y-2 pl-5">{memberships.map(option => <li key={option.institutionId}><span className="font-medium">{option.name}</span><span className="block text-sm">Roles disponibles: {option.roles.map(role => roleLabels[role]).join(', ')}</span></li>)}</ul> : <p className="mb-4 text-sm">No hay membresías institucionales disponibles en este contexto.</p>}
      {platform && membershipState.loading && <p role="status">Consultando tus membresías…</p>}
      {platform && membershipState.error && <p role="alert" className="tl-error">{membershipState.error}</p>}
      {Boolean(auth.platformOptions?.length) && <p className="mb-3 text-sm">El selector también incluye instituciones administrables desde plataforma. Ese acceso no implica membresía académica.</p>}
      <div className="flex flex-wrap items-end gap-4">
        <InstitutionSwitch />
        {combinedAcademic(auth) && <p className="text-sm">Docencia y tutorías están disponibles juntas, sin cambiar de espacio.</p>}
        {academicSpaces(auth).length > 1 && <div className="w-full min-w-0 sm:w-auto sm:max-w-full"><label htmlFor="active-role" className="block text-sm font-semibold">Espacio de trabajo</label>
          <select id="active-role" className="tl-input" value={combinedAcademic(auth) && auth.selectedRole === 'TUTOR' ? 'DOCENTE' : auth.selectedRole || ''} disabled={auth.switching || Boolean(auth.error)} onChange={e => setAction(e.target.value)}>
            <option value="" disabled>Selecciona un rol</option>{academicSpaces(auth).map(role => <option key={role} value={role}>{role === 'DOCENTE' && combinedAcademic(auth) ? 'Docencia y tutorías' : roleLabels[role]}</option>)}
          </select></div>}
        {auth.roles.includes('SUPER_ADMIN') && <button type="button" className="tl-button-secondary" disabled={auth.switching} onClick={() => setAction('platform')}>Volver a plataforma</button>}

      </div>
      <p className="mt-4 text-sm"><span className="font-semibold">Roles del contexto activo: </span>{auth.roles.map(role => roleLabels[role]).join(', ')}</p>
      <button type="button" className="tl-button-secondary mt-3" disabled={auth.switching || auth.optionsLoading} onClick={load}>Actualizar instituciones</button>
      {error && <div className="mx-auto mt-2 max-w-6xl" role="alert"><p>{error}</p><button className="tl-button-secondary" onClick={load}>Reintentar instituciones</button></div>}
      {auth.roles.includes('SUPER_ADMIN') && !auth.platformOptions?.length && <p className="mx-auto mt-2 max-w-6xl text-sm">Para recuperar el listado de plataforma, vuelve a autenticarte en el acceso de plataforma.</p>}
    </section>
    {action && <ConfirmDialog title={action === 'platform' ? 'Volver al ámbito global' : 'Cambiar de espacio'} onCancel={cancel} onConfirm={confirm}>
      {action === 'platform' ? 'Para volver a plataforma, cierra esta sesión y autentícate de nuevo con contraseña y código de verificación.' : 'Los formularios no guardados de este espacio se descartarán. Tus roles y asignaciones no cambian.'}
    </ConfirmDialog>}
  </>;
}
