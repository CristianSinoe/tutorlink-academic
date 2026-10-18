import { useState, useEffect } from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import axios from 'axios';
import AuthProvider from '../AuthContext';
import { useAuth } from '../useAuth';
import { clearSession, validateSession, authorizedNext, sessionHome } from '../sessionStore';
import apiClient from '../../api/axiosClient';
import ProfileContextSection from '../../components/context/ProfileContextSection';
import ProtectedRoute from '../../router/ProtectedRoute';
import userEvent from '@testing-library/user-event';

const options = [{ institutionId: 1, name: 'Escuela A', roles: ['DOCENTE', 'TUTOR'] }, { institutionId: 2, name: 'Escuela B', roles: ['ESTUDIANTE'] }];
const response = (config, data) => ({ config, data, status: 200, headers: {}, statusText: 'OK' });
const session = (overrides = {}) => ({ token: 'jwt-A', role: 'TUTOR', roles: ['DOCENTE', 'TUTOR'], institutionId: 1, email: 'persona@example.test', name: 'Persona', ...overrides });
const reject = (config, status = 403) => Promise.reject(new axios.AxiosError('Denied', 'ERR_BAD_REQUEST', config, null, { config, status, data: {} }));
let api;
const originalAdapter = apiClient.defaults.adapter;
function Probe() {
  const context = useAuth();
  useEffect(() => { api = context; }, [context]);
  return <p data-testid="session">{context.auth.loading ? 'loading' : `${context.auth.institutionId}|${context.auth.roles.join(',')}|${context.auth.selectedRole || ''}`}</p>;
}
function mount({ stored = session(), bar = false, children } = {}) {
  if (stored) localStorage.setItem('auth', JSON.stringify({ version: 2, ...stored, selectedRole: stored.roles?.[0] }));
  return render(<MemoryRouter><AuthProvider><Probe />{bar && <ProfileContextSection />}{children}</AuthProvider></MemoryRouter>);
}
function defaults(config) {
  if (config.url === '/api/auth/institutions') return Promise.resolve(response(config, options));
  if (config.url === '/api/platform/institutions') return Promise.resolve(response(config, [{ id: 1, name: 'Escuela A', status: 'ACTIVE' }, { id: 2, name: 'Inactiva', status: 'INACTIVE' }]));
  if (config.url === '/api/auth/context') {
    const id = JSON.parse(config.data).institutionId;
    return Promise.resolve(response(config, session({ institutionId: id, token: `jwt-${id}`, roles: options.find(o => o.institutionId === id)?.roles || ['SUPER_ADMIN'] })));
  }
  return Promise.resolve(response(config, []));
}
beforeEach(() => { clearSession(); apiClient.defaults.adapter = vi.fn(defaults); });
afterEach(() => { apiClient.defaults.adapter = originalAdapter; });

