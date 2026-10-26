import { afterEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import DeploymentGate from '../../DeploymentGate';

afterEach(() => { delete window.__TUTORLINK_CONFIG__; });
it('does not mount authentication or API consumers before deployment configuration is ready', () => {
  const mounted = vi.fn();
  function Consumer() { mounted(); return <div>Login funcional</div>; }
  window.__TUTORLINK_CONFIG__ = { deploymentPending: true, apiBaseUrl: '', recaptchaSiteKey: '' };
  render(<DeploymentGate><Consumer /></DeploymentGate>);
  expect(screen.getByRole('heading', { name: 'Frontend disponible' })).toBeInTheDocument();
  expect(mounted).not.toHaveBeenCalled();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
});
it('preserves normal application behavior when runtime configuration is ready or in development', () => {
  window.__TUTORLINK_CONFIG__ = { deploymentPending: false };
  render(<DeploymentGate><h1>Aplicación lista</h1></DeploymentGate>);
  expect(screen.getByRole('heading', { name: 'Aplicación lista' })).toBeInTheDocument();
});
