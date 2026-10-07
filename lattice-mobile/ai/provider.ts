import { answerLocally, type CopilotResponse, type ExperimentContext } from "@/ai/copilot";
import { withRetry } from "@/network/retry";

export type CopilotProviderResult = { response: CopilotResponse; mode: "server" | "local"; warning?: string };

export async function askCopilot(question: string, context: ExperimentContext): Promise<CopilotProviderResult> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!baseUrl) return { response: answerLocally(question, context), mode: "local" };
  try {
    const response = await withRetry(async () => {
      const result = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/ai/respond`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, context }) });
      if (!result.ok) throw new Error(`Provider returned HTTP ${result.status}`);
      return result.json() as Promise<CopilotResponse>;
    }, 2, 300);
    return { response, mode: "server" };
  } catch (error) {
    return { response: answerLocally(question, context), mode: "local", warning: error instanceof Error ? `Provider unavailable; using local fallback. ${error.message}` : "Provider unavailable; using local fallback." };
  }
}
