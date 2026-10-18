import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/useAuth';
import { sessionHome } from '../../context/sessionStore';
import ConfirmDialog from './ConfirmDialog';

export default function InstitutionSwitch({ target }) {
  const { auth, switchInstitution } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [error, setError] = useState('');
  const cancel = useCallback(() => setPending(null), []);
  const options = [...(auth.platformOptions || []), ...(auth.options || [])].filter((o, i, all) => all.findIndex(v => v.institutionId === o.institutionId) === i);
  const confirm = async () => {
    const id = pending;
    setPending(null); setError('');
    try { const session = await switchInstitution(id); navigate(sessionHome(session), { replace: true }); }
    catch { setError('No se pudo cambiar de institución. Tu contexto anterior se conserva. Puedes reintentar.'); }
  };
  return <>
    <div data-context-background className={target ? "" : "w-full min-w-0 sm:w-auto sm:max-w-full"}>
      {target ? <button type="button" className="tl-button-primary" disabled={auth.switching} onClick={() => setPending(target.institutionId)}>Entrar a {target.name}</button>
        : options.length > 0 && <div>
          <label htmlFor="active-institution" className="block text-sm font-semibold">Institución</label>
          <select id="active-institution" className="tl-input max-w-full" value={auth.institutionId || ''} disabled={auth.switching}
            onChange={event => { const id = Number(event.target.value); if (id && id !== auth.institutionId) setPending(id); }}>
            <option value="" disabled>Selecciona una institución</option>
            {!options.some(o => o.institutionId === auth.institutionId) && auth.institutionId && <option value={auth.institutionId}>{auth.institutionName || `Institución ${auth.institutionId}`}</option>}
            {options.map(o => <option key={o.institutionId} value={o.institutionId}>{o.name}</option>)}
          </select>
        </div>}
      {error && <p role="alert" className="tl-error mt-2">{error}</p>}
    </div>
    {pending && <ConfirmDialog title="Cambiar de institución" onCancel={cancel} onConfirm={confirm}>
      Cambiarás a {options.find(o => o.institutionId === pending)?.name || target?.name}. Los formularios no guardados se descartarán. Esperaremos a que terminen las operaciones en curso.
    </ConfirmDialog>}
  </>;
}
InstitutionSwitch.propTypes = { target: PropTypes.shape({ institutionId: PropTypes.number.isRequired, name: PropTypes.string.isRequired }) };
