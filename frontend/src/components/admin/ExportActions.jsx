import PropTypes from "prop-types";
import { exportAdminListToExcel, exportAdminListToPdf } from "../../utils/adminExport";

export default function ExportActions({ title, fileBaseName, columns, rows }) {
  const disabled = rows.length === 0;
  const exportOptions = { title, fileBaseName, columns, rows };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => exportAdminListToPdf(exportOptions)}
        disabled={disabled}
        aria-label={`Exportar ${title} en PDF`}
        className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <img src="/pdf18.svg" alt="" className="h-4 w-4" />
        Exportar PDF
      </button>
      <button
        type="button"
        onClick={() => exportAdminListToExcel(exportOptions)}
        disabled={disabled}
        aria-label={`Exportar ${title} en Excel`}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <img src="/microsoft-excel-svgrepo-com.svg" alt="" className="h-4 w-4" />
        Exportar Excel
      </button>
    </div>
  );
}

ExportActions.propTypes = {
  title: PropTypes.string.isRequired,
  fileBaseName: PropTypes.string.isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.func.isRequired,
  })).isRequired,
  rows: PropTypes.array.isRequired,
};
