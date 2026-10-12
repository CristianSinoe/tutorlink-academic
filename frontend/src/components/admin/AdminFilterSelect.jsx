import PropTypes from "prop-types";

export default function AdminFilterSelect({ id, label, value, onChange, options, allLabel = "Todos" }) {
  return (
    <div className="w-full min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-slate-700">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-uvBlue"
      >
        <option value="ALL">{allLabel}</option>
        {options.map((option) => {
          const item = typeof option === "string" ? { value: option, label: option } : option;
          return <option key={item.value} value={item.value}>{item.label}</option>;
        })}
      </select>
    </div>
  );
}

AdminFilterSelect.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  ])).isRequired,
  allLabel: PropTypes.string,
};
