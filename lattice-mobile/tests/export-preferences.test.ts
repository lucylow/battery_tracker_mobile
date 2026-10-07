import { describe, expect, it } from "vitest";
import { DEFAULT_EXPORT_PREFERENCES, normalizeExportPreferences, redactAllPreferences } from "@/lib/export-preferences";

describe("export preferences", () => {
  it("normalizes malformed values to safe booleans", () => {
    expect(normalizeExportPreferences({ redactLocalUri: true, redactNote: "yes", redactAnalysis: 1 })).toEqual({ ...DEFAULT_EXPORT_PREFERENCES, redactLocalUri: true });
    expect(normalizeExportPreferences(null)).toEqual(DEFAULT_EXPORT_PREFERENCES);
  });

  it("provides a complete redact-all preset", () => {
    expect(redactAllPreferences()).toEqual({ redactLocalUri: true, redactNote: true, redactProvenance: true, redactAnalysis: true });
  });
});
