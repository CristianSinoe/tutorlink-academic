const listeners = new Set();
const validRoles = new Set(['ADMIN', 'DOCENTE', 'TUTOR', 'ESTUDIANTE', 'SUPER_ADMIN', 'PLATFORM_SUPER_ADMIN']);
export const combinedAcademic = session => session.roles?.includes('DOCENTE') && session.roles?.includes('TUTOR');
export const academicSpaces = session => combinedAcademic(session) ? session.roles.filter(role => role !== 'TUTOR') : session.roles;
export const SESSION_VERSION = 2;
export const emptySession = () => ({ token: null, role: null, roles: [], institutionId: null, email: null, name: null, selectedRole: null });
let snapshot = { ...emptySession(), loading: true, switching: false, options: [], platformOptions: [], platformInstitutions: [], optionsLoading: false, institutionName: '', error: '', notice: '', logoutDestination: null, redirectTo: null, generation: 0 };
export function validateSession(data, preferredRole = null) {
  if (!data || typeof data.token !== 'string' || !data.token.trim() || typeof data.email !== 'string' || !data.email
      || typeof data.name !== 'string' || typeof data.role !== 'string' || !Array.isArray(data.roles) || !data.roles.length
      || data.roles.some(role => !validRoles.has(role)) || new Set(data.roles).size !== data.roles.length) {
    throw new Error('No se pudo confirmar la sesión. Inicia sesión nuevamente.');
  }
  const institutionId = data.institutionId ?? null;
  if ((institutionId === null && (data.roles.length !== 1 || data.roles[0] !== 'PLATFORM_SUPER_ADMIN'))
      || (institutionId !== null && (!Number.isSafeInteger(institutionId) || institutionId <= 0 || data.roles.includes('PLATFORM_SUPER_ADMIN')))) {
    throw new Error('El contexto recibido no es válido.');
  }
  return { token: data.token, role: data.role, roles: [...data.roles], institutionId, email: data.email, name: data.name,
    selectedRole: data.roles.includes(preferredRole) ? preferredRole : data.roles.length === 1 ? data.roles[0] : data.roles.length === 2 && combinedAcademic(data) ? 'DOCENTE' : null };
}
export function validateOptions(data) {
  if (!Array.isArray(data) || data.some(o => !Number.isSafeInteger(o.institutionId) || o.institutionId <= 0
      || typeof o.name !== 'string' || !o.name || !Array.isArray(o.roles) || o.roles.some(r => !validRoles.has(r)))
      || new Set(data.map(o => o.institutionId)).size !== data.length) throw new Error('No se pudieron confirmar las instituciones disponibles.');
  return data.map(o => ({ institutionId: o.institutionId, name: o.name, roles: [...o.roles] }));
}
export const getSession = () => snapshot;
export function subscribeSession(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function updateSession(patch) { snapshot = { ...snapshot, ...patch }; listeners.forEach(l => l()); }
export function replaceSession(session, extra = {}) {
  // Persist before publishing: a storage failure must not half-switch the context.
  localStorage.setItem('auth', JSON.stringify({ version: SESSION_VERSION, ...session }));
  updateSession({ ...session, ...(!session.roles.some(r => ['SUPER_ADMIN', 'PLATFORM_SUPER_ADMIN'].includes(r)) ? { platformOptions: [], platformInstitutions: [] } : {}), redirectTo: null, ...extra, generation: snapshot.generation + 1, loading: false, error: '', notice: '', logoutDestination: null });
}
export function clearSession(notice = '', logoutDestination = null) {
  localStorage.removeItem('auth');
  updateSession({ ...emptySession(), loading: false, switching: false, options: [], platformOptions: [], platformInstitutions: [], optionsLoading: false, institutionName: '', error: '', notice, logoutDestination, redirectTo: null,
    generation: snapshot.generation + 1 });
}
export const roleLabels = { ADMIN: 'ADMIN institucional', DOCENTE: 'DOCENTE', TUTOR: 'TUTOR académico', ESTUDIANTE: 'ESTUDIANTE',
  SUPER_ADMIN: 'SUPER_ADMIN institucional', PLATFORM_SUPER_ADMIN: 'SUPER_ADMIN de plataforma' };
export function sessionHome(session) {
  if (combinedAcademic(session) && ['DOCENTE', 'TUTOR'].includes(session.selectedRole)) return '/teacher';
  return ({ ADMIN: '/admin', DOCENTE: '/teacher', TUTOR: '/tutor', ESTUDIANTE: '/student', SUPER_ADMIN: '/context', PLATFORM_SUPER_ADMIN: '/platform' })[session.selectedRole] || '/context';
}
export function authorizedNext(path, session) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return null;
  const pathname = path.split(/[?#]/)[0];
  const segments = pathname.split('/');
  if (segments.some(s => s === '.' || s === '..') || /%2f|%5c|%2e/i.test(pathname)) return null;
  const role = ({ admin: 'ADMIN', teacher: 'DOCENTE', tutor: 'TUTOR', student: 'ESTUDIANTE', platform: 'PLATFORM_SUPER_ADMIN' })[segments[1]];
  return ['/context', '/accept-institution-invitation'].includes(pathname) || (role && session.roles.includes(role)) ? path : null;
}
