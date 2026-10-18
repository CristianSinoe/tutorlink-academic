import { Route, Routes } from 'react-router-dom';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { exportAdminListToExcel, exportAdminListToPdf } from '../../../utils/adminExport';
import UsersPage from '../UsersPage.jsx';
import StudentsPage from '../StudentsPage.jsx';
import { renderWithProviders } from '../../../test/test-utils.jsx';

vi.mock('../../../utils/adminExport', () => ({ exportAdminListToExcel: vi.fn(), exportAdminListToPdf: vi.fn() }));

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const page = { items: [{ userId: 8, name: 'Diana', email: 'diana@example.test', status: 'ACTIVE', roles: ['DOCENTE', 'TUTOR'] }], total: 1, page: 0, size: 10 };
const detail = { userId: 8, name: 'Diana', lastNamePaterno: 'López', email: 'diana@example.test', status: 'ACTIVE', profiles: [{ role: 'DOCENTE', code: 'D-8', department: 'Ciencias' }], memberships: [{ role: 'DOCENTE', status: 'ACTIVE' }, { role: 'TUTOR', status: 'SUSPENDED' }] };

function renderUsers(route = '/admin/users', page = <UsersPage />) {
  return renderWithProviders(<Routes><Route path="/admin/users" element={<UsersPage />} /><Route path="/admin/students" element={page} /></Routes>, { route, auth: { token: 'jwt-admin', role: 'ADMIN', roles: ['ADMIN'], institutionId: 3, email: 'admin@example.test', name: 'Admin' } });
}

describe('InstitutionUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/8') ? detail : page }));
  });

  it('uses institutional role and account filters without a membership control', async () => {
    const user = userEvent.setup();
    renderUsers();
    await screen.findByText('diana@example.test');
    await user.selectOptions(screen.getByLabelText('Rol'), 'DOCENTE');
    await user.selectOptions(screen.getByLabelText('Estado de cuenta'), 'ACTIVE');
    expect(screen.queryByLabelText('Estado de membresía')).not.toBeInTheDocument();
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/admin/institution/users', expect.objectContaining({ params: expect.objectContaining({ role: 'DOCENTE', membershipStatus: 'ALL', status: 'ACTIVE', page: 0, size: 10 }) })));
  });

  it('keeps student view as a role-filtered V30 listing', async () => {
    renderUsers('/admin/students', <StudentsPage />);
    await screen.findByText('diana@example.test');
    expect(apiClient.get).toHaveBeenCalledWith('/api/admin/institution/users', expect.objectContaining({ params: expect.objectContaining({ role: 'ESTUDIANTE' }) }));
    expect(screen.queryByLabelText('Rol')).not.toBeInTheDocument();
  });

  it('shows global identity as read-only and suspends only the local membership after confirmation', async () => {
    const user = userEvent.setup();
    apiClient.patch.mockResolvedValue({ data: {} });
    renderUsers();
    await screen.findByText('diana@example.test');
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    await screen.findByText('Cuenta global');
    expect(screen.getByText(/no se modifica desde esta institución/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Suspender' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(apiClient.patch).toHaveBeenCalledWith('/api/admin/institution/users/8/roles/DOCENTE/status', { status: 'SUSPENDED' }));
  });

  it('preserves a recoverable conflict and the profile form after a failed update', async () => {
    const user = userEvent.setup();
    apiClient.put.mockRejectedValue({ response: { data: { message: 'El código ya está en uso.' } } });
    renderUsers();
    await screen.findByText('diana@example.test');
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    await screen.findByRole('button', { name: 'DOCENTE' });
    await user.click(screen.getByRole('button', { name: 'DOCENTE' }));
    const code = screen.getByLabelText(/código docente/i);
    await user.clear(code);
    await user.type(code, 'D-99');
    await user.click(screen.getByRole('button', { name: 'Guardar perfil local' }));
    expect(await screen.findByText('El código ya está en uso.')).toBeInTheDocument();
    expect(code).toHaveValue('D-99');
  });

  it('restores academic filters, export actions and contextual help', async () => {
    const user = userEvent.setup();
    renderUsers();
    await screen.findByRole('option', { name: 'Ciencias' });
    expect(screen.getByLabelText('Carrera')).toBeInTheDocument();
    expect(screen.getByLabelText('Semestre')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Departamento'), 'Ciencias');
    await user.click(screen.getByRole('button', { name: /exportar .* en excel/i }));
    await user.click(screen.getByRole('button', { name: /exportar .* en pdf/i }));
    expect(exportAdminListToExcel).toHaveBeenCalledWith(expect.objectContaining({ rows: [expect.objectContaining({ userId: 8 })] }));
    expect(exportAdminListToPdf).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /ayuda de usuarios/i }));
    expect(await screen.findByText(/incluidas las páginas siguientes/)).toBeInTheDocument();
  });

  it('never offers additional academic roles for an institutional student', async () => {
    const user = userEvent.setup();
    apiClient.get.mockImplementation(url => Promise.resolve({ data: url.endsWith('/8') ? { ...detail, profiles: [{ role: 'ESTUDIANTE', code: 'E-8' }], memberships: [{ role: 'ESTUDIANTE', status: 'ACTIVE' }] } : page }));
    renderUsers('/admin/students', <StudentsPage />);
    await screen.findByText('diana@example.test');
    await user.click(screen.getByRole('button', { name: 'Ver detalle' }));
    await screen.findByText('Cuenta global');
    expect(screen.queryByLabelText('Rol para agregar')).not.toBeInTheDocument();
    expect(screen.queryByText('Agregar rol académico…')).not.toBeInTheDocument();
  });

  it('hides the role selector when both teacher and tutor roles already exist', async () => {
    const user = userEvent.setup(); renderUsers();
    await user.click(await screen.findByRole('button', { name: 'Ver detalle' }));
    await screen.findByText('Cuenta global');
    expect(screen.queryByLabelText('Rol para agregar')).not.toBeInTheDocument();
  });

  it('explains the retired administrator route without retaining it in the institutional UI', async () => {
    renderUsers('/admin/users?legacy=admins');
    expect(await screen.findByText(/panel SaaS/i)).toBeInTheDocument();
    expect(screen.queryByText('Administradores')).not.toBeInTheDocument();
  });
});
