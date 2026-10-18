import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../axiosClient';
import { academicApi, academicPage } from '../academicApi';

vi.mock('../axiosClient', () => ({ default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

describe('academicApi', () => {
  beforeEach(() => vi.clearAllMocks());
  it('validates pages and maps database field names to view models', () => {
    expect(academicPage({ content: [{ course_id: 3, course_name: 'Álgebra' }], page: 0, size: 10, totalElements: 1, totalPages: 1 }).content[0]).toEqual({ courseId: 3, courseName: 'Álgebra' });
    expect(() => academicPage({ content: [], page: 0 })).toThrow(/respuesta académica/i);
  });
  it('uses profile identifiers in assignment and enrollment DTOs', async () => {
    apiClient.post.mockResolvedValue({ data: {} });
    await academicApi.assignTeacher(8, 31); await academicApi.enrollStudent(8, 42);
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/api/admin/academic/groups/8/teachers', { teacherId: 31 });
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/api/admin/academic/groups/8/enrollments', { studentId: 42 });
  });
});
