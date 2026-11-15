import { useMemo } from "react";

import { type UseSuspenseQueryOptions, useSuspenseQuery } from "@tanstack/react-query";

import { tableQueryOptions } from "@/data/workspace/tables";
import { viewQueryOptions } from "@/data/workspace/views";

import { buildViewerColumns, type ViewScope } from "./columns";

type Detail = Parameters<typeof buildViewerColumns>[0] & { name: string; tableName: string };

export function useRecordScope(workspace: string, tableId: number, view?: ViewScope) {
  const options = view
    ? viewQueryOptions(workspace, tableId, view.id)
    : tableQueryOptions(workspace, tableId);
  const { data } = useSuspenseQuery(options as unknown as UseSuspenseQueryOptions<Detail>);

  return useMemo(
    () => ({
      tableName: view ? data.tableName : data.name,
      columns: buildViewerColumns(data),
    }),
    [data, view],
  );
}
