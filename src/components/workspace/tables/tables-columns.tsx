import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatRelativeTime } from "@/lib/format-relative-time";

import { NamedIcon } from "./named-icon";

function TableName({ id, name }: { id: number; name: string }) {
  const { id: workspace } = useWorkspace();
  return (
    <Link
      to="/workspaces/$workspace/tables/$table"
      params={{ workspace, table: String(id) }}
      className="truncate font-medium hover:underline"
    >
      {name}
    </Link>
  );
}
import type { TablesRow } from "./tables-table";

export const tablesColumns: ColumnDef<typeof dataTableFeatures, TablesRow>[] = [
  {
    id: "select",
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => {
      const all = table.getIsAllPageRowsSelected();
      return (
        <Checkbox
          aria-label="Select all"
          checked={all}
          indeterminate={table.getIsSomePageRowsSelected() && !all}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        />
      );
    },
    cell: ({ row }) => (
      <Checkbox
        aria-label={`Select ${row.original.name}`}
        checked={row.getIsSelected()}
        disabled={!row.getCanSelect()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
  },
  {
    id: "name",
    enableHiding: false,
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <NamedIcon name={row.original.icon} className="size-4 shrink-0 text-muted-foreground" />
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <TableName id={row.original.id} name={row.original.name} />
            {row.original.isHidden && <Badge variant="outline">Hidden</Badge>}
          </div>
          {row.original.description && (
            <span className="truncate text-muted-foreground text-xs">
              {row.original.description}
            </span>
          )}
        </div>
      </div>
    ),
  },
  {
    id: "groupName",
    accessorKey: "groupName",
    header: "Group",
    cell: ({ row }) =>
      row.original.groupName ? (
        <Badge variant="outline">{row.original.groupName}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "updatedAt",
    accessorKey: "updatedAt",
    header: "Updated",
    cell: ({ row }) => (
      <span
        className="text-muted-foreground"
        title={new Date(row.original.updatedAt).toLocaleString()}
      >
        {formatRelativeTime(row.original.updatedAt)}
      </span>
    ),
  },
];
