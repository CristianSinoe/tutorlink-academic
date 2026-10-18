import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ThemeProvider from '../ThemeContext';
import useTheme from '../useTheme';
import { AuthContext } from '../../context/auth-context';
import { FALLBACK_THEME, validateInstitutionTheme } from '../themeUtils';

function Probe() {
  const theme = useTheme();
  return <output data-testid="theme">{theme.colors.primary}|{theme.logoUrl || 'default'}</output>;
}
function renderTheme(auth, resolver) {
  return render(<AuthContext.Provider value={{ auth }}><ThemeProvider resolveInstitutionTheme={resolver}><Probe /></ThemeProvider></AuthContext.Provider>);
}
const baseAuth = { institutionId: 1, generation: 1, token: 'token' };

describe('ThemeProvider', () => {
  it('uses TutorLink while no server branding contract is supplied', () => {
    renderTheme(baseAuth);
    expect(screen.getByTestId('theme')).toHaveTextContent('#18529D|default');
  });

  it('rejects unsafe colors and assets', () => {
    const theme = validateInstitutionTheme({ primaryColor: '#28AD56', secondaryColor: '#ffffff', logoUrl: 'http://invalid.test/logo.svg', faviconUrl: 'https://user:secret@example.test/a.svg' });
    expect(theme.colors.primary).toBe(FALLBACK_THEME.colors.primary);
    expect(theme.logoUrl).toBeNull();
    expect(theme.faviconUrl).toBeNull();
  });

  it('resets the institution identity to TutorLink before a new institution has a valid theme', () => {
    const resolver = id => id === 1 ? { primaryColor: '#18529D', logoUrl: 'https://assets.example.test/logo.svg' } : null;
    const view = renderTheme(baseAuth, resolver);
    expect(screen.getByTestId('theme')).toHaveTextContent('#18529D|https://assets.example.test/logo.svg');
    view.rerender(<AuthContext.Provider value={{ auth: { ...baseAuth, institutionId: 2, generation: 2 } }}><ThemeProvider resolveInstitutionTheme={resolver}><Probe /></ThemeProvider></AuthContext.Provider>);
    expect(screen.getByTestId('theme')).toHaveTextContent('#18529D|default');
  });
});
