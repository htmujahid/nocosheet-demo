import { z } from "zod";

import type { FilterTarget } from "./filter-param";
import {
  type FilterCondition,
  filterConditionSchema,
  filterKind,
  operatorInput,
  operatorsFor,
} from "./filters";

// OpenAI model called through the Cloudflare AI Gateway with the project's OPENAI_API_KEY.
export const ASSISTANT_MODEL = "gpt-4.1-mini";

const rawConditionSchema = z.object({
  column: z.string().min(1).max(64),
  op: z.string().min(1).max(32),
  value: z.unknown().optional(),
});

export type RawCondition = z.infer<typeof rawConditionSchema>;

const orderSchema = z
  .preprocess(
    (value) =>
      typeof value === "string" && value.toLowerCase().startsWith("desc") ? "desc" : "asc",
    z.enum(["asc", "desc"]),
  )
  .default("asc");

const actionUnion = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("filter"),
    conditions: z.array(rawConditionSchema).max(10).default([]),
    sort: z.object({ column: z.string(), order: orderSchema }).nullish(),
    search: z.string().max(200).nullish(),
  }),
  z.object({ kind: z.literal("none") }),
]);

// The assistant is read-only: it filters, sorts and searches but never changes records.
const WRITE_KINDS = ["create", "insert", "add", "update", "edit", "change", "delete", "remove"];

export const assistantActionSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const kind = record.kind;
    if (kind === "sort" || kind === "order" || (kind == null && "sort" in record))
      return { ...record, kind: "filter" };
    if (typeof kind === "string" && WRITE_KINDS.includes(kind)) return { kind: "none" };
  }
  return value;
}, actionUnion);

export type AssistantAction = z.infer<typeof assistantActionSchema>;

export const assistantReplySchema = z.object({
  reply: z.string().max(600).default(""),
  action: assistantActionSchema.default({ kind: "none" }),
});

export type AssistantReply = z.infer<typeof assistantReplySchema>;

export type AssistantColumn = {
  name: string;
  format: string;
  required: boolean;
  choices?: string[];
};

const KIND_LABEL: Record<string, string> = {
  text: "text",
  number: "number",
  date: "date",
  checkbox: "checkbox",
  single_select: "select",
  multi_select: "multi-select",
};

export function describeColumns(columns: AssistantColumn[]): string {
  return columns
    .map((column) => {
      const kind = filterKind(column.format);
      const type = kind ? KIND_LABEL[kind] : column.format;
      const choices = column.choices?.length ? ` [${column.choices.join(", ")}]` : "";
      return `${column.name} (${type})${choices}`;
    })
    .join("\n");
}

export type AssistantUser = { id: string; name: string };

export function assistantSystemPrompt(
  tableName: string,
  columns: AssistantColumn[],
  user: AssistantUser,
): string {
  return [
    `Read-only assistant for the "${tableName}" table. You filter, sort and search the grid; you never add, change or delete records.`,
    'Reply with one JSON object: {"reply": <one short sentence>, "action": <object>}.',
    "",
    "action is one of:",
    '- {"kind":"filter","conditions":[{"column","op","value"}],"sort":{"column","order"}|null,"search":string|null} — empty conditions with null sort and search clears all filters. order is "asc" or "desc".',
    '- {"kind":"none"} — for anything you cannot do (adding, changing or deleting records) or do not understand; explain in reply.',
    "",
    "Operators by type — text: equals, not_equals; number: eq, neq, gt, gte, lt, lte; date: eq, before, after, on_or_before, on_or_after (value as YYYY-MM-DD); select: is, is_not, is_any_of, is_none_of; checkbox: is (true/false). Every type also has is_empty and is_not_empty (omit value). One operator per condition. For a date range use two conditions.",
    "Use the exact column names. Only set sort or search when asked.",
    `For me/my/mine, filter "Created by" equals "${user.id}" (current user: ${user.name}).`,
    "",
    "Columns:",
    describeColumns(columns),
    "Filter/sort only: Id (number), Created at (date), Updated at (date), Created by (text), Updated by (text).",
    "",
    "Examples:",
    'show records where Status is To do -> {"reply":"Filtered by Status.","action":{"kind":"filter","conditions":[{"column":"Status","op":"is","value":"To do"}],"sort":null,"search":null}}',
    'sort by Name descending -> {"reply":"Sorted by Name.","action":{"kind":"filter","conditions":[],"sort":{"column":"Name","order":"desc"},"search":null}}',
    'remove all filters -> {"reply":"Cleared all filters.","action":{"kind":"filter","conditions":[],"sort":null,"search":null}}',
    'delete record 21 -> {"reply":"I can only filter, sort and search records.","action":{"kind":"none"}}',
  ].join("\n");
}

