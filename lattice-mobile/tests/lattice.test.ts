import { describe, expect, it } from "vitest";
import { DEMO_EXPERIMENT, estimateResults } from "@/domain/lattice";

describe("LATTICE educational model", () => {
  it("produces finite, bounded moiré estimates", () => {
    const results = estimateResults(DEMO_EXPERIMENT);
    expect(Number.isFinite(results.moirePeriod)).toBe(true);
    expect(results.moirePeriod).toBeGreaterThanOrEqual(1);
    expect(results.moirePeriod).toBeLessThanOrEqual(120);
  });

  it("responds deterministically to twist angle", () => {
    const first = estimateResults({ ...DEMO_EXPERIMENT, twistAngle: 2 });
    const second = estimateResults({ ...DEMO_EXPERIMENT, twistAngle: 2 });
    const changed = estimateResults({ ...DEMO_EXPERIMENT, twistAngle: 10 });
    expect(first).toEqual(second);
    expect(changed.moirePeriod).not.toEqual(first.moirePeriod);
  });
});
