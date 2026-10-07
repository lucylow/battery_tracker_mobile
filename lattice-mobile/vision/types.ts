export type CameraMode = "capture" | "document" | "scientific-image" | "scale-calibration" | "qr" | "material-scan";
export type InferenceStatus = "idle" | "queued" | "processing" | "complete" | "failed" | "cancelled";
export type ImageAsset = { id: string; uri: string; width: number; height: number; mimeType: string; createdAt: string; source: "camera" | "library" | "import"; localOnly: boolean };
export type VisionMeasurement = { label: string; value: number; unit: string; confidence: number; calibrated: boolean };
export type VisionResult = { id: string; imageId: string; mode: CameraMode; modelId: string; modelVersion: string; status: InferenceStatus; confidence?: number; measurements: VisionMeasurement[]; warnings: string[]; provenance: string[]; createdAt: string };
export type VisionProvider = { analyze: (image: ImageAsset, mode: CameraMode) => Promise<VisionResult> };

export function confidenceBand(value: number) { return value >= 0.85 ? "high" as const : value >= 0.6 ? "medium" as const : "low" as const; }
export function captureGuidance(mode: CameraMode) { if (mode === "document") return "Fill the frame with the page and keep it flat."; if (mode === "scientific-image" || mode === "material-scan") return "Center the sample and minimize glare."; if (mode === "scale-calibration") return "Include a known scale bar before measuring."; return "Keep the subject steady and well lit."; }
export function localImageAsset(uri: string, width = 0, height = 0, source: ImageAsset["source"] = "camera"): ImageAsset { return { id: `image-${Date.now()}`, uri, width, height, mimeType: "image/*", createdAt: new Date().toISOString(), source, localOnly: true }; }
