export function getApiBaseUrl() {
  return globalThis.window?.__TUTORLINK_CONFIG__?.apiBaseUrl ?? import.meta.env.VITE_API_BASE_URL;
}

export function isDeploymentPending() {
  return globalThis.window?.__TUTORLINK_CONFIG__?.deploymentPending === true;
}

export function getRecaptchaSiteKey() {
  return (globalThis.window?.__TUTORLINK_CONFIG__?.recaptchaSiteKey ?? import.meta.env.VITE_RECAPTCHA_SITE_KEY)?.trim() || '';
}
