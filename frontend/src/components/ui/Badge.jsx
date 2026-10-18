import PropTypes from 'prop-types';

const tones = {
  neutral: 'bg-slate-100 text-slate-700', success: 'bg-emerald-100 text-emerald-800',
  info: 'bg-blue-100 text-blue-800', warning: 'bg-amber-100 text-amber-900', error: 'bg-red-100 text-red-800',
  teacher: 'bg-indigo-100 text-indigo-900', tutor: 'bg-purple-100 text-purple-900', student: 'bg-cyan-100 text-cyan-900',
};

export default function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`.trim()}>{children}</span>;
}

Badge.propTypes = { tone: PropTypes.oneOf(Object.keys(tones)), children: PropTypes.node, className: PropTypes.string };
