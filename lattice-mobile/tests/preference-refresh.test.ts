import { describe, expect, it } from "vitest";
import { entitlementStateForPlan } from "@/monetization/catalog";
import { MAX_ENTITLEMENT_CACHE_AGE_MS, normalizeEntitlementCache } from "@/monetization/entitlement-cache";
import { DEFAULT_SHARE_CAPABILITY_STATE, SHARE_CAPABILITY_MAX_AGE_MS, normalizeShareCapabilityState, shareCapabilityBadgeLabel, shareCapabilityFreshness, shareCapabilityFreshnessLabel, shouldRefreshShareCapability } from "@/lib/share-capability-store";
import { refreshEntitlements } from "@/monetization/entitlement-refresh";
import { DEFAULT_VISUALIZATION_PREFERENCES, normalizeVisualizationPreferences, normalizeVisualizationPreferencesWithStatus, resetVisualizationPreferenceState } from "@/lib/visualization-preferences";
import { buildPrivacySummary, destructiveConfirmationCopy, formatPrivacyTimestamp, shareCapabilityAuditEntry, shareConfirmationCopy } from "@/lib/privacy-center";
import { DEFAULT_EXPORT_PREFERENCES, redactAllPreferences } from "@/lib/export-preferences";

describe("share capability contracts", () => {
  it("classifies persisted diagnostics by bounded freshness", () => {
    const now = 10_000;
    expect(shareCapabilityFreshness(DEFAULT_SHARE_CAPABILITY_STATE, now)).toBe("unknown");
    expect(shareCapabilityFreshness({ available: true, checkedAt: now - 1 }, now)).toBe("fresh");
    expect(shareCapabilityFreshness({ available: false, checkedAt: now - SHARE_CAPABILITY_MAX_AGE_MS - 1 }, now)).toBe("stale");
    expect(shareCapabilityFreshnessLabel("stale")).toBe("Check is stale");
    expect(shouldRefreshShareCapability(DEFAULT_SHARE_CAPABILITY_STATE, now)).toBe(true);
    expect(shouldRefreshShareCapability({ available: true, checkedAt: now - 1 }, now)).toBe(false);
    expect(shouldRefreshShareCapability({ available: false, checkedAt: now - SHARE_CAPABILITY_MAX_AGE_MS - 1 }, now)).toBe(true);
    expect(shareCapabilityBadgeLabel(DEFAULT_SHARE_CAPABILITY_STATE, now)).toBe("Share support unverified");
    expect(shareCapabilityBadgeLabel({ available: true, checkedAt: now - 1 }, now)).toBe("Share support ready");
    expect(shareCapabilityBadgeLabel({ available: false, checkedAt: now - 1 }, now)).toBe("JSON fallback ready");
    expect(shareCapabilityBadgeLabel({ available: true, checkedAt: now - SHARE_CAPABILITY_MAX_AGE_MS - 1 }, now)).toBe("Share support stale");
  });

  it("repairs malformed persisted capability diagnostics", () => {
    expect(normalizeShareCapabilityState({ available: "yes", checkedAt: -4 })).toEqual(DEFAULT_SHARE_CAPABILITY_STATE);
    expect(normalizeShareCapabilityState({ available: true, checkedAt: 42 })).toEqual({ available: true, checkedAt: 42 });
  });
});

describe("visualization preference contracts", () => {
  it("repairs malformed values to safe defaults", () => {
    expect(normalizeVisualizationPreferences({ quality: "ultra", showAxes: "yes" })).toEqual(DEFAULT_VISUALIZATION_PREFERENCES);
    expect(normalizeVisualizationPreferencesWithStatus({ quality: "low", showAxes: true, showLegend: true })).toEqual({ preferences: { quality: "low", showAxes: true, showLegend: true }, repaired: false });
  });

  it("resets visualization state without affecting unrelated records", () => {
    expect(resetVisualizationPreferenceState()).toEqual(DEFAULT_VISUALIZATION_PREFERENCES);
  });
});

describe("privacy center contracts", () => {
  it("summarizes redaction and local-first boundaries", () => {
    const summary = buildPrivacySummary({ ...DEFAULT_EXPORT_PREFERENCES, ...redactAllPreferences() });
    expect(summary.find((item) => item.title === "Export notes")?.enabled).toBe(false);
    expect(summary.find((item) => item.title === "Local capture records")?.enabled).toBe(true);
    expect(summary.find((item) => item.title === "Remote analysis")?.enabled).toBe(false);
  });

  it("uses consequence-specific confirmation copy", () => {
    expect(destructiveConfirmationCopy("settings").message).toContain("Captures");
    expect(destructiveConfirmationCopy("history").message).toContain("metadata only");
  });

  it("formats capability checks as local-only audit metadata", () => {
    expect(formatPrivacyTimestamp(null)).toBe("Not checked yet");
    expect(shareCapabilityAuditEntry(null)).toContain("No share-capability check");
    expect(shareCapabilityAuditEntry(0)).toContain("no capture content was accessed or uploaded");
  });

  it("summarizes the exact export format and redaction count", () => {
    expect(shareConfirmationCopy("bundle", ["note"]).message).toContain("1 field redacted");
    expect(shareConfirmationCopy("json", []).title).toContain("JSON sidecar");
  });
});

describe("entitlement cache contracts", () => {
  it("returns free local access when the cache is missing or expired", () => {
    const now = Date.parse("2026-08-22T12:00:00.000Z");
    expect(normalizeEntitlementCache(undefined, now)).toMatchObject({ expired: false, repaired: true, state: entitlementStateForPlan("free") });
    expect(normalizeEntitlementCache({ state: entitlementStateForPlan("pro"), cachedAt: new Date(now - MAX_ENTITLEMENT_CACHE_AGE_MS - 1).toISOString() }, now)).toMatchObject({ expired: true, repaired: true, state: entitlementStateForPlan("free") });
  });

  it("preserves a valid server cache and repairs malformed timestamps", () => {
    const now = Date.parse("2026-08-22T12:00:00.000Z");
    const valid = normalizeEntitlementCache({ state: { plan: "pro", active: ["advanced_3d"], source: "server", checkedAt: "2026-08-22T11:00:00.000Z" }, cachedAt: "2026-08-22T11:00:00.000Z" }, now);
    expect(valid.state.plan).toBe("pro");
    expect(valid.expired).toBe(false);
    expect(normalizeEntitlementCache({ state: entitlementStateForPlan("pro"), cachedAt: "not-a-date" }, now).expired).toBe(true);
  });
});

describe("entitlement refresh contracts", () => {
  it("fails closed when no service is configured", async () => {
    const current = entitlementStateForPlan("free");
    const result = await refreshEntitlements(current, undefined, undefined);
    expect(result.status).toBe("offline");
    expect(result.state).toEqual(current);
  });

  it("does not replace current state on a failed response", async () => {
    const current = entitlementStateForPlan("free");
    const result = await refreshEntitlements(current, async () => ({ ok: false, json: async () => ({ plan: "pro" }) }), "https://example.test");
    expect(result.status).toBe("error");
    expect(result.state).toEqual(current);
  });

  it("marks successful responses as server-confirmed", async () => {
    const result = await refreshEntitlements(entitlementStateForPlan("free"), async () => ({ ok: true, json: async () => ({ plan: "pro", active: ["core_explore", "advanced_3d"] }) }), "https://example.test");
    expect(result.status).toBe("success");
    if (result.status === "success") expect(result.state).toMatchObject({ plan: "pro", source: "server" });
  });
});
