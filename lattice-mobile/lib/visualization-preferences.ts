import type { RenderQuality } from "@/visual3d/analytical";

export type VisualizationPreferences = { quality: RenderQuality; showAxes: boolean; showLegend: boolean };
export const DEFAULT_VISUALIZATION_PREFERENCES: VisualizationPreferences = { quality: "medium", showAxes: true, showLegend: true };

export function normalizeVisualizationPreferences(value: unknown): VisualizationPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_VISUALIZATION_PREFERENCES };
  const raw = value as Partial<VisualizationPreferences>;
  return { quality: raw.quality === "low" || raw.quality === "high" ? raw.quality : "medium", showAxes: typeof raw.showAxes === "boolean" ? raw.showAxes : true, showLegend: typeof raw.showLegend === "boolean" ? raw.showLegend : true };
}

export function normalizeVisualizationPreferencesWithStatus(value: unknown) {
  const preferences = normalizeVisualizationPreferences(value);
  const repaired = JSON.stringify(value ?? null) !== JSON.stringify(preferences);
  return { preferences, repaired };
}

export function resetVisualizationPreferenceState(): VisualizationPreferences {
  return { ...DEFAULT_VISUALIZATION_PREFERENCES };
}
