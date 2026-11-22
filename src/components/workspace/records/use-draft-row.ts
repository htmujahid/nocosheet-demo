import { useState } from "react";

import { toastManager } from "@/components/ui/toast";

import { cellMode } from "./cells";
import type { ViewerColumn } from "./columns";
import type { ViewerRow } from "./records-grid-columns";
import { useRecordWrites } from "./use-record-writes";

export const DRAFT_ID = -1;

export const isDraft = (row: { id: number }) => row.id === DRAFT_ID;

export type DraftRow = {
  row: ViewerRow | null;
  saving: boolean;
  new: () => void;
  duplicate: (source: ViewerRow) => void;
  change: (value: unknown, column: ViewerColumn) => void;
  discard: () => void;
  save: () => void;
};

const payloadOf = (column: ViewerColumn, value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value) && value.length === 0) return undefined;
  if (column.format === "relation") return (value as { id: number }).id;
  return value;
};

export function useDraftRow({
  tableId,
  columns,
}: {
  tableId: number;
  columns: ViewerColumn[];
}): DraftRow {
  const writes = useRecordWrites(tableId);
  const [row, setRow] = useState<ViewerRow | null>(null);

  const open = (values: Record<string, unknown> = {}) =>
    setRow((current) => current ?? { ...values, id: DRAFT_ID });

  return {
    row,
    saving: false,
    new: () => open(),
    duplicate: (source) => {
      const values: Record<string, unknown> = {};
      for (const column of columns)
        if (["input", "popup", "toggle"].includes(cellMode(column)))
          values[column.key] = source[column.key];
      open(values);
    },
    change: (value, column) => setRow((current) => current && { ...current, [column.key]: value }),
    discard: () => setRow(null),
    save: () => {
      if (!row) return;
      const values: Record<string, unknown> = {};
      const missing: string[] = [];
      for (const column of columns) {
        if (column.readOnly) continue;
        const value = payloadOf(column, row[column.key]);
        if (value === undefined) {
          if (column.required && column.defaultValue === null) missing.push(column.name);
        } else if (typeof value === "number" && Number.isNaN(value)) {
          return toastManager.add({ type: "error", title: `${column.name} must be a number` });
        } else values[column.key] = value;
      }
      if (missing.length > 0)
        return toastManager.add({
          type: "error",
          title: "Fill in the required columns",
          description: missing.join(", "),
        });
      writes.create(values);
      toastManager.add({ type: "success", title: "Record created" });
      setRow(null);
    },
  };
}
