import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";
import { type AssistantReply, assistantReplySchema } from "@/lib/records/assistant";
import { DEFAULT_WORKSPACE } from "@/lib/workspace";

export type AssistantTurn = { role: "user" | "assistant"; content: string };

export async function askAssistant(
  tableId: number,
  message: string,
  history: AssistantTurn[],
): Promise<AssistantReply> {
  const result = await unwrapFetch(
    fetch("/api/workspaces/:workspace/tables/:table/assistant", {
      method: "POST",
      params: { workspace: DEFAULT_WORKSPACE, table: String(tableId) },
      body: { message, history },
    }),
  );
  return assistantReplySchema.parse(result);
}
