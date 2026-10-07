export type ConceptProgressState = { completedConcepts: string[] };

export const DEFAULT_CONCEPT_PROGRESS: ConceptProgressState = { completedConcepts: [] };

export function normalizeConceptProgress(value: unknown): ConceptProgressState {
  if (!value || typeof value !== "object") return DEFAULT_CONCEPT_PROGRESS;
  const raw = (value as { completedConcepts?: unknown }).completedConcepts;
  if (!Array.isArray(raw)) return DEFAULT_CONCEPT_PROGRESS;
  return { completedConcepts: [...new Set(raw.filter((item): item is string => typeof item === "string" && item.trim().length > 0))].slice(0, 100) };
}

export function resetConceptProgress(): ConceptProgressState {
  return { ...DEFAULT_CONCEPT_PROGRESS };
}

export function toggleConceptCompletion(completedConcepts: string[], conceptId: string): string[] {
  const normalizedId = conceptId.trim();
  if (!normalizedId) return completedConcepts;
  return completedConcepts.includes(normalizedId)
    ? completedConcepts.filter((id) => id !== normalizedId)
    : [...completedConcepts, normalizedId].slice(-100);
}

export function conceptCompletionLabel(completed: boolean) {
  return completed ? "Explored" : "Mark as explored";
}

export function conceptCompletionCount(completedConcepts: string[], total: number) {
  return `${Math.min(new Set(completedConcepts).size, total)} of ${total} explored`;
}
