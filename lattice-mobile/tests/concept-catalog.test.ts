import { describe, expect, it } from "vitest";
import { CONCEPTS } from "@/science/concepts";
import { conceptDomainLabel, filterConcepts, moireScaleContext, wavefunctionProbabilitySamples } from "@/science/concept-catalog";

describe("concept catalog helpers", () => {
  it("filters by query and domain without mutating the catalog", () => {
    const original = [...CONCEPTS];
    expect(filterConcepts(CONCEPTS, "formula", "all").map((concept) => concept.id)).toEqual(["formula-mass"]);
    expect(filterConcepts(CONCEPTS, "", "quantum").every((concept) => concept.domain === "quantum")).toBe(true);
    expect(CONCEPTS).toEqual(original);
  });

  it("uses learner-friendly domain labels", () => {
    expect(conceptDomainLabel("reciprocal-space")).toBe("Reciprocal Space");
    expect(conceptDomainLabel("moire")).toBe("Moiré");
  });

  it("creates bounded wavefunction samples with expected boundary conditions", () => {
    const samples = wavefunctionProbabilitySamples(9);
    expect(samples).toHaveLength(9);
    expect(samples[0].probability).toBeCloseTo(0, 10);
    expect(samples.at(-1)?.probability).toBeCloseTo(0, 10);
    expect(samples[4].probability).toBeCloseTo(2, 10);
  });

  it("preserves explicit reduced-order metadata for moiré context", () => {
    const context = moireScaleContext(3.2, 2);
    expect(context.periodNanometers).toBeGreaterThan(0);
    expect(context.validity).toBe("educational-reduced-order");
  });
});
