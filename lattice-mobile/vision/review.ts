import type { ImageAsset } from "@/vision/types";

export type Annotation = { id: string; type: "note" | "box" | "arrow"; text?: string; x?: number; y?: number; width?: number; height?: number };
export type ScaleCalibration = { pixels: number; physicalValue: number; unit: string; confidence: number };

export function calibrationFactor(calibration: ScaleCalibration) { return calibration.pixels > 0 ? calibration.physicalValue / calibration.pixels : null; }
export function pixelToPhysical(calibration: ScaleCalibration, pixels: number) { const factor = calibrationFactor(calibration); return factor === null ? null : pixels * factor; }
export function clampNormalized(value: number) { return Math.min(1, Math.max(0, value)); }
export function normalizeAnnotationPoint(x: number, y: number, width: number, height: number): Pick<Annotation, "x" | "y"> { return { x: clampNormalized(width > 0 ? x / width : 0), y: clampNormalized(height > 0 ? y / height : 0) }; }
export function calibrationGuide(calibration: ScaleCalibration | null, image: ImageAsset) { if (!calibration || image.width <= 0 || image.height <= 0) return null; const width = clampNormalized(calibration.pixels / image.width); return { x: 0.08, y: 0.88, width: Math.max(0.08, width), label: `${calibration.pixels}px = ${calibration.physicalValue}${calibration.unit}` }; }
export function createLocalReview(image: ImageAsset, annotations: Annotation[], consentedToRemoteAnalysis: boolean) { return { imageId: image.id, localOnly: !consentedToRemoteAnalysis, annotations, createdAt: new Date().toISOString(), provenance: ["Captured in LATTICE", "Image-model measurements require calibration and remain assistive"] }; }
