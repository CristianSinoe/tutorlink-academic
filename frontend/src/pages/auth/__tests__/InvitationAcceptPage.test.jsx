import { screen, waitFor } from '@testing-library/react';
import { Routes, Route, useLocation } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import InvitationAcceptPage from '../InvitationAcceptPage';
import { forgetInvitation, readInvitation } from '../../../context/invitationMemory';
import { renderWithProviders } from '../../../test/test-utils';
vi.mock('../../../api/axiosClient', () => ({ default: { post: vi.fn() } }));
const token = 'a'.repeat(43);
function Location() { const l = useLocation(); return <output data-testid="location">{l.pathname}{l.search}</output>; }
function view(auth = {}) {
  return renderWithProviders(<><Location /><Routes><Route path="/accept-institution-invitation" element={<InvitationAcceptPage />} /><Route path="/login" element={<p>Login</p>} /><Route path="/context" element={<p>Contexto</p>} /></Routes></>,
    { route: `/accept-institution-invitation?token=${token}`, auth });
}
beforeEach(() => { forgetInvitation(); apiClient.post.mockReset(); });
afterEach(forgetInvitation);
it('retira la prueba del enlace y no la persiste ni la registra al fallar', async () => {
  const logged = vi.spyOn(console, 'error');
  apiClient.post.mockRejectedValue({ response: { status: 403 }, config: { data: token } });
  view();
  expect(screen.getByTestId('location')).toHaveTextContent('/accept-institution-invitation');
  expect(screen.getByTestId('location')).not.toHaveTextContent(token);
  expect(localStorage.getItem('auth')).not.toContain(token);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Contraseña'), 'secret123'); await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/No pudimos verificar/);
  expect(logged).not.toHaveBeenCalled();
});
it('cuenta existente sin sesión envía contraseña y nunca inventa correo o JWT', async () => {
  apiClient.post.mockResolvedValue({ data: { userId: 4, roles: ['TUTOR'] } });
  const { authValue } = view(); const user = userEvent.setup();
  await user.type(screen.getByLabelText('Contraseña'), 'secret123'); await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }));
  expect(await screen.findByRole('heading', { name: 'Invitación aceptada' })).toHaveFocus();
  expect(apiClient.post).toHaveBeenCalledWith('/api/institution-invitations/accept', { token, password: 'secret123' });
  expect(authValue.login).not.toHaveBeenCalled(); expect(readInvitation()).toBe('');
  await user.click(screen.getByRole('link', { name: 'Iniciar sesión' })); expect(await screen.findByText('Login')).toBeInTheDocument();
});
it('cuenta nueva envía datos mínimos y contraseña confirmada', async () => {
  apiClient.post.mockResolvedValue({ data: { userId: 5, roles: ['ESTUDIANTE'] } });
  view(); const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText('Tu cuenta'), 'new');
  await user.type(screen.getByLabelText('Nombre'), 'Ana'); await user.type(screen.getByLabelText('Primer apellido'), 'López');
  await user.type(screen.getByLabelText('Contraseña'), 'secret123'); await user.type(screen.getByLabelText('Confirmar contraseña'), 'secret123');
  await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }));
  expect(await screen.findByRole('heading', { name: 'Invitación aceptada' })).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledWith('/api/institution-invitations/accept', { token, name: 'Ana', lastNamePaterno: 'López', lastNameMaterno: '', password: 'secret123' });
});
it('sesión existente vincula solo la cuenta actual y ofrece reconsultar opciones', async () => {
  apiClient.post.mockResolvedValue({ data: { userId: 5, roles: ['DOCENTE', 'TUTOR'] } });
  const { authValue } = view({ token: 'jwt', role: 'TUTOR', email: 'ana@personal.test', name: 'Ana' });
  const user = userEvent.setup();
  expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }));
  expect(await screen.findByRole('heading', { name: 'Invitación aceptada' })).toBeInTheDocument();
  expect(apiClient.post).toHaveBeenCalledWith('/api/institution-invitations/accept', { token });
  await user.click(screen.getByRole('button', { name: /actualizar instituciones/i }));
  expect(authValue.retryRestore).toHaveBeenCalled(); expect(await screen.findByText('Contexto')).toBeInTheDocument();
});
it.each(['vencida', 'cancelada', 'utilizada', 'cuenta incorrecta'])('rechazo uniforme para invitación %s, sin inferir datos internos', async () => {
  apiClient.post.mockRejectedValue({ response: { status: 403 } });
  view(); const user = userEvent.setup(); await user.type(screen.getByLabelText('Contraseña'), 'secret123');
  await user.click(screen.getByRole('button', { name: 'Aceptar invitación' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/solicita una nueva invitación/);
  expect(screen.queryByText('Invitación aceptada')).not.toBeInTheDocument();
});
it('permite usar otra cuenta sin perder la prueba temporal', async () => {
  const { authValue } = view({ token: 'jwt', role: 'TUTOR', email: 'ana@example.test' });
  await userEvent.click(screen.getByRole('button', { name: 'Usar otra cuenta' }));
  expect(authValue.logout).toHaveBeenCalled(); expect(readInvitation()).toBe(token);
});
it('recargar sin prueba en memoria pide reabrir correo', async () => {
  renderWithProviders(<InvitationAcceptPage />, { route: '/accept-institution-invitation' });
  await waitFor(() => expect(screen.getByText(/Reabre el enlace original/)).toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'Aceptar invitación' })).not.toBeInTheDocument();
});
