import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

function displayValue(value) {
  if (value === undefined || value === null || value === "") {
    return "—";
  }

  return String(value);
}

function fileName(name, extension) {
  const date = new Date().toISOString().slice(0, 10);
  return `${name}-${date}.${extension}`;
}

function exportRows(columns, rows) {
  return rows.map((row) => Object.fromEntries(
    columns.map((column) => [column.label, displayValue(column.value(row))]),
  ));
}

export function exportAdminListToExcel({ title, fileBaseName, columns, rows }) {
  const worksheet = XLSX.utils.json_to_sheet(exportRows(columns, rows));
  worksheet["!cols"] = columns.map((column) => ({
    wch: Math.max(column.label.length + 2, 18),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));
  XLSX.writeFile(workbook, fileName(fileBaseName, "xlsx"));
}

export function exportAdminListToPdf({ title, fileBaseName, columns, rows }) {
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  document.setFontSize(16);
  document.text(title, 14, 16);
  document.setFontSize(9);
  document.text(`Registros exportados: ${rows.length}`, 14, 23);

  autoTable(document, {
    startY: 28,
    head: [columns.map((column) => column.label)],
    body: rows.map((row) => columns.map((column) => displayValue(column.value(row)))),
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [24, 82, 157] },
    margin: { left: 10, right: 10 },
  });
  document.save(fileName(fileBaseName, "pdf"));
}
