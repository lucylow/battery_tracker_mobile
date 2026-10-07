export type ComplexAmplitude = { re: number; im: number };
export type QuantumResult<T> = { value: T; units: string; assumptions: string[]; validity: "educational-reduced-order" };

export const QUANTUM_CONSTANTS = {
  hbar: 1.054571817e-34,
  electronMass: 9.1093837139e-31,
  jouleToEv: 1 / 1.602176634e-19,
} as const;

export function normalizeAmplitudes(amplitudes: ComplexAmplitude[]): QuantumResult<ComplexAmplitude[]> {
  const norm = Math.sqrt(amplitudes.reduce((sum, amplitude) => sum + amplitude.re ** 2 + amplitude.im ** 2, 0));
  if (norm <= 0) throw new Error("Cannot normalize a zero state.");
  return { value: amplitudes.map((amplitude) => ({ re: amplitude.re / norm, im: amplitude.im / norm })), units: "dimensionless", assumptions: ["Finite basis state vector.", "Normalization is exact for the supplied amplitudes."], validity: "educational-reduced-order" };
}

export function measurementProbabilities(amplitudes: ComplexAmplitude[]): QuantumResult<number[]> {
  const raw = amplitudes.map((amplitude) => amplitude.re ** 2 + amplitude.im ** 2);
  const total = raw.reduce((sum, value) => sum + value, 0);
  if (total <= 0) throw new Error("Probability requires a non-zero state.");
  return { value: raw.map((value) => value / total), units: "probability", assumptions: ["Measurement basis is the supplied finite basis."], validity: "educational-reduced-order" };
}

export function particleInBoxGroundEnergy(widthNm: number, effectiveMassRatio = 1): QuantumResult<number> {
  if (widthNm <= 0 || effectiveMassRatio <= 0) throw new Error("Width and effective mass ratio must be positive.");
  const widthMeters = widthNm * 1e-9;
  const joules = (Math.PI ** 2 * QUANTUM_CONSTANTS.hbar ** 2) / (2 * QUANTUM_CONSTANTS.electronMass * effectiveMassRatio * widthMeters ** 2);
  return { value: joules * QUANTUM_CONSTANTS.jouleToEv, units: "eV", assumptions: ["One-dimensional infinite quantum well.", "Ground state n = 1.", "Effective mass is expressed as a multiple of the electron mass.", "Educational reduced-order model; not a band-structure calculation."], validity: "educational-reduced-order" };
}

export function particleInBoxProbability(positionFraction: number, quantumNumber = 1): QuantumResult<number> {
  if (quantumNumber < 1 || !Number.isInteger(quantumNumber) || positionFraction < 0 || positionFraction > 1) throw new Error("Position fraction must be between 0 and 1, with an integer quantum number.");
  const amplitude = Math.sqrt(2) * Math.sin(quantumNumber * Math.PI * positionFraction);
  return { value: amplitude ** 2, units: "relative probability density", assumptions: ["One-dimensional infinite quantum well.", "Position is normalized to the well width."], validity: "educational-reduced-order" };
}
