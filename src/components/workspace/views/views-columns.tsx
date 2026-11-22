import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { LayoutGridIcon } from "lucide-react";

import type { dataTableFeatures } from "@/components/shared/data-table/features";
import { Checkbox } from "@/components/ui/checkbox";
import { formatRelativeTime } from "@/lib/format-relative-time";

import { NamedIcon } from "../tables/named-icon";
import type { ViewsRow } from "./views-table";

export function viewsColumns({
  workspace,
  table,
  canManage,
}: {
  workspace: string;
  table: string;
  canManage: boolean;
}): ColumnDef<typeof dataTableFeatures, ViewsRow>[] {
  return [
    ...(canManage
      ? [
          {
            id: "select",
            enableSorting: false,
            enableHiding: false,
            header: ({ table: grid }) => {
              const all = grid.getIsAllPageRowsSelected();
              return (
                <Checkbox
                  aria-label="Select all"
                  checked={all}
                  indeterminate={grid.getIsSomePageRowsSelected() && !all}
                  onCheckedChange={(value) => grid.toggleAllPageRowsSelected(!!value)}
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
          } satisfies ColumnDef<typeof dataTableFeatures, ViewsRow>,
        ]
      : []),
    {
      id: "name",
      enableHiding: false,
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <NamedIcon
            name={row.original.icon}
            fallback={LayoutGridIcon}
            className="size-4 shrink-0 text-muted-foreground"
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-medium">{row.original.name}</span>
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
      id: "columnCount",
      accessorKey: "columnCount",
      header: "Columns",
      cell: ({ row }) => <span className="tabular-nums">{row.original.columnCount}</span>,
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
}
