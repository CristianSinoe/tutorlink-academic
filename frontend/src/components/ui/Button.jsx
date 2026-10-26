import PropTypes from 'prop-types';

const variants = {
  primary: 'tl-button-primary',
  secondary: 'tl-button-secondary',
  positive: 'tl-button-positive',
  danger: 'tl-button-danger',
  dangerSubtle: 'tl-button-danger-subtle',
  ghost: 'tl-button-ghost',
};

export default function Button({ variant = 'primary', busy = false, iconOnly = false, children, className = '', disabled, ...props }) {
  return <button {...props} aria-busy={busy || undefined} disabled={disabled || busy} className={`${variants[variant]} ${iconOnly ? 'tl-button-icon-only' : ''} ${className}`.trim()}>
    {busy ? iconOnly ? <span className="tl-spinner" aria-hidden="true" /> : 'Procesando…' : children}
  </button>;
}

Button.propTypes = {
  variant: PropTypes.oneOf(Object.keys(variants)), busy: PropTypes.bool, iconOnly: PropTypes.bool, children: PropTypes.node,
  className: PropTypes.string, disabled: PropTypes.bool,
};