it('restaura y revalida roles desde el contrato, manteniendo el rol visual autorizado', async () => {
  mount({ stored: session({ roles: ['DOCENTE', 'TUTOR', 'ADMIN'] }) });
  await waitFor(() => expect(api.auth.loading).toBe(false));
  expect(api.auth.roles).toEqual(['DOCENTE', 'TUTOR']);
  expect(api.auth.selectedRole).toBe('DOCENTE');
  expect(JSON.parse(localStorage.getItem('auth'))).toMatchObject({ version: 2, institutionId: 1, roles: ['DOCENTE', 'TUTOR'] });
});
it('rechaza registros heredados sin asumir permisos a partir del rol', async () => {
  mount({ stored: { token: 'old', role: 'ADMIN' } });
  await waitFor(() => expect(api.auth.loading).toBe(false));
  expect(api.auth.token).toBeNull();
  expect(localStorage.getItem('auth')).toBeNull();
  expect(apiClient.defaults.adapter).not.toHaveBeenCalled();
});
it('una membresía revocada en el contexto exige reautenticación', async () => {
  apiClient.defaults.adapter = vi.fn(config => reject(config));
  mount();
  await waitFor(() => expect(api.auth.token).toBeNull());
  expect(api.auth.notice).toMatch(/sesión o contexto/);
});
it('no confunde un fallo de red al restaurar con cuenta sin instituciones', async () => {
  apiClient.defaults.adapter = vi.fn(() => Promise.reject(new Error('network')));
  mount();
  await waitFor(() => expect(api.auth.error).toMatch(/verificar/));
  expect(api.auth.token).toBe('jwt-A');
});
it('cambia institución, reemplaza roles y persistencia coherentemente', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  await act(() => api.switchInstitution(2));
  expect(api.auth).toMatchObject({ institutionId: 2, roles: ['ESTUDIANTE'], selectedRole: 'ESTUDIANTE', institutionName: 'Escuela B', switching: false });
  expect(JSON.parse(localStorage.getItem('auth'))).toMatchObject({ institutionId: 2, token: 'jwt-2', roles: ['ESTUDIANTE'] });
});
it('fallo del cambio conserva exactamente la sesión anterior', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  const stored = localStorage.getItem('auth');
  apiClient.defaults.adapter = vi.fn(config => reject(config));
  await act(async () => { await expect(api.switchInstitution(2)).rejects.toBeDefined(); });
  expect(api.auth.institutionId).toBe(1); expect(api.auth.switching).toBe(false);
  expect(localStorage.getItem('auth')).toBe(stored);
});
it('rechaza IDs arbitrarios y respuestas con institución o identidad incorrectas', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  await expect(api.switchInstitution(999)).rejects.toThrow(/autorizada/);
  apiClient.defaults.adapter = config => Promise.resolve(response(config, session({ institutionId: 2, email: 'otra@example.test' })));
  await act(async () => { await expect(api.switchInstitution(2)).rejects.toThrow(/inválido/); });
  expect(api.auth.institutionId).toBe(1);
});
it('espera escrituras iniciadas y bloquea nuevas durante la transición', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  let complete, contextCalls = 0;
  apiClient.defaults.adapter = vi.fn(config => {
    if (config.url === '/write') return new Promise(resolve => { complete = () => resolve(response(config, {})); });
    if (config.url === '/api/auth/context') contextCalls++;
    return defaults(config);
  });
  const writing = apiClient.post('/write', {});
  await waitFor(() => expect(complete).toBeTypeOf('function'));
  let switching;
  act(() => { switching = api.switchInstitution(2); });
  await expect(apiClient.post('/new-write', {})).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  expect(contextCalls).toBe(0);
  await act(async () => { complete(); await writing; await switching; });
  expect(contextCalls).toBe(1); expect(api.auth.institutionId).toBe(2);
});
it('descarta respuestas tardías y remonta datos locales del contexto anterior', async () => {
  let reads = 0, deliver;
  function Resource() {
    const [value, setValue] = useState('vacío');
    return <div><span data-testid="resource">{value}</span><button onClick={() => { apiClient.get('/resource').then(r => setValue(r.data)).catch(() => {}); }}>Leer recurso</button></div>;
  }
  mount({ children: <ProtectedRoute><Resource /></ProtectedRoute> });
  await waitFor(() => expect(api.auth.loading).toBe(false));
  apiClient.defaults.adapter = config => {
    if (config.url === '/resource') { reads++; return new Promise(resolve => { deliver = () => resolve(response(config, 'Datos de A')); }); }
    return defaults(config);
  };
  await userEvent.click(screen.getByText('Leer recurso'));
  await waitFor(() => expect(reads).toBe(1));
  await act(() => api.switchInstitution(2));
  await act(async () => { deliver(); await Promise.resolve(); });
  expect(screen.getByTestId('resource')).toHaveTextContent('vacío');
});
it('un 403 de recurso no borra una sesión contextual válida', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  apiClient.defaults.adapter = config => reject(config);
  await expect(apiClient.get('/foreign-resource')).rejects.toMatchObject({ response: { status: 403 } });
  expect(api.auth.institutionId).toBe(1);
});
it('permite alternar DOCENTE/TUTOR sin emitir JWT ni conceder ADMIN', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  const token = api.auth.token;
  act(() => api.selectRole('TUTOR'));
  expect(api.auth.selectedRole).toBe('TUTOR'); expect(api.auth.token).toBe(token);
  expect(() => api.selectRole('ADMIN')).toThrow(/autorizado/);
});
it('SUPER_ADMIN global consulta plataforma y conserva catálogo al entrar a una escuela', async () => {
  mount({ stored: session({ institutionId: null, roles: ['PLATFORM_SUPER_ADMIN'] }) });
  await waitFor(() => expect(api.auth.loading).toBe(false));
  expect(api.auth.platformOptions).toHaveLength(1);
  apiClient.defaults.adapter = config => Promise.resolve(response(config, session({ roles: ['SUPER_ADMIN'] })));
  await act(() => api.switchInstitution(1));
  expect(api.auth.platformOptions[0].name).toBe('Escuela A');
  expect(api.auth.selectedRole).toBe('SUPER_ADMIN');
});
it('SUPER_ADMIN institucional restaurado no recupera plataforma con JWT institucional', async () => {
  apiClient.defaults.adapter = vi.fn(config => config.url === '/api/auth/context' ? Promise.resolve(response(config, session({ roles: ['SUPER_ADMIN'] }))) : defaults(config));
  mount({ stored: session({ roles: ['SUPER_ADMIN'] }) });
  await waitFor(() => expect(api.auth.loading).toBe(false));
  expect(api.auth.platformOptions).toEqual([]);
  expect(apiClient.defaults.adapter.mock.calls.some(([config]) => config.url === '/api/platform/institutions')).toBe(false);
});
it('confirmación institucional permite cancelar y restaura foco; teclado no sale del diálogo', async () => {
  mount({ bar: true }); await waitFor(() => expect(api.auth.loading).toBe(false));
  const user = userEvent.setup();
  const select = await screen.findByLabelText('Institución');
  select.focus(); await user.selectOptions(select, '2');
  expect(screen.getByRole('dialog')).toHaveTextContent(/formularios no guardados/);
  expect(screen.getByRole('button', { name: 'Cancelar' })).toHaveFocus();
  await user.tab({ shift: true }); expect(screen.getByRole('button', { name: 'Continuar' })).toHaveFocus();
  await user.keyboard('{Escape}'); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(select).toHaveFocus(); expect(api.auth.institutionId).toBe(1);
});
it('no persiste un cambio si localStorage falla', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => { throw new Error('storage full'); });
  await act(async () => { await expect(api.switchInstitution(2)).rejects.toThrow(/storage/); });
  expect(api.auth.institutionId).toBe(1); expect(api.auth.switching).toBe(false);
});
it('valida rutas de retorno internas y roles globales/contextuales sin fallback legado', () => {
  const s = validateSession(session());
  expect(sessionHome(s)).toBe('/context');
  expect(authorizedNext('/tutor/history?tab=my', s)).toBe('/tutor/history?tab=my');
  for (const path of ['https://evil.test', '//evil.test', '/admin', '/tutor/../admin', '/tutor/%2e%2e/admin', '/platform']) expect(authorizedNext(path, s)).toBeNull();
  expect(() => validateSession(session({ roles: [] }))).toThrow();
  expect(() => validateSession(session({ roles: ['PLATFORM_SUPER_ADMIN'] }))).toThrow();
  expect(() => validateSession(session({ institutionId: null }))).toThrow();
});
it('logout no permite que una respuesta pública tardía reponga otra sesión', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  let deliver;
  apiClient.defaults.adapter = config => new Promise(resolve => { deliver = () => resolve(response(config, session())); });
  const login = apiClient.post('/api/auth/login', {}).catch(error => error);
  await waitFor(() => expect(deliver).toBeTypeOf('function'));
  act(() => api.logout('/login?access=platform'));
  deliver();
  expect(await login).toMatchObject({ code: 'ERR_CANCELED' });
  expect(api.auth.logoutDestination).toBe('/login?access=platform'); expect(api.auth.token).toBeNull();
});
it('una consulta posterior de opciones elimina un rol revocado mediante nuevo JWT contextual', async () => {
  mount(); await waitFor(() => expect(api.auth.loading).toBe(false));
  const token = api.auth.token;
  apiClient.defaults.adapter = config => Promise.resolve(response(config, config.url === '/api/auth/institutions'
    ? [{ ...options[0], roles: ['DOCENTE'] }, options[1]] : session({ token: 'refreshed', roles: ['DOCENTE'] })));
  await act(() => api.refreshOptions());
  expect(api.auth.roles).toEqual(['DOCENTE']); expect(api.auth.token).not.toBe(token);
  expect(() => api.selectRole('TUTOR')).toThrow(/autorizado/);
});
