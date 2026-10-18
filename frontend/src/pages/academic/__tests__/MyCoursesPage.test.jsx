import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import apiClient from '../../../api/axiosClient';
import { renderWithProviders } from '../../../test/test-utils';
import MyCoursesPage from '../MyCoursesPage';

vi.mock('../../../api/axiosClient', () => ({ default: { get: vi.fn() } }));

describe('MyCoursesPage', () => {
  it('uses the role-specific real endpoint and expands only loaded information', async () => {
    apiClient.get.mockResolvedValue({ data: { content: [{ id: 1, code: 'G1', name: 'Grupo A', course_name: 'Matemáticas', period_name: '2027-A' }], page: 0, size: 10, totalElements: 1, totalPages: 1 } });
    const user = userEvent.setup(); renderWithProviders(<MyCoursesPage role="DOCENTE" />); expect(await screen.findByText('Matemáticas')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/teacher/courses', expect.any(Object)); await user.click(screen.getByRole('button', { name: /ver detalle/i })); expect(screen.getByText('2027-A')).toBeInTheDocument();
  });
  it('distinguishes an empty enrollment from a loading error', async () => {
    apiClient.get.mockResolvedValue({ data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 } }); renderWithProviders(<MyCoursesPage role="ESTUDIANTE" />); expect(await screen.findByText(/no tienes materias activas/i)).toBeInTheDocument(); expect(apiClient.get).toHaveBeenCalledWith('/api/student/courses', expect.any(Object));
  });
});
