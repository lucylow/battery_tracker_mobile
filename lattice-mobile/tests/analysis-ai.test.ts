import { describe, expect, it } from "vitest";
import { experimentDataset, iqrOutliers, summarize, validateDataset } from "@/data/analysis";
import { routeAITask } from "@/ai/tasks";
import { assertNoPlaceholder, containsPlaceholder } from "@/data/runtime";
import { moirePeriod, twistRegime } from "@/science/concepts";
import { isRTL, resolveLocale, translate } from "@/i18n";
import { captureGuidance, confidenceBand, localImageAsset } from "@/vision/types";

describe("LATTICE local analysis", () => {
  it("validates the active experiment dataset shape", () => {
    const dataset = experimentDataset([{ twistAngle: 2, moirePeriod: 31, mismatch: 0.01 }]);
    expect(validateDataset(dataset)).toEqual([]);
    expect(dataset.source.kind).toBe("experiment");
  });
  it("summarizes finite values and tracks missing values", () => {
    expect(summarize([1, 3, null, 5]).mean).toBe(3);
    expect(summarize([1, 3, null, 5]).missing).toBe(1);
  });
  it("does not call a small sample an outlier", () => {
    expect(iqrOutliers([1, 2, 3]).every((item) => !item.outlier)).toBe(true);
  });
});

describe("LATTICE runtime and concepts", () => {
  it("detects placeholder content without rejecting curated records", () => {
    expect(containsPlaceholder({ name: "Demo Experiment" })).toBe(true);
    expect(() => assertNoPlaceholder({ name: "Graphene" })).not.toThrow();
  });
  it("keeps moiré concept helpers bounded and interpretable", () => {
    expect(moirePeriod(3.2, 2)).toBeGreaterThan(moirePeriod(3.2, 10));
    expect(twistRegime(0.5)).toBe("ultra-small-angle");
  });
});

describe("LATTICE multilingual and vision boundaries", () => {
  it("falls back safely and exposes RTL metadata", () => {
    expect(resolveLocale("fr-CA")).toBe("fr-FR");
    expect(translate("fr-FR", "nav.lab")).toBe("Laboratoire");
    expect(translate("fr-FR", "missing.key")).toBe("missing.key");
    expect(isRTL("ar")).toBe(true);
  });
  it("keeps capture guidance and provenance explicit", () => {
    expect(captureGuidance("scale-calibration")).toContain("scale bar");
    expect(confidenceBand(0.5)).toBe("low");
    expect(localImageAsset("file://local.jpg").localOnly).toBe(true);
  });
});

describe("LATTICE AI task routing", () => {
  it("routes explanation, teaching, and comparison questions", () => {
    expect(routeAITask("Why did the result change?")).toBe("explain");
    expect(routeAITask("What is a moire pattern?")).toBe("teach");
    expect(routeAITask("Compare these two experiments")).toBe("compare");
  });
});
