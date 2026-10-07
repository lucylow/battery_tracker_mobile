import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { filterExportHistory, filterExportHistoryByDate, searchExportHistory, sortExportHistory, type ExportHistoryFilter, type ExportHistoryEntry, type ExportHistorySort } from "@/lib/export-history";
import { clearExportHistory, loadExportHistory, removeExportHistory } from "@/lib/export-history-store";
import { loadExportHistoryViewPreferencesWithStatus, saveExportHistoryViewPreferences } from "@/lib/export-history-preferences-store";
import { dateRangeForPreset, normalizeDateInput, validateExportHistoryDateRange, type ExportHistoryDatePreset } from "@/lib/export-history-preferences";

const FILTERS: ExportHistoryFilter[] = ["all", "bundle", "json", "redacted"];
const SORTS: ExportHistorySort[] = ["newest", "oldest"];

export default function ExportHistoryScreen() {
  const [history, setHistory] = useState<ExportHistoryEntry[]>([]);
  const [filter, setFilter] = useState<ExportHistoryFilter>("all");
  const [sort, setSort] = useState<ExportHistorySort>("newest");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [datePreset, setDatePreset] = useState<ExportHistoryDatePreset>("all");
  const [query, setQuery] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [repairedNotice, setRepairedNotice] = useState(false);

  useEffect(() => {
    void Promise.all([loadExportHistory(), loadExportHistoryViewPreferencesWithStatus()]).then(([entries, result]) => {
      const preferences = result.preferences;
      setHistory(entries);
      setFilter(preferences.filter);
      setSort(preferences.sort);
      setFrom(preferences.from);
      setTo(preferences.to);
      setDatePreset(preferences.datePreset);
      setRepairedNotice(result.repaired);
      if (result.repaired) void saveExportHistoryViewPreferences(preferences);
    });
  }, []);

  useEffect(() => {
    void saveExportHistoryViewPreferences({ filter, sort, from, to, datePreset });
  }, [filter, sort, from, to, datePreset]);

  const dateValidation = validateExportHistoryDateRange(from, to);
  const filteredHistory = useMemo(() => dateValidation === "reversed" || dateValidation === "invalid" ? [] : sortExportHistory(filterExportHistoryByDate(searchExportHistory(filterExportHistory(history, filter), query), from, to), sort), [history, filter, sort, from, to, query, dateValidation]);
  const chooseDatePreset = (next: ExportHistoryDatePreset) => { const range = dateRangeForPreset(next); setDatePreset(next); if (next !== "custom") { setFrom(range.from); setTo(range.to); } };
  const setCustomToday = () => { const today = new Date().toISOString().slice(0, 10); setDatePreset("custom"); setFrom(today); setTo(today); };
  const clearCustomRange = () => { setDatePreset("all"); setFrom(""); setTo(""); };
  const removeEntry = async (id: string) => setHistory(await removeExportHistory(id));
  const confirmAndClearHistory = async () => { setHistory(await clearExportHistory()); setConfirmClear(false); };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back"><MaterialIcons name="arrow-back" size={22} color="#F4F8FC" /></Pressable><Text style={styles.title}>Export history</Text><View style={{ width: 22 }} /></View>
    <Text style={styles.subtitle}>Local sharing metadata only. Image contents are never stored in this history.</Text>{repairedNotice && <Pressable onPress={() => setRepairedNotice(false)} accessibilityRole="alert" style={styles.repairedCard}><MaterialIcons name="auto-fix-high" size={18} color="#65E6E0" /><Text style={styles.repairedText}>Saved filters were repaired to a safe range. Tap to dismiss.</Text></Pressable>}
    <TextInput value={query} onChangeText={setQuery} placeholder="Search capture or redaction" placeholderTextColor="#70849A" style={styles.search} accessibilityLabel="Search export history" />
    <View style={styles.filters}>{FILTERS.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterSelected]} accessibilityRole="button" accessibilityState={{ selected: filter === item }}><Text style={[styles.filterText, filter === item && styles.filterTextSelected]}>{item === "all" ? "All" : item === "bundle" ? "Bundles" : item === "json" ? "JSON" : "Redacted"}</Text></Pressable>)}</View>
    <View style={styles.filters}>{(["all", "today", "sevenDays", "thirtyDays", "custom"] as ExportHistoryDatePreset[]).map((item) => <Pressable key={item} onPress={() => chooseDatePreset(item)} style={[styles.filter, datePreset === item && styles.filterSelected]} accessibilityRole="button" accessibilityState={{ selected: datePreset === item }}><Text style={[styles.filterText, datePreset === item && styles.filterTextSelected]}>{item === "all" ? "Any date" : item === "today" ? "Today" : item === "sevenDays" ? "7 days" : item === "thirtyDays" ? "30 days" : "Custom"}</Text></Pressable>)}</View>
    <View style={styles.filters}>{SORTS.map((item) => <Pressable key={item} onPress={() => setSort(item)} style={[styles.filter, sort === item && styles.filterSelected]} accessibilityRole="button" accessibilityState={{ selected: sort === item }}><Text style={[styles.filterText, sort === item && styles.filterTextSelected]}>{item === "newest" ? "Newest" : "Oldest"}</Text></Pressable>)}</View>
    <View style={styles.dateRow}><TextInput value={from} onChangeText={(value) => { setDatePreset("custom"); setFrom(normalizeDateInput(value) || value); }} placeholder="From YYYY-MM-DD" placeholderTextColor="#70849A" style={styles.dateInput} accessibilityLabel="Export history start date" /><TextInput value={to} onChangeText={(value) => { setDatePreset("custom"); setTo(normalizeDateInput(value) || value); }} placeholder="To YYYY-MM-DD" placeholderTextColor="#70849A" style={styles.dateInput} accessibilityLabel="Export history end date" /></View>{dateValidation !== "valid" && dateValidation !== "empty" && <Text style={styles.dateError} accessibilityRole="alert">{dateValidation === "reversed" ? "Start date must be on or before the end date." : "Use valid dates in YYYY-MM-DD format."}</Text>}<View style={styles.dateActions}><Pressable onPress={setCustomToday} style={styles.dateAction} accessibilityRole="button"><Text style={styles.dateActionText}>Use today</Text></Pressable><Pressable onPress={clearCustomRange} style={styles.dateAction} accessibilityRole="button"><Text style={styles.dateActionText}>Clear dates</Text></Pressable></View>
    <View style={styles.summary}><Text style={styles.summaryText}>{filteredHistory.length} matching export{filteredHistory.length === 1 ? "" : "s"}</Text>{history.length > 0 && <Pressable onPress={() => setConfirmClear(true)} accessibilityRole="button"><Text style={styles.clear}>Clear all</Text></Pressable>}</View>
    {confirmClear && <View style={styles.confirmCard}><Text style={styles.confirmTitle}>Clear export history?</Text><Text style={styles.confirmBody}>This removes local metadata entries only. Capture images and saved captures are not affected.</Text><View style={styles.confirmActions}><Pressable onPress={() => setConfirmClear(false)} style={styles.cancelButton} accessibilityRole="button"><Text style={styles.cancelText}>Keep history</Text></Pressable><Pressable onPress={() => void confirmAndClearHistory()} style={styles.confirmButton} accessibilityRole="button"><Text style={styles.confirmText}>Clear history</Text></Pressable></View></View>}
    {filteredHistory.length > 0 ? filteredHistory.map((entry) => <View key={entry.id} style={styles.row}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{entry.format === "bundle" ? "PNG + JSON bundle" : "JSON sidecar"}</Text><Text style={styles.rowDetail}>Capture {entry.captureId} · {new Date(entry.createdAt).toLocaleString()}</Text><Text style={styles.rowDetail}>{entry.redactions.length ? `Redacted: ${entry.redactions.join(", ")}` : "No fields redacted"} · Image contents not stored</Text></View><Pressable onPress={() => void removeEntry(entry.id)} accessibilityRole="button" accessibilityLabel="Remove export entry"><Text style={styles.remove}>Remove</Text></Pressable></View>) : <View style={styles.empty}><MaterialIcons name="history" size={25} color="#65E6E0" /><Text style={styles.emptyTitle}>{history.length ? "No matching exports" : "No exports yet"}</Text><Text style={styles.emptyBody}>{history.length ? "Try another search, date, or filter." : "Share a local capture record to create a metadata entry."}</Text></View>}
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 16, paddingBottom: 40 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }, title: { color: "#F4F8FC", fontSize: 21, fontWeight: "800" }, subtitle: { color: "#9FB0C3", fontSize: 13, lineHeight: 19 }, search: { minHeight: 46, color: "#F4F8FC", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 13, paddingHorizontal: 12, marginTop: 16 }, filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }, filter: { borderWidth: 1, borderColor: "#27415C", borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8 }, filterSelected: { backgroundColor: "#0D2833", borderColor: "#65E6E0" }, filterText: { color: "#9FB0C3", fontSize: 11, fontWeight: "800" }, filterTextSelected: { color: "#65E6E0" }, dateRow: { flexDirection: "row", gap: 8, marginTop: 12 }, repairedCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0D2833", borderWidth: 1, borderColor: "#2D7778", borderRadius: 12, padding: 10, marginTop: 12 }, repairedText: { flex: 1, color: "#A5F4EF", fontSize: 11, lineHeight: 16 }, dateError: { color: "#FF7D8A", fontSize: 11, lineHeight: 16, marginTop: 7 }, dateActions: { flexDirection: "row", gap: 8, marginTop: 8 }, dateAction: { borderWidth: 1, borderColor: "#27415C", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 }, dateActionText: { color: "#65E6E0", fontSize: 10, fontWeight: "800" }, dateInput: { flex: 1, minHeight: 42, color: "#F4F8FC", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 11, paddingHorizontal: 10, fontSize: 11 }, summary: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 8 }, summaryText: { color: "#65E6E0", fontSize: 12, fontWeight: "800" }, clear: { color: "#FF7D8A", fontSize: 12, fontWeight: "800" }, confirmCard: { backgroundColor: "#2B1823", borderWidth: 1, borderColor: "#FF7D8A", borderRadius: 14, padding: 13, marginBottom: 8 }, confirmTitle: { color: "#F4F8FC", fontSize: 13, fontWeight: "800" }, confirmBody: { color: "#D6A9B0", fontSize: 11, lineHeight: 17, marginTop: 5 }, confirmActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 11 }, cancelButton: { borderWidth: 1, borderColor: "#70849A", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, cancelText: { color: "#C3D0DC", fontSize: 10, fontWeight: "800" }, confirmButton: { backgroundColor: "#FF7D8A", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 }, confirmText: { color: "#2B1823", fontSize: 10, fontWeight: "800" }, row: { flexDirection: "row", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: "#1B3047", paddingVertical: 13 }, rowTitle: { color: "#F4F8FC", fontSize: 13, fontWeight: "800" }, rowDetail: { color: "#70849A", fontSize: 11, lineHeight: 16, marginTop: 3 }, remove: { color: "#FF7D8A", fontSize: 10, fontWeight: "800" }, empty: { alignItems: "center", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 16, padding: 26, marginTop: 10 }, emptyTitle: { color: "#F4F8FC", fontSize: 15, fontWeight: "800", marginTop: 10 }, emptyBody: { color: "#9FB0C3", fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 6 } });
