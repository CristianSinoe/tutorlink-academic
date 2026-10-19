import PropTypes from 'prop-types';

/** Shared label, help and error linkage for existing form controls. */
export default function Field({ id, label, hint, error, required = false, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return <div className="tl-field space-y-1.5">
    <label htmlFor={id} className="block text-sm font-semibold text-slate-700">{label}{required && <span aria-hidden="true"> *</span>}</label>
    {children({ id, 'aria-invalid': Boolean(error) || undefined, 'aria-describedby': [hintId, errorId].filter(Boolean).join(' ') || undefined })}
    {hint && <p id={hintId} className="text-xs text-slate-600">{hint}</p>}
    {error && <p id={errorId} className="text-xs font-medium text-red-700">{error}</p>}
  </div>;
}

Field.propTypes = { id: PropTypes.string.isRequired, label: PropTypes.node.isRequired, hint: PropTypes.node, error: PropTypes.node, required: PropTypes.bool, children: PropTypes.func.isRequired };
