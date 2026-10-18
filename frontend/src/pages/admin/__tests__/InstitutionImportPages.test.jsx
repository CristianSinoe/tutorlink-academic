import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils.jsx';
import StudentsPage from '../StudentsPage.jsx';
import TeachersPage from '../TeachersPage.jsx';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));

const emptyPage = { items: [], total: 0, page: 0, size: 20 };
const report = { total: 2, created: 1, invited: 1, skipped: 0, failed: 0, rows: [{ row: 2, outcome: 'CREATED', message: 'Correcto' }] };

describe('institutional imports', () => {
  beforeEach(() => { vi.clearAllMocks(); apiClient.get.mockResolvedValue({ data: emptyPage }); apiClient.post.mockResolvedValue({ data: report }); });

  it.each([
    ['students', StudentsPage, 'ESTUDIANTE'],
    ['teachers', TeachersPage, 'DOCENTE'],
  ])('validates and imports CSV for %s using the role-specific V30 endpoint', async (_name, Page, role) => {
    const user = userEvent.setup();
    renderWithProviders(<Page />);
    await screen.findByText(/no hay usuarios/i);
    await user.click(screen.getByRole('button', { name: /importar/i }));
    const file = new File(['name,email\nAna,ana@example.test'], 'people.csv', { type: 'text/csv' });
    await user.upload(screen.getByLabelText(/archivo csv o excel/i), file);
    await user.click(screen.getByRole('button', { name: 'Procesar importación' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/admin/institution/users/import-csv', { csv: 'name,email\nAna,ana@example.test' }, expect.objectContaining({ params: { role } })));
    expect(await screen.findByText('Importación procesada.')).toBeInTheDocument();
    expect(screen.getByText('Correcto')).toBeInTheDocument();
  });

  it('rejects an unsupported file locally before writing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<StudentsPage />);
    await screen.findByText(/no hay usuarios/i);
    await user.click(screen.getByRole('button', { name: /importar/i }));
    await user.upload(screen.getByLabelText(/archivo csv o excel/i), new File(['x'], 'people.txt', { type: 'text/plain' }));
    await user.click(screen.getByRole('button', { name: 'Procesar importación' }));
    expect(await screen.findByText(/selecciona un archivo csv o xlsx/i)).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
