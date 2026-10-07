import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { CONCEPTS, type ConceptDomain } from "@/science/concepts";
import { conceptDomainLabel, filterConcepts, moireScaleContext, wavefunctionProbabilitySamples, type ConceptFilter } from "@/science/concept-catalog";
import { conceptCompletionCount } from "@/lib/concept-progress";
import { useLearning } from "@/lib/learning-store";

const FILTERS: { id: ConceptFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "moire", label: "Moiré" },
  { id: "quantum", label: "Quantum" },
  { id: "chemistry", label: "Chemistry" },
];

export default function ConceptsScreen() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ConceptFilter>("all");
  const { completedConcepts, isHydrated } = useLearning();
  const concepts = useMemo(() => filterConcepts(CONCEPTS, query, filter), [query, filter]);
  const waveSamples = useMemo(() => wavefunctionProbabilitySamples(), []);
  const moire = useMemo(() => moireScaleContext(3.2, 2), []);

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><FlatList
    data={concepts}
    keyExtractor={(item) => item.id}
    showsVerticalScrollIndicator={false}
    contentContainerStyle={styles.content}
    ListHeaderComponent={<>
      <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back"><MaterialIcons name="arrow-back" size={22} color="#F4F8FC" /><Text style={styles.backText}>Explore</Text></Pressable>
      <Text style={styles.kicker}>CONCEPT ATLAS</Text><Text style={styles.title}>Build a sharper{`\n`}materials intuition.</Text><Text style={styles.intro}>Short, inspectable models connect chemistry, quantum ideas, and moiré experiments without presenting educational calculations as measurements.</Text>
      <View style={styles.search}><MaterialIcons name="search" color="#70849A" size={21} /><TextInput value={query} onChangeText={setQuery} placeholder="Search concepts" placeholderTextColor="#70849A" style={styles.searchInput} returnKeyType="done" accessibilityLabel="Search science concepts" /></View>
      <View style={styles.filters}>{FILTERS.map((item) => <Pressable key={item.id} onPress={() => setFilter(item.id)} style={[styles.filter, filter === item.id && styles.filterSelected]} accessibilityRole="radio" accessibilityState={{ selected: filter === item.id }}><Text style={[styles.filterText, filter === item.id && styles.filterTextSelected]}>{item.label}</Text></Pressable>)}</View>
      <View style={styles.visualCard}><View style={styles.visualHeading}><View><Text style={styles.visualKicker}>MODEL SNAPSHOT</Text><Text style={styles.visualTitle}>Ground-state probability</Text></View><Text style={styles.visualValue}>n = 1</Text></View><View style={styles.waveChart} accessibilityLabel="Ground-state probability density rises from zero at the well boundaries and peaks at the center"><View style={styles.axis} />{waveSamples.slice(0, -1).map((sample, index) => <View key={`${sample.position}-${index}`} style={[styles.waveBar, { left: `${sample.position * 100}%`, height: `${Math.max(4, sample.probability * 42)}%` }]} />)}</View><Text style={styles.chartNote}>Probability density is normalized to a one-dimensional educational well.</Text></View>
      <View style={styles.visualCard}><View style={styles.visualHeading}><View><Text style={styles.visualKicker}>MOIRÉ CONTEXT</Text><Text style={styles.visualTitle}>Small twist, longer repeat</Text></View><Text style={styles.visualValue}>{moire.periodNanometers.toFixed(1)} nm</Text></View><View style={styles.scaleTrack}><View style={[styles.scaleFill, { width: "72%" }]} /></View><Text style={styles.chartNote}>{moire.regime.replaceAll("-", " ")} · simplified period for a 3.2 Å lattice constant at 2°.</Text></View>
      <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Browse concepts</Text><Text style={styles.count}>{concepts.length}</Text></View><Text style={styles.progress}>{isHydrated ? conceptCompletionCount(completedConcepts, CONCEPTS.length) : "Loading local progress…"}</Text>
    </>}
    renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: "/concept/[id]", params: { id: item.id } })} style={({ pressed }) => [styles.conceptCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Open ${item.title} concept detail`}><View style={styles.conceptTop}><Text style={styles.domain}>{conceptDomainLabel(item.domain as ConceptDomain)}</Text><Text style={styles.level}>{completedConcepts.includes(item.id) ? "EXPLORED" : item.level}</Text></View><Text style={styles.conceptTitle}>{item.title}</Text><Text style={styles.conceptSummary}>{item.summary}</Text><View style={styles.learnRow}><Text style={styles.learnText}>Open concept detail</Text><MaterialIcons name="arrow-forward" size={17} color="#65E6E0" /></View></Pressable>}
    ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No concepts match</Text><Text style={styles.emptyBody}>Try “quantum”, “formula”, or “moiré”.</Text></View>}
  /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { paddingTop: 15, paddingBottom: 38 }, back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 }, backText: { color: "#9FB0C3", fontSize: 14, fontWeight: "700" }, kicker: { color: "#65E6E0", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginTop: 25 }, title: { color: "#F4F8FC", fontSize: 31, lineHeight: 38, fontWeight: "800", marginTop: 10 }, intro: { color: "#9FB0C3", fontSize: 15, lineHeight: 23, marginTop: 13 }, search: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#0D1B2E", borderRadius: 15, borderWidth: 1, borderColor: "#27415C", paddingHorizontal: 13, marginTop: 20 }, searchInput: { flex: 1, minHeight: 48, color: "#F4F8FC", fontSize: 14 }, filters: { flexDirection: "row", gap: 8, marginTop: 13, marginBottom: 3 }, filter: { minHeight: 36, paddingHorizontal: 13, borderRadius: 18, borderWidth: 1, borderColor: "#27415C", backgroundColor: "#0D1B2E", justifyContent: "center" }, filterSelected: { backgroundColor: "#0D2833", borderColor: "#65E6E0" }, filterText: { color: "#9FB0C3", fontSize: 12, fontWeight: "700" }, filterTextSelected: { color: "#65E6E0" }, visualCard: { backgroundColor: "#101C31", borderRadius: 17, borderWidth: 1, borderColor: "#39416A", padding: 15, marginTop: 16 }, visualHeading: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }, visualKicker: { color: "#9B8CFF", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, visualTitle: { color: "#F4F8FC", fontSize: 16, fontWeight: "800", marginTop: 6 }, visualValue: { color: "#65E6E0", fontSize: 14, fontWeight: "800" }, waveChart: { height: 90, marginTop: 14, backgroundColor: "#0D1B2E", borderRadius: 11, overflow: "hidden", position: "relative" }, axis: { position: "absolute", left: 0, right: 0, bottom: 8, height: 1, backgroundColor: "#39416A" }, waveBar: { position: "absolute", bottom: 9, width: 3, borderRadius: 2, backgroundColor: "#65E6E0" }, chartNote: { color: "#8FA1B8", fontSize: 11, lineHeight: 16, marginTop: 9 }, scaleTrack: { height: 10, backgroundColor: "#263A55", borderRadius: 5, marginTop: 17, overflow: "hidden" }, scaleFill: { height: "100%", backgroundColor: "#9B8CFF", borderRadius: 5 }, sectionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 28, marginBottom: 11 }, sectionTitle: { color: "#F4F8FC", fontSize: 18, fontWeight: "800" }, progress: { color: "#65E6E0", fontSize: 12, fontWeight: "700", marginTop: -5, marginBottom: 11 }, count: { color: "#70849A", fontSize: 12 }, conceptCard: { backgroundColor: "#0D1B2E", borderRadius: 17, borderWidth: 1, borderColor: "#27415C", padding: 15, marginBottom: 11 }, conceptTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, domain: { color: "#65E6E0", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, level: { color: "#70849A", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }, conceptTitle: { color: "#F4F8FC", fontSize: 17, fontWeight: "800", marginTop: 9 }, conceptSummary: { color: "#9FB0C3", fontSize: 13, lineHeight: 20, marginTop: 5 }, learnRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 13 }, learnText: { color: "#65E6E0", fontSize: 12, fontWeight: "800" }, pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] }, empty: { backgroundColor: "#0D1B2E", padding: 18, borderRadius: 16, borderWidth: 1, borderColor: "#27415C" }, emptyTitle: { color: "#F4F8FC", fontSize: 15, fontWeight: "800" }, emptyBody: { color: "#9FB0C3", fontSize: 13, marginTop: 5 } });
