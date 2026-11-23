import { defineHandler } from "void";
import { ai } from "void/ai";
import { requireAuth } from "void/auth";
import { env } from "void/env";
import { UsageLimit } from "void/limits";
import { z } from "zod";

import { requireAccess } from "@/lib/access/require-access";
import { httpError, NOT_FOUND } from "@/lib/http";
import {
  ASSISTANT_MODEL,
  type AssistantColumn,
  assistantReplySchema,
  assistantSystemPrompt,
} from "@/lib/records/assistant";
import { findRecordTable } from "@/lib/records/repository";
import { listColumns } from "@/lib/tables/repository";

const params = z.object({ workspace: z.string(), table: z.coerce.number().int().positive() });

const body = z.object({
  message: z.string().min(1).max(1000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(10)
    .default([]),
});

const CHOICE_FORMATS = ["single_select", "multi_select"];

const extractJson = (text: string) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
};

export const POST = defineHandler.withValidator({ params, body })(async (c, { params, body }) => {
  await requireAccess(c, params.table, "read");
  const user = requireAuth(c);
  const table = await findRecordTable(c.get("workspaceId"), params.table);
  if (!table) throw httpError(404, NOT_FOUND);

  const columns: AssistantColumn[] = (await listColumns(table.id))
    .filter((column) => column.format !== "binary")
    .map((column) => ({
      name: column.name,
      format: column.format,
      required: column.isRequired,
      choices: CHOICE_FORMATS.includes(column.format)
        ? (column.options as { choices?: { value: string }[] } | null)?.choices?.map(
            (choice) => choice.value,
          )
        : undefined,
    }));

  const messages = [
    {
      role: "system",
      content: assistantSystemPrompt(table.name, columns, {
        id: user.id,
        name: user.name ?? user.email ?? "the current user",
      }),
    },
    ...body.history,
    { role: "user", content: body.message },
  ];

  const unavailable = {
    reply:
      "The assistant is unavailable right now. Check that an OpenAI API key is configured for the AI Gateway.",
    action: { kind: "none" as const },
  };

  let content: string | null = null;
  try {
    const response = await ai.provider("openai").fetch("/chat/completions", {
      headers: env.AI_GATEWAY_TOKEN
        ? { "cf-aig-authorization": `Bearer ${env.AI_GATEWAY_TOKEN}` }
        : undefined,
      body: {
        model: ASSISTANT_MODEL,
        messages,
        temperature: 0,
        max_tokens: 512,
        response_format: {
          type: "json_schema",
          json_schema: { name: "assistant_action", schema: SCHEMA },
        },
      },
    });
    if (!response.ok) {
      console.error(
        "assistant model error",
        response.status,
        await response.text().catch(() => ""),
      );
      return unavailable;
    }
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    content = data.choices?.[0]?.message?.content ?? null;
  } catch (error) {
    if (error instanceof UsageLimit) return error.response();
    console.error("assistant model error", error);
    return unavailable;
  }

  const payload = content ? extractJson(content) : null;
  const parsed = assistantReplySchema.safeParse(payload);
  if (parsed.success) return parsed.data;

  const reply =
    payload &&
    typeof payload === "object" &&
    typeof (payload as { reply?: unknown }).reply === "string"
      ? (payload as { reply: string }).reply.slice(0, 600)
      : "I couldn't work that out. Try rephrasing.";
  return {
    reply,
    action: { kind: "none" as const },
  };
});

const CONDITION = {
  type: "object",
  properties: {
    column: { type: "string" },
    op: { type: "string" },
    value: { type: ["string", "number", "boolean", "array", "null"] },
  },
  required: ["column", "op", "value"],
};

const SORT = {
  type: "object",
  properties: {
    column: { type: "string" },
    order: { type: "string", enum: ["asc", "desc"] },
  },
  required: ["column", "order"],
};

const SCHEMA = {
  type: "object",
  properties: {
    reply: { type: "string" },
    action: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["filter", "none"] },
        conditions: { type: "array", items: CONDITION },
        sort: SORT,
        search: { type: ["string", "null"] },
      },
      required: ["kind"],
    },
  },
  required: ["reply", "action"],
};
