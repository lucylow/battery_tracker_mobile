import type { CaptureExportOptions } from "@/lib/capture-export";

export type ExportPreferences = Required<CaptureExportOptions>;

export const DEFAULT_EXPORT_PREFERENCES: ExportPreferences = {
  redactLocalUri: false,
  redactNote: false,
  redactProvenance: false,
  redactAnalysis: false,
};

export function normalizeExportPreferences(value: unknown): ExportPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_EXPORT_PREFERENCES };
  const candidate = value as Partial<ExportPreferences>;
  return {
    redactLocalUri: candidate.redactLocalUri === true,
    redactNote: candidate.redactNote === true,
    redactProvenance: candidate.redactProvenance === true,
    redactAnalysis: candidate.redactAnalysis === true,
  };
}

export function redactAllPreferences(): ExportPreferences {
  return { redactLocalUri: true, redactNote: true, redactProvenance: true, redactAnalysis: true };
}
