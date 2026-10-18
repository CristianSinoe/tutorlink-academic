export const FALLBACK_THEME = Object.freeze({
  colors: { primary: '#18529D', primaryHover: '#123F79', positive: '#166534', brandGreen: '#28AD56' },
  logoUrl: null, sidebarLogoUrl: null, loginLogoUrl: null, faviconUrl: null,
});

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const HTTPS_URL = /^https:\/\/[^\s#@]+$/i;
function luminance(hex) {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
    .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}
function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
function validUrl(value) { return typeof value === 'string' && value.length <= 2048 && HTTPS_URL.test(value) ? value : null; }

/** Validates a future server-provided brand; unsafe values always fall back. */
export function validateInstitutionTheme(candidate) {
  if (!candidate || typeof candidate !== 'object') return FALLBACK_THEME;
  const primary = candidate.primaryColor;
  const secondary = candidate.secondaryColor;
  return {
    colors: {
      primary: HEX_COLOR.test(primary || '') && contrast(primary, '#FFFFFF') >= 4.5 ? primary : FALLBACK_THEME.colors.primary,
      primaryHover: FALLBACK_THEME.colors.primaryHover,
      positive: FALLBACK_THEME.colors.positive,
      brandGreen: HEX_COLOR.test(secondary || '') && contrast('#0F172A', secondary) >= 4.5 ? secondary : FALLBACK_THEME.colors.brandGreen,
    },
    logoUrl: validUrl(candidate.logoUrl), sidebarLogoUrl: validUrl(candidate.sidebarLogoUrl),
    loginLogoUrl: validUrl(candidate.loginLogoUrl), faviconUrl: validUrl(candidate.faviconUrl),
  };
}
