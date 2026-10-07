import { describe, expect, it } from "vitest";
import { createExportHistoryEntry, filterExportHistory, filterExportHistoryByDate, normalizeExportHistory, prependExportHistory, removeExportHistoryEntry, searchExportHistory, sortExportHistory } from "@/lib/export-history";
import { normalizeExportHistoryViewPreferences } from "@/lib/export-history-preferences";

describe("export history", () => {
  it("records only format and redaction metadata", () => {
    const entry = createExportHistoryEntry("capture-1", "bundle", { redactLocalUri: true, redactNote: true }, "2026-08-22T20:00:00.000Z");
    expect(entry).toMatchObject({ captureId: "capture-1", format: "bundle", redactions: ["localUri", "note"], imageContentsStored: false });
    expect(entry).not.toHaveProperty("imageUri");
  });

  it("normalizes malformed history and bounds its length", () => {
    const valid = createExportHistoryEntry("capture-1", "json", {}, "2026-08-22T20:00:00.000Z");
    const malformed = { id: "bad", captureId: "capture-2", format: "unknown", createdAt: "now", redactions: [] };
    expect(normalizeExportHistory([malformed, valid])).toEqual([{ ...valid, imageContentsStored: false }]);
    expect(prependExportHistory([valid], createExportHistoryEntry("capture-2", "bundle", {}, "2026-08-22T20:01:00.000Z"), 1)).toHaveLength(1);
  });

  it("filters and removes metadata entries predictably", () => {
    const json = createExportHistoryEntry("capture-1", "json", {}, "2026-08-22T20:00:00.000Z");
    const bundle = createExportHistoryEntry("capture-1", "bundle", { redactNote: true }, "2026-08-22T20:01:00.000Z");
    const history = [bundle, json];
    expect(filterExportHistory(history, "bundle")).toEqual([bundle]);
    expect(filterExportHistory(history, "redacted")).toEqual([bundle]);
    expect(removeExportHistoryEntry(history, bundle.id)).toEqual([json]);
  });
});


describe("export history refinement", () => {
  it("searches, filters by date, and sorts without mutating history", () => {
    const older = createExportHistoryEntry("capture-older", "json", {}, "2026-08-20T10:00:00.000Z");
    const newer = createExportHistoryEntry("capture-newer", "bundle", { redactNote: true }, "2026-08-22T10:00:00.000Z");
    const history = [older, newer];
    expect(searchExportHistory(history, "newer")).toEqual([newer]);
    expect(filterExportHistoryByDate(history, "2026-08-21", "2026-08-22")).toEqual([newer]);
    expect(sortExportHistory(history, "newest")).toEqual([newer, older]);
    expect(sortExportHistory(history, "oldest")).toEqual([older, newer]);
    expect(history).toEqual([older, newer]);
  });

  it("normalizes invalid view preferences to safe defaults", () => {
    expect(normalizeExportHistoryViewPreferences({ filter: "bad", sort: "bad", from: 4 })).toEqual({ filter: "all", sort: "newest", from: "", to: "", datePreset: "all" });
  });

  it("resets malformed and reversed persisted ranges", () => {
    const reversed = normalizeExportHistoryViewPreferences({ from: "2026-08-22", to: "2026-08-01", datePreset: "custom" });
    const malformed = normalizeExportHistoryViewPreferences({ from: "not-a-date", to: "2026-08-22", datePreset: "custom" });
    expect(reversed).toMatchObject({ from: "", to: "", datePreset: "all" });
    expect(malformed).toMatchObject({ from: "", to: "", datePreset: "all" });
  });
});
