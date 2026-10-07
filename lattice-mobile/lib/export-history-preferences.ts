import type { ExportHistoryFilter, ExportHistorySort } from "@/lib/export-history";

export const DEFAULT_EXPORT_HISTORY_FILTER: ExportHistoryFilter = "all";
export const DEFAULT_EXPORT_HISTORY_SORT: ExportHistorySort = "newest";

export type ExportHistoryDatePreset = "all" | "today" | "sevenDays" | "thirtyDays" | "custom";
export type ExportHistoryViewPreferences = { filter: ExportHistoryFilter; sort: ExportHistorySort; from: string; to: string; datePreset: ExportHistoryDatePreset };

export const DEFAULT_EXPORT_HISTORY_VIEW_PREFERENCES: ExportHistoryViewPreferences = { filter: DEFAULT_EXPORT_HISTORY_FILTER, sort: DEFAULT_EXPORT_HISTORY_SORT, from: "", to: "", datePreset: "all" };

export function normalizeExportHistoryFilter(value: unknown): ExportHistoryFilter {
  return value === "bundle" || value === "json" || value === "redacted" ? value : DEFAULT_EXPORT_HISTORY_FILTER;
}

export function normalizeExportHistorySort(value: unknown): ExportHistorySort {
  return value === "oldest" ? "oldest" : DEFAULT_EXPORT_HISTORY_SORT;
}

export function normalizeExportHistoryDatePreset(value: unknown): ExportHistoryDatePreset {
  return value === "today" || value === "sevenDays" || value === "thirtyDays" || value === "custom" ? value : "all";
}

export function normalizeDateInput(value: string) {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "";
  const parsed = Date.parse(`${trimmed}T00:00:00.000Z`);
  return Number.isNaN(parsed) ? "" : trimmed;
}

export type ExportHistoryDateValidation = "valid" | "empty" | "invalid" | "reversed";

export function validateExportHistoryDateRange(from: string, to: string): ExportHistoryDateValidation {
  if (!from && !to) return "empty";
  const normalizedFrom = normalizeDateInput(from);
  const normalizedTo = normalizeDateInput(to);
  if ((from && !normalizedFrom) || (to && !normalizedTo)) return "invalid";
  if (normalizedFrom && normalizedTo && Date.parse(normalizedFrom) > Date.parse(normalizedTo)) return "reversed";
  return "valid";
}

export function dateRangeForPreset(preset: ExportHistoryDatePreset, now = new Date()) {
  if (preset === "all" || preset === "custom") return { from: "", to: "" };
  const end = new Date(now);
  const start = new Date(now);
  if (preset === "today") start.setHours(0, 0, 0, 0);
  if (preset === "sevenDays") start.setDate(start.getDate() - 6);
  if (preset === "thirtyDays") start.setDate(start.getDate() - 29);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export type NormalizedExportHistoryPreferences = { preferences: ExportHistoryViewPreferences; repaired: boolean };

export function normalizeExportHistoryViewPreferencesWithStatus(value: unknown): NormalizedExportHistoryPreferences {
  if (!value || typeof value !== "object") return { preferences: { ...DEFAULT_EXPORT_HISTORY_VIEW_PREFERENCES }, repaired: Boolean(value) };
  const candidate = value as Partial<ExportHistoryViewPreferences>;
  const requestedPreset = normalizeExportHistoryDatePreset(candidate.datePreset);
  const candidateFrom = typeof candidate.from === "string" ? normalizeDateInput(candidate.from) : "";
  const candidateTo = typeof candidate.to === "string" ? normalizeDateInput(candidate.to) : "";
  const hasInvalidRange = (candidate.from && !candidateFrom) || (candidate.to && !candidateTo);
  const hasReversedRange = candidateFrom && candidateTo && Date.parse(candidateFrom) > Date.parse(candidateTo);
  const safeRange = hasInvalidRange || hasReversedRange ? { from: "", to: "", datePreset: "all" as ExportHistoryDatePreset } : { from: candidateFrom, to: candidateTo, datePreset: requestedPreset };
  const preferences = { filter: normalizeExportHistoryFilter(candidate.filter), sort: normalizeExportHistorySort(candidate.sort), ...safeRange };
  return { preferences, repaired: candidate.filter !== preferences.filter || candidate.sort !== preferences.sort || candidate.from !== preferences.from || candidate.to !== preferences.to || candidate.datePreset !== preferences.datePreset };
}

export function normalizeExportHistoryViewPreferences(value: unknown): ExportHistoryViewPreferences {
  return normalizeExportHistoryViewPreferencesWithStatus(value).preferences;
}
