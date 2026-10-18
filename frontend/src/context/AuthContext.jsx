import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import PropTypes from 'prop-types';
import apiClient, { waitForMutations } from '../api/axiosClient';
import { AuthContext } from './auth-context';
import { SESSION_VERSION, sessionHome, clearSession, getSession, replaceSession, subscribeSession, updateSession, validateOptions, validateSession } from './sessionStore';

const control = { sessionControl: true };
function platformOptions(data) {
  if (!Array.isArray(data) || data.some(i => !Number.isSafeInteger(i.id) || i.id <= 0 || typeof i.name !== 'string'
      || !['ACTIVE', 'INACTIVE'].includes(i.status))) throw new Error('No se pudieron confirmar las instituciones de plataforma.');
  return data.filter(i => i.status === 'ACTIVE').map(i => ({ institutionId: i.id, name: i.name, roles: ['SUPER_ADMIN'] }));
}
export default function AuthProvider({ children }) {
  const auth = useSyncExternalStore(subscribeSession, getSession);
  const [providerId] = useState(() => Symbol('auth-provider'));
  // A remounted provider must verify persisted context before its descendants can redirect or fetch.
  const visibleAuth = useMemo(() => auth.providerId === providerId ? auth : { ...auth, loading: true }, [auth, providerId]);
  const switchInstitution = useCallback(async (institutionId, { revalidate = false } = {}) => {
    const start = getSession();
    const choices = start.roles.includes('SUPER_ADMIN') || start.roles.includes('PLATFORM_SUPER_ADMIN')
      ? [...start.platformOptions, ...start.options] : start.options;
    const option = choices.find(i => i.institutionId === institutionId)
      || (revalidate && institutionId === start.institutionId && start.roles.includes('SUPER_ADMIN')
        ? { institutionId, name: start.institutionName } : null);
    if (start.switching || !option) throw new Error('Selecciona una institución autorizada.');
    updateSession({ switching: true, contextError: '' });
    try {
      await waitForMutations();
      if (getSession().generation !== start.generation) throw new Error('La sesión cambió.');
      const { data } = await apiClient.post('/api/auth/context', { institutionId }, control);
      const session = validateSession(data, start.selectedRole);
      if (getSession().generation !== start.generation) throw new Error('La sesión cambió.');
      if (session.institutionId !== institutionId || session.email !== start.email) throw new Error('Contexto recibido inválido.');
      replaceSession(session, { institutionName: option.name, switching: false, redirectTo: !revalidate || session.selectedRole !== start.selectedRole ? sessionHome(session) : null });
      return session;
    } catch (error) {
      if (getSession().generation === start.generation) updateSession({ switching: false, contextError: 'No se pudo cambiar de institución. Tu contexto anterior se conserva.' });
      throw error;
    }
  }, []);
  const refreshOptions = useCallback(async () => {
    const start = getSession();
    if (!start.token) return [];
    updateSession({ optionsLoading: true });
    try {
    if (start.roles.includes('PLATFORM_SUPER_ADMIN')) {
      const { data } = await apiClient.get('/api/platform/institutions', control);
      const options = platformOptions(data);
      if (getSession().generation === start.generation) updateSession({ platformOptions: options, platformInstitutions: data.map(i => ({ id: i.id, name: i.name, status: i.status })), optionsLoading: false });
      return options;
    }
    const { data } = await apiClient.get('/api/auth/institutions', control);
    let options;
    try { options = validateOptions(data); }
    catch (error) { if (getSession().generation === start.generation) updateSession({ error: 'No pudimos confirmar las opciones de acceso. Reintenta para continuar.' }); throw error; }
    if (getSession().generation === start.generation) {
      const current = options.find(i => i.institutionId === start.institutionId);
      updateSession({ options, optionsLoading: false, institutionName: current?.name || start.institutionName });
      const currentRoles = [...(current?.roles || []), ...(start.roles.includes('SUPER_ADMIN') ? ['SUPER_ADMIN'] : [])];
      if (!currentRoles.length) { clearSession('Tu membresía ya no está vigente. Inicia sesión para seleccionar otra institución autorizada.'); return []; }
      if ([...currentRoles].sort().join(',') !== [...start.roles].sort().join(',')) {
        try { await switchInstitution(start.institutionId, { revalidate: true }); }
        catch (error) {
          if (getSession().generation === start.generation) updateSession({ error: 'Tus roles cambiaron y no pudimos confirmar el nuevo contexto. Reintenta antes de continuar.' });
          throw error;
        }
      }
    }
    return options;
    } catch (error) {
      if (getSession().generation === start.generation && [401, 403].includes(error.response?.status)) clearSession('Tu sesión o contexto ya no es válido. Vuelve a iniciar sesión.');
      throw error;
    } finally { if (getSession().generation === start.generation) updateSession({ optionsLoading: false }); }
  }, [switchInstitution]);
  const restore = useCallback(async () => {
    const start = getSession();
    if (!start.token) { updateSession({ loading: false }); return; }
    updateSession({ loading: true, error: '' });
    try {
      const options = await refreshOptions();
      if (getSession().generation !== start.generation) return;
      if (!start.roles.includes('PLATFORM_SUPER_ADMIN')) {
        const current = options.find(i => i.institutionId === start.institutionId);
        if (!current && !start.roles.includes('SUPER_ADMIN')) { clearSession('Tu contexto ya no está disponible. Inicia sesión para elegir una institución autorizada.'); return; }
        const { data } = await apiClient.post('/api/auth/context', { institutionId: start.institutionId }, control);
        if (getSession().generation !== start.generation) return;
        const session = validateSession(data, start.selectedRole);
        if (session.institutionId !== start.institutionId || session.email !== start.email) throw new Error('Contexto recibido inválido.');
        replaceSession(session, { institutionName: current?.name || start.institutionName, redirectTo: session.selectedRole !== start.selectedRole ? sessionHome(session) : null });
      } else updateSession({ loading: false });
    } catch (error) {
      if (getSession().generation !== start.generation) return;
      if ([401, 403].includes(error.response?.status)) clearSession('Tu sesión o contexto ya no es válido. Vuelve a iniciar sesión.');
      else updateSession({ loading: false, error: 'No pudimos verificar tu contexto. Reintenta antes de continuar.' });
    }
  }, [refreshOptions]);
  useEffect(() => {
    let stored;
    try { stored = JSON.parse(localStorage.getItem('auth')); } catch { /* invalid storage */ }
    if (!stored) { clearSession(); updateSession({ providerId }); return; }
    try {
      if (stored.version !== SESSION_VERSION) throw new Error('Sesión anterior');
      const session = validateSession(stored, stored.selectedRole);
      replaceSession(session, { institutionName: '', options: [], platformOptions: [], platformInstitutions: [], switching: false });
    } catch { clearSession('Inicia sesión nuevamente para utilizar el contexto institucional.'); updateSession({ providerId }); return; }
    void restore();
    updateSession({ providerId });
  }, [restore, providerId]);
  const login = useCallback((data, options = []) => {
    const session = validateSession(data);
    const verified = validateOptions(options);
    const institutionName = verified.find(i => i.institutionId === session.institutionId)?.name || '';
    replaceSession(session, { options: verified, platformOptions: [], platformInstitutions: [], institutionName, switching: false });
    return session;
  }, []);
  const logout = useCallback((destination = '/login') => clearSession('', typeof destination === 'string' ? destination : '/login'), []);
  const selectRole = useCallback((role, { redirect = true } = {}) => {
    const current = getSession();
    if (!current.roles.includes(role) || current.switching || current.loading || current.error) throw new Error('Espacio de trabajo no autorizado.');
    const session = validateSession(current, role);
    replaceSession(session, { redirectTo: redirect ? sessionHome(session) : null });
  }, []);
  const value = useMemo(() => ({ auth: visibleAuth, login, logout, refreshOptions, selectRole, switchInstitution, retryRestore: restore }),
    [visibleAuth, login, logout, refreshOptions, selectRole, switchInstitution, restore]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
AuthProvider.propTypes = { children: PropTypes.node };
