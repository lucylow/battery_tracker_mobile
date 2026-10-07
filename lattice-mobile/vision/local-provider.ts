import type { VisionProvider } from "@/vision/types";

export const localVisionProvider: VisionProvider = { analyze: async (image, mode) => ({ id: `local-result-${Date.now()}`, imageId: image.id, mode, modelId: "local-adapter", modelVersion: "0.0.0", status: "complete", confidence: 0, measurements: [], warnings: ["No verified recognition or measurement was produced.", "Configure an on-device model before using production vision inference."], provenance: ["Local offline adapter", "User consent is not required because the image remains on device"], createdAt: new Date().toISOString() }) };
