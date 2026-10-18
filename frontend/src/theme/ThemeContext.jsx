import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../context/useAuth';
import { ThemeContext } from './theme-context';
import { FALLBACK_THEME, validateInstitutionTheme } from './themeUtils';

export default function ThemeProvider({ children, resolveInstitutionTheme = () => null }) {
  const { auth } = useAuth();
  const defaultFavicon = useRef(null);
  // No branding endpoint exists in this phase. The resolver is only an injection
  // point for the future authenticated contract and deterministic tests.
  const theme = !auth.institutionId ? FALLBACK_THEME : validateInstitutionTheme(resolveInstitutionTheme(auth.institutionId, auth));

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--tl-action-primary', theme.colors.primary);
    root.style.setProperty('--tl-action-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--tl-action-positive', theme.colors.positive);
    root.style.setProperty('--tl-brand-green', theme.colors.brandGreen);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      if (defaultFavicon.current === null) defaultFavicon.current = favicon.getAttribute('href') || '';
      favicon.setAttribute('href', theme.faviconUrl || defaultFavicon.current);
    }
    return () => {
      root.style.removeProperty('--tl-action-primary');
      root.style.removeProperty('--tl-action-primary-hover');
      root.style.removeProperty('--tl-action-positive');
      root.style.removeProperty('--tl-brand-green');
    };
  }, [theme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node,
  resolveInstitutionTheme: PropTypes.func,
};
