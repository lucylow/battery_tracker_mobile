import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeVisualizationPreferences, normalizeVisualizationPreferencesWithStatus, resetVisualizationPreferenceState, type VisualizationPreferences } from "@/lib/visualization-preferences";

export const VISUALIZATION_PREFERENCES_KEY = "lattice.visualization-preferences.v1";

export async function loadVisualizationPreferencesWithStatus(): Promise<{ preferences: VisualizationPreferences; repaired: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(VISUALIZATION_PREFERENCES_KEY);
    const parsed = raw ? JSON.parse(raw) : undefined;
    const result = normalizeVisualizationPreferencesWithStatus(parsed);
    if (result.repaired) await saveVisualizationPreferences(result.preferences);
    return result;
  } catch {
    return { preferences: resetVisualizationPreferenceState(), repaired: true };
  }
}

export async function loadVisualizationPreferences() {
  return (await loadVisualizationPreferencesWithStatus()).preferences;
}

export async function saveVisualizationPreferences(value: VisualizationPreferences) {
  const normalized = normalizeVisualizationPreferences(value);
  await AsyncStorage.setItem(VISUALIZATION_PREFERENCES_KEY, JSON.stringify(normalized));
  return normalized;
}

export async function resetVisualizationPreferences() {
  const defaults = resetVisualizationPreferenceState();
  await AsyncStorage.setItem(VISUALIZATION_PREFERENCES_KEY, JSON.stringify(defaults));
  return defaults;
}
