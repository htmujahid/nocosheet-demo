import { eq, useLiveQuery } from "@tanstack/react-db";

import { CloudUploadIcon } from "lucide-react";

import { pendingRecordsCollection } from "@/data/workspace/records";

export function PendingRecords({ tableId }: { tableId: number }) {
  const { data } = useLiveQuery((q) =>
    q
      .from({ pending: pendingRecordsCollection })
      .where(({ pending }) => eq(pending.tableId, tableId)),
  );
  const count = data.reduce((sum, item) => sum + item.rows.length, 0);
  if (count === 0) return null;

  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
      <CloudUploadIcon aria-hidden="true" className="size-4" />
      {count === 1 ? "1 record waiting to sync" : `${count} records waiting to sync`}
    </span>
  );
}
