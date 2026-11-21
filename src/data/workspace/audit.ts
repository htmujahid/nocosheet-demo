import { queryOptions } from "@tanstack/react-query";

import { fetch } from "void/client";

import { unwrapFetch } from "@/lib/api-error";
import type { AuditQuery } from "@/lib/audit/query";

import { workspaceKeys } from "./keys";

export const auditQueryOptions = (workspace: string, query: AuditQuery) =>
  queryOptions({
    queryKey: workspaceKeys.auditList(query),
    queryFn: () =>
      unwrapFetch(
        fetch("/api/workspaces/:workspace/audit-logs", {
          params: { workspace },
          query: {
            pageSize: query.pageSize,
            dir: query.dir,
            ...(query.cursor !== null ? { cursor: query.cursor } : {}),
            ...(query.table !== null ? { table: query.table } : {}),
            ...(query.action !== null ? { action: query.action } : {}),
          },
        }),
      ),
  });
