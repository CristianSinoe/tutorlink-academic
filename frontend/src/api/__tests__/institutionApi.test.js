import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiClient from '../axiosClient';
import { getPublicInstitution, normalizeInstitutionCode } from '../institutionApi';

vi.mock('../axiosClient', () => ({ default: { get: vi.fn() } }));

describe('institutionApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normaliza códigos seguros para enlaces institucionales', () => {
    expect(normalizeInstitutionCode(' benitojuarez ')).toBe('BENITOJUAREZ');
    expect(normalizeInstitutionCode('DEMO15-I1')).toBe('DEMO15-I1');
    expect(normalizeInstitutionCode('../admin')).toBe('');
    expect(normalizeInstitutionCode('')).toBe('');
  });

  it('consulta la institución pública y valida que el código coincida', async () => {
    apiClient.get.mockResolvedValue({ data: { code: 'DEMO15-I1', name: '[Demo] Instituto ficticio 1' } });
    await expect(getPublicInstitution('demo15-i1')).resolves.toEqual({ code: 'DEMO15-I1', name: '[Demo] Instituto ficticio 1' });
    expect(apiClient.get).toHaveBeenCalledWith('/api/public/institutions/DEMO15-I1', { anonymous: true });
  });

  it('rechaza respuestas públicas malformadas o de otro código', async () => {
    apiClient.get.mockResolvedValue({ data: { code: 'OTRA', name: 'Otra' } });
    await expect(getPublicInstitution('DEMO15-I1')).rejects.toThrow(/no coincide/i);
    apiClient.get.mockResolvedValue({ data: { code: 'DEMO15-I1' } });
    await expect(getPublicInstitution('DEMO15-I1')).rejects.toThrow(/confirmar/i);
  });
});
