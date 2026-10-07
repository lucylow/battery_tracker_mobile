import { Share, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import type { ExperimentParameters, ModeledResults } from "@/domain/lattice";
import type { CaptureRecord } from "@/lib/capture-store";
import type { VisionJob } from "@/vision/queue";
import { captureBundleManifest, captureJson, type CaptureExportOptions } from "@/lib/capture-export";

export { captureBundleManifest, captureJson } from "@/lib/capture-export";

export function experimentJson(parameters: ExperimentParameters, results: ModeledResults) {
  return JSON.stringify({ schemaVersion: "lattice-experiment-1", exportedAt: new Date().toISOString(), parameters, results }, null, 2);
}

export async function shareExperiment(parameters: ExperimentParameters, results: ModeledResults) {
  return Share.share({ title: "LATTICE experiment", message: experimentJson(parameters, results) });
}

export async function shareCapture(record: CaptureRecord, job?: VisionJob, options?: CaptureExportOptions) {
  return Share.share({ title: "LATTICE annotated capture record", message: captureJson(record, job, options) });
}

export async function shareCaptureBundle(imageUri: string, record: CaptureRecord, job?: VisionJob, options?: CaptureExportOptions) {
  if (Platform.OS === "web" || !(await Sharing.isAvailableAsync())) return shareCapture(record, job, options);
  const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
  const zip = new JSZip();
  zip.file("annotated-capture.png", base64, { base64: true });
  zip.file("provenance.json", captureJson(record, job, options));
  zip.file("manifest.json", JSON.stringify(captureBundleManifest(record), null, 2));
  const bundleBase64 = await zip.generateAsync({ type: "base64", compression: "DEFLATE" });
  const bundleUri = `${FileSystem.cacheDirectory}lattice-capture-${record.id}.zip`;
  await FileSystem.writeAsStringAsync(bundleUri, bundleBase64, { encoding: FileSystem.EncodingType.Base64 });
  return Sharing.shareAsync(bundleUri, { mimeType: "application/zip", dialogTitle: "Share LATTICE capture bundle" });
}
