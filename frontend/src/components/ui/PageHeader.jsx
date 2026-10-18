import PropTypes from 'prop-types';

export default function PageHeader({ title, description, actions, eyebrow }) {
  return <header className="tl-page-header">
    <div>{eyebrow && <p className="tl-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p>{description}</p>}</div>
    {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
  </header>;
}

PageHeader.propTypes = { title: PropTypes.string.isRequired, description: PropTypes.node, actions: PropTypes.node, eyebrow: PropTypes.string };
