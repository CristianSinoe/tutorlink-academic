import { screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils';
import AcademicDashboard from '../AcademicDashboard';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('combines actual teacher and tutor summaries only when both contextual roles exist', async () => {
  apiClient.get.mockImplementation(url => Promise.resolve({ data: url.includes('/tutor/dashboard') ? { pendingCount: 4, todayAnsweredCount: 2, totalAnswers: 8 } : url.includes('/tutor/questions') ? [] : { content: [], page: 0, size: 1, totalElements: 3, totalPages: 3 } }));
  renderWithProviders(<AcademicDashboard />, { auth: { token: 'jwt', roles: ['DOCENTE', 'TUTOR'], role: 'TUTOR', selectedRole: 'DOCENTE', institutionId: 1 } });
  expect(await screen.findByRole('heading', { name: 'Resumen de docencia y tutorías' })).toBeInTheDocument();
  expect(await screen.findByText('8')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ver mis materias' })).toHaveAttribute('href', '/teacher/courses');
  expect(apiClient.get).toHaveBeenCalledWith('/api/teacher/courses', expect.any(Object));
  expect(apiClient.get).toHaveBeenCalledWith('/api/tutor/dashboard/summary');
});
it('does not call tutoring endpoints for a teacher without a tutor role and does not invent error totals', async () => {
  apiClient.get.mockRejectedValue(new Error('Unavailable'));
  renderWithProviders(<AcademicDashboard />, { auth: { token: 'jwt', roles: ['DOCENTE'], role: 'DOCENTE', selectedRole: 'DOCENTE', institutionId: 1 } });
  expect(await screen.findAllByText('Este dato no está disponible.')).toHaveLength(3);
  expect(apiClient.get.mock.calls.every(([url]) => !url.startsWith('/api/tutor'))).toBe(true);
  expect(screen.queryByText('0')).not.toBeInTheDocument();
});
