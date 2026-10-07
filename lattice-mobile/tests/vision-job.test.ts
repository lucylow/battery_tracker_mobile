import { describe, expect, it } from "vitest";
import { parseVisionJobs, removeVisionJob, upsertVisionJob } from "@/lib/vision-job-store";
import { VisionQueue, type VisionJob } from "@/vision/queue";
import type { ImageAsset, VisionResult } from "@/vision/types";

const image: ImageAsset = {
  id: "image-1",
  uri: "file:///sample.png",
  width: 100,
  height: 100,
  mimeType: "image/png",
  createdAt: "2026-08-22T00:00:00.000Z",
  source: "camera",
  localOnly: true,
};

const job = (overrides: Partial<VisionJob> = {}): VisionJob => ({
  id: "vision-1",
  image,
  mode: "scientific-image",
  status: "queued",
  progress: 0,
  consentedToRemoteAnalysis: false,
  ...overrides,
});

const result: VisionResult = {
  id: "result-1",
  imageId: image.id,
  mode: "scientific-image",
  modelId: "test-provider",
  modelVersion: "1.0.0",
  status: "complete",
  measurements: [],
  warnings: [],
  provenance: ["deterministic test provider"],
  createdAt: "2026-08-22T00:00:00.000Z",
};

describe("vision job persistence helpers", () => {
  it("recovers only valid jobs from local storage and tolerates malformed JSON", () => {
    expect(parseVisionJobs("not-json")).toEqual([]);
    expect(parseVisionJobs(JSON.stringify([job(), { id: "invalid" }, null]))).toEqual([job()]);
  });

  it("updates a job in place at the front and removes it by id", () => {
    const complete = job({ status: "complete", progress: 1, result });
    const current = [job({ id: "older" }), job()];
    expect(upsertVisionJob(current, complete)).toEqual([complete, job({ id: "older" })]);
    expect(removeVisionJob([complete, job({ id: "older" })], complete.id)).toEqual([job({ id: "older" })]);
  });

  it("bounds persisted history to the newest twenty jobs", () => {
    const current = Array.from({ length: 20 }, (_, index) => job({ id: `job-${index}` }));
    const next = upsertVisionJob(current, job({ id: "newest" }));
    expect(next).toHaveLength(20);
    expect(next[0]?.id).toBe("newest");
    expect(next.some((item) => item.id === "job-19")).toBe(false);
  });
});

describe("vision queue recovery states", () => {
  it("completes a local job and reports progress updates", async () => {
    const updates: VisionJob[] = [];
    const queue = new VisionQueue({ analyze: async () => result });
    const completed = await queue.run(job(), (next) => updates.push(next));
    expect(completed.status).toBe("complete");
    expect(completed.progress).toBe(1);
    expect(updates.map((item) => item.status)).toEqual(["processing", "complete"]);
  });

  it("returns a failed job when the provider throws", async () => {
    const queue = new VisionQueue({ analyze: async () => { throw new Error("provider unavailable"); } });
    const failed = await queue.run(job());
    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("provider unavailable");
  });

  it("preserves cancellation as a resumable terminal state", async () => {
    const queue = new VisionQueue({ analyze: async () => result });
    const queued = job();
    const running = queue.run(queued);
    const cancelled = queue.cancel(queued.id);
    expect(cancelled?.status).toBe("cancelled");
    expect((await running).status).toBe("cancelled");
    expect((await running).error).toContain("cancelled");
  });
});
