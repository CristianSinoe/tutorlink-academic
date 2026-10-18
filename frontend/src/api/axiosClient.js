import axios from 'axios';
import { resolveApiBaseUrl } from './resolveApiBaseUrl';
import { getSession } from '../context/sessionStore';

const apiClient = axios.create({ baseURL: resolveApiBaseUrl(), timeout: 20000, headers: { 'Content-Type': 'application/json' } });
const mutations = new Set();
const waiters = new Set();
const publicRoutes = new Set(['/api/auth/login', '/api/auth/login/verify-otp', '/api/auth/login/resend-otp', '/api/auth/first-login/complete']);
export const waitForMutations = () => mutations.size === 0 ? Promise.resolve() : new Promise(resolve => waiters.add(resolve));
function settle(config) {
  if (config?._mutation) mutations.delete(config._mutation);
  if (!mutations.size) { waiters.forEach(resolve => resolve()); waiters.clear(); }
}
function stale(config) { return config?._generation !== undefined && config._generation !== getSession().generation; }
apiClient.interceptors.request.use(config => {
  const session = getSession();
  const isPublic = config.anonymous || publicRoutes.has(config.url);
  const mutation = !['get', 'head', 'options'].includes(config.method || 'get');
  config._generation = session.generation;
  if (!isPublic) {
    if (mutation && session.switching && !config.sessionControl) throw new axios.CanceledError('Espera a que termine el cambio de institución.');
    if (session.token) config.headers.Authorization = `Bearer ${session.token}`;
    if (mutation && !config.sessionControl) { config._mutation = Symbol(); mutations.add(config._mutation); }
  }
  return config;
});
apiClient.interceptors.response.use(response => {
  settle(response.config);
  if (stale(response.config)) throw new axios.CanceledError('Respuesta de un contexto anterior descartada.');
  return response;
}, error => {
  settle(error.config);
  if (stale(error.config)) return Promise.reject(new axios.CanceledError('Respuesta de un contexto anterior descartada.'));
  return Promise.reject(error);
});
export default apiClient;
