// src/utils/dateUtils.js

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  // 08/12/2025 → si quieres exactamente 08-12-2025, abajo hay otra opción
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Si quieres fecha y hora, tipo 08-12-2025 11:35
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // 24h
  });
}

// Si quieres EXACTAMENTE con guiones: 08-12-2025
export function formatDateWithDashes(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
