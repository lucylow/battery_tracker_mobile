import AsyncStorage from "@react-native-async-storage/async-storage";

export type ShareCapabilityState = {
  available: boolean | null;
  checkedAt: number | null;
};

export const DEFAULT_SHARE_CAPABILITY_STATE: ShareCapabilityState = { available: null, checkedAt: null };
export const SHARE_CAPABILITY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export type ShareCapabilityFreshness = "unknown" | "fresh" | "stale";
const SHARE_CAPABILITY_KEY = "lattice.share-capability.v1";

export function shareCapabilityFreshness(state: ShareCapabilityState, now = Date.now(), maxAgeMs = SHARE_CAPABILITY_MAX_AGE_MS): ShareCapabilityFreshness {
  if (state.available === null || state.checkedAt === null) return "unknown";
  return now - state.checkedAt > maxAgeMs ? "stale" : "fresh";
}

export function shouldRefreshShareCapability(state: ShareCapabilityState, now = Date.now()) {
  return shareCapabilityFreshness(state, now) !== "fresh";
}

export function shareCapabilityFreshnessLabel(freshness: ShareCapabilityFreshness) {
  return freshness === "fresh" ? "Checked recently" : freshness === "stale" ? "Check is stale" : "Not checked";
}

export function shareCapabilityActionLabel(state: ShareCapabilityState, now = Date.now()) {
  const freshness = shareCapabilityFreshness(state, now);
  if (freshness === "unknown") return "Support unverified";
  if (freshness === "stale") return "Support stale";
  return state.available ? "Native ready" : "JSON fallback";
}

export function shareCapabilityRefreshMessage(outcome: "checking" | "refreshed" | "failed") {
  if (outcome === "checking") return "Checking share support locally…";
  if (outcome === "refreshed") return "Share support updated locally; no capture content was accessed.";
  return "Share support could not be refreshed; local export data is unchanged.";
}

export function shareCapabilityBadgeLabel(state: ShareCapabilityState, now = Date.now()) {
  const freshness = shareCapabilityFreshness(state, now);
  if (freshness === "unknown") return "Share support unverified";
  if (freshness === "stale") return "Share support stale";
  return state.available ? "Share support ready" : "JSON fallback ready";
}

export function normalizeShareCapabilityState(value: unknown): ShareCapabilityState {
  if (!value || typeof value !== "object") return { ...DEFAULT_SHARE_CAPABILITY_STATE };
  const input = value as Partial<ShareCapabilityState>;
  const checkedAt = typeof input.checkedAt === "number" && Number.isFinite(input.checkedAt) && input.checkedAt >= 0 ? input.checkedAt : null;
  const available = typeof input.available === "boolean" ? input.available : null;
  return { available, checkedAt };
}

export async function loadShareCapabilityState(): Promise<ShareCapabilityState> {
  try {
    const raw = await AsyncStorage.getItem(SHARE_CAPABILITY_KEY);
    return normalizeShareCapabilityState(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_SHARE_CAPABILITY_STATE };
  }
}

export async function saveShareCapabilityState(state: ShareCapabilityState): Promise<ShareCapabilityState> {
  const normalized = normalizeShareCapabilityState(state);
  try {
    await AsyncStorage.setItem(SHARE_CAPABILITY_KEY, JSON.stringify(normalized));
  } catch {
    // Local diagnostics are advisory; UI retains the normalized in-memory state.
  }
  return normalized;
}

export async function clearShareCapabilityState(): Promise<ShareCapabilityState> {
  try {
    await AsyncStorage.removeItem(SHARE_CAPABILITY_KEY);
  } catch {
    // Best-effort privacy reset; callers still receive safe defaults.
  }
  return { ...DEFAULT_SHARE_CAPABILITY_STATE };
}
