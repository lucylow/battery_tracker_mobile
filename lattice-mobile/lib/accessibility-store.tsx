import AsyncStorage from "@react-native-async-storage/async-storage";
import { AccessibilityInfo } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type AccessibilityState = { reducedMotion: boolean; largeText: boolean; isHydrated: boolean; setReducedMotion: (value: boolean) => void; setLargeText: (value: boolean) => void };
const KEY = "lattice.accessibility.v1";
const Context = createContext<AccessibilityState | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [largeText, setLargeTextState] = useState(false);
  const [isHydrated, setHydrated] = useState(false);
  useEffect(() => { let mounted = true; void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (mounted) setReducedMotionState(enabled); }); void AsyncStorage.getItem(KEY).then((raw) => { if (raw && mounted) { try { const value = JSON.parse(raw) as Partial<AccessibilityState>; if (typeof value.reducedMotion === "boolean") setReducedMotionState(value.reducedMotion); if (typeof value.largeText === "boolean") setLargeTextState(value.largeText); } catch { /* Keep accessible defaults if preferences are corrupt. */ } } if (mounted) setHydrated(true); }).catch(() => { if (mounted) setHydrated(true); }); return () => { mounted = false; }; }, []);
  const persist = useCallback((next: { reducedMotion: boolean; largeText: boolean }) => { void AsyncStorage.setItem(KEY, JSON.stringify(next)); }, []);
  const setReducedMotion = useCallback((value: boolean) => { setReducedMotionState(value); persist({ reducedMotion: value, largeText }); }, [largeText, persist]);
  const setLargeText = useCallback((value: boolean) => { setLargeTextState(value); persist({ reducedMotion, largeText: value }); }, [largeText, persist, reducedMotion]);
  const value = useMemo(() => ({ reducedMotion, largeText, isHydrated, setReducedMotion, setLargeText }), [reducedMotion, largeText, isHydrated, setReducedMotion, setLargeText]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAccessibility() { const value = useContext(Context); if (!value) throw new Error("useAccessibility must be used inside AccessibilityProvider"); return value; }
