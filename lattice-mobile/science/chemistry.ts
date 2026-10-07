export type ChemistryElement = {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  electronegativity?: number;
  category: "nonmetal" | "metalloid" | "transition-metal";
};

export type FormulaComponent = { element: string; count: number };
export type ChemicalFormula = { normalized: string; components: FormulaComponent[] };
export type ChemistryResult<T> = { value: T; assumptions: string[]; validity: "educational-reduced-order" };

export const CHEMISTRY_ELEMENTS: Record<string, ChemistryElement> = {
  H: { symbol: "H", name: "Hydrogen", atomicNumber: 1, atomicMass: 1.008, electronegativity: 2.2, category: "nonmetal" },
  C: { symbol: "C", name: "Carbon", atomicNumber: 6, atomicMass: 12.011, electronegativity: 2.55, category: "nonmetal" },
  N: { symbol: "N", name: "Nitrogen", atomicNumber: 7, atomicMass: 14.007, electronegativity: 3.04, category: "nonmetal" },
  O: { symbol: "O", name: "Oxygen", atomicNumber: 8, atomicMass: 15.999, electronegativity: 3.44, category: "nonmetal" },
  S: { symbol: "S", name: "Sulfur", atomicNumber: 16, atomicMass: 32.06, electronegativity: 2.58, category: "nonmetal" },
  Se: { symbol: "Se", name: "Selenium", atomicNumber: 34, atomicMass: 78.971, electronegativity: 2.55, category: "metalloid" },
  Mo: { symbol: "Mo", name: "Molybdenum", atomicNumber: 42, atomicMass: 95.95, electronegativity: 2.16, category: "transition-metal" },
  W: { symbol: "W", name: "Tungsten", atomicNumber: 74, atomicMass: 183.84, electronegativity: 2.36, category: "transition-metal" },
  B: { symbol: "B", name: "Boron", atomicNumber: 5, atomicMass: 10.81, electronegativity: 2.04, category: "metalloid" },
  Si: { symbol: "Si", name: "Silicon", atomicNumber: 14, atomicMass: 28.085, electronegativity: 1.9, category: "metalloid" },
};

export function parseChemicalFormula(value: string): ChemicalFormula {
  const normalized = value.replace(/\s+/g, "");
  if (!normalized) throw new Error("Enter a chemical formula.");
  const token = /([A-Z][a-z]?)(\d*)/g;
  const components: FormulaComponent[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(normalized))) {
    if (match.index !== cursor) throw new Error("Use element symbols followed by optional integer counts.");
    components.push({ element: match[1], count: Number(match[2] || 1) });
    cursor = token.lastIndex;
  }
  if (cursor !== normalized.length || !components.length) throw new Error("Unsupported or malformed chemical formula.");
  return { normalized, components };
}

export function validateChemicalFormula(formula: ChemicalFormula) {
  const unknown = formula.components.filter((component) => !CHEMISTRY_ELEMENTS[component.element]);
  const invalidCounts = formula.components.filter((component) => !Number.isInteger(component.count) || component.count <= 0);
  return { valid: unknown.length === 0 && invalidCounts.length === 0, unknown, invalidCounts };
}

export function formulaMolarMass(formula: ChemicalFormula): ChemistryResult<number> {
  const validation = validateChemicalFormula(formula);
  if (!validation.valid) throw new Error("Formula contains an unknown element or invalid count.");
  const value = formula.components.reduce((sum, component) => sum + CHEMISTRY_ELEMENTS[component.element].atomicMass * component.count, 0);
  return { value, assumptions: ["Uses the curated LATTICE element registry.", "This is a formula-mass educational calculation, not a measurement."], validity: "educational-reduced-order" };
}

export function bondPolarity(enA: number, enB: number): ChemistryResult<{ delta: number; regime: string }> {
  const delta = Math.abs(enA - enB);
  const regime = delta < 0.4 ? "mostly covalent" : delta < 1.7 ? "polar covalent" : "strongly polar / ionic";
  return { value: { delta, regime }, assumptions: ["Uses an electronegativity-difference heuristic."], validity: "educational-reduced-order" };
}
