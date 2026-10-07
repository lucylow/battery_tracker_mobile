export type AIWorkspaceMode = "copilot" | "tutor" | "researcher" | "analyst" | "planner" | "voice";
export type AIPendingAction = { id: string; type: "change_parameter" | "save_snapshot" | "start_plan"; title: string; description: string; reversible: boolean; requiresApproval: boolean };
export type AIWorkspace = { experimentId?: string; activeMode: AIWorkspaceMode; selectedTool?: string; attachedImageIds: string[]; pendingActions: AIPendingAction[] };
export type AgentState = "idle" | "planning" | "retrieving" | "reasoning" | "waiting_approval" | "completed" | "failed" | "cancelled";
export const COPILOT_MODE_CONFIGS: Array<{ id: AIWorkspaceMode; title: string; description: string; readOnly: boolean; allowedTools: string[] }> = [
  { id: "copilot", title: "Copilot", description: "Explain the current experiment.", readOnly: true, allowedTools: ["explain_current_result"] },
  { id: "tutor", title: "Tutor", description: "Teach materials science interactively.", readOnly: true, allowedTools: ["define_concept"] },
  { id: "analyst", title: "Analyst", description: "Analyze local experiment data.", readOnly: true, allowedTools: ["dataset_stats", "comparison"] },
  { id: "planner", title: "Planner", description: "Draft bounded experiment changes.", readOnly: false, allowedTools: ["draft_experiment", "compare_experiments"] },
];
export const ALLOWED_AGENT_TRANSITIONS: Record<AgentState, AgentState[]> = { idle: ["planning"], planning: ["retrieving", "reasoning", "failed", "cancelled"], retrieving: ["reasoning", "failed", "cancelled"], reasoning: ["waiting_approval", "completed", "failed", "cancelled"], waiting_approval: ["completed", "cancelled", "failed"], completed: [], failed: [], cancelled: [] };
export function canTransition(from: AgentState, to: AgentState) { return ALLOWED_AGENT_TRANSITIONS[from].includes(to); }
export type ActionPreview = { id: string; title: string; before: unknown; after: unknown; impact: string; reversible: boolean; requiresApproval: boolean };
export function previewParameterChange(key: string, before: number, after: number): ActionPreview { return { id: `preview-${key}`, title: `Change ${key}`, before, after, impact: "The active educational model will recompute outputs after approval.", reversible: true, requiresApproval: true }; }
export function rollbackParameterChange(preview: ActionPreview) { return preview.reversible ? { [String(preview.id).replace("preview-", "")]: preview.before } : null; }
