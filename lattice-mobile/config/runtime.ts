export const runtimeConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "",
  environment: process.env.EXPO_PUBLIC_ENVIRONMENT ?? "development",
  demoDataEnabled: process.env.EXPO_PUBLIC_ENABLE_DEMO_DATA === "true",
} as const;

export type DataSource = "curated" | "server" | "demo" | "mock";

export function assertAllowedSource(source: DataSource) {
  if ((source === "demo" || source === "mock") && !runtimeConfig.demoDataEnabled) {
    throw new Error("Demo and mock records are disabled outside explicit demo mode.");
  }
}
