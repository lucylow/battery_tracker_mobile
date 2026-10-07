import { describe, expect, it } from "vitest";
import { formulaMolarMass, parseChemicalFormula, validateChemicalFormula } from "@/science/chemistry";
import { measurementProbabilities, normalizeAmplitudes, particleInBoxGroundEnergy } from "@/science/quantum";
import { CONCEPTS } from "@/science/concepts";

describe("chemistry concept models", () => {
  it("parses and validates a curated material formula", () => {
    const formula = parseChemicalFormula(" MoS2 ");
    expect(formula).toEqual({ normalized: "MoS2", components: [{ element: "Mo", count: 1 }, { element: "S", count: 2 }] });
    expect(validateChemicalFormula(formula).valid).toBe(true);
    expect(formulaMolarMass(formula).value).toBeCloseTo(160.07, 2);
  });

  it("rejects malformed formula boundaries and unknown elements", () => {
    expect(() => parseChemicalFormula("Mo-2")).toThrow();
    const formula = parseChemicalFormula("Xe2");
    expect(validateChemicalFormula(formula).valid).toBe(false);
    expect(() => formulaMolarMass(formula)).toThrow();
  });
});

describe("quantum concept models", () => {
  it("normalizes amplitudes and returns probabilities that sum to one", () => {
    const normalized = normalizeAmplitudes([{ re: 1, im: 0 }, { re: 1, im: 0 }]);
    const probabilities = measurementProbabilities(normalized.value);
    expect(probabilities.value.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1, 10);
    expect(normalized.validity).toBe("educational-reduced-order");
  });

  it("shows confinement energy increasing as the width shrinks", () => {
    const narrow = particleInBoxGroundEnergy(1).value;
    const wide = particleInBoxGroundEnergy(2).value;
    expect(narrow).toBeGreaterThan(wide);
    expect(particleInBoxGroundEnergy(1).assumptions.join(" ")).toContain("not a band-structure calculation");
  });

  it("exposes chemistry and quantum concepts in the learning catalog", () => {
    expect(CONCEPTS.some((concept) => concept.id === "quantum-confinement")).toBe(true);
    expect(CONCEPTS.some((concept) => concept.id === "formula-mass")).toBe(true);
  });
});
