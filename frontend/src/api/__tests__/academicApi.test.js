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
  it('reads teacher activities only for a concrete group and normalizes task fields', async () => {
    apiClient.get.mockResolvedValue({ data: { content: [{ id: 1, due_at: '2026-12-01', allow_late_submissions: true }], page: 0, size: 5, totalElements: 1, totalPages: 1 } });
    const result = await academicApi.teacherActivities('tasks', 7, { page: 0, size: 5, groupId: 99 });
    expect(apiClient.get).toHaveBeenCalledWith('/api/teacher/tasks', { params: { groupId: 7, page: 0, size: 5 } });
    expect(result.content[0]).toMatchObject({ dueAt: '2026-12-01', allowLateSubmissions: true });
    await expect(academicApi.teacherActivities('unknown', 7)).rejects.toThrow();
    await expect(academicApi.teacherActivities('tasks', 0)).rejects.toThrow();
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
