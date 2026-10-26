import apiClient from './axiosClient';

const ADMIN_ROOT = '/api/admin/academic';

const clean = values => Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null));
const camel = key => key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const normalize = value => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [camel(key), item]));
};

export function academicPage(data) {
  if (!data || !Array.isArray(data.content) || !Number.isInteger(data.page) || !Number.isInteger(data.size)
    || !Number.isFinite(data.totalElements) || !Number.isInteger(data.totalPages)) {
    throw new Error('La respuesta académica no es válida.');
  }
  return { ...data, content: data.content.map(normalize) };
}

export const academicApi = {
  async adminList(kind, params = {}) {
    if (!['periods', 'courses', 'groups'].includes(kind)) throw new Error('Catálogo académico inválido.');
    return academicPage((await apiClient.get(`${ADMIN_ROOT}/${kind}`, { params: clean(params) })).data);
  },
  async updatePeriod(id, payload) { await apiClient.put(`${ADMIN_ROOT}/periods/${id}`, payload); },
  async updateCourse(id, payload) { await apiClient.put(`${ADMIN_ROOT}/courses/${id}`, payload); },
  async createPeriod(payload) { return (await apiClient.post(`${ADMIN_ROOT}/periods`, payload)).data; },
  async createCourse(payload) { return (await apiClient.post(`${ADMIN_ROOT}/courses`, payload)).data; },
  async createGroup(payload) { return (await apiClient.post(`${ADMIN_ROOT}/groups`, payload)).data; },
  async groupTeachers(groupId, params = {}) { return academicPage((await apiClient.get(`${ADMIN_ROOT}/groups/${groupId}/teachers`, { params: clean(params) })).data); },
  async groupEnrollments(groupId, params = {}) { return academicPage((await apiClient.get(`${ADMIN_ROOT}/groups/${groupId}/enrollments`, { params: clean(params) })).data); },
  async assignTeacher(groupId, teacherId) { await apiClient.post(`${ADMIN_ROOT}/groups/${groupId}/teachers`, { teacherId }); },
  async enrollStudent(groupId, studentId) { await apiClient.post(`${ADMIN_ROOT}/groups/${groupId}/enrollments`, { studentId }); },
  async withdrawStudent(groupId, studentId) { await apiClient.delete(`${ADMIN_ROOT}/groups/${groupId}/enrollments/${studentId}`); },
  async teacherCourses(params = {}) { return academicPage((await apiClient.get('/api/teacher/courses', { params: clean(params) })).data); },
  async teacherActivities(kind, groupId, params = {}) {
    if (!['tasks', 'contents'].includes(kind) || !Number.isInteger(groupId) || groupId < 1) throw new Error('Actividad académica inválida.');
    return academicPage((await apiClient.get(`/api/teacher/${kind}`, { params: clean({ ...params, groupId }) })).data);
  },
  async saveActivity(kind, groupId, payload, id = null) {
    if (!['tasks', 'contents'].includes(kind)) throw new Error('Actividad inválida.');
    if (id) return apiClient.put(`/api/teacher/${kind}/${id}`, payload);
    return apiClient.post(`/api/teacher/${kind}`, { ...payload, groupId });
  },
  async deleteActivity(kind, id) {
    if (!['tasks', 'contents'].includes(kind)) throw new Error('Actividad inválida.');
    return apiClient.delete(`/api/teacher/${kind}/${id}`);
  },
  async taskStudents(taskId, params = {}) { return academicPage((await apiClient.get(`/api/teacher/tasks/${taskId}/students`, { params: clean(params) })).data); },
  async studentCourses(params = {}) { return academicPage((await apiClient.get('/api/student/courses', { params: clean(params) })).data); },
};
