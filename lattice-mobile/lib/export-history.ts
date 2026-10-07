import type { CaptureExportOptions } from "@/lib/capture-export";

export type ExportFormat = "json" | "bundle";

export type ExportHistoryEntry = {
  id: string;
  captureId: string;
  format: ExportFormat;
  createdAt: string;
  redactions: string[];
  imageContentsStored: false;
};

export function createExportHistoryEntry(captureId: string, format: ExportFormat, options: CaptureExportOptions = {}, createdAt = new Date().toISOString()): ExportHistoryEntry {
  return {
    id: `${captureId}-${format}-${createdAt}`,
    captureId,
    format,
    createdAt,
    redactions: [options.redactLocalUri && "localUri", options.redactNote && "note", options.redactProvenance && "provenance", options.redactAnalysis && "analysis"].filter(Boolean) as string[],
    imageContentsStored: false,
  };
}

export function normalizeExportHistory(value: unknown, limit = 20): ExportHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ExportHistoryEntry => Boolean(item && typeof item === "object" && typeof (item as ExportHistoryEntry).id === "string" && typeof (item as ExportHistoryEntry).captureId === "string" && ((item as ExportHistoryEntry).format === "json" || (item as ExportHistoryEntry).format === "bundle") && typeof (item as ExportHistoryEntry).createdAt === "string" && Array.isArray((item as ExportHistoryEntry).redactions))).map((item) => ({ ...item, redactions: item.redactions.filter((redaction): redaction is string => typeof redaction === "string"), imageContentsStored: false as const })).slice(0, limit);
}

export type ExportHistoryFilter = "all" | "bundle" | "json" | "redacted";
export type ExportHistorySort = "newest" | "oldest";

export function filterExportHistoryByDate(history: ExportHistoryEntry[], from?: string, to?: string) {
  const fromTime = from ? Date.parse(from) : Number.NEGATIVE_INFINITY;
  const toTime = to ? Date.parse(to) + 86_399_999 : Number.POSITIVE_INFINITY;
  return history.filter((entry) => { const time = Date.parse(entry.createdAt); return time >= fromTime && time <= toTime; });
}

export function sortExportHistory(history: ExportHistoryEntry[], sort: ExportHistorySort) {
  return [...history].sort((a, b) => { const delta = Date.parse(a.createdAt) - Date.parse(b.createdAt); return sort === "newest" ? -delta : delta; });
}

export function searchExportHistory(history: ExportHistoryEntry[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return history;
  return history.filter((entry) => [entry.captureId, entry.format, ...entry.redactions].some((value) => value.toLowerCase().includes(normalized)));
}

export function filterExportHistory(history: ExportHistoryEntry[], filter: ExportHistoryFilter) {
  if (filter === "all") return history;
  if (filter === "redacted") return history.filter((entry) => entry.redactions.length > 0);
  return history.filter((entry) => entry.format === filter);
}

export function removeExportHistoryEntry(history: ExportHistoryEntry[], entryId: string) {
  return history.filter((entry) => entry.id !== entryId);
}

export function prependExportHistory(history: ExportHistoryEntry[], entry: ExportHistoryEntry, limit = 20) {
  return normalizeExportHistory([entry, ...history], limit);
}
