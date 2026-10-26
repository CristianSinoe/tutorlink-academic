import PropTypes from 'prop-types';

const paths = {
  trash: <><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="m16 3 5 5-12 12-6 1 1-6L16 3ZM13 6l5 5" /></>,
  unlink: <><path d="m10 7 2-2a5 5 0 0 1 7 7l-2 2M14 17l-2 2a5 5 0 0 1-7-7l2-2M4 4l16 16" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
  pdf: <><path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5" /><text x="12" y="16" textAnchor="middle" fill="currentColor" stroke="none" fontSize="6.5" fontWeight="700" fontFamily="Arial, sans-serif">PDF</text></>,
  excel: <><path d="M14 2H5v20h14V7l-5-5ZM14 2v5h5M9 11l6 7m0-7-6 7" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.2 1.8c-1.2.8-1.7 1.1-1.7 2.7M12 17h.01" /></>,
};

export default function ActionIcon({ name }) {
  return <svg className="tl-action-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
ActionIcon.propTypes = { name: PropTypes.oneOf(Object.keys(paths)).isRequired };
