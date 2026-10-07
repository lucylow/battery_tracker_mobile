import { describe, expect, it } from "vitest";
import { captureRecoveryLabel, countAttentionCaptures, filterCaptureRecords, sortCaptureRecords } from "@/lib/capture-filter";
import type { CaptureRecord } from "@/lib/capture-store";
import type { VisionJob } from "@/vision/queue";
import type { ImageAsset } from "@/vision/types";

const image = (id: string): ImageAsset => ({ id, uri: `file:///${id}.png`, width: 100, height: 100, mimeType: "image/png", createdAt: "2026-08-22T00:00:00.000Z", source: "camera", localOnly: true });
const record = (id: string, mode: CaptureRecord["mode"], note: string): CaptureRecord => ({ id, image: image(id), note, annotations: [], mode, remoteConsent: false, createdAt: "2026-08-22T00:00:00.000Z", provenance: ["Captured in LATTICE"] });
const job = (id: string, status: VisionJob["status"], progress = 0): VisionJob => ({ id: `job-${id}`, image: image(id), mode: "scientific-image", status, progress, consentedToRemoteAnalysis: false });

describe("capture gallery helpers", () => {
  const records = [record("one", "scientific-image", "graphene sample"), record("two", "document", "lab notebook"), record("three", "scale-calibration", "scale bar")];
  const jobs = [job("one", "complete", 1), job("two", "failed"), job("three", "processing", 0.4)];

  it("filters captures by query and mode", () => {
    expect(filterCaptureRecords(records, jobs, "graphene", "all", "all").map((item) => item.id)).toEqual(["one"]);
    expect(filterCaptureRecords(records, jobs, "", "document", "all").map((item) => item.id)).toEqual(["two"]);
  });

  it("filters captures by persisted vision status, including not analyzed", () => {
    expect(filterCaptureRecords(records, jobs, "", "all", "failed").map((item) => item.id)).toEqual(["two"]);
    expect(filterCaptureRecords([...records, record("four", "document", "unprocessed")], jobs, "", "all", "none").map((item) => item.id)).toEqual(["four"]);
  });

  it("sorts attention and analyzed captures deterministically", () => {
    const sortedAttention = sortCaptureRecords(records, jobs, "attention");
    expect(sortedAttention.map((item) => item.id)).toEqual(["two", "three", "one"]);
    const sortedAnalyzed = sortCaptureRecords(records, jobs, "analyzed");
    expect(sortedAnalyzed[0]?.id).toBe("one");
    expect(countAttentionCaptures(records, jobs)).toBe(1);
  });

  it("derives honest recovery labels", () => {
    expect(captureRecoveryLabel(undefined)).toBe("No analysis started");
    expect(captureRecoveryLabel(job("one", "processing", 0.4))).toBe("Analyzing · 40%");
    expect(captureRecoveryLabel(job("two", "failed"))).toBe("Retry available");
    expect(captureRecoveryLabel(job("three", "cancelled"))).toBe("Resume available");
  });
});
