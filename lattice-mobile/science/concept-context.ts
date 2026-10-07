import { MATERIALS, type Material } from "@/domain/lattice";
import { CONCEPTS, educationalScopeNote, type Concept } from "./concepts";

export type ConceptContext = {
  id: string;
  whyItMatters: string;
  inspect: string;
  modelLabel: string;
  suggestedMaterialIds: string[];
  labPrompt: string;
};

const RELATED_IDS: Record<string, string[]> = {
  "unit-cell": ["moire", "brillouin-zone"],
  "brillouin-zone": ["unit-cell", "quantum-confinement"],
  moire: ["unit-cell", "exciton"],
  exciton: ["moire", "quantum-confinement"],
  "quantum-confinement": ["state-probability", "exciton"],
  "state-probability": ["quantum-confinement", "brillouin-zone"],
  "formula-mass": ["bond-polarity", "unit-cell"],
  "bond-polarity": ["formula-mass", "exciton"],
};

const CONTEXTS: Record<string, Omit<ConceptContext, "id">> = {
  "unit-cell": {
    whyItMatters: "A unit cell is the compact repeating description behind a larger idealized crystal pattern.",
    inspect: "Start with lattice constants and ask which assumptions remain when a real sample contains defects, edges, or multiple phases.",
    modelLabel: "Curated structural concept",
    suggestedMaterialIds: ["graphene", "ws2"],
    labPrompt: "Use a pair of hexagonal materials to connect real-space repetition to a moiré experiment.",
  },
  "brillouin-zone": {
    whyItMatters: "The Brillouin zone organizes wave-like behavior in reciprocal space rather than by position alone.",
    inspect: "Use it as a map for how periodicity constrains allowed wavevectors; this atlas does not calculate a band structure.",
    modelLabel: "Educational reciprocal-space scope",
    suggestedMaterialIds: ["graphene", "wse2"],
    labPrompt: "Compare the lattice pairing, then use the Lab to reason about how mismatch changes the repeat scale.",
  },
  moire: {
    whyItMatters: "A small twist or lattice mismatch can create a much longer repeat pattern than either layer has alone.",
    inspect: "The atlas uses a reduced-order period estimate; treat it as intuition-building context, not a measured superlattice constant.",
    modelLabel: "Reduced-order educational model",
    suggestedMaterialIds: ["wse2", "ws2"],
    labPrompt: "Open the Lab to vary twist angle and observe the modeled moiré period with its assumptions visible.",
  },
  exciton: {
    whyItMatters: "An exciton is a bound electron–hole excitation that helps connect optical response to layered materials.",
    inspect: "Material tags can suggest excitonic relevance, but LATTICE does not calculate binding energies or lifetimes.",
    modelLabel: "Curated qualitative concept",
    suggestedMaterialIds: ["wse2", "ws2"],
    labPrompt: "Use the Lab as a qualitative comparison surface; do not interpret its optical or excitonic hints as measurements.",
  },
  "quantum-confinement": {
    whyItMatters: "Reducing a dimension can increase the spacing between allowed states in a simple confinement model.",
    inspect: "The educational well model isolates width and quantum number effects while omitting material-specific potentials.",
    modelLabel: "Reduced-order educational model",
    suggestedMaterialIds: ["wse2", "mos2"],
    labPrompt: "Pair the concept with a material detail, then use the Lab to keep the broader layered-material context in view.",
  },
  "state-probability": {
    whyItMatters: "The squared magnitude of a normalized amplitude gives a probability density in the selected basis.",
    inspect: "The atlas visualization is normalized and one-dimensional, so it is a teaching aid rather than a detector readout.",
    modelLabel: "Normalized educational model",
    suggestedMaterialIds: ["graphene"],
    labPrompt: "Use the Lab for material context and return here when you want to revisit the probability interpretation.",
  },
  "formula-mass": {
    whyItMatters: "Formula mass turns a chemical composition into a reproducible sum using curated atomic masses.",
    inspect: "Parsing and mass estimates support sample literacy; they do not identify phases, defects, or stoichiometric uncertainty.",
    modelLabel: "Curated chemistry calculation",
    suggestedMaterialIds: ["wse2", "ws2", "mos2"],
    labPrompt: "Open a material detail to inspect its formula, then use the Lab to connect composition to layered behavior.",
  },
  "bond-polarity": {
    whyItMatters: "Electronegativity differences provide a compact heuristic for discussing chemical contrast.",
    inspect: "The heuristic is not a full charge, bond-order, or electronic-structure calculation.",
    modelLabel: "Educational chemistry heuristic",
    suggestedMaterialIds: ["mos2", "wse2"],
    labPrompt: "Compare curated formulas first, then explore a material pairing without treating the result as a quantum-chemistry prediction.",
  },
};

export function conceptContext(id: string): ConceptContext | null {
  const context = CONTEXTS[id];
  return context ? { id, ...context } : null;
}

export function relatedConcepts(id: string): Concept[] {
  return (RELATED_IDS[id] ?? [])
    .map((relatedId) => CONCEPTS.find((concept) => concept.id === relatedId))
    .filter((concept): concept is Concept => Boolean(concept));
}

export function conceptMaterials(context: ConceptContext): Material[] {
  return context.suggestedMaterialIds
    .map((id) => MATERIALS.find((material) => material.id === id))
    .filter((material): material is Material => Boolean(material));
}

export function conceptScopeNote() {
  return educationalScopeNote();
}
