export type Material = {
  id: string;
  name: string;
  formula: string;
  category: string;
  dimensionality: string;
  latticeConstant: number;
  accent: string;
  tags: string[];
  aliases: string[];
};

export type ExperimentParameters = {
  layerA: Material;
  layerB: Material;
  twistAngle: number;
  strain: number;
  interlayerSpacing: number;
  temperature: number;
};

export type UnitValue<Unit extends string = string> = { value: number; unit: Unit };
export type ResultProvenance = { modelId: string; modelVersion: string; validity: "reduced-order" | "curated" | "external"; assumptions: string[]; provenance: string[]; uncertainty?: UnitValue };

export type ModeledResults = {
  moirePeriod: number;
  mismatch: number;
  symmetry: string;
  bandGapTendency: string;
  excitonicTendency: string;
  phononBehavior: string;
  opticalHint: string;
  provenance: ResultProvenance;
};

export const MATERIALS: Material[] = [
  { id: "wse2", name: "Tungsten diselenide", formula: "WSe₂", category: "Transition-metal dichalcogenide", dimensionality: "2D monolayer", latticeConstant: 3.28, accent: "#9B8CFF", tags: ["semiconductor", "exciton"], aliases: ["WSe2"] },
  { id: "ws2", name: "Tungsten disulfide", formula: "WS₂", category: "Transition-metal dichalcogenide", dimensionality: "2D monolayer", latticeConstant: 3.15, accent: "#65E6E0", tags: ["semiconductor", "optical"], aliases: ["WS2"] },
  { id: "graphene", name: "Graphene", formula: "C", category: "Carbon material", dimensionality: "2D monolayer", latticeConstant: 2.46, accent: "#FFC76B", tags: ["conductive", "hexagonal"], aliases: ["graphene"] },
  { id: "mos2", name: "Molybdenum disulfide", formula: "MoS₂", category: "Transition-metal dichalcogenide", dimensionality: "2D monolayer", latticeConstant: 3.16, accent: "#F48FB1", tags: ["semiconductor", "monolayer"], aliases: ["MoS2"] },
];

export const DEMO_EXPERIMENT: ExperimentParameters = {
  layerA: MATERIALS[0],
  layerB: MATERIALS[1],
  twistAngle: 2,
  strain: 0,
  interlayerSpacing: 0.62,
  temperature: 295,
};

export function estimateResults(parameters: ExperimentParameters): ModeledResults {
  const mismatch = Math.abs(parameters.layerA.latticeConstant - parameters.layerB.latticeConstant) / parameters.layerA.latticeConstant;
  const radians = (parameters.twistAngle * Math.PI) / 180;
  const denominator = Math.max(1e-4, Math.sqrt((2 * Math.sin(radians / 2)) ** 2 + mismatch ** 2));
  const moirePeriod = Math.min(120, Math.max(1, parameters.layerA.latticeConstant / denominator));
  const alignment = mismatch < 0.015 ? "close lattice alignment" : "noticeable lattice mismatch";
  const bandGapTendency = parameters.twistAngle < 3 ? "narrower modeled tendency" : "shifted modeled tendency";
  const excitonicTendency = parameters.interlayerSpacing < 0.7 ? "stronger interlayer tendency" : "more layer-local tendency";
  const phononBehavior = parameters.temperature > 320 ? "higher thermal activity" : "lower thermal activity";
  const opticalHint = parameters.twistAngle < 5 ? "enhanced low-angle optical contrast" : "broader illustrative response";
  return { moirePeriod, mismatch, symmetry: alignment, bandGapTendency, excitonicTendency, phononBehavior, opticalHint, provenance: { modelId: "lattice-moire-reduced-order", modelVersion: "0.2.0", validity: "reduced-order", assumptions: ["Hexagonal geometry is approximated from scalar lattice constants.", "Electronic, excitonic, phonon, and optical labels are qualitative tendencies."], provenance: ["curated local material metadata", "deterministic TypeScript model"], uncertainty: { value: Math.max(0.1, moirePeriod * 0.08), unit: "angstrom" } } };
}
