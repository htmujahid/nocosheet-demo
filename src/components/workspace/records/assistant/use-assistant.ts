import { useCallback, useMemo, useState } from "react";

import { askAssistant, type AssistantTurn } from "@/data/workspace/assistant";
import { isNetworkError } from "@/lib/api-error";
import { type AssistantAction, resolveConditions } from "@/lib/records/assistant";
import { targetsOfColumns } from "@/lib/records/filter-param";
import { type FilterCondition, SYSTEM_FILTER_COLUMNS } from "@/lib/records/filters";

import type { ViewerColumn } from "../columns";

export type Proposal = { kind: "filter"; summary: string } | { kind: "error"; errors: string[] };

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposal?: Proposal;
};

const clean = (value?: string | null): string => {
  const text = (value ?? "").trim();
  return text && !["null", "none", "undefined"].includes(text.toLowerCase()) ? text : "";
};

export type ApplyView = (input: {
  filters: FilterCondition[];
  sort: string | null;
  order: "asc" | "desc";
  search: string;
}) => void;

export function useAssistant({
  tableId,
  columns,
  applyView,
}: {
  tableId: number;
  columns: ViewerColumn[];
  applyView: ApplyView;
}) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [pending, setPending] = useState(false);

  const targets = useMemo(
    () =>
      targetsOfColumns([
        ...columns
          .filter((column) => column.filterable)
          .map((column) => ({ columnName: column.key, name: column.name, format: column.format })),
        ...SYSTEM_FILTER_COLUMNS.map((column) => ({ ...column })),
      ]),
    [columns],
  );

  const toProposal = useCallback(
    (action: AssistantAction): Proposal | undefined => {
      if (action.kind !== "filter") return undefined;

      const { filters, errors } = resolveConditions(action.conditions, targets);
      // Conditions were requested but none resolved: that's a real failure.
      if (action.conditions.length > 0 && filters.length === 0)
        return {
          kind: "error",
          errors: errors.length ? errors : ["I couldn't work out that filter."],
        };
      // No conditions and nothing else means "show everything" / clear the filters.
      const sortName = clean(action.sort?.column);
      const sortColumn = sortName
        ? columns.find(
            (column) => column.sortable && column.name.toLowerCase() === sortName.toLowerCase(),
          )
        : undefined;
      const search = clean(action.search);
      applyView({
        filters,
        sort: sortColumn ? sortColumn.name : null,
        order: action.sort?.order ?? "asc",
        search,
      });
      const cleared = filters.length === 0 && !sortColumn && !search;
      return {
        kind: "filter",
        summary: cleared ? "showing all records" : summarize(filters, targets, search),
      };
    },
    [targets, columns, applyView],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;
      const userMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      // Each command is interpreted independently so earlier filters or sorts never carry over.
      const history: AssistantTurn[] = [];
      setMessages((current) => [...current, userMessage]);
      setPending(true);
      try {
        const reply = await askAssistant(tableId, trimmed, history);
        const proposal = toProposal(reply.action);
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", content: reply.reply, proposal },
        ]);
      } catch (error) {
        const message = isNetworkError(error)
          ? "You appear to be offline. The assistant needs a connection."
          : error instanceof Error
            ? error.message
            : "Something went wrong.";
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", content: message },
        ]);
      } finally {
        setPending(false);
      }
    },
    [pending, tableId, toProposal],
  );

  return { messages, pending, send };
}

function summarize(
  filters: FilterCondition[],
  targets: readonly { key: string; name: string }[],
  search: string,
): string {
  const nameOf = (key: string) => targets.find((target) => target.key === key)?.name ?? key;
  const parts = filters.map((filter) => `${nameOf(filter.column)} ${filter.op.replace(/_/g, " ")}`);
  if (search) parts.push(`matching "${search}"`);
  return parts.length ? parts.join(", ") : "all records";
}
