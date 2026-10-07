import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { normalizeConceptProgress, resetConceptProgress, toggleConceptCompletion } from "@/lib/concept-progress";

type Level = "beginner" | "intermediate" | "advanced";
export type LearningState = { level: Level; goals: string[]; completedLessons: string[]; masteredConcepts: string[]; completedConcepts: string[]; quizHistory: { lessonId: string; correct: boolean; timestamp: number }[] };
type LearningStore = LearningState & { isHydrated: boolean; recordAnswer: (lessonId: string, correct: boolean) => void; completeLesson: (lessonId: string) => void; toggleConcept: (conceptId: string) => void; resetConceptProgress: () => void; setGoals: (goals: string[]) => void };
const KEY = "lattice.learning.v1";
const DEFAULT_STATE: LearningState = { level: "beginner", goals: [], completedLessons: [], masteredConcepts: [], completedConcepts: [], quizHistory: [] };
const LearningContext = createContext<LearningStore | null>(null);

export function LearningProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LearningState>(DEFAULT_STATE);
  const [isHydrated, setHydrated] = useState(false);
  useEffect(() => { AsyncStorage.getItem(KEY).then((raw) => { if (raw) { try { const parsed = JSON.parse(raw) as LearningState;
          setState({ ...DEFAULT_STATE, ...parsed, ...normalizeConceptProgress(parsed) }); } catch { /* Keep the safe default if local progress is corrupt. */ } } setHydrated(true); }).catch(() => setHydrated(true)); }, []);
  const persist = useCallback((next: LearningState) => { setState(next); void AsyncStorage.setItem(KEY, JSON.stringify(next)); }, []);
  const recordAnswer = useCallback((lessonId: string, correct: boolean) => { const nextHistory = [...state.quizHistory, { lessonId, correct, timestamp: Date.now() }].slice(-50); const recent = nextHistory.slice(-6); const rate = recent.length ? recent.filter((item) => item.correct).length / recent.length : 0; const level: Level = rate >= 0.85 && state.level === "beginner" ? "intermediate" : rate < 0.45 && state.level === "advanced" ? "intermediate" : state.level; persist({ ...state, quizHistory: nextHistory, level }); }, [persist, state]);
  const completeLesson = useCallback((lessonId: string) => { if (state.completedLessons.includes(lessonId)) return; persist({ ...state, completedLessons: [...state.completedLessons, lessonId] }); }, [persist, state]);
  const toggleConcept = useCallback((conceptId: string) => { persist({ ...state, completedConcepts: toggleConceptCompletion(state.completedConcepts, conceptId) }); }, [persist, state]);
  const resetConcepts = useCallback(() => { persist({ ...state, ...resetConceptProgress() }); }, [persist, state]);
  const setGoals = useCallback((goals: string[]) => { persist({ ...state, goals: [...new Set(goals)].slice(0, 4) }); }, [persist, state]);
  const value = useMemo(() => ({ ...state, isHydrated, recordAnswer, completeLesson, toggleConcept, resetConceptProgress: resetConcepts, setGoals }), [state, isHydrated, recordAnswer, completeLesson, toggleConcept, resetConcepts, setGoals]);
  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}
export function useLearning() { const value = useContext(LearningContext); if (!value) throw new Error("useLearning must be used inside LearningProvider"); return value; }
