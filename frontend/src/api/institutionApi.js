import apiClient from './axiosClient';

const CODE_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,58}[A-Za-z0-9])?$/;

export function normalizeInstitutionCode(value) {
  if (typeof value !== 'string') return '';
  const code = value.trim();
  return CODE_PATTERN.test(code) ? code.toUpperCase() : '';
}

export async function getPublicInstitution(rawCode) {
  const code = normalizeInstitutionCode(rawCode);
  if (!code) throw new Error('El enlace institucional no es válido.');
  const { data } = await apiClient.get(`/api/public/institutions/${encodeURIComponent(code)}`, { anonymous: true });
  if (!data || typeof data.code !== 'string' || typeof data.name !== 'string' || !data.name.trim()) {
    throw new Error('No se pudo confirmar la institución del enlace.');
  }
  const responseCode = normalizeInstitutionCode(data.code);
  if (responseCode !== code) throw new Error('La institución del enlace no coincide.');
  return { code: responseCode, name: data.name.trim() };
}
