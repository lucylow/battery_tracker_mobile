import { describe, expect, it } from "vitest";
import { conceptContext, conceptMaterials, conceptScopeNote, relatedConcepts } from "@/science/concept-context";
import { conceptCompletionCount, conceptCompletionLabel, normalizeConceptProgress, toggleConceptCompletion } from "@/lib/concept-progress";
import { captureBundleManifest, captureBundlePreview, captureExportPreview, captureShareReview, captureJson, exportCapabilityMeaning, exportCapabilityStatus, exportFailureMessage, exportReadiness, exportRetryLabel, formatExportSize, shareOutcomeMessage } from "@/lib/capture-export";

const image = { id: "image-1", uri: "file:///sample.png", width: 100, height: 100, mimeType: "image/png", createdAt: "2026-08-22T00:00:00.000Z", source: "camera" as const, localOnly: true };
const record = { id: "capture-1", image, note: "moire sample", annotations: [{ id: "mark-1", type: "arrow" as const, x: 0.4, y: 0.5, text: "domain" }], mode: "scientific-image", remoteConsent: false, createdAt: "2026-08-22T00:00:00.000Z", provenance: ["Captured in LATTICE"], calibration: { pixels: 200, physicalValue: 50, unit: "nm", confidence: 0.5 } };
const job = { id: "job-1", image, mode: "scientific-image" as const, status: "failed" as const, progress: 0.15, consentedToRemoteAnalysis: false, error: "offline" };

describe("concept progress", () => {
  it("normalizes malformed local progress and bounds duplicate IDs", () => {
    expect(normalizeConceptProgress({ completedConcepts: ["moire", "moire", 7, ""] })).toEqual({ completedConcepts: ["moire"] });
    expect(normalizeConceptProgress({ completedConcepts: "moire" })).toEqual({ completedConcepts: [] });
  });

  it("toggles completion without creating blank IDs", () => {
    expect(toggleConceptCompletion([], " moire ")).toEqual(["moire"]);
    expect(toggleConceptCompletion(["moire"], "moire")).toEqual([]);
    expect(toggleConceptCompletion([], "   ")).toEqual([]);
    expect(conceptCompletionLabel(true)).toBe("Explored");
    expect(conceptCompletionCount(["moire", "moire"], 8)).toBe("1 of 8 explored");
  });
});

describe("concept detail context", () => {
  it("resolves grounded context and curated material links", () => {
    const context = conceptContext("moire");
    expect(context?.modelLabel).toContain("Reduced-order");
    expect(conceptMaterials(context!)).toEqual(expect.arrayContaining([expect.objectContaining({ id: "wse2" }), expect.objectContaining({ id: "ws2" })]));
    expect(conceptScopeNote()).toContain("not substitutes");
  });

  it("returns a curated, non-self related path", () => {
    expect(relatedConcepts("moire").map((concept) => concept.id)).toEqual(["unit-cell", "exciton"]);
    expect(relatedConcepts("moire").every((concept) => concept.id !== "moire")).toBe(true);
  });

  it("fails safely for unknown concept routes", () => {
    expect(conceptContext("not-a-concept")).toBeNull();
  });
});

describe("local capture export", () => {
  it("includes annotations, calibration, job state, and provenance", () => {
    const payload = JSON.parse(captureJson(record, job));
    expect(payload.schemaVersion).toBe("lattice-capture-1");
    expect(payload.capture.annotations[0].text).toBe("domain");
    expect(payload.capture.calibration.unit).toBe("nm");
    expect(payload.analysis.status).toBe("failed");
    expect(payload.provenance).toEqual(["Captured in LATTICE"]);
  });

  it("summarizes image context and deterministic size estimates", () => {
    const preview = captureBundlePreview(record);
    expect(preview.dimensions).toBe("100 × 100px");
    expect(preview.estimatedPngBytes).toBe(40000);
    expect(preview.estimatedBundleBytes).toBe(42048);
    expect(formatExportSize(preview.estimatedBundleBytes)).toBe("41.1 KB");
    expect(captureBundlePreview(record, { redactLocalUri: true }).localUri).toBe("Redacted in sidecar");
  });

  it("describes the bundled PNG and JSON sidecar manifest", () => {
    expect(captureBundleManifest(record)).toEqual({ schemaVersion: "lattice-capture-bundle-1", files: ["annotated-capture.png", "provenance.json"], captureId: "capture-1", imageFormat: "image/png", includesAnnotations: true, includesProvenance: true });
  });

  it("previews annotation packaging and supports local URI redaction", () => {
    const preview = captureExportPreview(record, job, { redactLocalUri: true });
    expect(preview.localUri).toBe("Redacted");
    expect(preview.annotationPackage).toContain("JSON");
    expect(preview.uploadBehavior).toBe("No image upload");
    const payload = JSON.parse(captureJson(record, job, { redactLocalUri: true }));
    expect(payload.privacy.localUriRedacted).toBe(true);
    expect(payload.capture.image.uri).toBe("redacted://local-image-uri");
  });

  it("prepares a final review with files, sizes, and active redactions", () => {
    const review = captureShareReview(record, { redactNote: true });
    expect(review.files).toEqual(["annotated-capture.png", "provenance.json"]);
    expect(review.estimatedBundleBytes).toBe(42048);
    expect(review.redactions).toEqual(["note"]);
  });

  it("describes runtime capability states without implying uploads", () => {
    expect(exportCapabilityStatus("ios", null).state).toBe("checking");
    expect(exportCapabilityStatus("ios", true).state).toBe("ready");
    expect(exportCapabilityStatus("web", true).label).toBe("Web JSON fallback");
    expect(exportCapabilityStatus("android", false).guidance).toContain("preserve privacy");
  });

  it("explains every capability state without implying upload", () => {
    expect(exportCapabilityMeaning("checking")).toContain("locally");
    expect(exportCapabilityMeaning("ready")).toContain("PNG and JSON");
    expect(exportCapabilityMeaning("fallback")).toContain("JSON sidecar");
    expect(exportCapabilityMeaning("unavailable")).toContain("automatically");
  });

  it("describes platform readiness and JSON fallback", () => {
    expect(exportReadiness("web")).toMatchObject({ bundleSupported: false, label: "Web fallback" });
    expect(exportReadiness("ios").guidance).toContain("falls back to the JSON sidecar");
  });

  it("keeps failure and retry messaging explicit", () => {
    expect(exportFailureMessage("bundle")).toContain("Nothing was shared");
    expect(exportRetryLabel("json")).toBe("Retry JSON export");
    expect(shareOutcomeMessage("cancelled", "json")).toContain("cancelled");
  });

  it("declares that the export has no image-transfer side effect", () => {
    const payload = JSON.parse(captureJson(record));
    expect(payload.privacy.imageTransfer).toBe("none");
    expect(payload.capture.image.uri).toBe("file:///sample.png");
    expect(payload.analysis.status).toBe("none");
  });
});
