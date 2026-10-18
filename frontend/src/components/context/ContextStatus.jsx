import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';

// Refresh independently of the profile controls so permissions remain current in every workspace.
export default function ContextStatus() {
  const { auth, refreshOptions } = useAuth();
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { await refreshOptions(); setError(''); }
    catch (failure) { if (failure.code !== 'ERR_CANCELED') setError('No pudimos actualizar las instituciones disponibles.'); }
  }, [refreshOptions]);
  useEffect(() => {
    let active = true;
    refreshOptions().then(() => { if (active) setError(''); }).catch(failure => {
      if (active && failure.code !== 'ERR_CANCELED') setError('No pudimos actualizar las instituciones disponibles.');
    });
    return () => { active = false; };
  }, [refreshOptions, auth.token, auth.generation]);
  return <>
    {auth.optionsLoading && <p role="status" className="mt-2 text-sm">Actualizando las instituciones autorizadas…</p>}
    {auth.switching && <p role="status" className="mt-2 text-sm">Actualizando tu contexto. Las nuevas escrituras están bloqueadas…</p>}
    {error && <div role="alert" className="mt-2"><p>{error}</p><button type="button" className="tl-button-secondary" onClick={load}>Reintentar instituciones</button></div>}
  </>;
}
