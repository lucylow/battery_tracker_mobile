import type { ExportPreferences } from "@/lib/export-preferences";

export type PrivacySummary = { title: string; detail: string; enabled: boolean }[];

export function buildPrivacySummary(preferences: ExportPreferences): PrivacySummary {
  return [
    { title: "Local capture records", detail: "Remain on this device unless you explicitly share them.", enabled: true },
    { title: "Export local URI", detail: "Include the local image URI in shared JSON and bundles.", enabled: !preferences.redactLocalUri },
    { title: "Export notes", detail: "Include your notes in shared JSON and bundles.", enabled: !preferences.redactNote },
    { title: "Export provenance", detail: "Include provenance entries in shared JSON and bundles.", enabled: !preferences.redactProvenance },
    { title: "Export analysis", detail: "Include analysis details in shared JSON and bundles.", enabled: !preferences.redactAnalysis },
    { title: "Remote analysis", detail: "Never starts implicitly; requires an explicit user action and consent.", enabled: false },
  ];
}

export function formatPrivacyTimestamp(timestamp: number | null) {
  return timestamp === null ? "Not checked yet" : new Date(timestamp).toLocaleString();
}

export function shareCapabilityAuditEntry(timestamp: number | null) {
  return timestamp === null ? "No share-capability check has been recorded locally." : `Share capability checked locally on ${formatPrivacyTimestamp(timestamp)}; no capture content was accessed or uploaded.`;
}

export function shareConfirmationCopy(format: "json" | "bundle", redactions: string[]) {
  const label = format === "bundle" ? "PNG + JSON bundle" : "JSON sidecar";
  const privacy = redactions.length ? `${redactions.length} field${redactions.length === 1 ? "" : "s"} redacted` : "No metadata fields redacted";
  return { title: `Share ${label}?`, message: `${privacy}. Sharing is explicit and will open the device share sheet.` };
}

export function redactAllConfirmationCopy() {
  return { title: "Redact all export fields?", message: "Local URI, notes, provenance, and analysis details will be omitted from future exports until you change the preferences." };
}

export function destructiveConfirmationCopy(kind: "settings" | "history") {
  return kind === "settings"
    ? { title: "Reset local settings?", message: "Visualization preferences and entitlement metadata will reset. Captures, exports, experiments, and learning progress will remain." }
    : { title: "Clear export metadata?", message: "This removes local export-history metadata only. It does not delete capture records or shared files." };
}
