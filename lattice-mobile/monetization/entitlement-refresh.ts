import { normalizeEntitlementState, type EntitlementState } from "@/monetization/catalog";

export type EntitlementRefreshStatus = "idle" | "refreshing" | "success" | "offline" | "error";
export type EntitlementRefreshResult = { status: "success"; state: EntitlementState } | { status: "offline" | "error"; message: string; state: EntitlementState };
export type EntitlementFetcher = (url: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;

export async function refreshEntitlements(current: EntitlementState, fetcher: EntitlementFetcher = (url) => fetch(url), apiUrl = process.env.EXPO_PUBLIC_API_URL): Promise<EntitlementRefreshResult> {
  if (!apiUrl) return { status: "offline", message: "No entitlement service is configured. Local access remains available.", state: current };
  try {
    const response = await fetcher(`${apiUrl}/v1/billing/entitlements`);
    if (!response.ok) return { status: "error", message: "The entitlement service could not confirm access. Try again later.", state: current };
    const state = normalizeEntitlementState({ ...(await response.json() as object), source: "server", checkedAt: new Date().toISOString() });
    return { status: "success", state };
  } catch {
    return { status: "offline", message: "Entitlement refresh is unavailable offline. Local experiments remain accessible.", state: current };
  }
}
