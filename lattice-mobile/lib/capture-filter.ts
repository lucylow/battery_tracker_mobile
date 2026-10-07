import type { CaptureRecord } from "@/lib/capture-store";
import type { VisionJob } from "@/vision/queue";

export type CaptureModeFilter = "all" | CaptureRecord["mode"];
export type CaptureStatusFilter = "all" | "queued" | "processing" | "complete" | "failed" | "cancelled" | "none";
export type CaptureSort = "newest" | "attention" | "analyzed";

export function jobForCapture(record: CaptureRecord, jobs: VisionJob[]) { return jobs.find((item) => item.image.id === record.image.id); }

export function filterCaptureRecords(records: CaptureRecord[], jobs: VisionJob[], query: string, mode: CaptureModeFilter, status: CaptureStatusFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  return records.filter((record) => {
    const job = jobForCapture(record, jobs);
    const matchesQuery = !normalizedQuery || [record.note, record.mode, record.image.source, ...record.provenance].join(" ").toLowerCase().includes(normalizedQuery);
    const matchesMode = mode === "all" || record.mode === mode;
    const matchesStatus = status === "all" || (job?.status ?? "none") === status;
    return matchesQuery && matchesMode && matchesStatus;
  });
}

export function sortCaptureRecords(records: CaptureRecord[], jobs: VisionJob[], sort: CaptureSort) {
  return [...records].sort((a, b) => {
    const aJob = jobForCapture(a, jobs);
    const bJob = jobForCapture(b, jobs);
    if (sort === "attention") {
      const priority = (job: VisionJob | undefined) => job?.status === "failed" || job?.status === "cancelled" ? 0 : job?.status === "processing" || job?.status === "queued" ? 1 : 2;
      const difference = priority(aJob) - priority(bJob);
      if (difference !== 0) return difference;
    }
    if (sort === "analyzed") {
      const aComplete = aJob?.status === "complete" ? 0 : 1;
      const bComplete = bJob?.status === "complete" ? 0 : 1;
      if (aComplete !== bComplete) return aComplete - bComplete;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function countAttentionCaptures(records: CaptureRecord[], jobs: VisionJob[]) { return records.filter((record) => { const status = jobForCapture(record, jobs)?.status; return status === "failed" || status === "cancelled"; }).length; }

export function captureRecoveryLabel(job: VisionJob | undefined) {
  if (!job) return "No analysis started";
  if (job.status === "complete") return "Analysis complete";
  if (job.status === "failed") return "Retry available";
  if (job.status === "cancelled") return "Resume available";
  if (job.status === "processing") return `Analyzing · ${Math.round(job.progress * 100)}%`;
  return "Queued locally";
}
