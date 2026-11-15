import { useMemo } from "react";

import { type UseSuspenseQueryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { tableQueryOptions } from "@/data/workspace/tables";
import { viewQueryOptions } from "@/data/workspace/views";

import { buildScopedColumns, buildViewerColumns, type ViewScope } from "./columns";

type TableData = Parameters<typeof buildViewerColumns>[0] & { name: string };

type ViewData = {
  name: string;
  table: { id: number; name: string; titleColumnId: number | null };
  columns: TableData["columns"];
};

export function useRecordScope(workspace: string, tableId: number, view?: Pick<ViewScope, "id">) {
  const options = view
    ? viewQueryOptions(workspace, tableId, view.id)
    : tableQueryOptions(workspace, tableId);
  const { data } = useSuspenseQuery(
    options as unknown as UseSuspenseQueryOptions<TableData | ViewData>,
  );

  return useMemo(
    () =>
      view
        ? {
            name: data.name,
            tableName: (data as ViewData).table.name,
            columns: buildScopedColumns(data as ViewData),
          }
        : {
            name: data.name,
            tableName: data.name,
            columns: buildViewerColumns(data as TableData),
          },
    [data, view],
  );
}
