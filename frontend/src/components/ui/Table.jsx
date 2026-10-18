import PropTypes from 'prop-types';

/** Preserves actions on narrow screens by providing an explicitly labelled scroll region. */
export default function Table({ label, children, className = '' }) {
  return <div className="overflow-x-auto" role="region" aria-label={label} tabIndex="0"><table className={`min-w-full text-left text-sm ${className}`.trim()}>{children}</table></div>;
}

Table.propTypes = { label: PropTypes.string.isRequired, children: PropTypes.node, className: PropTypes.string };
