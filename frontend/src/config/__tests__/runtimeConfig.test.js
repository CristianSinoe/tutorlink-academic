import { afterEach, describe, expect, it, vi } from 'vitest';
import { getApiBaseUrl, getRecaptchaSiteKey } from '../runtimeConfig';
import { resolveApiBaseUrl } from '../../api/resolveApiBaseUrl';
afterEach(() => { delete window.__TUTORLINK_CONFIG__; vi.unstubAllEnvs(); });
describe('Configuración pública de la imagen Docker', () => {
  it('prioriza los valores de runtime sobre el build y no cambia de imagen', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://old.example.org');
    window.__TUTORLINK_CONFIG__ = { apiBaseUrl: 'https://api.example.org', recaptchaSiteKey: 'public-key' };
    expect(getApiBaseUrl()).toBe('https://api.example.org');
    expect(resolveApiBaseUrl()).toBe('https://api.example.org');
    expect(getRecaptchaSiteKey()).toBe('public-key');
  });
  it('conserva Vite en desarrollo sin archivo generado', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8080');
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', ' local-key ');
    expect(getApiBaseUrl()).toBe('http://localhost:8080');
    expect(getRecaptchaSiteKey()).toBe('local-key');
  });
});
