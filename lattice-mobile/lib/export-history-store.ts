import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeExportHistory, prependExportHistory, removeExportHistoryEntry, type ExportHistoryEntry } from "@/lib/export-history";

export const EXPORT_HISTORY_KEY = "lattice.export-history.v1";

export async function loadExportHistory(): Promise<ExportHistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(EXPORT_HISTORY_KEY);
    return normalizeExportHistory(raw ? JSON.parse(raw) : undefined);
  } catch {
    return [];
  }
}

export async function appendExportHistory(entry: ExportHistoryEntry) {
  const history = await loadExportHistory();
  const next = prependExportHistory(history, entry);
  await AsyncStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function removeExportHistory(id: string) {
  const next = removeExportHistoryEntry(await loadExportHistory(), id);
  await AsyncStorage.setItem(EXPORT_HISTORY_KEY, JSON.stringify(next));
  return next;
}

export async function clearExportHistory() {
  await AsyncStorage.removeItem(EXPORT_HISTORY_KEY);
  return [];
}
