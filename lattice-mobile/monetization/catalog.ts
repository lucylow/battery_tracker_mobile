export type PlanId = "free" | "pro" | "lab" | "enterprise";
export type Entitlement = "core_explore" | "core_lab" | "basic_ai" | "advanced_ai" | "advanced_models" | "advanced_3d" | "export" | "comparison" | "collaboration";
export type EntitlementSource = "server" | "local-cache";
export type EntitlementState = { plan: PlanId; active: Entitlement[]; source: EntitlementSource; checkedAt?: string };
export type EntitlementFreshness = "server-confirmed" | "stale-server" | "local-cache" | "unknown";
export type Product = { id: string; planId: PlanId; name: string; description: string; billingPeriod?: "monthly" | "yearly"; priceMinor?: number; currency?: string; trialDays?: number };

export const PLAN_CATALOG: Record<PlanId, { name: string; description: string; entitlements: Entitlement[] }> = {
  free: { name: "Free", description: "Core exploration, lessons, Lab controls, and basic Copilot stay available.", entitlements: ["core_explore", "core_lab", "basic_ai"] },
  pro: { name: "LATTICE Pro", description: "For deeper models, comparison, exports, advanced 3D previews, and advanced Copilot workflows.", entitlements: ["core_explore", "core_lab", "basic_ai", "advanced_ai", "advanced_models", "advanced_3d", "export", "comparison"] },
  lab: { name: "LATTICE Lab", description: "For private projects, collaboration, and higher compute allowances.", entitlements: ["core_explore", "core_lab", "basic_ai", "advanced_ai", "advanced_models", "advanced_3d", "export", "comparison", "collaboration"] },
  enterprise: { name: "Enterprise", description: "For institution-managed workspaces and collaboration controls.", entitlements: ["core_explore", "core_lab", "basic_ai", "advanced_ai", "advanced_models", "advanced_3d", "export", "comparison", "collaboration"] },
};

export const PLAN_FEATURE_ROWS = [
  { key: "experiments", label: "Interactive experiments", free: "Unlimited", pro: "Unlimited", lab: "Unlimited", enterprise: "Unlimited" },
  { key: "saves", label: "Local saves", free: "Included", pro: "Included", lab: "Included", enterprise: "Included" },
  { key: "copilot", label: "Copilot", free: "Educational fallback", pro: "More credits", lab: "Highest allowance", enterprise: "Managed allowance" },
  { key: "advanced3d", label: "Advanced 3D previews", free: "Illustrative fallback", pro: "Included", lab: "Included", enterprise: "Included" },
  { key: "comparison", label: "Comparison and export", free: "Included", pro: "Included", lab: "Included", enterprise: "Included" },
  { key: "collaboration", label: "Team collaboration", free: "—", pro: "—", lab: "Included", enterprise: "Included" },
] as const;

export function hasEntitlement(state: EntitlementState, entitlement: Entitlement) { return state.active.includes(entitlement); }

export function entitlementStateForPlan(plan: PlanId, source: EntitlementSource = "local-cache"): EntitlementState {
  return { plan, active: [...PLAN_CATALOG[plan].entitlements], source };
}

export function normalizeEntitlementState(value: unknown): EntitlementState {
  if (!value || typeof value !== "object") return entitlementStateForPlan("free");
  const raw = value as Partial<EntitlementState>;
  const plan = raw.plan && raw.plan in PLAN_CATALOG ? raw.plan : "free";
  const active = Array.isArray(raw.active) ? raw.active.filter((item): item is Entitlement => PLAN_CATALOG.enterprise.entitlements.includes(item as Entitlement)) : [];
  const source: EntitlementSource = raw.source === "server" ? "server" : "local-cache";
  return { plan, active: source === "server" ? active : [...PLAN_CATALOG[plan].entitlements], source, checkedAt: typeof raw.checkedAt === "string" ? raw.checkedAt : undefined };
}

export function featureAvailability(state: EntitlementState, feature: Entitlement) {
  return { available: hasEntitlement(state, feature), reason: hasEntitlement(state, feature) ? "included" as const : "available-on-upgrade" as const };
}

export function entitlementFreshness(state: EntitlementState, now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000): EntitlementFreshness {
  if (state.source === "local-cache") return "local-cache";
  if (!state.checkedAt) return "unknown";
  const timestamp = Date.parse(state.checkedAt);
  if (!Number.isFinite(timestamp)) return "unknown";
  return now - timestamp <= maxAgeMs ? "server-confirmed" : "stale-server";
}

export function entitlementFreshnessLabel(freshness: EntitlementFreshness) {
  return freshness === "server-confirmed" ? "Server confirmed" : freshness === "stale-server" ? "Needs refresh" : freshness === "local-cache" ? "Local cache" : "Not verified";
}
