import PropTypes from 'prop-types';

export default function Card({ children, className = '', ...props }) {
  return <section {...props} className={`tl-card ${className}`.trim()}>{children}</section>;
}

Card.propTypes = { children: PropTypes.node, className: PropTypes.string };
