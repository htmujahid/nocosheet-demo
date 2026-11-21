import { toastManager } from "@/components/ui/toast";

import type { ViewerColumn } from "./columns";
import type { ViewerRow } from "./records-grid";
import { useRecordWrites } from "./use-record-writes";

const payloadOf = (column: ViewerColumn, value: unknown) => {
  if (value === undefined || value === "") return null;
  if (column.format === "relation") return (value as { id: number } | null)?.id ?? null;
  return value;
};

export function useUpdateCell({ tableId }: { tableId: number }) {
  const writes = useRecordWrites(tableId);

  return (original: ViewerRow, draft: ViewerRow, column: ViewerColumn) => {
    if (JSON.stringify(original[column.key]) === JSON.stringify(draft[column.key])) return;

    const value = payloadOf(column, draft[column.key]);
    if (value === null && column.required)
      return toastManager.add({ type: "error", title: `${column.name} is required` });
    if (typeof value === "number" && Number.isNaN(value))
      return toastManager.add({ type: "error", title: `${column.name} must be a number` });

    writes.update(original.id, { [column.key]: value });
  };
}
