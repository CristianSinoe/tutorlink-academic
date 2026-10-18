import PropTypes from 'prop-types';
import Button from './Button';

export function Alert({ tone = 'error', children, className = '', ...props }) {
  return <div {...props} className={`tl-alert tl-alert-${tone} ${className}`.trim()} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function LoadingState({ label = 'Cargando información…' }) {
  return <div className="tl-state" role="status"><span className="tl-spinner" aria-hidden="true" />{label}</div>;
}

export function EmptyState({ title = 'No hay información disponible', description, children }) {
  return <section className="tl-state tl-state-empty"><h2 className="font-semibold text-slate-900">{title}</h2>{(description || children) && <div className="mt-2 text-sm text-slate-600">{description || children}</div>}</section>;
}

export function ErrorState({ title = 'No pudimos cargar la información', message, children, onRetry }) {
  return <section className="tl-state tl-state-error" role="alert"><h2 className="font-semibold">{title}</h2>{(message || children) && <div className="mt-2 text-sm">{message || children}</div>}{onRetry && <Button variant="secondary" className="mt-4" onClick={onRetry}>Reintentar</Button>}</section>;
}

Alert.propTypes = { tone: PropTypes.oneOf(['error', 'success', 'warning', 'info']), children: PropTypes.node, className: PropTypes.string };
LoadingState.propTypes = { label: PropTypes.string };
EmptyState.propTypes = { title: PropTypes.string, description: PropTypes.node, children: PropTypes.node };
ErrorState.propTypes = { title: PropTypes.string, message: PropTypes.node, children: PropTypes.node, onRetry: PropTypes.func };
