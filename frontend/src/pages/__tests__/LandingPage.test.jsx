import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import LandingPage from '../LandingPage.jsx';
import { renderWithProviders } from '../../test/test-utils.jsx';

describe('LandingPage', () => {
  it('presenta la vista pública sin activar navegación ni llamadas de acceso', () => {
    renderWithProviders(<LandingPage />, { route: '/' });
    expect(screen.getByRole('heading', { name: /el acompañamiento académico empieza aquí/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /conocer tutorlink/i })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: /soluciones/i })).toHaveAttribute('href', '#soluciones');
  });
});
