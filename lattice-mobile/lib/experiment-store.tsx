import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEMO_EXPERIMENT, type ExperimentParameters } from "@/domain/lattice";

const STORAGE_KEY = "lattice.experiment.v1";
type StoredExperiment = { version: 1; parameters: ExperimentParameters; updatedAt: number; saved: boolean };
type ExperimentStore = { parameters: ExperimentParameters; isHydrated: boolean; lastSavedAt: number | null; saved: boolean; canUndo: boolean; canRedo: boolean; updateParameters: (next: ExperimentParameters) => void; undo: () => void; redo: () => void; saveExperiment: () => Promise<void>; clearDraft: () => Promise<void> };
const ExperimentContext = createContext<ExperimentStore | null>(null);

export function ExperimentProvider({ children }: { children: ReactNode }) {
  const [parameters, setParameters] = useState(DEMO_EXPERIMENT);
  const [past, setPast] = useState<ExperimentParameters[]>([]);
  const [future, setFuture] = useState<ExperimentParameters[]>([]);
  const [isHydrated, setHydrated] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => { AsyncStorage.getItem(STORAGE_KEY).then((raw) => { if (raw) { try { const stored = JSON.parse(raw) as StoredExperiment; if (stored.version === 1 && stored.parameters?.layerA && stored.parameters?.layerB) { setParameters(stored.parameters); setLastSavedAt(stored.updatedAt); setSaved(stored.saved); } } catch { /* Invalid local data falls back to the deterministic starter. */ } } setHydrated(true); }).catch(() => setHydrated(true)); }, []);
  const persist = useCallback(async (next: ExperimentParameters, isSaved: boolean) => { const updatedAt = Date.now(); await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, parameters: next, updatedAt, saved: isSaved } satisfies StoredExperiment)); setLastSavedAt(updatedAt); setSaved(isSaved); }, []);
  const updateParameters = useCallback((next: ExperimentParameters) => { setParameters((current) => { if (JSON.stringify(current) === JSON.stringify(next)) return current; setPast((items) => [...items.slice(-19), current]); setFuture([]); void persist(next, false); return next; }); }, [persist]);
  const undo = useCallback(() => { setPast((items) => { const previous = items.at(-1); if (!previous) return items; setFuture((itemsFuture) => [parameters, ...itemsFuture.slice(0, 19)]); setParameters(previous); void persist(previous, false); return items.slice(0, -1); }); }, [parameters, persist]);
  const redo = useCallback(() => { setFuture((items) => { const next = items[0]; if (!next) return items; setPast((itemsPast) => [...itemsPast.slice(-19), parameters]); setParameters(next); void persist(next, false); return items.slice(1); }); }, [parameters, persist]);
  const saveExperiment = useCallback(async () => { await persist(parameters, true); }, [parameters, persist]);
  const clearDraft = useCallback(async () => { await AsyncStorage.removeItem(STORAGE_KEY); setParameters(DEMO_EXPERIMENT); setPast([]); setFuture([]); setLastSavedAt(null); setSaved(false); }, []);
  const value = useMemo(() => ({ parameters, isHydrated, lastSavedAt, saved, canUndo: past.length > 0, canRedo: future.length > 0, updateParameters, undo, redo, saveExperiment, clearDraft }), [parameters, isHydrated, lastSavedAt, saved, past.length, future.length, updateParameters, undo, redo, saveExperiment, clearDraft]);
  return <ExperimentContext.Provider value={value}>{children}</ExperimentContext.Provider>;
}
export function useExperiment() { const value = useContext(ExperimentContext); if (!value) throw new Error("useExperiment must be used inside ExperimentProvider"); return value; }
