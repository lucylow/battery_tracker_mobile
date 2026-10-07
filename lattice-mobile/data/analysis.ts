export type DataValue = number | string | boolean | null;
export type DataColumn = { name: string; type: "numeric" | "categorical" | "datetime" | "boolean" | "text"; unit?: string; nullable: boolean };
export type Dataset = { id: string; name: string; schemaVersion: string; columns: DataColumn[]; rows: Record<string, DataValue>[]; source: { kind: "experiment" | "simulation" | "manual"; provenance: string[] }; createdAt: string; updatedAt: string };

export function validateDataset(dataset: Dataset): string[] {
  const errors: string[] = [];
  const names = new Set<string>();
  for (const column of dataset.columns) { if (names.has(column.name)) errors.push(`Duplicate column: ${column.name}`); names.add(column.name); }
  for (const [index, row] of dataset.rows.entries()) for (const column of dataset.columns) if (!(column.name in row)) errors.push(`Row ${index + 1} is missing ${column.name}`);
  return errors;
}

export type NumericSummary = { count: number; mean: number; min: number; max: number; missing: number };
export function summarize(values: Array<number | null>): NumericSummary {
  const clean = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return { count: clean.length, mean: clean.length ? clean.reduce((sum, value) => sum + value, 0) / clean.length : NaN, min: clean.length ? Math.min(...clean) : NaN, max: clean.length ? Math.max(...clean) : NaN, missing: values.length - clean.length };
}

export function iqrOutliers(values: number[]) {
  const clean = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (clean.length < 4) return values.map((value, index) => ({ index, value, outlier: false }));
  const quantile = (fraction: number) => clean[Math.floor((clean.length - 1) * fraction)];
  const q1 = quantile(0.25); const q3 = quantile(0.75); const spread = q3 - q1;
  const low = q1 - 1.5 * spread; const high = q3 + 1.5 * spread;
  return values.map((value, index) => ({ index, value, outlier: Number.isFinite(value) && (value < low || value > high) }));
}

export function experimentDataset(rows: Record<string, DataValue>[]): Dataset {
  return { id: "local-active-experiment", name: "Active experiment outputs", schemaVersion: "1.0", rows, columns: [{ name: "twistAngle", type: "numeric", unit: "°", nullable: false }, { name: "moirePeriod", type: "numeric", unit: "Å", nullable: false }, { name: "mismatch", type: "numeric", unit: "fraction", nullable: false }], source: { kind: "experiment", provenance: ["active persisted experiment", "deterministic reduced-order model"] }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
