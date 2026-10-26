import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils';
import SubmissionFiles from '../../../components/academic/SubmissionFiles';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
it('consults metadata and only exposes a reference after explicit content authorization', async () => {
  apiClient.get.mockResolvedValueOnce({ data: [{ id: 9, fileName: 'Respuesta.pdf', mimeType: 'application/pdf' }] }).mockResolvedValueOnce({ data: { id: 9, url: 'https://school.example/approved.pdf' } });
  renderWithProviders(<SubmissionFiles submissionId={5} />);
  expect(apiClient.get).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole('button', { name: 'Consultar archivos referenciados' }));
  await screen.findByText('Respuesta.pdf');
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
  expect(apiClient.get).toHaveBeenCalledWith('/api/attachments', { params: { resourceType: 'SUBMISSION', resourceId: 5, actingRole: 'DOCENTE', page: 0, size: 5 } });
  await userEvent.click(screen.getByRole('button', { name: 'Consultar referencia' }));
  expect(await screen.findByRole('link', { name: 'Abrir referencia autorizada' })).toHaveAttribute('href', 'https://school.example/approved.pdf');
  expect(apiClient.get).toHaveBeenLastCalledWith('/api/attachments/9/content-reference', { params: { actingRole: 'DOCENTE' } });
});
it('keeps metadata without a content link when the reference is not approved', async () => {
  apiClient.get.mockResolvedValueOnce({ data: [{ id: 9, fileName: 'Histórico.pdf' }] }).mockRejectedValueOnce({ response: { status: 409 } });
  renderWithProviders(<SubmissionFiles submissionId={5} />);
  await userEvent.click(screen.getByRole('button', { name: 'Consultar archivos referenciados' }));
  await userEvent.click(await screen.findByRole('button', { name: 'Consultar referencia' }));
  expect(await screen.findByText(/su procedencia no está aprobada/)).toBeInTheDocument();
  expect(screen.getByText('Histórico.pdf')).toBeInTheDocument();
  expect(screen.queryByRole('link')).not.toBeInTheDocument();
});
