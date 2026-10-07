export type AITask = "chat" | "explain" | "teach" | "plan" | "compare" | "summarize" | "debug_experiment";
export type AIFeature = "copilot" | "explain_result" | "teach_concept" | "experiment_planner" | "compare" | "report";

export const AI_FEATURES: Record<AIFeature, { label: string; availableOffline: boolean; requiresConfirmation: boolean }> = {
  copilot: { label: "LATTICE Copilot", availableOffline: true, requiresConfirmation: false },
  explain_result: { label: "Explain this result", availableOffline: true, requiresConfirmation: false },
  teach_concept: { label: "Teach this concept", availableOffline: true, requiresConfirmation: false },
  experiment_planner: { label: "Plan a next experiment", availableOffline: false, requiresConfirmation: true },
  compare: { label: "Compare experiment states", availableOffline: true, requiresConfirmation: false },
  report: { label: "Generate a report", availableOffline: false, requiresConfirmation: false },
};

export function routeAITask(text: string): AITask {
  const question = text.toLowerCase();
  if (/what should i try|next experiment|design an experiment|plan/.test(question)) return "plan";
  if (/teach|lesson|quiz|learn|what is|define/.test(question)) return "teach";
  if (/compare|difference|versus|\bvs\b/.test(question)) return "compare";
  if (/summari[sz]e|brief me|tl;dr/.test(question)) return "summarize";
  if (/debug|invalid|error|not working/.test(question)) return "debug_experiment";
  if (/why did|why is|explain|what happened/.test(question)) return "explain";
  return "chat";
}
