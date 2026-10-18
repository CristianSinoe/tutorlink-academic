import PropTypes from 'prop-types';

const variants = {
  primary: 'tl-button-primary',
  secondary: 'tl-button-secondary',
  positive: 'tl-button-positive',
  danger: 'tl-button-danger',
  ghost: 'tl-button-ghost',
};

export default function Button({ variant = 'primary', busy = false, children, className = '', disabled, ...props }) {
  return <button {...props} disabled={disabled || busy} className={`${variants[variant]} ${className}`.trim()}>
    {busy ? 'Procesando…' : children}
  </button>;
}

Button.propTypes = {
  variant: PropTypes.oneOf(Object.keys(variants)), busy: PropTypes.bool, children: PropTypes.node,
  className: PropTypes.string, disabled: PropTypes.bool,
};
