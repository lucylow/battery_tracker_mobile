import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useLearning } from "@/lib/learning-store";
import { useAccessibility } from "@/lib/accessibility-store";

const GOALS = ["Learn physics", "Explore materials", "Build experiments", "Use AI Copilot"];

const STEPS = [
  { eyebrow: "01 / MATERIAL SYSTEMS", title: "Start with a pair of layers.", body: "Choose two materials and see how their relationship shapes the experiment.", glyph: "◈" },
  { eyebrow: "02 / YOUR DIRECTION", title: "Choose what to explore first.", body: "Your choices shape the first suggestions, and you can change them later.", glyph: "⌁" },
  { eyebrow: "03 / OBSERVE", title: "Watch matter respond.", body: "Explore a modeled result, ask why it changed, and keep what you discover.", glyph: "✦" },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const { goals, setGoals } = useLearning();
  const { reducedMotion } = useAccessibility();
  const current = STEPS[step];
  const finish = () => { setGoals(goals); router.replace("/(tabs)"); };
  const toggleGoal = (goal: string) => setGoals(goals.includes(goal) ? goals.filter((item) => item !== goal) : [...goals, goal]);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-6">
      <View style={styles.top}><Text style={styles.brand}>LATTICE</Text><Pressable onPress={finish} accessibilityRole="button" accessibilityLabel="Skip onboarding"><Text style={styles.skip}>Skip</Text></Pressable></View>
      <View style={styles.content}>
        <View style={styles.orbit}><Text style={styles.glyph}>{current.glyph}</Text><View style={styles.ring} /></View>
        <Text style={styles.eyebrow}>{current.eyebrow}</Text>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
        {step === 1 && <View style={styles.goals}>{GOALS.map((goal) => <Pressable key={goal} onPress={() => toggleGoal(goal)} style={[styles.goal, goals.includes(goal) && styles.goalSelected]} accessibilityRole="checkbox" accessibilityState={{ checked: goals.includes(goal) }}><Text style={[styles.goalText, goals.includes(goal) && styles.goalTextSelected]}>{goal}</Text><Text style={[styles.goalMark, goals.includes(goal) && styles.goalMarkSelected]}>{goals.includes(goal) ? "✓" : "+"}</Text></Pressable>)}</View>}
      </View>
      <View style={styles.bottom}>
        <View style={styles.dots}>{STEPS.map((_, index) => <View key={index} style={[styles.dot, index === step && styles.activeDot]} />)}</View>
        <Pressable onPress={() => step === STEPS.length - 1 ? finish() : setStep(step + 1)} style={({ pressed }) => [styles.button, pressed && (reducedMotion ? styles.pressedReduced : styles.pressed)]} accessibilityRole="button" accessibilityLabel={step === STEPS.length - 1 ? "Enter LATTICE" : "Continue onboarding"}>
          <Text style={styles.buttonText}>{step === STEPS.length - 1 ? "Enter LATTICE" : "Continue"}</Text><Text style={styles.arrow}>→</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 20 },
  brand: { color: "#F4F8FC", fontSize: 15, fontWeight: "800", letterSpacing: 3 },
  skip: { color: "#9FB0C3", fontSize: 15, fontWeight: "600" },
  content: { flex: 1, justifyContent: "center", paddingBottom: 40 },
  orbit: { width: 190, height: 190, borderRadius: 95, alignSelf: "center", alignItems: "center", justifyContent: "center", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", marginBottom: 54 },
  ring: { position: "absolute", width: 138, height: 138, borderRadius: 69, borderWidth: 1, borderColor: "#65E6E0", opacity: 0.35 },
  glyph: { color: "#65E6E0", fontSize: 62, fontWeight: "300" },
  eyebrow: { color: "#65E6E0", fontSize: 12, fontWeight: "800", letterSpacing: 1.8, marginBottom: 14 },
  title: { color: "#F4F8FC", fontSize: 37, lineHeight: 44, fontWeight: "700", letterSpacing: -1 },
  body: { color: "#9FB0C3", fontSize: 17, lineHeight: 26, marginTop: 18, maxWidth: 330 },
  goals: { gap: 9, marginTop: 22, maxWidth: 360 },
  goal: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: "#27415C", backgroundColor: "#0D1B2E", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalSelected: { borderColor: "#65E6E0", backgroundColor: "#0D2833" },
  goalText: { color: "#9FB0C3", fontSize: 14, fontWeight: "700" },
  goalTextSelected: { color: "#F4F8FC" },
  goalMark: { color: "#70849A", fontSize: 18, fontWeight: "800" },
  goalMarkSelected: { color: "#65E6E0" },
  bottom: { paddingBottom: 18 },
  dots: { flexDirection: "row", gap: 8, marginBottom: 22 },
  dot: { height: 5, width: 20, borderRadius: 4, backgroundColor: "#27415C" },
  activeDot: { width: 42, backgroundColor: "#65E6E0" },
  button: { height: 58, borderRadius: 18, backgroundColor: "#65E6E0", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  pressedReduced: { opacity: 0.82 },
  buttonText: { color: "#07111F", fontSize: 16, fontWeight: "800" },
  arrow: { color: "#07111F", fontSize: 22, fontWeight: "700" },
});
