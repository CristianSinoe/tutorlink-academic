import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils.jsx';
import InstitutionInvitationsPage from '../InstitutionInvitationsPage.jsx';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
const invitations = { content: [{ id: 15, contactEmail: 'ana@school.test', role: 'ESTUDIANTE', expiresAt: '2030-01-02T12:00:00Z', status: 'PENDING' }, { id: 16, contactEmail: 'old@school.test', role: 'TUTOR', expiresAt: '2020-01-01T00:00:00Z', status: 'EXPIRED' }], page: 0, size: 20, totalElements: 2, totalPages: 1 };

describe('InstitutionInvitationsPage', () => {
  beforeEach(() => { vi.clearAllMocks(); apiClient.get.mockResolvedValue({ data: invitations }); apiClient.post.mockResolvedValue({ data: {} }); apiClient.delete.mockResolvedValue({ data: {} }); });

  it('creates an invitation through its explicit V30 DTO without a password or token', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InstitutionInvitationsPage />);
    await screen.findByText('ana@school.test');
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Crear invitación' }));
    await user.type(screen.getByLabelText(/correo de contacto institucional/i), 'new@school.test');
    await user.type(screen.getByLabelText(/matrícula/i), 'A-9');
    await user.click(screen.getByRole('button', { name: 'Emitir invitación' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/admin/institution/users/invitations', expect.objectContaining({ contactEmail: 'new@school.test', role: 'ESTUDIANTE', profile: expect.objectContaining({ code: 'A-9' }) })));
  });

  it('confirms resend and cancellation before mutating invitation history', async () => {
    const user = userEvent.setup();
    renderWithProviders(<InstitutionInvitationsPage />);
    await screen.findByText('ana@school.test');
    await user.click(screen.getByRole('button', { name: 'Reenviar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/prueba y la anterior dejará de ser válida/i);
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/admin/institution/users/invitations/15/resend'));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    await user.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/api/admin/institution/users/invitations/15'));
  });

  it('keeps a recoverable server error visible instead of treating it as an empty list', async () => {
    apiClient.get.mockRejectedValue({ response: { data: { message: 'No puedes gestionar esta institución.' } } });
    renderWithProviders(<InstitutionInvitationsPage />);
    expect((await screen.findAllByText('No puedes gestionar esta institución.')).length).toBeGreaterThan(0);
  });
});
