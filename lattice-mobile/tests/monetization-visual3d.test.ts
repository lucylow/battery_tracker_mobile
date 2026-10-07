import { describe, expect, it } from "vitest";
import { entitlementFreshness, entitlementStateForPlan, featureAvailability, normalizeEntitlementState } from "@/monetization/catalog";
import { generateMoireSurface, normalizeScalar, renderStateForPreferences } from "@/visual3d/analytical";

describe("monetization contracts", () => {
  it("keeps core exploration available on the free plan", () => {
    const state = entitlementStateForPlan("free");
    expect(featureAvailability(state, "core_explore").available).toBe(true);
    expect(featureAvailability(state, "advanced_3d").available).toBe(false);
  });

  it("does not trust locally cached active entitlements over the selected plan", () => {
    const state = normalizeEntitlementState({ plan: "free", active: ["advanced_3d"], source: "local-cache" });
    expect(state.active).not.toContain("advanced_3d");
    expect(state.source).toBe("local-cache");
  });

  it("accepts only known server entitlements", () => {
    const state = normalizeEntitlementState({ plan: "pro", active: ["core_explore", "advanced_3d", "not-a-feature"], source: "server" });
    expect(state.active).toEqual(["core_explore", "advanced_3d"]);
  });

  it("classifies entitlement freshness without granting cached access", () => {
    const now = Date.parse("2026-08-22T12:00:00.000Z");
    expect(entitlementFreshness({ plan: "pro", active: ["advanced_3d"], source: "server", checkedAt: "2026-08-22T11:00:00.000Z" }, now)).toBe("server-confirmed");
    expect(entitlementFreshness({ plan: "pro", active: ["advanced_3d"], source: "server", checkedAt: "2026-08-20T11:00:00.000Z" }, now)).toBe("stale-server");
    expect(entitlementFreshness(entitlementStateForPlan("free"), now)).toBe("local-cache");
  });
});

describe("analytical visualization primitives", () => {
  it("generates a bounded scalar surface with deterministic dimensions", () => {
    const surface = generateMoireSurface(2, 5, 0.36);
    expect(surface).toHaveLength(25);
    expect(surface.every((point) => point.x >= -1 && point.x <= 1 && point.y >= -1 && point.y <= 1)).toBe(true);
    expect(surface.every((point) => point.value === point.z)).toBe(true);
  });

  it("handles constant scalar ranges safely", () => {
    expect(normalizeScalar(4, 4, 4)).toBe(0.5);
    expect(normalizeScalar(20, 0, 10)).toBe(1);
    expect(normalizeScalar(-1, 0, 10)).toBe(0);
  });

  it("pauses motion and lowers quality for reduced-motion or low-power states", () => {
    expect(renderStateForPreferences(true, true)).toMatchObject({ reducedMotion: true, paused: true, quality: "low" });
    expect(renderStateForPreferences(false, false).quality).toBe("medium");
  });
});
