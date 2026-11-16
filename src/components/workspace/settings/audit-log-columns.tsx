import type { ColumnDef } from "@tanstack/react-table";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { summarizeAudit } from "@/lib/audit/format";
import { formatRelativeTime } from "@/lib/format-relative-time";

import { AuditActionBadge } from "./audit-action-badge";
import { AuditEntryDialog } from "./audit-entry-dialog";
import type { AuditRow } from "./audit-log";

export const auditColumns: ColumnDef<typeof dataTableFeatures, AuditRow>[] = [
  {
    id: "createdAt",
    meta: { label: "When" },
    enableSorting: false,
    enableHiding: false,
    header: "When",
    cell: ({ row }) => (
      <span
        className="whitespace-nowrap text-muted-foreground"
        title={new Date(row.original.createdAt).toLocaleString()}
      >
        {formatRelativeTime(row.original.createdAt)}
      </span>
    ),
  },
  {
    id: "actor",
    meta: { label: "Who" },
    enableSorting: false,
    header: "Who",
    cell: ({ row }) =>
      row.original.actorName ?? <span className="text-muted-foreground">Deleted user</span>,
  },
  {
    id: "action",
    meta: { label: "Action" },
    enableSorting: false,
    header: "Action",
    cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
  },
  {
    id: "table",
    meta: { label: "Table" },
    enableSorting: false,
    header: "Table",
    cell: ({ row }) => <span className="font-medium">{row.original.tableLabel}</span>,
  },
  {
    id: "details",
    meta: { label: "Details" },
    enableSorting: false,
    enableHiding: false,
    header: "Details",
    cell: ({ row }) => (
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 truncate">{summarizeAudit(row.original)}</span>
        {(row.original.changes.length > 0 || row.original.recordIds.length > 1) && (
          <AuditEntryDialog entry={row.original} />
        )}
      </div>
    ),
  },
];
