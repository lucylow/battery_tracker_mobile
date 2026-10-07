import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { VisionJob } from "@/vision/queue";

export const VISION_JOB_STORAGE_KEY = "lattice.vision-jobs.v1";
const MAX_JOBS = 20;

type JobContext = {
  jobs: VisionJob[];
  isHydrated: boolean;
  saveJob: (job: VisionJob) => void;
  removeJob: (id: string) => void;
};

const Context = createContext<JobContext | null>(null);

const isVisionJob = (value: unknown): value is VisionJob => {
  if (!value || typeof value !== "object") return false;
  const job = value as Partial<VisionJob>;
  return typeof job.id === "string" && typeof job.image === "object" && job.image !== null && typeof job.mode === "string" && typeof job.status === "string" && typeof job.progress === "number";
};

export function parseVisionJobs(raw: string | null): VisionJob[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isVisionJob).slice(0, MAX_JOBS) : [];
  } catch {
    return [];
  }
}

export function upsertVisionJob(current: VisionJob[], job: VisionJob): VisionJob[] {
  return [job, ...current.filter((item) => item.id !== job.id)].slice(0, MAX_JOBS);
}

export function removeVisionJob(current: VisionJob[], id: string): VisionJob[] {
  return current.filter((job) => job.id !== id);
}

export function VisionJobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<VisionJob[]>([]);
  const [isHydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(VISION_JOB_STORAGE_KEY)
      .then((raw) => {
        if (mounted) {
          setJobs(parseVisionJobs(raw));
          setHydrated(true);
        }
      })
      .catch(() => {
        if (mounted) setHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback((update: (current: VisionJob[]) => VisionJob[]) => {
    setJobs((current) => {
      const next = update(current);
      void AsyncStorage.setItem(VISION_JOB_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const saveJob = useCallback((job: VisionJob) => persist((current) => upsertVisionJob(current, job)), [persist]);
  const removeJob = useCallback((id: string) => persist((current) => removeVisionJob(current, id)), [persist]);
  const value = useMemo(() => ({ jobs, isHydrated, saveJob, removeJob }), [jobs, isHydrated, saveJob, removeJob]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useVisionJobs() {
  const value = useContext(Context);
  if (!value) throw new Error("useVisionJobs must be used inside VisionJobProvider");
  return value;
}
