import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import FirstLoginPage from '../FirstLoginPage';
import { renderWithProviders } from '../../../test/test-utils';
vi.mock('../../../api/axiosClient', () => ({ default: { post: vi.fn() } }));
it('mantiene el primer acceso heredado y devuelve al login sin fabricar JWT', async () => {
  apiClient.post.mockResolvedValue({ data: { message: 'Contraseña definida' } });
  const { authValue } = renderWithProviders(<Routes><Route path="/first-login" element={<FirstLoginPage />} /><Route path="/login" element={<p>Login heredado</p>} /></Routes>, { route: '/first-login?token=old-proof' });
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/^Nueva contraseña$/i), 'secret123');
  await user.type(screen.getByLabelText(/confirmar contraseña/i), 'secret123');
  await user.click(screen.getByRole('button', { name: /guardar|definir|activar/i }));
  expect(apiClient.post).toHaveBeenCalledWith('/api/auth/first-login/complete', { token: 'old-proof', password: 'secret123' });
  expect(authValue.login).not.toHaveBeenCalled();
  expect(await screen.findByText('Login heredado', {}, { timeout: 3000 })).toBeInTheDocument();
});
