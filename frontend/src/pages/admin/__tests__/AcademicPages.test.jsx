import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils';
import PeriodsPage from '../PeriodsPage';
import GroupsPage from '../GroupsPage';
import CoursesPage from '../CoursesPage';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }));
const page = content => ({ content, page: 0, size: 20, totalElements: content.length, totalPages: content.length ? 1 : 0 });

describe('academic administration pages', () => {
  beforeEach(() => { vi.clearAllMocks(); apiClient.post.mockResolvedValue({ data: { id: 9 } }); apiClient.delete.mockResolvedValue({}); });
  it('creates a period and preserves validation before writing', async () => {
    apiClient.get.mockResolvedValue({ data: page([]) }); const user = userEvent.setup(); renderWithProviders(<PeriodsPage />);
    await screen.findByText(/no hay periodos/i); await user.click(screen.getByRole('button', { name: /crear periodo/i }));
    await user.type(screen.getByRole('textbox', { name: /Código/ }), '2027-A'); await user.type(screen.getByRole('textbox', { name: /Nombre/ }), 'Primavera 2027');
    await user.type(screen.getByLabelText(/^Fecha inicial/), '2027-08-01'); await user.type(screen.getByLabelText(/^Fecha final/), '2027-01-01');
    await user.click(screen.getByRole('button', { name: 'Crear' })); expect(screen.getByRole('alert')).toHaveTextContent(/fecha final/i); expect(apiClient.post).not.toHaveBeenCalled();
  });
  it.each(['periods', 'courses'])('edits %s from details and preserves the form after a conflict', async kind => {
    const row = kind === 'periods' ? { id: 1, code: 'P1', name: 'Periodo original', starts_on: '2027-01-01', ends_on: '2027-06-30', status: 'ACTIVE' } : { id: 1, code: 'C1', name: 'Materia original', description: 'Texto', active: true };
    apiClient.get.mockResolvedValue({ data: page([row]) });
    apiClient.put.mockRejectedValueOnce({ response: { data: { message: 'Código duplicado' } } }).mockResolvedValueOnce({});
    const user = userEvent.setup(); renderWithProviders(kind === 'periods' ? <PeriodsPage /> : <CoursesPage />);
    await user.click(await screen.findByRole('button', { name: 'Ver detalles' }));
    const name = screen.getByRole('textbox', { name: /Nombre/ });
    await user.clear(name); await user.type(name, 'Nombre modificado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    expect(await screen.findByText('Código duplicado')).toBeInTheDocument(); expect(name).toHaveValue('Nombre modificado');
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(apiClient.put).toHaveBeenLastCalledWith(`/api/admin/academic/${kind}/1`, expect.objectContaining({ name: 'Nombre modificado' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
  it('assigns institutional profile ids and never user ids', async () => {
    const groups = page([{ id: 7, code: 'G1', name: 'Grupo 1', course_id: 2, period_id: 3, active: true }]);
    const courses = page([{ id: 2, code: 'MAT', name: 'Matemáticas', active: true }]); const periods = page([{ id: 3, code: 'P1', name: 'Periodo', status: 'ACTIVE' }]);
    apiClient.get.mockImplementation(url => {
      if (url.endsWith('/groups')) return Promise.resolve({ data: groups });
      if (url.endsWith('/courses')) return Promise.resolve({ data: courses });
      if (url.endsWith('/periods')) return Promise.resolve({ data: periods });
      if (url.endsWith('/teachers')) return Promise.resolve({ data: page([]) });
      if (url.endsWith('/enrollments')) return Promise.resolve({ data: page([]) });
      if (url.includes('/institution/users')) return Promise.resolve({ data: { items: [{ userId: 500, name: 'Docente Demo', profiles: { DOCENTE: 31 } }], total: 1, page: 0, size: 100 } });
      return Promise.reject(new Error(url));
    });
    const user = userEvent.setup(); renderWithProviders(<GroupsPage />); await screen.findByText('Grupo 1'); await user.click(screen.getByRole('button', { name: 'Gestionar' }));
    await waitFor(() => {
      for (const role of ['DOCENTE', 'ESTUDIANTE']) {
        expect(apiClient.get).toHaveBeenCalledWith('/api/admin/institution/users', {
          params: expect.objectContaining({ role, membershipStatus: 'ACTIVE', status: 'ACTIVE' }),
        });
      }
    });
    const teacher = await screen.findByLabelText(/docente institucional activo/i); await user.selectOptions(teacher, '31'); await user.click(screen.getByRole('button', { name: 'Asignar' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/admin/academic/groups/7/teachers', { teacherId: 31 }));
  });
});
