import { vi } from 'vitest';
import apiClient from '../../api/axiosClient';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { buildAuthValue, renderWithProviders } from '../../test/test-utils';
import WorkspaceLayout from '../WorkspaceLayout';
import ProfileContextSection from '../../components/context/ProfileContextSection';

const schools = [{ institutionId: 1, name: 'Escuela A', roles: ['DOCENTE', 'TUTOR'] }, { institutionId: 2, name: 'Escuela B', roles: ['ESTUDIANTE'] }];
function mount(role = 'DOCENTE', extra = {}) {
  const value = buildAuthValue({ token: 'context', name: 'Persona', email: 'un-correo-principal-extenso@example.test', institutionId: role === 'PLATFORM_SUPER_ADMIN' ? null : 1, institutionName: role === 'PLATFORM_SUPER_ADMIN' ? '' : 'Escuela A', roles: [role], selectedRole: role, options: schools, ...extra });
  renderWithProviders(<Routes><Route path="/" element={<WorkspaceLayout title="Espacio" items={[{ to: '/', label: 'Inicio', end: true }]} profilePath="/profile"><h1>Contenido académico</h1></WorkspaceLayout>} /><Route path="/profile" element={<ProfileContextSection />} /><Route path="/login" element={<h1>Iniciar sesión</h1>} /></Routes>, { authValue: value });
  return value;
}
it.each(['ADMIN', 'DOCENTE', 'TUTOR', 'ESTUDIANTE', 'SUPER_ADMIN', 'PLATFORM_SUPER_ADMIN'])('identidad y cierre únicos en sidebar para %s', role => {
  mount(role);
  const sidebar = screen.getByRole('complementary', { name: 'Menú lateral' });
  const header = screen.getByRole('banner');
  expect(within(sidebar).getByText('Persona')).toBeInTheDocument();
  expect(within(sidebar).getByText(role === 'PLATFORM_SUPER_ADMIN' ? 'Ámbito global de plataforma' : 'Escuela A')).toBeInTheDocument();
  expect(within(sidebar).getByText(/un-correo/)).toHaveClass('truncate');
  expect(within(sidebar).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  expect(within(header).queryByText('Persona')).not.toBeInTheDocument();
  expect(within(header).queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Institución')).not.toBeInTheDocument();
});
it('Mi perfil contiene instituciones y roles y conserva cancelación del cambio', async () => {
  const value = mount('DOCENTE', { roles: ['DOCENTE', 'TUTOR'] }); const user = userEvent.setup();
  await user.click(screen.getByRole('link', { name: 'Mi perfil', exact: true }));
  expect(screen.getByRole('heading', { name: 'Instituciones y contexto de trabajo' })).toBeInTheDocument();
  expect(screen.getByText('Roles disponibles: DOCENTE, TUTOR académico')).toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText('Institución'), '2');
  await user.click(screen.getByRole('button', { name: 'Cancelar' }));
  expect(value.switchInstitution).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Espacio de trabajo')).toHaveValue('DOCENTE');
});
it('menú móvil atrapa foco, Escape cierra y restaura foco al disparador', async () => {
  mount(); const user = userEvent.setup(); const trigger = screen.getByRole('button', { name: 'Abrir menú' });
  await user.click(trigger);
  const dialog = screen.getByRole('dialog', { name: 'Menú de navegación' });
  expect(within(dialog).getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
  expect(document.querySelector('[data-workspace-shell]')).toHaveAttribute('inert');
  await user.tab({ shift: true }); expect(within(dialog).getByRole('button', { name: 'Cerrar sesión' })).toHaveFocus();
  await user.tab(); expect(within(dialog).getByRole('button', { name: 'Cerrar menú' })).toHaveFocus();
  await user.keyboard('{Escape}'); expect(trigger).toHaveFocus(); expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(document.querySelector('[data-workspace-shell]')).not.toHaveAttribute('inert');
});
it('cierra la sesión desde el sidebar de escritorio', async () => {
  const value = mount(); await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
  expect(value.logout).toHaveBeenCalledOnce(); expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
});
it('cierra sesión desde el menú móvil y limpia bloqueo modal', async () => {
  const value = mount(); const user = userEvent.setup(); await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Cerrar sesión' }));
  expect(value.logout).toHaveBeenCalledOnce(); await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  expect(document.body.style.overflow).not.toBe('hidden');
});

it('plataforma distingue las membresías del catálogo administrable', async () => {
  vi.spyOn(apiClient, 'get').mockResolvedValue({ data: schools });
  mount('PLATFORM_SUPER_ADMIN', { options: [], platformOptions: [{ institutionId: 3, name: 'Escuela del catálogo', roles: ['SUPER_ADMIN'] }] });
  await userEvent.click(screen.getByRole('link', { name: 'Mi perfil', exact: true }));
  await screen.findByText('Roles disponibles: DOCENTE, TUTOR académico');
  expect(apiClient.get).toHaveBeenCalledWith('/api/auth/institutions');
  const memberships = screen.getByRole('list');
  expect(memberships).toHaveTextContent('Escuela A');
  expect(memberships).not.toHaveTextContent('Escuela del catálogo');
  expect(screen.getByLabelText('Institución')).toHaveTextContent('Escuela del catálogo');
  expect(screen.queryByLabelText('Espacio de trabajo')).not.toBeInTheDocument();
});
