import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import AuthProvider from '../AuthContext';
import { clearSession } from '../sessionStore';
import apiClient from '../../api/axiosClient';
const actor = { token: 'A', role: 'TUTOR', email: 'persona@example.test', name: 'Persona', institutionId: 1, roles: ['DOCENTE', 'TUTOR'], selectedRole: 'DOCENTE', version: 2 };
const schools = [{ institutionId: 1, name: 'Escuela A', roles: ['DOCENTE', 'TUTOR'] }, { institutionId: 2, name: 'Escuela B', roles: ['ESTUDIANTE'] }];
const original = apiClient.defaults.adapter;
function Location() { const location = useLocation(); const navigate = useNavigate(); return <><output data-testid="route">{location.pathname}</output><button onClick={() => navigate('/tutor/no-existe')}>Ruta desconocida</button></>; }
beforeEach(() => {
  clearSession(); localStorage.setItem('auth', JSON.stringify(actor));
  apiClient.defaults.adapter = async config => {
    let data = [];
    if (config.url === '/api/auth/institutions') data = schools;
    if (config.url === '/api/auth/context') { const id = JSON.parse(config.data).institutionId; data = { ...actor, token: `jwt-${id}`, institutionId: id, roles: schools.find(s => s.institutionId === id).roles }; }
    if (config.url === '/api/me') data = { id: 1, name: 'Persona', email: actor.email, role: 'TUTOR' };
    if (config.url === '/api/student/questions/my') data = { content: [] };
    if (config.url === '/api/tutor/dashboard/summary') data = { pendingCount: 0, todayAnsweredCount: 0, totalAnswers: 0 };
    return { data, status: 200, config, headers: {}, statusText: 'OK' };
  };
});
afterEach(() => { apiClient.defaults.adapter = original; });
function mount() { render(<MemoryRouter initialEntries={['/teacher']}><AuthProvider><App /><Location /></AuthProvider></MemoryRouter>); }
it('cambiar escuela con otros roles nunca deja que la guardia del espacio anterior sobrescriba el destino', async () => {
  mount(); const user = userEvent.setup(); await screen.findByText(/Estás en tu espacio docente/);
  await user.click(screen.getByRole('link', { name: 'Mi perfil', exact: true }));
  await user.selectOptions(screen.getByLabelText('Institución'), '2'); await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Dashboard del estudiante');
  await waitFor(() => expect(screen.getByTestId('route')).toHaveTextContent('/student'));
  expect(screen.queryByText('Acceso no disponible')).not.toBeInTheDocument();
});
it('alternar espacios no permite que una guardia anterior restaure el rol que se acaba de abandonar', async () => {
  mount(); const user = userEvent.setup(); await screen.findByText(/Estás en tu espacio docente/);
  await user.click(screen.getByRole('link', { name: 'Mi perfil', exact: true }));
  await user.selectOptions(screen.getByLabelText('Espacio de trabajo'), 'TUTOR'); await user.click(screen.getByRole('button', { name: 'Continuar' }));
  await screen.findByText('Dashboard del Tutor');
  expect(screen.getByTestId('sidebar-session')).toHaveTextContent('TUTOR académico');
  expect(screen.getByTestId('route')).toHaveTextContent('/tutor');
  expect(JSON.parse(localStorage.getItem('auth')).selectedRole).toBe('TUTOR');
});
it('las rutas desconocidas dentro de un espacio autorizado también muestran recuperación 404', async () => {
  mount(); await screen.findByText(/Estás en tu espacio docente/);
  await userEvent.click(screen.getByText('Ruta desconocida'));
  expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/tutor');
});
