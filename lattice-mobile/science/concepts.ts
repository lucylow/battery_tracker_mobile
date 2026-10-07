export type ConceptDomain = "crystal-structure" | "reciprocal-space" | "electronic" | "phonon" | "exciton" | "moire" | "quantum" | "chemistry";
export type Concept = { id: string; title: string; domain: ConceptDomain; level: "beginner" | "intermediate" | "advanced"; summary: string };
export const CONCEPTS: Concept[] = [
  { id: "unit-cell", title: "Unit cell", domain: "crystal-structure", level: "beginner", summary: "The repeating building block of an idealized crystal." },
  { id: "brillouin-zone", title: "Brillouin zone", domain: "reciprocal-space", level: "intermediate", summary: "The primitive region used to describe reciprocal space." },
  { id: "moire", title: "Moiré superlattice", domain: "moire", level: "intermediate", summary: "A longer-scale pattern arising from twist or mismatch between repeating layers." },
  { id: "exciton", title: "Exciton", domain: "exciton", level: "beginner", summary: "A bound electron–hole excitation; this app does not calculate binding energies." },
  { id: "quantum-confinement", title: "Quantum confinement", domain: "quantum", level: "intermediate", summary: "When a nanoscale dimension changes the allowed energy spacing in a reduced-order well model." },
  { id: "state-probability", title: "State probability", domain: "quantum", level: "beginner", summary: "The squared magnitude of a normalized amplitude gives a basis-state measurement probability." },
  { id: "formula-mass", title: "Formula mass", domain: "chemistry", level: "beginner", summary: "A composition-based sum of curated atomic masses, useful for connecting formulas to material samples." },
  { id: "bond-polarity", title: "Bond polarity", domain: "chemistry", level: "beginner", summary: "An electronegativity-difference heuristic that helps explain chemical contrast without claiming a full bonding calculation." },
];

export function moirePeriod(latticeAngstrom: number, twistDeg: number) { if (latticeAngstrom <= 0) throw new Error("Lattice constant must be positive."); const theta = Math.abs(twistDeg) * Math.PI / 180; return theta < 1e-8 ? Infinity : latticeAngstrom / (2 * Math.sin(theta / 2)); }
export function twistRegime(degrees: number) { const angle = Math.abs(degrees); if (angle < 1) return "ultra-small-angle" as const; if (angle < 5) return "small-angle" as const; if (angle < 15) return "intermediate-angle" as const; return "large-angle" as const; }
export function educationalScopeNote() { return "These helpers describe simplified concepts and are not substitutes for first-principles calculations or measured data."; }
