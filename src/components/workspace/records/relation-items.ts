import { useEffect, useMemo, useState } from "react";

import { useLiveQuery } from "@tanstack/react-db";

import { columnsCollection } from "@/data/workspace/columns";
import { recordsCollection } from "@/data/workspace/records";
import { tablesCollection } from "@/data/workspace/tables";
import { useAccess } from "@/hooks/use-access";

import type { ViewerColumn } from "./columns";
import { useReadOwner } from "./use-read-owner";

export type RelationItem = { value: string; label: string; id: number };

const LIMIT = 10;

export function useRelationItems(_workspace: string, column: ViewerColumn, search: string) {
  const targetId = Number(column.options.tableId);
  const readOwner = useReadOwner(targetId);
  const access = useAccess();

  const [term, setTerm] = useState(search.trim());
  useEffect(() => {
    const timeout = setTimeout(() => setTerm(search.trim()), 150);
    return () => clearTimeout(timeout);
  }, [search]);

  const { data: tables } = useLiveQuery((q) => q.from({ table: tablesCollection }));
  const { data: columns } = useLiveQuery((q) => q.from({ column: columnsCollection(targetId) }));
  const {
    data: records,
    isReady,
    isLoadingError: isError,
  } = useLiveQuery((q) => q.from({ record: recordsCollection(targetId) }));

  const titleKey = useMemo(() => {
    const titleColumnId = tables.find((table) => table.id === targetId)?.titleColumnId;
    return columns.find((item) => item.id === titleColumnId)?.columnName ?? null;
  }, [tables, columns, targetId]);

  const items = useMemo<RelationItem[]>(() => {
    const needle = term.toLowerCase();
    const found: RelationItem[] = [];
    if (access.scope(targetId, "read") === "none") return found;
    for (const record of [...records].sort((a, b) => a.id - b.id)) {
      if (readOwner && record.created_by !== readOwner) continue;
      const raw = titleKey ? record[titleKey] : null;
      const text = raw === null || raw === undefined ? "" : String(raw as string | number);
      if (needle && !text.toLowerCase().includes(needle)) continue;
      found.push({ value: String(record.id), label: text || `#${record.id}`, id: record.id });
      if (found.length >= LIMIT) break;
    }
    return found;
  }, [records, titleKey, term, readOwner, access, targetId]);

  return {
    items,
    isFetching: !isReady && !isError,
    error: isError ? new Error("The records could not be loaded.") : null,
  };
}
