import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";
import type { TrashQuery } from "@/lib/trash/query";

import { workspaceKeys } from "./keys";

export const trashQueryOptions = (workspace: string, tableId: number, query: TrashQuery) =>
  queryOptions({
    queryKey: workspaceKeys.recordsTrashList(tableId, query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/records/trash", {
          params: { workspace, table: String(tableId) },
          query: {
            page: query.page,
            pageSize: query.pageSize,
            sort: query.sort,
            order: query.order,
            ...(query.q ? { q: query.q } : {}),
          },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export const trashEntryQueryOptions = (workspace: string, tableId: number, recordId: number) =>
  queryOptions({
    queryKey: workspaceKeys.recordsTrashEntry(tableId, recordId),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/tables/:table/records/:record/trash", {
          params: { workspace, table: String(tableId), record: String(recordId) },
        }),
      ),
    staleTime: 15_000,
    retry: false,
  });

export type RestoreFailure = { message: string; field?: string };

export const restoreRecord = ({
  workspace,
  tableId,
  recordId,
  values,
}: {
  workspace: string;
  tableId: number;
  recordId: number;
  values?: Record<string, unknown>;
}) =>
  unwrapFetch(
    fetch("/api/workspaces/:workspace/tables/:table/records/trash/restore", {
      method: "POST",
      params: { workspace, table: String(tableId) },
      body: values ? { id: recordId, values } : { id: recordId },
    }),
  );
