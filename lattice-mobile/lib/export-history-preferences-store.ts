import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_EXPORT_HISTORY_VIEW_PREFERENCES, normalizeExportHistoryFilter, normalizeExportHistoryViewPreferences, normalizeExportHistoryViewPreferencesWithStatus, type ExportHistoryViewPreferences } from "@/lib/export-history-preferences";
import type { ExportHistoryFilter, ExportHistorySort } from "@/lib/export-history";

export const EXPORT_HISTORY_FILTER_KEY = "lattice.export-history-filter.v1";
export const EXPORT_HISTORY_VIEW_KEY = "lattice.export-history-view.v1";

export async function loadExportHistoryFilter(): Promise<ExportHistoryFilter> {
  try { return normalizeExportHistoryFilter(await AsyncStorage.getItem(EXPORT_HISTORY_FILTER_KEY)); } catch { return DEFAULT_EXPORT_HISTORY_VIEW_PREFERENCES.filter; }
}

export async function saveExportHistoryFilter(filter: ExportHistoryFilter) {
  await AsyncStorage.setItem(EXPORT_HISTORY_FILTER_KEY, filter);
  return filter;
}

export async function loadExportHistoryViewPreferencesWithStatus(): Promise<{ preferences: ExportHistoryViewPreferences; repaired: boolean }> {
  try {
    const raw = await AsyncStorage.getItem(EXPORT_HISTORY_VIEW_KEY);
    return normalizeExportHistoryViewPreferencesWithStatus(raw ? JSON.parse(raw) : undefined);
  } catch { return { preferences: { ...DEFAULT_EXPORT_HISTORY_VIEW_PREFERENCES }, repaired: true }; }
}

export async function loadExportHistoryViewPreferences(): Promise<ExportHistoryViewPreferences> {
  return (await loadExportHistoryViewPreferencesWithStatus()).preferences;
}

export async function saveExportHistoryViewPreferences(value: ExportHistoryViewPreferences) {
  const normalized = normalizeExportHistoryViewPreferences(value);
  await AsyncStorage.setItem(EXPORT_HISTORY_VIEW_KEY, JSON.stringify(normalized));
  return normalized;
}

export type { ExportHistorySort };
