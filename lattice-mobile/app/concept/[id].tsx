import { useLocalSearchParams, router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { CONCEPTS } from "@/science/concepts";
import { conceptContext, conceptMaterials, conceptScopeNote, relatedConcepts } from "@/science/concept-context";
import { conceptCompletionLabel } from "@/lib/concept-progress";
import { useLearning } from "@/lib/learning-store";

export default function ConceptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { completedConcepts, toggleConcept } = useLearning();
  const concept = CONCEPTS.find((item) => item.id === id);
  const context = concept ? conceptContext(concept.id) : null;
  const materials = context ? conceptMaterials(context) : [];
  const related = concept ? relatedConcepts(concept.id) : [];
  const isCompleted = Boolean(concept && completedConcepts.includes(concept.id));

  if (!concept || !context) {
    return (
      <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
        <View style={styles.missing}>
          <Text style={styles.kicker}>CONCEPT ATLAS</Text>
          <Text style={styles.title}>Concept not found</Text>
          <Text style={styles.body}>This local learning card is no longer available.</Text>
          <Pressable onPress={() => router.replace("/concepts")} style={styles.primaryButton} accessibilityRole="button">
            <Text style={styles.primaryText}>Return to atlas</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="Go back to Concept Atlas">
          <MaterialIcons name="arrow-back" size={22} color="#F4F8FC" />
          <Text style={styles.backText}>Concept Atlas</Text>
        </Pressable>
        <Text style={styles.kicker}>{concept.domain.replace("-", " ").toUpperCase()}</Text>
        <Text style={styles.title}>{concept.title}</Text>
        <Text style={styles.summary}>{concept.summary}</Text>
        <Pressable onPress={() => toggleConcept(concept.id)} style={({ pressed }) => [styles.progressButton, isCompleted && styles.progressButtonComplete, pressed && styles.pressed]} accessibilityRole="button" accessibilityState={{ checked: isCompleted }} accessibilityLabel={`${conceptCompletionLabel(isCompleted)}: ${concept.title}`}><MaterialIcons name={isCompleted ? "check-circle" : "radio-button-unchecked"} size={19} color={isCompleted ? "#07111F" : "#65E6E0"} /><Text style={[styles.progressButtonText, isCompleted && styles.progressButtonTextComplete]}>{conceptCompletionLabel(isCompleted)}</Text></Pressable>
        <View style={styles.scopeCard} accessibilityLabel={`Scope: ${context.modelLabel}`}>
          <View style={styles.scopeIcon}><MaterialIcons name="science" size={18} color="#65E6E0" /></View>
          <View style={styles.scopeCopy}><Text style={styles.scopeLabel}>{context.modelLabel}</Text><Text style={styles.scopeBody}>{conceptScopeNote()}</Text></View>
        </View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Why it matters</Text><Text style={styles.body}>{context.whyItMatters}</Text></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Inspect the idea</Text><Text style={styles.body}>{context.inspect}</Text></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>Suggested materials</Text><Text style={styles.body}>{context.labPrompt}</Text></View>
        {materials.map((material) => (
          <Pressable key={material.id} onPress={() => router.push({ pathname: "/material/[id]", params: { id: material.id } })} style={({ pressed }) => [styles.materialCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Open ${material.name} material detail`}>
            <View><Text style={styles.materialName}>{material.name}</Text><Text style={styles.materialMeta}>{material.formula} · {material.category}</Text></View><MaterialIcons name="arrow-forward" size={18} color={material.accent} />
          </Pressable>
        ))}
        <View style={styles.relatedSection}><Text style={styles.sectionTitle}>Continue exploring</Text><Text style={styles.body}>Follow a curated local path to a neighboring idea.</Text>{related.map((item) => <Pressable key={item.id} onPress={() => router.push({ pathname: "/concept/[id]", params: { id: item.id } })} style={({ pressed }) => [styles.relatedCard, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Open related concept ${item.title}`}><View style={styles.relatedCopy}><Text style={styles.relatedTitle}>{item.title}</Text><Text style={styles.relatedSummary}>{item.summary}</Text></View><MaterialIcons name="arrow-forward" size={18} color="#65E6E0" /></Pressable>)}</View>
        <Pressable onPress={() => router.push("/lab")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Open Lab from concept detail">
          <Text style={styles.primaryText}>Open in Lab</Text><MaterialIcons name="science" size={18} color="#07111F" />
        </Pressable>
        <Text style={styles.footerNote}>Navigation stays on-device. No concept content is uploaded by opening this detail.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 15, paddingBottom: 42 },
  back: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 44 },
  backText: { color: "#9FB0C3", fontSize: 14, fontWeight: "700" },
  kicker: { color: "#65E6E0", fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginTop: 25 },
  title: { color: "#F4F8FC", fontSize: 32, lineHeight: 39, fontWeight: "800", marginTop: 9 },
  summary: { color: "#9FB0C3", fontSize: 16, lineHeight: 24, marginTop: 11 },
  progressButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: "#2F7779", backgroundColor: "#102A35", marginTop: 18 },
  progressButtonComplete: { backgroundColor: "#65E6E0", borderColor: "#65E6E0" },
  progressButtonText: { color: "#65E6E0", fontSize: 13, fontWeight: "800" },
  progressButtonTextComplete: { color: "#07111F" },
  scopeCard: { flexDirection: "row", gap: 12, backgroundColor: "#102A35", borderRadius: 16, borderWidth: 1, borderColor: "#2F7779", padding: 14, marginTop: 13 },
  scopeIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#163F49", alignItems: "center", justifyContent: "center" },
  scopeCopy: { flex: 1 },
  scopeLabel: { color: "#65E6E0", fontSize: 12, fontWeight: "800" },
  scopeBody: { color: "#B5D1D3", fontSize: 12, lineHeight: 18, marginTop: 4 },
  section: { marginTop: 25 },
  sectionTitle: { color: "#F4F8FC", fontSize: 18, fontWeight: "800", marginBottom: 7 },
  body: { color: "#9FB0C3", fontSize: 14, lineHeight: 22 },
  materialCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#0D1B2E", borderRadius: 15, borderWidth: 1, borderColor: "#27415C", padding: 14, marginTop: 10 },
  relatedSection: { marginTop: 27 },
  relatedCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, backgroundColor: "#101C31", borderRadius: 15, borderWidth: 1, borderColor: "#39416A", padding: 14, marginTop: 10 },
  relatedCopy: { flex: 1 },
  relatedTitle: { color: "#F4F8FC", fontSize: 14, fontWeight: "800" },
  relatedSummary: { color: "#8FA1B8", fontSize: 12, lineHeight: 17, marginTop: 4 },
  materialName: { color: "#F4F8FC", fontSize: 14, fontWeight: "800" },
  materialMeta: { color: "#8FA1B8", fontSize: 12, marginTop: 4 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, minHeight: 50, backgroundColor: "#65E6E0", borderRadius: 15, paddingHorizontal: 18, marginTop: 25 },
  primaryText: { color: "#07111F", fontSize: 14, fontWeight: "800" },
  footerNote: { color: "#70849A", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 14 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  missing: { flex: 1, justifyContent: "center" },
});
