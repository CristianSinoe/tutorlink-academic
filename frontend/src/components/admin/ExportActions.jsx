import PropTypes from "prop-types";
import { exportAdminListToExcel, exportAdminListToPdf } from "../../utils/adminExport";
import Button from '../ui/Button';
import ActionIcon from '../ui/ActionIcon';

export default function ExportActions({ title, fileBaseName, columns, rows }) {
  const disabled = rows.length === 0;
  const exportOptions = { title, fileBaseName, columns, rows };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="danger"
        type="button"
        onClick={() => exportAdminListToPdf(exportOptions)}
        disabled={disabled}
        aria-label={`Exportar ${title} en PDF`}
        className="gap-2"
      >
        <ActionIcon name="pdf" />
        Exportar <span className="sr-only">PDF</span>
      </Button>
      <Button variant="positive"
        type="button"
        onClick={() => exportAdminListToExcel(exportOptions)}
        disabled={disabled}
        aria-label={`Exportar ${title} en Excel`}
        className="gap-2"
      >
        <ActionIcon name="excel" />
        Exportar <span className="sr-only">Excel</span>
      </Button>
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
