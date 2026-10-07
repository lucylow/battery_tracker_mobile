import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ExperimentProvider } from "@/lib/experiment-store";
import { LearningProvider } from "@/lib/learning-store";
import { ComparisonProvider } from "@/lib/comparison-store";
import { AccessibilityProvider } from "@/lib/accessibility-store";
import { I18nProvider } from "@/i18n";
import { CaptureProvider } from "@/lib/capture-store";
import { VisionJobProvider } from "@/lib/vision-job-store";

export default function RootLayout() {
  return <I18nProvider><CaptureProvider><VisionJobProvider><ExperimentProvider><LearningProvider><ComparisonProvider><AccessibilityProvider>
    <StatusBar style="light" />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#07111F" } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="material/[id]" options={{ presentation: "modal" }} />
      <Stack.Screen name="copilot" options={{ presentation: "modal" }} />
      <Stack.Screen name="education" options={{ presentation: "modal" }} />
      <Stack.Screen name="compare" options={{ presentation: "modal" }} />
      <Stack.Screen name="scan" options={{ presentation: "modal" }} />
      <Stack.Screen name="capture/[id]" options={{ presentation: "modal" }} />
    </Stack>
  </AccessibilityProvider></ComparisonProvider></LearningProvider></ExperimentProvider></VisionJobProvider></CaptureProvider></I18nProvider>;
}
