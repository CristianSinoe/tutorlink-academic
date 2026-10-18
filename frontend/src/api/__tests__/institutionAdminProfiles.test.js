import { beforeEach, expect, it, vi } from 'vitest';
import apiClient from '../axiosClient';
import { institutionAdminApi } from '../institutionAdminApi';
import { getSession, updateSession } from '../../context/sessionStore';
vi.mock('../axiosClient', () => ({ default: { get: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
it('collects every authorized page and local profile for filtering and export', async () => {
  apiClient.get.mockImplementation((url, config) => Promise.resolve({ data: /\/users$/.test(url)
    ? { items: [{ userId: config.params.page + 1 }], total: 2, size: 1, page: config.params.page }
    : { profiles: [{ role: 'ESTUDIANTE', career: 'ISC' }] } }));
  const result = await institutionAdminApi.usersWithProfiles({ role: 'ESTUDIANTE' });
  expect(result.items).toHaveLength(2);
  expect(result.items[1].detail.profiles[0].career).toBe('ISC');
});
it('stops loading additional pages when the institutional context changes', async () => {
  apiClient.get.mockImplementation(async () => {
    updateSession({ generation: getSession().generation + 1 });
    return { data: { items: [{ userId: 1 }], total: 2, size: 1, page: 0 } };
  });
  await expect(institutionAdminApi.usersWithProfiles({})).rejects.toThrow('contexto institucional cambió');
  expect(apiClient.get).toHaveBeenCalledTimes(1);
});
