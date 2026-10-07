import type { CaptureRecord } from "@/lib/capture-store";
import type { VisionJob } from "@/vision/queue";

export type CaptureExportOptions = { redactLocalUri?: boolean; redactNote?: boolean; redactProvenance?: boolean; redactAnalysis?: boolean };

export function captureBundleManifest(record: CaptureRecord) {
  return { schemaVersion: "lattice-capture-bundle-1", files: ["annotated-capture.png", "provenance.json"], captureId: record.id, imageFormat: "image/png", includesAnnotations: true, includesProvenance: true };
}

export function formatExportSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function captureBundlePreview(record: CaptureRecord, options: CaptureExportOptions = {}) {
  const estimatedPngBytes = record.image.width * record.image.height * 4;
  const estimatedBundleBytes = estimatedPngBytes + 2048;
  return { files: captureBundleManifest(record).files, imageLabel: "Rendered annotated PNG", sidecarLabel: "Provenance JSON", manifestLabel: "Bundle manifest", localUri: options.redactLocalUri ? "Redacted in sidecar" : "Included in sidecar", redactions: [options.redactNote && "note", options.redactProvenance && "provenance", options.redactAnalysis && "analysis"].filter(Boolean) as string[], uploadBehavior: "No upload; shared as a local file bundle", dimensions: `${record.image.width} × ${record.image.height}px`, estimatedPngBytes, estimatedBundleBytes };
}

export function captureShareReview(record: CaptureRecord, options: CaptureExportOptions = {}) {
  const bundle = captureBundlePreview(record, options);
  return { imageContext: bundle.dimensions, files: bundle.files, redactions: bundle.redactions, uploadBehavior: bundle.uploadBehavior, localUri: bundle.localUri, estimatedPngBytes: bundle.estimatedPngBytes, estimatedBundleBytes: bundle.estimatedBundleBytes };
}

export function exportCapabilityStatus(platform: "web" | "ios" | "android", available: boolean | null) {
  if (available === null) return { state: "checking" as const, label: "Checking share support", guidance: "LATTICE is checking whether this device or browser can open a share sheet." };
  if (platform === "web") return available ? { state: "fallback" as const, label: "Web JSON fallback", guidance: "The browser can share text, but local bundle files stay on-device; use the JSON sidecar here." } : { state: "unavailable" as const, label: "Sharing unavailable", guidance: "This browser cannot open a share sheet. Nothing will be uploaded automatically." };
  return available ? { state: "ready" as const, label: "Native file sharing ready", guidance: "The device can open the share sheet for the local PNG + JSON bundle." } : { state: "fallback" as const, label: "Native JSON fallback", guidance: "File sharing is unavailable, so LATTICE will preserve privacy and offer the JSON sidecar instead." };
}

export function exportCapabilityMeaning(state: "checking" | "ready" | "fallback" | "unavailable") {
  if (state === "checking") return "Support is being checked locally before sharing.";
  if (state === "ready") return "This device can share the rendered PNG and JSON together.";
  if (state === "fallback") return "LATTICE will use a JSON sidecar when bundle sharing is unavailable.";
  return "Sharing is unavailable here; no export will be sent automatically.";
}

export function exportReadiness(platform: "web" | "ios" | "android") {
  if (platform === "web") return { bundleSupported: false, label: "Web fallback", guidance: "JSON sidecar sharing is available here; native bundle sharing uses the device file share sheet." };
  return { bundleSupported: true, label: "Native sharing", guidance: "PNG + JSON bundles use the device file share sheet; if unavailable, LATTICE falls back to the JSON sidecar." };
}

export function exportFailureMessage(format: "json" | "bundle") {
  const label = format === "bundle" ? "PNG + JSON bundle" : "JSON sidecar";
  return `${label} could not be prepared. Nothing was shared; you can retry without changing your privacy choices.`;
}

export function exportRetryLabel(format: "json" | "bundle") {
  return `Retry ${format === "bundle" ? "bundle" : "JSON"} export`;
}

export function shareOutcomeMessage(outcome: "shared" | "cancelled", format: "json" | "bundle") {
  const label = format === "bundle" ? "PNG + JSON bundle" : "JSON sidecar";
  return outcome === "shared" ? `${label} is ready in the device share sheet.` : `${label} sharing was cancelled; nothing was sent.`;
}

export function captureExportPreview(record: CaptureRecord, job?: VisionJob, options: CaptureExportOptions = {}) {
  return { imageSource: record.image.source, localUri: options.redactLocalUri ? "Redacted" : record.image.uri, annotationCount: record.annotations.length, calibration: record.calibration ? `${record.calibration.pixels}px = ${record.calibration.physicalValue}${record.calibration.unit}` : "Not provided", analysisStatus: job?.status ?? "none", provenanceCount: record.provenance.length, uploadBehavior: "No image upload", annotationPackage: "Markers and labels included in JSON" };
}

export function captureJson(record: CaptureRecord, job?: VisionJob, options: CaptureExportOptions = {}) {
  const image = options.redactLocalUri ? { ...record.image, uri: "redacted://local-image-uri" } : record.image;
  return JSON.stringify({
    schemaVersion: "lattice-capture-1",
    exportedAt: new Date().toISOString(),
    privacy: { imageTransfer: "none", localUriRedacted: Boolean(options.redactLocalUri), note: "This export contains local observations and annotation metadata; LATTICE does not upload the image." },
    capture: { id: record.id, image, mode: record.mode, note: options.redactNote ? "[redacted]" : record.note, annotations: record.annotations, calibration: record.calibration, createdAt: record.createdAt },
    analysis: options.redactAnalysis ? { status: "redacted" } : job ? { id: job.id, status: job.status, progress: job.progress, result: job.result, error: job.error } : { status: "none" },
    provenance: options.redactProvenance ? ["[redacted]"] : record.provenance,
  }, null, 2);
}
