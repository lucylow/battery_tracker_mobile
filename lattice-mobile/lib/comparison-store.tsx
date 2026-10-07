import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ExperimentParameters, ModeledResults } from "@/domain/lattice";

export type ExperimentSnapshot = { id: string; label: string; createdAt: number; parameters: ExperimentParameters; results: ModeledResults };
type ComparisonStore = { snapshots: ExperimentSnapshot[]; isHydrated: boolean; addSnapshot: (label: string, parameters: ExperimentParameters, results: ModeledResults) => Promise<void>; removeSnapshot: (id: string) => Promise<void> };
const KEY = "lattice.comparison.v1";
const ComparisonContext = createContext<ComparisonStore | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [snapshots, setSnapshots] = useState<ExperimentSnapshot[]>([]);
  const [isHydrated, setHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(KEY).then((raw) => { if (raw) { try { setSnapshots((JSON.parse(raw) as ExperimentSnapshot[]).slice(-2)); } catch { /* Corrupt comparison data stays discarded. */ } } setHydrated(true); }).catch(() => setHydrated(true)); }, []);
  const persist = useCallback((next: ExperimentSnapshot[]) => { setSnapshots(next); return AsyncStorage.setItem(KEY, JSON.stringify(next)); }, []);
  const addSnapshot = useCallback(async (label: string, parameters: ExperimentParameters, results: ModeledResults) => { const next = [...snapshots.filter((item) => item.label !== label), { id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`, label, createdAt: Date.now(), parameters, results }].slice(-2); await persist(next); }, [persist, snapshots]);
  const removeSnapshot = useCallback(async (id: string) => { await persist(snapshots.filter((item) => item.id !== id)); }, [persist, snapshots]);
  const value = useMemo(() => ({ snapshots, isHydrated, addSnapshot, removeSnapshot }), [snapshots, isHydrated, addSnapshot, removeSnapshot]);
  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}
export function useComparison() { const value = useContext(ComparisonContext); if (!value) throw new Error("useComparison must be used inside ComparisonProvider"); return value; }
