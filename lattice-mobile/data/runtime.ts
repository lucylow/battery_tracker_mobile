export const DATA_MODE = process.env.EXPO_PUBLIC_DATA_MODE === "mock" ? "mock" : "curated-local" as const;

export function assertProductionDataMode() {
  if (process.env.NODE_ENV === "production" && DATA_MODE === "mock") throw new Error("Mock data is disabled in production.");
}

const PLACEHOLDERS = ["John Doe", "Lorem ipsum", "Demo Experiment", "Sample Material", "TO_DO"];
export function containsPlaceholder(value: unknown) { const text = JSON.stringify(value); return PLACEHOLDERS.some((placeholder) => text.includes(placeholder)); }
export function assertNoPlaceholder(value: unknown) { if (containsPlaceholder(value)) throw new Error("Placeholder content detected."); }
