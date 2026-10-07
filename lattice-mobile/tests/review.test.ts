import { describe, expect, it } from "vitest";
import { calibrationGuide, clampNormalized, normalizeAnnotationPoint, pixelToPhysical } from "@/vision/review";
import type { ImageAsset } from "@/vision/types";

const image: ImageAsset = { id: "image-1", uri: "file:///sample.png", width: 1000, height: 500, mimeType: "image/png", createdAt: "2026-08-22T00:00:00.000Z", source: "camera", localOnly: true };

describe("capture annotation and calibration helpers", () => {
  it("clamps touch points to normalized image coordinates", () => {
    expect(normalizeAnnotationPoint(250, 125, 1000, 500)).toEqual({ x: 0.25, y: 0.25 });
    expect(normalizeAnnotationPoint(-10, 700, 1000, 500)).toEqual({ x: 0, y: 1 });
    expect(clampNormalized(2)).toBe(1);
  });

  it("creates an assistive guide proportional to the source image", () => {
    const guide = calibrationGuide({ pixels: 200, physicalValue: 50, unit: "nm", confidence: 0.5 }, image);
    expect(guide).toEqual({ x: 0.08, y: 0.88, width: 0.2, label: "200px = 50nm" });
    expect(calibrationGuide(null, image)).toBeNull();
  });

  it("keeps calibration conversion explicit and positive-only", () => {
    const calibration = { pixels: 200, physicalValue: 50, unit: "nm", confidence: 0.5 };
    expect(pixelToPhysical(calibration, 100)).toBe(25);
    expect(pixelToPhysical({ ...calibration, pixels: 0 }, 100)).toBeNull();
  });
});
