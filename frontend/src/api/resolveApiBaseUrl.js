import { getApiBaseUrl } from '../config/runtimeConfig';

function normalizeConfiguredApiBaseUrl(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export function resolveApiBaseUrl() {
  const configuredBaseUrl = normalizeConfiguredApiBaseUrl(
    getApiBaseUrl(),
  );

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  if (globalThis.window === undefined) {
    return "http://localhost:8080";
  }

  return `${globalThis.window.location.protocol}//${globalThis.window.location.hostname}:8080`;
}
