import AsyncStorage from "@react-native-async-storage/async-storage";
import { entitlementStateForPlan, normalizeEntitlementState, type EntitlementState } from "@/monetization/catalog";

export const ENTITLEMENT_CACHE_KEY = "lattice.entitlements.v1";
export const MAX_ENTITLEMENT_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
export type CachedEntitlements = { state: EntitlementState; cachedAt: string };
export type EntitlementCacheLoad = { state: EntitlementState; cachedAt?: string; repaired: boolean; expired: boolean };

export function normalizeEntitlementCache(value: unknown, now = Date.now(), maxAgeMs = MAX_ENTITLEMENT_CACHE_AGE_MS): EntitlementCacheLoad {
  if (!value || typeof value !== "object") return { state: entitlementStateForPlan("free"), repaired: true, expired: false };
  const raw = value as Partial<CachedEntitlements>;
  const state = normalizeEntitlementState(raw.state);
  const cachedAt = typeof raw.cachedAt === "string" && Number.isFinite(Date.parse(raw.cachedAt)) ? raw.cachedAt : undefined;
  const expired = !cachedAt || now - Date.parse(cachedAt) > maxAgeMs;
  if (expired) return { state: entitlementStateForPlan("free"), repaired: true, expired: true };
  return { state, cachedAt, repaired: JSON.stringify(value) !== JSON.stringify({ state, cachedAt }), expired: false };
}

export async function loadEntitlementCache(now = Date.now()): Promise<EntitlementCacheLoad> {
  try {
    const raw = await AsyncStorage.getItem(ENTITLEMENT_CACHE_KEY);
    const result = normalizeEntitlementCache(raw ? JSON.parse(raw) : undefined, now);
    if (result.expired) await AsyncStorage.removeItem(ENTITLEMENT_CACHE_KEY);
    return result;
  } catch {
    return { state: entitlementStateForPlan("free"), repaired: true, expired: false };
  }
}

export async function saveEntitlementCache(state: EntitlementState, cachedAt = new Date().toISOString()) {
  const value: CachedEntitlements = { state: normalizeEntitlementState({ ...state, source: "server", checkedAt: state.checkedAt ?? cachedAt }), cachedAt };
  await AsyncStorage.setItem(ENTITLEMENT_CACHE_KEY, JSON.stringify(value));
  return value;
}

export async function clearEntitlementCache() {
  await AsyncStorage.removeItem(ENTITLEMENT_CACHE_KEY);
  return entitlementStateForPlan("free");
}

export function formatEntitlementLastChecked(cachedAt?: string, locale = "en-US") {
  if (!cachedAt) return "Not checked on this device";
  const timestamp = Date.parse(cachedAt);
  return Number.isFinite(timestamp) ? `Last checked ${new Date(timestamp).toLocaleString(locale)}` : "Not checked on this device";
}
