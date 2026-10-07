import { useEffect, useMemo, useRef, useState, type ComponentRef } from "react";
import { Alert, AppState, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Sharing from "expo-sharing";
import ViewShot, { captureRef } from "react-native-view-shot";
import { router, useLocalSearchParams } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/components/screen-container";
import { CaptureAnnotationOverlay } from "@/components/capture-annotation-overlay";
import { useCaptures } from "@/lib/capture-store";
import { useVisionJobs } from "@/lib/vision-job-store";
import { calibrationFactor, pixelToPhysical, type Annotation, type ScaleCalibration } from "@/vision/review";
import { localVisionProvider } from "@/vision/local-provider";
import { VisionQueue, type VisionJob } from "@/vision/queue";
import { shareCapture, shareCaptureBundle } from "@/lib/mobile-export";
import { captureBundlePreview, captureExportPreview, captureShareReview,   exportCapabilityMeaning,
  exportCapabilityStatus, exportFailureMessage, exportRetryLabel, formatExportSize, shareOutcomeMessage } from "@/lib/capture-export";
import { DEFAULT_EXPORT_PREFERENCES, redactAllPreferences } from "@/lib/export-preferences";
import { loadExportPreferences, saveExportPreferences } from "@/lib/export-preferences-store";
import { createExportHistoryEntry, type ExportFormat } from "@/lib/export-history";
import { appendExportHistory, loadExportHistory } from "@/lib/export-history-store";
import { buildPrivacySummary, redactAllConfirmationCopy, shareConfirmationCopy } from "@/lib/privacy-center";
import { loadShareCapabilityState, saveShareCapabilityState, shareCapabilityActionLabel, shareCapabilityBadgeLabel, shareCapabilityFreshness, shareCapabilityFreshnessLabel, shareCapabilityRefreshMessage, shouldRefreshShareCapability } from "@/lib/share-capability-store";

export default function CaptureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records, updateRecord, removeRecord } = useCaptures();
  const { jobs, saveJob, removeJob } = useVisionJobs();
  const record = records.find((item) => item.id === id);
  const persistedJob = record ? jobs.find((item) => item.image.id === record.image.id) : undefined;
  const [note, setNote] = useState(record?.note ?? "");
  const [pixels, setPixels] = useState("");
  const [physicalValue, setPhysicalValue] = useState("");
  const [unit, setUnit] = useState("nm");
  const [jobActionBusy, setJobActionBusy] = useState(false);
  const [markerType, setMarkerType] = useState<Annotation["type"]>("arrow");
  const [markerLabel, setMarkerLabel] = useState("observation");
  const [showExportPreview, setShowExportPreview] = useState(false);
  const [redactLocalUri, setRedactLocalUri] = useState(false);
  const [redactNote, setRedactNote] = useState(false);
  const [redactProvenance, setRedactProvenance] = useState(false);
  const [redactAnalysis, setRedactAnalysis] = useState(DEFAULT_EXPORT_PREFERENCES.redactAnalysis);
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [imageExportBusy, setImageExportBusy] = useState(false);
  const [exportHistory, setExportHistory] = useState<Awaited<ReturnType<typeof loadExportHistory>>>([]);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [shareErrorFormat, setShareErrorFormat] = useState<"json" | "bundle" | null>(null);
  const [shareCapabilityAvailable, setShareCapabilityAvailable] = useState<boolean | null>(null);
  const [shareCapabilityCheckedAt, setShareCapabilityCheckedAt] = useState<number | null>(null);
  const [shareCapabilityChecking, setShareCapabilityChecking] = useState(false);
  const [shareCapabilityRefreshToken, setShareCapabilityRefreshToken] = useState(0);
  const shotRef = useRef<ComponentRef<typeof ViewShot>>(null);

  useEffect(() => {
    void loadExportHistory().then(setExportHistory);
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshIfNeeded = async () => {
      const persisted = await loadShareCapabilityState();
      if (!mounted) return;
      setShareCapabilityAvailable(persisted.available);
      setShareCapabilityCheckedAt(persisted.checkedAt);
      if (!shouldRefreshShareCapability(persisted)) return;
      setShareCapabilityChecking(true);
      const checkedAt = Date.now();
      try {
        const available = await Sharing.isAvailableAsync();
        if (!mounted) return;
        setShareCapabilityAvailable(available);
        setShareCapabilityCheckedAt(checkedAt);
        await saveShareCapabilityState({ available, checkedAt });
      } catch {
        if (!mounted) return;
        setShareCapabilityAvailable(false);
        setShareCapabilityCheckedAt(checkedAt);
        await saveShareCapabilityState({ available: false, checkedAt });
      } finally {
        if (mounted) setShareCapabilityChecking(false);
      }
    };
    void refreshIfNeeded();
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") void refreshIfNeeded(); });
    return () => { mounted = false; subscription.remove(); };
  }, [shareCapabilityRefreshToken]);

  useEffect(() => {
    void loadExportPreferences().then((preferences) => {
      setRedactLocalUri(preferences.redactLocalUri);
      setRedactNote(preferences.redactNote);
      setRedactProvenance(preferences.redactProvenance);
      setRedactAnalysis(preferences.redactAnalysis);
      setPreferencesLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;
    void saveExportPreferences({ redactLocalUri, redactNote, redactProvenance, redactAnalysis });
  }, [preferencesLoaded, redactLocalUri, redactNote, redactProvenance, redactAnalysis]);

  useEffect(() => {
    if (!record) return;
    setNote(record.note);
    setPixels(record.calibration?.pixels.toString() ?? "");
    setPhysicalValue(record.calibration?.physicalValue.toString() ?? "");
    setUnit(record.calibration?.unit ?? "nm");
  }, [record]);

  const calibration = useMemo<ScaleCalibration | null>(() => {
    const px = Number(pixels);
    const value = Number(physicalValue);
    return px > 0 && value > 0 ? { pixels: px, physicalValue: value, unit, confidence: 0.5 } : null;
  }, [pixels, physicalValue, unit]);

  if (!record) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><View style={styles.center}><Text style={styles.title}>Capture not found</Text><Pressable onPress={() => router.back()} style={styles.button}><Text style={styles.buttonText}>Back to Library</Text></Pressable></View></ScreenContainer>;

  const runPersistedJob = async (job: VisionJob) => {
    if (jobActionBusy) return;
    setJobActionBusy(true);
    const queue = new VisionQueue(localVisionProvider);
    try {
      await queue.run(job, saveJob);
    } finally {
      setJobActionBusy(false);
    }
  };

  const updateAnnotations = (annotations: Annotation[]) => updateRecord(record.id, { annotations });
  const addMarker = (x: number, y: number) => updateAnnotations([...record.annotations, { id: `mark-${Date.now()}`, type: markerType, x, y, text: markerLabel.trim() || markerType }]);
  const save = () => updateRecord(record.id, {
    note: note.trim(),
    annotations: record.annotations,
    calibration: calibration ?? undefined,
    provenance: calibration
      ? [...record.provenance.filter((item) => !item.startsWith("Scale calibration:")), `Scale calibration: ${calibration.pixels}px = ${calibration.physicalValue}${calibration.unit}`]
      : record.provenance.filter((item) => !item.startsWith("Scale calibration:")),
  });
  const exportOptions = { redactLocalUri, redactNote, redactProvenance, redactAnalysis };
  const privacySummary = buildPrivacySummary(exportOptions);
  const activeRedactions = Object.entries(exportOptions).filter(([, enabled]) => enabled).map(([key]) => key.replace(/^redact/, "").replace(/([A-Z])/g, " $1").trim().toLowerCase());
  const applyRedactAll = () => {
    const preferences = redactAllPreferences();
    setRedactLocalUri(preferences.redactLocalUri);
    setRedactNote(preferences.redactNote);
    setRedactProvenance(preferences.redactProvenance);
    setRedactAnalysis(preferences.redactAnalysis);
  };
  const redactAll = () => { const copy = redactAllConfirmationCopy(); Alert.alert(copy.title, copy.message, [{ text: "Cancel", style: "cancel" }, { text: "Redact all", style: "destructive", onPress: applyRedactAll }]); };
  const exportPreview = captureExportPreview(record, persistedJob, exportOptions);
  const bundlePreview = captureBundlePreview(record, exportOptions);
  const shareReview = captureShareReview(record, exportOptions);
  const capabilityState = { available: shareCapabilityAvailable, checkedAt: shareCapabilityCheckedAt };
  const capabilityFreshness = shareCapabilityFreshness(capabilityState);
  const capabilityStatus = exportCapabilityStatus(Platform.OS === "web" ? "web" : Platform.OS === "ios" ? "ios" : "android", shareCapabilityAvailable);
  const recordExport = async (format: ExportFormat) => {
    const next = await appendExportHistory(createExportHistoryEntry(record.id, format, exportOptions));
    setExportHistory(next);
  };
  const performExportCapture = async () => { try { await shareCapture(record, persistedJob, exportOptions); await recordExport("json"); setShareErrorFormat(null); setShareNotice(shareOutcomeMessage("shared", "json")); setShowExportPreview(false); } catch { setShareErrorFormat("json"); setShareNotice(exportFailureMessage("json")); } };
  const performExportAnnotatedImage = async () => {
    if (imageExportBusy || Platform.OS === "web") return performExportCapture();
    setImageExportBusy(true);
    try {
      const uri = await captureRef(shotRef, { format: "png", quality: 0.92, result: "tmpfile" });
      await shareCaptureBundle(uri, record, persistedJob, exportOptions);
      await recordExport("bundle");
      setShareErrorFormat(null);
      setShareNotice(shareOutcomeMessage("shared", "bundle"));
    } catch { setShareErrorFormat("bundle"); setShareNotice(exportFailureMessage("bundle")); } finally { setImageExportBusy(false); }
  };
  const confirmShare = (format: "json" | "bundle") => { const copy = shareConfirmationCopy(format, activeRedactions); Alert.alert(copy.title, copy.message, [{ text: "Cancel", style: "cancel", onPress: () => setShareNotice(shareOutcomeMessage("cancelled", format)) }, { text: "Share", onPress: () => { void (format === "bundle" ? performExportAnnotatedImage() : performExportCapture()); } }]); };
  const deleteCapture = () => {
    removeJob(record.image.id);
    removeRecord(record.id);
    router.back();
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5"><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to Library"><MaterialIcons name="arrow-back" size={22} color="#F4F8FC" /></Pressable><Text style={styles.title}>Capture detail</Text><View style={{ width: 22 }} /></View>
    <ViewShot ref={shotRef} style={styles.captureShot} options={{ format: "png", quality: 0.92 }}><CaptureAnnotationOverlay image={record.image} annotations={record.annotations} calibration={calibration} onAddPoint={addMarker} onRemove={(annotationId) => updateAnnotations(record.annotations.filter((item) => item.id !== annotationId))} accessibilityLabel="Saved capture with local annotations and calibration guide" /></ViewShot>
    <View style={styles.metaCard}><Text style={styles.kicker}>{record.mode.replace("-", " ").toUpperCase()}</Text><Text style={styles.meta}>Source: {record.image.source} · {record.remoteConsent ? "Remote consent recorded" : "Local only"}</Text><Text style={styles.meta}>Captured {new Date(record.createdAt).toLocaleDateString()}</Text></View>
    {persistedJob && <View style={styles.queueCard}><View style={styles.queueHeader}><Text style={styles.queueTitle}>Vision analysis · {persistedJob.status}</Text><Text style={styles.queueProgress}>{Math.round(persistedJob.progress * 100)}%</Text></View><Text style={styles.meta}>{persistedJob.status === "complete" ? (persistedJob.result?.warnings[0] ?? "Analysis complete; review measurements with calibration.") : persistedJob.error ?? "A local analysis can resume from this saved state."}</Text>{(persistedJob.status === "queued" || persistedJob.status === "processing" || persistedJob.status === "failed" || persistedJob.status === "cancelled") && <Pressable onPress={() => void runPersistedJob(persistedJob)} disabled={jobActionBusy} style={styles.queueButton} accessibilityRole="button"><Text style={styles.queueButtonText}>{jobActionBusy ? "Resuming…" : persistedJob.status === "failed" || persistedJob.status === "cancelled" ? "Retry local analysis" : "Resume local analysis"}</Text></Pressable>}<Pressable onPress={() => removeJob(persistedJob.id)} style={styles.queueRemove} accessibilityRole="button"><Text style={styles.queueRemoveText}>Clear saved analysis state</Text></Pressable></View>}
    <Text style={styles.section}>Local annotation</Text><Text style={styles.helper}>Choose a marker style and label, then tap the image. Tap an existing marker to remove it.</Text><View style={styles.annotationTools}><Pressable onPress={() => setMarkerType("arrow")} style={[styles.toolButton, markerType === "arrow" && styles.toolButtonSelected]} accessibilityRole="button"><Text style={styles.toolText}>Point</Text></Pressable><Pressable onPress={() => setMarkerType("box")} style={[styles.toolButton, markerType === "box" && styles.toolButtonSelected]} accessibilityRole="button"><Text style={styles.toolText}>Box</Text></Pressable><TextInput value={markerLabel} onChangeText={setMarkerLabel} placeholder="Marker label" placeholderTextColor="#70849A" style={styles.markerInput} accessibilityLabel="Marker label" /></View>
    {record.annotations.filter((item) => item.x !== undefined && item.y !== undefined).map((item) => <View key={item.id} style={styles.annotationRow}><TextInput value={item.text ?? ""} onChangeText={(text) => updateAnnotations(record.annotations.map((annotation) => annotation.id === item.id ? { ...annotation, text } : annotation))} placeholder="Annotation label" placeholderTextColor="#70849A" style={styles.annotationInput} accessibilityLabel={`Edit annotation ${item.id}`} /><Pressable onPress={() => updateAnnotations(record.annotations.filter((annotation) => annotation.id !== item.id))} accessibilityRole="button"><Text style={styles.deleteText}>Remove</Text></Pressable></View>)}
    <TextInput value={note} onChangeText={setNote} placeholder="Label this sample or observation" placeholderTextColor="#70849A" style={styles.input} accessibilityLabel="Capture annotation" />
    <Text style={styles.section}>Optional scale calibration</Text><Text style={styles.helper}>Add a known pixel span and its physical value. This does not claim a validated measurement.</Text><View style={styles.row}><TextInput value={pixels} onChangeText={setPixels} keyboardType="decimal-pad" placeholder="Pixels" placeholderTextColor="#70849A" style={[styles.input, styles.smallInput]} accessibilityLabel="Calibration pixels" /><TextInput value={physicalValue} onChangeText={setPhysicalValue} keyboardType="decimal-pad" placeholder="Value" placeholderTextColor="#70849A" style={[styles.input, styles.smallInput]} accessibilityLabel="Calibration physical value" /><TextInput value={unit} onChangeText={setUnit} placeholder="Unit" placeholderTextColor="#70849A" style={[styles.input, styles.unitInput]} accessibilityLabel="Calibration unit" /></View>{calibration && <View style={styles.calibrationCard}><Text style={styles.calibrationTitle}>Local calibration ready</Text><Text style={styles.meta}>{calibration.pixels}px = {calibration.physicalValue}{calibration.unit} · factor {calibrationFactor(calibration)?.toFixed(4)} {calibration.unit}/px</Text><Text style={styles.meta}>100px ≈ {pixelToPhysical(calibration, 100)?.toFixed(2)}{calibration.unit} (assistive only)</Text></View>}
    <Text style={styles.section}>Provenance</Text>{record.provenance.map((item) => <Text key={item} style={styles.provenance}>• {item}</Text>)}<Pressable onPress={save} style={styles.button} accessibilityRole="button"><Text style={styles.buttonText}>Save detail</Text></Pressable>{shareNotice && <View style={styles.shareNotice}><MaterialIcons name={shareErrorFormat ? "error-outline" : shareNotice.includes("cancelled") ? "info-outline" : "check-circle"} size={17} color={shareErrorFormat ? "#FF9BA5" : shareNotice.includes("cancelled") ? "#FFC76B" : "#65E6E0"} /><Text style={styles.shareNoticeText}>{shareNotice}</Text>{shareErrorFormat && <Pressable onPress={() => confirmShare(shareErrorFormat)} accessibilityRole="button"><Text style={styles.retryText}>{exportRetryLabel(shareErrorFormat)}</Text></Pressable>}</View>}<Pressable onPress={() => setShowExportPreview((value) => !value)} style={styles.exportButton} accessibilityRole="button" accessibilityState={{ expanded: showExportPreview }}><MaterialIcons name="share" size={17} color="#65E6E0" /><Text style={styles.exportText}>{showExportPreview ? "Hide export preview" : "Export local record"}</Text></Pressable>{showExportPreview && <View style={styles.exportCard}><Text style={styles.exportTitle}>Review before sharing</Text><View style={styles.reviewCard}><Text style={styles.reviewTitle}>Final file review</Text><Text style={styles.exportMeta}>Image context: {shareReview.imageContext}</Text><Text style={styles.exportMeta}>URI handling: {shareReview.localUri}</Text><Text style={styles.exportMeta}>Bundle files: {shareReview.files.join(" · ")}</Text><Text style={styles.exportMeta}>Estimated PNG: {formatExportSize(shareReview.estimatedPngBytes)} · Bundle: {formatExportSize(shareReview.estimatedBundleBytes)}</Text><Text style={styles.exportMeta}>Export support: {capabilityStatus.label}. {capabilityStatus.guidance}</Text><Text style={styles.exportMeta}>{exportCapabilityMeaning(capabilityStatus.state)}</Text><Text style={styles.exportMeta}>Capability check: {shareCapabilityChecking ? shareCapabilityRefreshMessage("checking") : shareCapabilityBadgeLabel(capabilityState)} · {shareCapabilityFreshnessLabel(capabilityFreshness)} · no capture content is accessed.</Text><Pressable onPress={() => { setShareCapabilityAvailable(null); setShareCapabilityCheckedAt(null); setShareCapabilityRefreshToken((value) => value + 1); }} style={styles.capabilityRefreshButton} accessibilityRole="button" accessibilityLabel="Refresh share support"><MaterialIcons name="refresh" size={16} color="#65E6E0" /><Text style={styles.capabilityRefreshText}>{shareCapabilityChecking ? shareCapabilityRefreshMessage("checking") : "Refresh share support"}</Text></Pressable><Text style={styles.exportMeta}>Active redactions: {shareReview.redactions.length ? shareReview.redactions.join(", ") : "none"}</Text></View><View style={styles.privacySummaryCard}><Text style={styles.privacySummaryTitle}>Privacy summary</Text>{privacySummary.slice(1, 5).map((item) => <View key={item.title} style={styles.privacySummaryRow}><Text style={styles.privacySummaryLabel}>{item.title}</Text><Text style={[styles.privacySummaryValue, !item.enabled && styles.privacySummaryRedacted]}>{item.enabled ? "Included" : "Redacted"}</Text></View>)}</View><Text style={styles.exportMeta}>Local image URI: {exportPreview.localUri}</Text><Pressable onPress={() => setRedactLocalUri((value) => !value)} style={styles.redactionRow} accessibilityRole="checkbox" accessibilityState={{ checked: redactLocalUri }}><MaterialIcons name={redactLocalUri ? "check-box" : "check-box-outline-blank"} size={18} color="#65E6E0" /><Text style={styles.exportMeta}>Redact local URI from shared record</Text></Pressable><Pressable onPress={() => setRedactNote((value) => !value)} style={styles.redactionRow} accessibilityRole="checkbox" accessibilityState={{ checked: redactNote }}><MaterialIcons name={redactNote ? "check-box" : "check-box-outline-blank"} size={18} color="#65E6E0" /><Text style={styles.exportMeta}>Redact note</Text></Pressable><Pressable onPress={() => setRedactProvenance((value) => !value)} style={styles.redactionRow} accessibilityRole="checkbox" accessibilityState={{ checked: redactProvenance }}><MaterialIcons name={redactProvenance ? "check-box" : "check-box-outline-blank"} size={18} color="#65E6E0" /><Text style={styles.exportMeta}>Redact provenance entries</Text></Pressable><Pressable onPress={() => setRedactAnalysis((value) => !value)} style={styles.redactionRow} accessibilityRole="checkbox" accessibilityState={{ checked: redactAnalysis }}><MaterialIcons name={redactAnalysis ? "check-box" : "check-box-outline-blank"} size={18} color="#65E6E0" /><Text style={styles.exportMeta}>Redact analysis details</Text></Pressable><Pressable onPress={redactAll} style={styles.redactAllButton} accessibilityRole="button"><Text style={styles.redactAllText}>Redact all sensitive fields</Text></Pressable><Text style={styles.exportMeta}>Annotations: {exportPreview.annotationCount} · Calibration: {exportPreview.calibration}</Text><Text style={styles.exportMeta}>Analysis: {exportPreview.analysisStatus} · Provenance entries: {exportPreview.provenanceCount}</Text><Text style={styles.exportPrivacy}>Privacy boundary: {exportPreview.uploadBehavior}. {exportPreview.annotationPackage}. The bundle stays local until you confirm sharing.</Text><View style={styles.bundleChecklist}><Text style={styles.exportTitle}>Export preview</Text><Image source={{ uri: record.image.uri }} style={styles.exportThumbnail} resizeMode="cover" accessibilityLabel="Preview of the annotated capture export" /><Text style={styles.exportMeta}>Image context: {bundlePreview.dimensions} · estimated PNG {formatExportSize(bundlePreview.estimatedPngBytes)}</Text><Text style={styles.exportMeta}>Estimated bundle size: {formatExportSize(bundlePreview.estimatedBundleBytes)} (size varies with compression)</Text><Text style={styles.exportTitle}>Bundle contents</Text>{bundlePreview.files.map((file) => <Text key={file} style={styles.exportMeta}>✓ {file}</Text>)}<Text style={styles.exportMeta}>{bundlePreview.imageLabel} · {bundlePreview.sidecarLabel} · {bundlePreview.manifestLabel}</Text><Text style={styles.exportMeta}>URI handling: {bundlePreview.localUri} · Redactions: {bundlePreview.redactions.length ? bundlePreview.redactions.join(", ") : "none"}</Text><Text style={styles.exportPrivacy}>{bundlePreview.uploadBehavior}.</Text></View>{exportHistory.length > 0 && <View style={styles.historyCard}><Text style={styles.exportTitle}>Recent local exports</Text>{exportHistory.slice(0, 3).map((entry) => <Text key={entry.id} style={styles.exportMeta}>{entry.format === "bundle" ? "PNG + JSON bundle" : "JSON sidecar"} · {new Date(entry.createdAt).toLocaleString()} · {entry.redactions.length ? `redacted: ${entry.redactions.join(", ")}` : "no fields redacted"}</Text>)}<Text style={styles.exportPrivacy}>History stores metadata only; image contents are never stored here.</Text></View>}<View style={styles.shareActionRow}><Pressable onPress={() => confirmShare("bundle")} style={[styles.queueButton, styles.shareActionButton]} accessibilityRole="button"><Text style={styles.queueButtonText}>{imageExportBusy ? "Preparing bundle…" : capabilityStatus.state === "checking" ? "Checking share support…" : capabilityStatus.state === "ready" ? "Share PNG + JSON bundle" : "Share JSON fallback"}</Text></Pressable><View style={styles.capabilityBadge} accessibilityLabel={`Share capability: ${shareCapabilityActionLabel(capabilityState)}`}><Text style={styles.capabilityBadgeText}>{shareCapabilityActionLabel(capabilityState)}</Text></View></View><Pressable onPress={() => confirmShare("json")} style={styles.exportButton} accessibilityRole="button"><Text style={styles.exportText}>Share JSON sidecar</Text></Pressable></View>}<Pressable onPress={deleteCapture} style={styles.deleteButton} accessibilityRole="button"><Text style={styles.deleteText}>Delete capture</Text></Pressable>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ captureShot: { width: "100%", minHeight: 220, borderRadius: 18, overflow: "hidden" }, content: { paddingTop: 12, paddingBottom: 40 }, header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }, title: { color: "#F4F8FC", fontSize: 21, fontWeight: "800" }, metaCard: { backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 15, padding: 13, marginTop: 14 }, kicker: { color: "#65E6E0", fontSize: 10, fontWeight: "800", letterSpacing: 1 }, meta: { color: "#9FB0C3", fontSize: 12, lineHeight: 18, marginTop: 5 }, queueCard: { backgroundColor: "#16152E", borderWidth: 1, borderColor: "#3D3468", borderRadius: 15, padding: 13, marginTop: 14 }, queueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, queueTitle: { color: "#9B8CFF", fontSize: 12, fontWeight: "800" }, queueProgress: { color: "#9B8CFF", fontSize: 12, fontWeight: "800" }, queueButton: { alignItems: "center", backgroundColor: "#9B8CFF", borderRadius: 12, paddingVertical: 11, marginTop: 11 }, shareActionRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }, shareActionButton: { flex: 1, marginTop: 0 }, capabilityBadge: { borderWidth: 1, borderColor: "#27415C", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8, maxWidth: 105 }, capabilityBadgeText: { color: "#9FB0C3", fontSize: 9, fontWeight: "800", textAlign: "center" }, queueButtonText: { color: "#0B1020", fontSize: 12, fontWeight: "800" }, queueRemove: { alignItems: "center", paddingTop: 10 }, queueRemoveText: { color: "#9FB0C3", fontSize: 11, fontWeight: "700" }, section: { color: "#F4F8FC", fontSize: 15, fontWeight: "800", marginTop: 22, marginBottom: 8 }, helper: { color: "#70849A", fontSize: 12, lineHeight: 18 }, annotationTools: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }, toolButton: { borderWidth: 1, borderColor: "#27415C", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }, toolButtonSelected: { borderColor: "#65E6E0", backgroundColor: "#0D2833" }, toolText: { color: "#9FB0C3", fontSize: 11, fontWeight: "800" }, markerInput: { flex: 1, minHeight: 40, color: "#F4F8FC", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 10, paddingHorizontal: 10 }, annotationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }, annotationInput: { flex: 1, minHeight: 40, color: "#F4F8FC", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 10, paddingHorizontal: 10 }, input: { minHeight: 46, color: "#F4F8FC", backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 13, paddingHorizontal: 12, marginTop: 4 }, row: { flexDirection: "row", gap: 8 }, smallInput: { flex: 1 }, unitInput: { flex: 0.7 }, calibrationCard: { backgroundColor: "#16152E", borderWidth: 1, borderColor: "#3D3468", borderRadius: 13, padding: 12, marginTop: 12 }, calibrationTitle: { color: "#9B8CFF", fontSize: 12, fontWeight: "800" }, provenance: { color: "#70849A", fontSize: 12, lineHeight: 18 }, button: { alignItems: "center", backgroundColor: "#65E6E0", borderRadius: 14, paddingVertical: 14, marginTop: 24 }, buttonText: { color: "#07111F", fontWeight: "800" }, exportButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderWidth: 1, borderColor: "#27415C", borderRadius: 14, paddingVertical: 13, marginTop: 9 }, exportText: { color: "#65E6E0", fontWeight: "800" }, bundleChecklist: { borderTopWidth: 1, borderTopColor: "#27415C", marginTop: 10, paddingTop: 9 }, exportThumbnail: { width: "100%", height: 130, borderRadius: 10, marginTop: 8, backgroundColor: "#07111F" }, historyCard: { backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 14, padding: 12, marginTop: 10 }, shareNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#0D2833", borderWidth: 1, borderColor: "#27656B", borderRadius: 12, padding: 11, marginTop: 10 }, shareNoticeText: { flex: 1, color: "#C7D9E4", fontSize: 11, lineHeight: 17 }, retryText: { color: "#65E6E0", fontSize: 10, fontWeight: "800", paddingTop: 2 }, reviewCard: { backgroundColor: "#101C31", borderRadius: 12, padding: 11, marginTop: 10, marginBottom: 4 }, reviewTitle: { color: "#F4F8FC", fontSize: 12, fontWeight: "800", marginBottom: 3 }, privacySummaryCard: { backgroundColor: "#101C31", borderRadius: 12, padding: 11, marginTop: 10, marginBottom: 4 }, privacySummaryTitle: { color: "#F4F8FC", fontSize: 12, fontWeight: "800", marginBottom: 5 }, privacySummaryRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#1B3047", paddingVertical: 6 }, privacySummaryLabel: { color: "#9FB0C3", fontSize: 10 }, privacySummaryValue: { color: "#65E6E0", fontSize: 10, fontWeight: "800" }, capabilityRefreshButton: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", borderWidth: 1, borderColor: "#27415C", borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, marginTop: 8 }, capabilityRefreshText: { color: "#65E6E0", fontSize: 10, fontWeight: "800" }, privacySummaryRedacted: { color: "#FFC76B" }, exportCard: { backgroundColor: "#0D1B2E", borderWidth: 1, borderColor: "#27415C", borderRadius: 14, padding: 12, marginTop: 10 }, exportTitle: { color: "#F4F8FC", fontSize: 13, fontWeight: "800" }, exportMeta: { color: "#9FB0C3", fontSize: 11, lineHeight: 17, marginTop: 5 }, exportPrivacy: { color: "#65E6E0", fontSize: 11, lineHeight: 17, marginTop: 8 }, redactionRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 }, redactAllButton: { alignItems: "center", borderWidth: 1, borderColor: "#FFB86B", borderRadius: 10, paddingVertical: 9, marginTop: 10 }, redactAllText: { color: "#FFB86B", fontSize: 11, fontWeight: "800" }, deleteButton: { alignItems: "center", padding: 14, marginTop: 6 }, deleteText: { color: "#FF7D8A", fontWeight: "800" } });
