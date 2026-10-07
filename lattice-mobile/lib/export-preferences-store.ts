import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_EXPORT_PREFERENCES, normalizeExportPreferences, type ExportPreferences } from "@/lib/export-preferences";

export const EXPORT_PREFERENCES_KEY = "lattice.export-preferences.v1";

export async function loadExportPreferences(): Promise<ExportPreferences> {
  try {
    const raw = await AsyncStorage.getItem(EXPORT_PREFERENCES_KEY);
    return normalizeExportPreferences(raw ? JSON.parse(raw) : undefined);
  } catch {
    return { ...DEFAULT_EXPORT_PREFERENCES };
  }
}

export async function saveExportPreferences(value: ExportPreferences) {
  const normalized = normalizeExportPreferences(value);
  await AsyncStorage.setItem(EXPORT_PREFERENCES_KEY, JSON.stringify(normalized));
  return normalized;
}
