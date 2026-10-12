export function filterOptions(rows, field) {
  const values = new Map();
  rows.forEach((row) => {
    const value = String(row[field] ?? "").trim();
    if (value) values.set(value.toLocaleLowerCase("es"), value);
  });
  return [...values.values()].sort((a, b) => a.localeCompare(b, "es", { numeric: true, sensitivity: "base" }));
}

export function matchesOption(value, selected) {
  return selected === "ALL" || String(value ?? "").trim().toLocaleLowerCase("es") === selected.toLocaleLowerCase("es");
}

export function matchesAssignment(assigned, selected) {
  return selected === "ALL" || (selected === "YES") === (assigned === true);
}