const scalar = (value: unknown): string =>
  typeof value === "string" || typeof value === "number" || typeof value === "boolean"
    ? String(value)
    : JSON.stringify(value);

function coerceValue(
  kind: ReturnType<typeof filterKind>,
  op: string,
  value: unknown,
): FilterCondition["value"] | undefined {
  if (!kind) return undefined;
  switch (operatorInput(kind, op)) {
    case "none":
      return undefined;
    case "number":
      return typeof value === "number" ? value : Number(value);
    case "boolean":
      return value === true || value === "true";
    case "choices":
      return Array.isArray(value) ? value.map(scalar) : [scalar(value ?? "")];
    default:
      return value == null ? "" : scalar(value);
  }
}

const EQUALITY = ["eq", "equals", "is", "=", "=="];
const INEQUALITY = ["neq", "not_equals", "is_not", "isnt", "not", "!=", "<>"];
const GREATER = ["gt", "greater_than", "greater", "more_than", ">"];
const GREATER_EQ = ["gte", "greater_or_equal", "at_least", ">="];
const LESS = ["lt", "less_than", "less", "before", "<"];
const LESS_EQ = ["lte", "less_or_equal", "at_most", "<="];

function resolveOp(kind: FilterTarget["kind"], rawOp: string): string | null {
  const op = rawOp
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)[0]
    .replace(/^['"`]+|['"`]+$/g, "");
  const operators = operatorsFor(kind);
  const has = (value: string) => operators.some((item) => item.value === value);
  const first = (candidates: string[]) => candidates.find((value) => has(value)) ?? null;

  if (has(op)) return op;
  if (EQUALITY.includes(op)) return first(["equals", "eq", "is"]);
  if (INEQUALITY.includes(op)) return first(["not_equals", "neq", "is_not"]);
  if (GREATER.includes(op)) return first(["gt", "after"]);
  if (GREATER_EQ.includes(op)) return first(["gte", "on_or_after"]);
  if (LESS.includes(op)) return first(["lt", "before"]);
  if (LESS_EQ.includes(op)) return first(["lte", "on_or_before"]);
  return null;
}

export type ResolvedConditions = {
  filters: FilterCondition[];
  errors: string[];
};

export function resolveConditions(
  raw: RawCondition[],
  targets: readonly FilterTarget[],
): ResolvedConditions {
  const filters: FilterCondition[] = [];
  const errors: string[] = [];
  for (const condition of raw) {
    const wanted = condition.column.trim().toLowerCase();
    const target = targets.find((item) => item.name.toLowerCase() === wanted);
    if (!target) {
      errors.push(`"${condition.column}" can't be filtered.`);
      continue;
    }
    const op = resolveOp(target.kind, condition.op);
    if (!op) {
      errors.push(`"${condition.op}" can't be used on "${target.name}".`);
      continue;
    }
    const value = coerceValue(target.kind, op, condition.value);
    const needsValue = operatorInput(target.kind, op) !== "none";
    const emptyValue =
      value === "" || value === undefined || (Array.isArray(value) && value.length === 0);
    if (needsValue && emptyValue) {
      errors.push(`"${target.name}" needs a value to filter by.`);
      continue;
    }
    const parsed = filterConditionSchema.safeParse({ column: target.key, op, value });
    if (parsed.success) filters.push(parsed.data);
    else errors.push(`"${target.name}" has an invalid value.`);
  }
  return { filters, errors };
}
