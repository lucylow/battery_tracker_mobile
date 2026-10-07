import { moirePeriod, twistRegime, type Concept, type ConceptDomain } from "./concepts";
import { particleInBoxProbability } from "./quantum";

export type ConceptFilter = "all" | ConceptDomain;

export function filterConcepts(concepts: Concept[], query: string, filter: ConceptFilter = "all") {
  const normalized = query.trim().toLowerCase();
  return concepts.filter((concept) => {
    const matchesFilter = filter === "all" || concept.domain === filter;
    const haystack = `${concept.title} ${concept.domain} ${concept.level} ${concept.summary}`.toLowerCase();
    return matchesFilter && (!normalized || haystack.includes(normalized));
  });
}

export function conceptDomainLabel(domain: ConceptDomain) {
  return domain === "moire" ? "Moiré" : domain.replace("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function wavefunctionProbabilitySamples(sampleCount = 17, quantumNumber = 1) {
  if (!Number.isInteger(sampleCount) || sampleCount < 3) throw new Error("Sample count must be an integer of at least 3.");
  return Array.from({ length: sampleCount }, (_, index) => {
    const position = index / (sampleCount - 1);
    return { position, probability: particleInBoxProbability(position, quantumNumber).value };
  });
}

export function moireScaleContext(latticeAngstrom: number, twistDeg: number) {
  const period = moirePeriod(latticeAngstrom, twistDeg);
  return { periodAngstrom: period, periodNanometers: Number.isFinite(period) ? period / 10 : Infinity, regime: twistRegime(twistDeg), validity: "educational-reduced-order" as const };
}
