import apiClient from './axiosClient';
import { getSession } from '../context/sessionStore';

const ROOT = '/api/admin/institution/users';
const ROLES = new Set(['ESTUDIANTE', 'DOCENTE', 'TUTOR']);

function requireRole(role) {
  if (!ROLES.has(role)) throw new Error('Rol institucional inválido.');
}

function page(data) {
  if (!data || !Array.isArray(data.items) || !Number.isFinite(data.total) || !Number.isInteger(data.page) || !Number.isInteger(data.size)) {
    throw new Error('La respuesta de usuarios institucionales no es válida.');
  }
  return data;
}

function invitations(data) {
  if (!data || !Array.isArray(data.content) || !Number.isInteger(data.page) || !Number.isInteger(data.size)) {
    throw new Error('La respuesta de invitaciones no es válida.');
  }
  return data;
}

function cleanParams(values) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null));
}

export const institutionAdminApi = {
  async usersWithProfiles(filters) {
    const generation = getSession().generation;
    const checkContext = () => { if (getSession().generation !== generation) throw new Error('El contexto institucional cambió.'); };
    const first = await this.users({ ...filters, page: 0 });
    checkContext();
    const items = [...first.items];
    for (let page = 1; page * first.size < first.total; page++) {
      items.push(...(await this.users({ ...filters, page })).items);
      checkContext();
    }
    const rows = [];
    for (let offset = 0; offset < items.length; offset += 8) {
      rows.push(...await Promise.all(items.slice(offset, offset + 8).map(async item => ({ ...item, detail: await this.user(item.userId) }))));
      checkContext();
    }
    return { ...first, items: rows };
  },
  async users({ q, role, membershipStatus = 'ACTIVE', status, page: currentPage = 0, size = 10 }) {
    if (role) requireRole(role);
    const { data } = await apiClient.get(ROOT, { params: cleanParams({ q, role, membershipStatus, status, page: currentPage, size }) });
    return page(data);
  },
  async user(userId) { return (await apiClient.get(`${ROOT}/${userId}`)).data; },
  async updateProfile(userId, role, profile) { requireRole(role); return (await apiClient.put(`${ROOT}/${userId}/profiles/${role}`, profile)).data; },
  async addRole(userId, payload) { requireRole(payload.role); return (await apiClient.post(`${ROOT}/${userId}/roles`, payload)).data; },
  async setMembershipStatus(userId, role, status) { requireRole(role); return (await apiClient.patch(`${ROOT}/${userId}/roles/${role}/status`, { status })).data; },
  async revokeRole(userId, role) { requireRole(role); await apiClient.delete(`${ROOT}/${userId}/roles/${role}`); },
  async createInvitation(payload) { requireRole(payload.role); return (await apiClient.post(`${ROOT}/invitations`, payload)).data; },
  async invitationPage({ page: currentPage = 0, size = 10 }) { return invitations((await apiClient.get(`${ROOT}/invitations`, { params: { page: currentPage, size } })).data); },
  async resendInvitation(id) { return (await apiClient.post(`${ROOT}/invitations/${id}/resend`)).data; },
  async cancelInvitation(id) { await apiClient.delete(`${ROOT}/invitations/${id}`); },
  async importCsv(role, csv) { requireRole(role); return (await apiClient.post(`${ROOT}/import-csv`, { csv }, { params: { role } })).data; },
  async importExcel(role, file) {
    requireRole(role);
    const data = new FormData(); data.append('file', file);
    return (await apiClient.post(`${ROOT}/import-excel`, data, { params: { role }, headers: { 'Content-Type': undefined } })).data;
  },
};

export const institutionRoles = [...ROLES];
